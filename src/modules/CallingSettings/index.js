import RcModule from '../../lib/RcModule';
import getCallingSettingsReducer, {
  getCallWithReducer,
  getRingoutPromptReducer,
  getMyLocationReducer,
  getTimestampReducer,
  getFromNumberReducer,
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
    addWebphone,
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
    this._fromNumberStorageKey = 'fromCallIdNumber';

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
    this._storage.registerReducer({
      key: this._fromNumberStorageKey,
      reducer: getFromNumberReducer(this.actionTypes),
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

    this.addSelector('callWithOptions',
      () => this._rolesAndPermissions.ringoutEnabled,
      () => this._rolesAndPermissions.webphoneEnabled,
      () => this.otherPhoneNumbers.length > 0,
      (ringoutEnabled, webphoneEnabled, hasOtherPhone) => {
        const callWithOptions = [];
        if (addWebphone && webphoneEnabled) {
          callWithOptions.push(callingOptions.browser);
        }
        callWithOptions.push(callingOptions.softphone);
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
    this.updateFromNumber = this.updateFromNumber.bind(this);
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
        this._webphoneEnabled = this._rolesAndPermissions.webphoneEnabled;
        this.store.dispatch({
          type: this.actionTypes.init,
        });
        if (!this.timestamp) {
          // first time login
          const defaultCallWith = this.callWithOptions && this.callWithOptions[0];
          this.store.dispatch({
            type: this.actionTypes.setData,
            callWith: defaultCallWith,
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
        this._initFromNumber();
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
          this._webphoneEnabled !== this._rolesAndPermissions.webphoneEnabled ||
          this._myPhoneNumbers !== this.myPhoneNumbers ||
          this._otherPhoneNumbers !== this.otherPhoneNumbers)
      ) {
        this._ringoutEnabled = this._rolesAndPermissions.ringoutEnabled;
        this._webphoneEnabled = this._rolesAndPermissions.webphoneEnabled;
        this._myPhoneNumbers = this.myPhoneNumbers;
        this._otherPhoneNumbers = this.otherPhoneNumbers;
        this._validateSettings();
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

  _setSoftPhoneToCallWith() {
    this.store.dispatch({
      type: this.actionTypes.setData,
      callWith: callingOptions.softphone,
      timestamp: Date.now(),
    });
  }

  _validateSettings() {
    if (
      !this._webphoneEnabled &&
      this.callWith === callingOptions.browser
    ) {
      this._setSoftPhoneToCallWith();
      this._alert.danger({
        message: callingSettingsMessages.webphonePermissionRemoved,
        ttl: 0,
      });
    } else if (
      !this._ringoutEnabled &&
      (
        this.callWith === callingOptions.myphone ||
        this.callWith === callingOptions.otherphone ||
        this.callWith === callingOptions.customphone
      )
    ) {
      this._setSoftPhoneToCallWith();
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

  _warningEmergencyCallingNotAvailable() {
    if (this.callWith === callingOptions.browser) {
      this._alert.info({
        message: callingSettingsMessages.emergencyCallingNotAvailable,
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

  get fromNumber() {
    return this._storage.getItem(this._fromNumberStorageKey);
  }

  get fromNumbers() {
    return this._selectors.fromNumbers();
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
        this._warningEmergencyCallingNotAvailable();
      }
    }
  }
}
