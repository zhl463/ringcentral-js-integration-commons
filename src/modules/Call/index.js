import RcModule from '../../lib/RcModule';
import callingModes from '../CallingSettings/callingModes';
import moduleStatus from '../../enums/moduleStatus';
import normalizeNumber from '../../lib/normalizeNumber';
import parseNumber from '../../lib/parseNumber';

import callActionTypes from './actionTypes';
import getCallReducer, {
  getLastCallNumberReducer,
} from './getCallReducer';

import callStatus from './callStatus';
import callErrors from './callErrors';
import ringoutErrors from '../Ringout/ringoutErrors';


export default class Call extends RcModule {
  constructor({
    alert,
    client,
    storage,
    regionSettings,
    callingSettings,
    softphone,
    ringout,
    accountExtension,
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
    this._reducer = getCallReducer(this.actionTypes);
    this._regionSettings = regionSettings;
    this._callingSettings = callingSettings;
    this._ringout = ringout;
    this._softphone = softphone;
    this._accountExtension = accountExtension;

    this._storage.registerReducer({
      key: this._storageKey,
      reducer: getLastCallNumberReducer(this.actionTypes),
    });
  }

  initialize() {
    this.store.subscribe(() => {
      if (
        this._regionSettings.ready &&
        this._callingSettings.ready &&
        this._storage.ready &&
        this.status === moduleStatus.pending
      ) {
        this.store.dispatch({
          type: this.actionTypes.initSuccess,
        });
      } else if (
        (
          !this._regionSettings.ready ||
          !this._callingSettings.ready ||
          !this._storage.ready
        ) &&
        this.status === moduleStatus.ready
      ) {
        this.store.dispatch({
          type: this.actionTypes.resetSuccess,
        });
      }
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
    const fromNumber = this._callingSettings.myLocation;
    const countryCode = this._regionSettings.countryCode;
    const areaCode = this._regionSettings.areaCode;

    const {
      hasPlus,
      number,
      isServiceNumber,
      hasInvalidChars,
    } = parseNumber(this.toNumber);
    // include special char or cleaned has no digit (only #*+)
    if (hasInvalidChars || number === '') {
      this._alert.warning({
        message: callErrors.noToNumber,
      });
    } else if (
      !isServiceNumber &&
      !hasPlus &&
      number.length === 7 &&
      (countryCode === 'CA' || countryCode === 'US') &&
      areaCode === ''
    ) {
      this._alert.warning({
        message: callErrors.noAreaCode
      });
    } else {
      // to e164 normalize
      const normalized = normalizeNumber({
        phoneNumber: this.toNumber,
        countryCode,
        areaCode,
      });
      // phoneParser
      const homeCountry = countryCode ? { homeCountry: countryCode } : {};
      const resp = await this._client.numberParser().parse().post(
        {
          originalStrings: [normalized, fromNumber]
        },
        homeCountry,
      );
      if (resp.phoneNumbers[0] && resp.phoneNumbers[0].special) {
        this._alert.warning({
          message: callErrors.specialNumber
        });
      } else if (resp.phoneNumbers[0] &&
        resp.phoneNumbers[0].originalString.length <= 5 &&
        !this._accountExtension.isAvailableExtension(resp.phoneNumbers[0].originalString)
      ) { // not a service code but short number, confirm if it is an extension
        this._alert.warning({
          message: callErrors.notAnExtension
        });
      } else {
        // using e164 in response to call
        let parsedFromNumber =
          resp.phoneNumbers[1] ? resp.phoneNumbers[1].e164 : '';
        // add ext back if any
        if (parsedFromNumber !== '') {
          parsedFromNumber = (resp.phoneNumbers[1].subAddress) ?
            [resp.phoneNumbers[1].e164, resp.phoneNumbers[1].subAddress].join('*') :
            resp.phoneNumbers[1].e164;
        }
        return {
          toNumber: resp.phoneNumbers[0].e164,
          fromNumber: parsedFromNumber,
        };
      }
    }
    return null;
  }

  async _makeCall({ toNumber, fromNumber }) {
    const callingMode = this._callingSettings.callingMode;
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
      default:
        break;
    }
  }

  get status() {
    return this.state.status;
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
}
