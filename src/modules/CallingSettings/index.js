import RcModule from '../../lib/RcModule';
import getCallingSettingsReducer, {
  getCallWithReducer,
  getRingoutPromptReducer,
  getMyLocationReducer,
  getTimestampReducer,
} from './getCallingSettingsReducer';
import moduleStatuses from '../../enums/moduleStatuses';
import mapOptionToMode from './mapOptionToMode';
import callingOptions from './callingOptions';
import callingSettingsMessages from './callingSettingsMessages';
import actionTypes from './actionTypes';

export default class CallingSettings extends RcModule {
  constructor({
    alert,
    brand,
    extensionInfo,
    extensionPhoneNumber,
    forwardingNumber,
    storage,
    rolesAndPermissions,
    tabManager,
    onFirstLogin,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._alert = alert;
    this._brand = brand;
    this._extensionInfo = extensionInfo;
    this._extensionPhoneNumber = extensionPhoneNumber;
    this._forwardingNumber = forwardingNumber;
    this._storage = storage;
    this._rolesAndPermissions = rolesAndPermissions;
    this._tabManager = tabManager;

    this._callWithStorageKey = 'callingSettingsCallWith';
    this._ringoutPromptStorageKey = 'callingSettingsRingoutPrompt';
    this._myLocationStorageKey = 'callingSettingsMyLocation';
    this._timestampStorageKey = 'callingSettingsTimestamp';

    this._onFirstLogin = onFirstLogin;

    this._storage.registerReducer({
      key: this._callWithStorageKey,
      reducer: getCallWithReducer(this.actionTypes),
    });
    this._storage.registerReducer({
      key: this._ringoutPromptStorageKey,
      reducer: getRingoutPromptReducer(this.actionTypes),
    });
    this._storage.registerReducer({
      key: this._myLocationStorageKey,
      reducer: getMyLocationReducer(this.actionTypes),
    });
    this._storage.registerReducer({
      key: this._timestampStorageKey,
      reducer: getTimestampReducer(this.actionTypes),
    });
    this._reducer = getCallingSettingsReducer(this.actionTypes);

    this.addSelector('myPhoneNumbers',
      () => this._extensionPhoneNumber.directNumbers,
      () => this._extensionPhoneNumber.mainCompanyNumber,
      () => this._extensionInfo.extensionNumber,
      (directNumbers, mainCompanyNumber, extensionNumber) => {
        const myPhoneNumbers = directNumbers.map(item => item.phoneNumber);
        if (mainCompanyNumber && extensionNumber) {
          myPhoneNumbers.push(`${mainCompanyNumber.phoneNumber}*${extensionNumber}`);
        }
        return myPhoneNumbers;
      }
    );

    this.addSelector('otherPhoneNumbers',
      () => this._forwardingNumber.flipNumbers,
      () => this._extensionPhoneNumber.callerIdNumbers,
      () => this._extensionPhoneNumber.directNumbers,
      (flipNumbers, callerIdNumbers, directNumbers) => {
        const filterMapping = {};
        callerIdNumbers.forEach((item) => {
          filterMapping[item.phoneNumber] = true;
        });
        directNumbers.forEach((item) => {
          filterMapping[item.phoneNumber] = true;
        });
        return flipNumbers
          .filter(item => !filterMapping[item.phoneNumber])
          .sort((a, b) => (a.label === 'Mobile' && a.label !== b.label ? -1 : 1))
          .map(item => item.phoneNumber);
      }
    );

    this.addSelector('callWithOptions',
      () => this._rolesAndPermissions.ringoutEnabled,
      () => this.otherPhoneNumbers.length > 0,
      (ringoutEnabled, hasOtherPhone) => {
        const callWithOptions = [callingOptions.softphone];
        if (ringoutEnabled) {
          callWithOptions.push(callingOptions.myphone);
          if (hasOtherPhone) {
            callWithOptions.push(callingOptions.otherphone);
          }
          callWithOptions.push(callingOptions.customphone);
        }
        return callWithOptions;
      },
    );
    this.addSelector('availableNumbers',
      () => this.myPhoneNumbers,
      () => this.otherPhoneNumbers,
      (myPhoneNumbers, otherPhoneNumbers) => ({
        [callingOptions.myphone]: myPhoneNumbers,
        [callingOptions.otherphone]: otherPhoneNumbers,
      }),
    );
  }

  initialize() {
    this.store.subscribe(async () => {
      if (
        this._storage.ready &&
        this._extensionInfo.ready &&
        this._extensionPhoneNumber.ready &&
        this._forwardingNumber.ready &&
        this._rolesAndPermissions.ready &&
        this.status === moduleStatuses.pending
      ) {
        this._myPhoneNumbers = this.myPhoneNumbers;
        this._otherPhoneNumbers = this.otherPhoneNumbers;
        this._ringoutEnabled = this._rolesAndPermissions.ringoutEnabled;
        this.store.dispatch({
          type: this.actionTypes.init,
        });
        if (!this.timestamp) {
          // first time login
          this.store.dispatch({
            type: this.actionTypes.setData,
            timestamp: Date.now(),
          });
          this._alert.warning({
            message: this._brand.id === '1210' ?
              callingSettingsMessages.firstLogin :
              callingSettingsMessages.firstLoginOther,
          });
          if (typeof this._onFirstLogin === 'function') {
            this._onFirstLogin();
          }
        }
        this._validateSettings();
        this.store.dispatch({
          type: this.actionTypes.initSuccess,
        });
      } else if (
        this.ready &&
        (!this._storage.ready ||
          !this._extensionInfo.ready ||
          !this._extensionPhoneNumber.ready ||
          !this._forwardingNumber.ready ||
          !this._rolesAndPermissions.ready)
      ) {
        this.store.dispatch({
          type: this.actionTypes.resetSuccess,
        });
      } else if (
        this.ready &&
        (this._ringoutEnabled !== this._rolesAndPermissions.ringoutEnabled ||
          this._myPhoneNumbers !== this.myPhoneNumbers ||
          this._otherPhoneNumbers !== this.otherPhoneNumbers)
      ) {
        this._ringoutEnabled = this._rolesAndPermissions.ringoutEnabled;
        this._myPhoneNumbers = this.myPhoneNumbers;
        this._otherPhoneNumbers = this.otherPhoneNumbers;
        this._validateSettings();
      }
    });
  }
  _validateSettings() {
    if (
      !this._ringoutEnabled &&
      this.callWith !== callingOptions.softphone
    ) {
      this.store.dispatch({
        type: this.actionTypes.setData,
        callWith: callingOptions.softphone,
        timestamp: Date.now(),
      });
      this._alert.danger({
        message: callingSettingsMessages.permissionChanged,
        ttl: 0,
      });
    } else if (
      (this.callWith === callingOptions.otherphone &&
        this._otherPhoneNumbers.indexOf(this.myLocation) === -1) ||
      (this.callWith === callingOptions.myphone &&
        this._myPhoneNumbers.indexOf(this.myLocation) === -1)
    ) {
      this.store.dispatch({
        type: this.actionTypes.setData,
        callWith: callingOptions.myphone,
        myLocation: this._myPhoneNumbers[0],
        timestamp: Date.now(),
      });
      this._alert.danger({
        message: callingSettingsMessages.phoneNumberChanged,
        ttl: 0,
      });
    }
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.state.status === moduleStatuses.ready;
  }

  get callWith() {
    return this._storage.getItem(this._callWithStorageKey);
  }

  get callingMode() {
    return mapOptionToMode(this.callWith);
  }

  get callWithOptions() {
    return this._selectors.callWithOptions();
  }

  get ringoutPrompt() {
    return this._storage.getItem(this._ringoutPromptStorageKey);
  }

  get myLocation() {
    return this._storage.getItem(this._myLocationStorageKey);
  }

  get timestamp() {
    return this._storage.getItem(this._timestampStorageKey);
  }

  get myPhoneNumbers() {
    return this._selectors.myPhoneNumbers();
  }

  get otherPhoneNumbers() {
    return this._selectors.otherPhoneNumbers();
  }

  get availableNumbers() {
    return this._selectors.availableNumbers();
  }

  setData({ callWith, myLocation, ringoutPrompt }, withPrompt) {
    // TODO validate myLocation
    this.store.dispatch({
      type: this.actionTypes.setData,
      callWith,
      myLocation,
      ringoutPrompt,
      timestamp: Date.now(),
    });
    if (withPrompt) {
      if (this.callWith === callingOptions.softphone) {
        this._alert.info({
          message: callingSettingsMessages.saveSuccessWithSoftphone,
        });
      } else {
        this._alert.info({
          message: callingSettingsMessages.saveSuccess,
        });
      }
    }
  }
}
