import RcModule from '../../lib/RcModule';
import callingModes from '../CallingSettings/callingModes';
import moduleStatuses from '../../enums/moduleStatuses';

import callActionTypes from './actionTypes';
import getCallReducer, {
  getLastCallNumberReducer,
  getFromNumberReducer,
} from './getCallReducer';

import callStatus from './callStatus';
import callErrors from './callErrors';
import ringoutErrors from '../Ringout/ringoutErrors';


export default class Call extends RcModule {
  constructor({
    alert,
    client,
    storage,
    callingSettings,
    softphone,
    ringout,
    webphone,
    extensionPhoneNumber,
    numberValidate,
    regionSettings,
    ...options
  }) {
    super({
      ...options,
      actionTypes: callActionTypes,
    });

    this._alert = alert;
    this._client = client;
    this._storage = storage;
    this._storageKey = 'lastCallNumber';
    this._fromNumberStorageKey = 'fromCallIdNumber';
    this._reducer = getCallReducer(this.actionTypes);
    this._callingSettings = callingSettings;
    this._ringout = ringout;
    this._softphone = softphone;
    this._webphone = webphone;
    this._numberValidate = numberValidate;
    this._extensionPhoneNumber = extensionPhoneNumber;
    this._regionSettings = regionSettings;
    this._callSettingMode = null;

    this._storage.registerReducer({
      key: this._storageKey,
      reducer: getLastCallNumberReducer(this.actionTypes),
    });

    this._storage.registerReducer({
      key: this._fromNumberStorageKey,
      reducer: getFromNumberReducer(this.actionTypes),
    });

    this.addSelector(
      'fromNumbers',
      () => this._extensionPhoneNumber.callerIdNumbers,
      phoneNumbers => phoneNumbers.sort((firstItem, lastItem) => {
        if (firstItem.usageType === 'DirectNumber') return -1;
        else if (lastItem.usageType === 'DirectNumber') return 1;
        else if (firstItem.usageType === 'MainCompanyNumber') return -1;
        else if (lastItem.usageType === 'MainCompanyNumber') return 1;
        else if (firstItem.usageType < lastItem.usageType) return -1;
        else if (firstItem.usageType > lastItem.usageType) return 1;
        return 0;
      }),
    );
  }

  initialize() {
    this.store.subscribe(async () => {
      if (
        this._numberValidate.ready &&
        this._callingSettings.ready &&
        this._storage.ready &&
        this._extensionPhoneNumber.ready &&
        this._regionSettings.ready &&
        (!this._webphone || this._webphone.ready) &&
        this._ringout.ready &&
        this._softphone.ready &&
        this.status === moduleStatuses.pending
      ) {
        this.store.dispatch({
          type: this.actionTypes.init,
        });
        this._initFromNumber();
        // init webphone
        this._callSettingMode = this._callingSettings.callingMode;
        if (this._callSettingMode === callingModes.webphone) {
          await this._webphone.connect(this.fromNumbers.length > 0);
        }
        this.store.dispatch({
          type: this.actionTypes.initSuccess,
        });
      } else if (
        (
          !this._numberValidate.ready ||
          !this._callingSettings.ready ||
          !this._extensionPhoneNumber.ready ||
          !this._regionSettings.ready ||
          (!!this._webphone && !this._webphone.ready) ||
          !this._ringout.ready ||
          !this._softphone.ready ||
          !this._storage.ready
        ) &&
        this.ready
      ) {
        this.store.dispatch({
          type: this.actionTypes.resetSuccess,
        });
        this._callSettingMode = this._callingSettings.callingMode;
        if (this._callSettingMode === callingModes.webphone && this._webphone) {
          await this._webphone.disconnect();
        }
      } else if (this.ready) {
        const oldCallSettingMode = this._callSettingMode;
        if (this._callingSettings.callingMode !== oldCallSettingMode && this._webphone) {
          this._callSettingMode = this._callingSettings.callingMode;
          if (oldCallSettingMode === callingModes.webphone) {
            await this._webphone.disconnect();
          } else if (this._callSettingMode === callingModes.webphone) {
            await this._webphone.connect(this.fromNumbers);
          }
        }
      }
    });
  }

  _initFromNumber() {
    const fromNumber = this.fromNumber;
    if (!fromNumber) {
      const fromNumberList = this.fromNumbers;
      this.updateFromNumber(fromNumberList[0]);
    }
  }

  updateFromNumber(number) {
    this.store.dispatch({
      type: this.actionTypes.updateFromNumber,
      number: number && number.phoneNumber,
    });
  }

  onToNumberChange(value) {
    this.store.dispatch({
      type: this.actionTypes.toNumberChanged,
      data: value,
    });
  }

  onCall = async () => {
    if (this.callStatus === callStatus.idle) {
      // last number check
      if (`${this.toNumber}`.trim().length === 0) {
        if (this.lastCallNumber) {
          this.onToNumberChange(this.lastCallNumber);
        } else {
          this._alert.warning({
            message: callErrors.noToNumber,
          });
        }
      } else {
        this.store.dispatch({
          type: this.actionTypes.connect,
          number: this.toNumber,
        });
        try {
          const validatedNumbers = await this._getValidatedNumbers();
          if (validatedNumbers) {
            await this._makeCall(validatedNumbers);
            this.store.dispatch({
              type: this.actionTypes.connectSuccess
            });
          } else {
            this.store.dispatch({
              type: this.actionTypes.connectError
            });
          }
        } catch (error) {
          if (error.message === ringoutErrors.firstLegConnectFailed) {
            this._alert.warning({
              message: callErrors.connectFailed,
              payroll: error
            });
          } else if (error.message === 'Failed to fetch') {
            this._alert.danger({
              message: callErrors.networkError,
              payroll: error,
            });
          } else if (error.message !== 'Refresh token has expired') {
            this._alert.danger({
              message: callErrors.internalError,
              payroll: error,
            });
          }
          this.store.dispatch({
            type: this.actionTypes.connectError
          });
        }
      }
    }
  }

  async _getValidatedNumbers() {
    let fromNumber;
    const isWebphone = (this._callingSettings.callingMode === callingModes.webphone);
    if (isWebphone) {
      fromNumber = this.fromNumber;
      if (fromNumber === null || fromNumber === '') {
        return null;
      }
    } else {
      fromNumber = this._callingSettings.myLocation;
    }
    const waitingValidateNumbers = [this.toNumber];
    if (
      fromNumber &&
      fromNumber.length > 0 &&
      !(isWebphone && fromNumber === 'anonymous')
    ) {
      waitingValidateNumbers.push(fromNumber);
    }
    const validatedResult
      = await this._numberValidate.validateNumbers(waitingValidateNumbers);
    if (!validatedResult.result) {
      validatedResult.errors.forEach((error) => {
        this._alert.warning({
          message: callErrors[error.type]
        });
      });
      return null;
    }
    const parsedNumbers = validatedResult.numbers;
    // using e164 in response to call
    let parsedFromNumber =
      parsedNumbers[1] ? parsedNumbers[1].e164 : '';
    // add ext back if any
    if (parsedFromNumber !== '') {
      parsedFromNumber = (parsedNumbers[1].subAddress) ?
        [parsedNumbers[1].e164, parsedNumbers[1].subAddress].join('*') :
        parsedNumbers[1].e164;
    }
    return {
      toNumber: parsedNumbers[0].e164,
      fromNumber: parsedFromNumber,
    };
  }

  async _makeCall({ toNumber, fromNumber }) {
    const callingMode = this._callingSettings.callingMode;
    const countryCode = this._regionSettings.countryCode;
    const homeCountry = this._regionSettings.availableCountries.find(
      country => country.isoCode === countryCode
    );
    const homeCountryId = (homeCountry && homeCountry.callingCode) || '1';
    switch (callingMode) {
      case callingModes.softphone:
        this._softphone.makeCall(toNumber);
        break;
      case callingModes.ringout:
        await this._ringout.makeCall({
          fromNumber,
          toNumber,
          prompt: this._callingSettings.ringoutPrompt,
        });
        break;
      case callingModes.webphone:
        if (this._webphone) {
          await this._webphone.makeCall({
            fromNumber,
            toNumber,
            homeCountryId,
          });
        }
        break;
      default:
        break;
    }
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.state.status === moduleStatuses.ready;
  }

  get callStatus() {
    return this.state.callStatus;
  }

  get isIdle() {
    return this.state.callStatus === callStatus.idle;
  }

  get lastCallNumber() {
    return this._storage.getItem(this._storageKey) || '';
  }

  get toNumber() {
    return this.state.toNumber;
  }

  get fromNumber() {
    return this._storage.getItem(this._fromNumberStorageKey);
  }

  get fromNumbers() {
    return this._selectors.fromNumbers();
  }
}
