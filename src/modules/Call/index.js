import RcModule from '../../lib/RcModule';
import callingModes from '../CallingSettings/callingModes';
import moduleStatus from '../../enums/moduleStatus';

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
    callingSettings,
    softphone,
    ringout,
    numberValidate,
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
    this._callingSettings = callingSettings;
    this._ringout = ringout;
    this._softphone = softphone;
    this._numberValidate = numberValidate;

    this._storage.registerReducer({
      key: this._storageKey,
      reducer: getLastCallNumberReducer(this.actionTypes),
    });
  }

  initialize() {
    this.store.subscribe(() => {
      if (
        this._numberValidate.ready &&
        this._callingSettings.ready &&
        this._storage.ready &&
        this.status === moduleStatus.pending
      ) {
        this.store.dispatch({
          type: this.actionTypes.initSuccess,
        });
      } else if (
        (
          !this._numberValidate.ready ||
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
            console.log(error);
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
    const waitingValidateNumbers = [this.toNumber];
    if (fromNumber && fromNumber.length > 0) {
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
