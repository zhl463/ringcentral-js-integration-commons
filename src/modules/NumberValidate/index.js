import RcModule from '../../lib/RcModule';
import moduleStatus from '../../enums/moduleStatus';
import normalizeNumber from '../../lib/normalizeNumber';
import cleanNumber from '../../lib/cleanNumber';
import parseNumber from '../../lib/parseNumber';

import numberValidateActionTypes from './numberValidateActionTypes';
import getNumberValidateReducer from './getNumberValidateReducer';

export default class NumberValidate extends RcModule {
  constructor({
    client,
    accountExtension,
    regionSettings,
    ...options
  }) {
    super({
      ...options,
      actionTypes: numberValidateActionTypes,
    });
    this._client = client;
    this._accountExtension = accountExtension;
    this._regionSettings = regionSettings;
    this._reducer = getNumberValidateReducer(this.actionTypes);
  }

  initialize() {
    this.store.subscribe(() => {
      if (
        this._regionSettings.ready &&
        this._accountExtension.ready &&
        this.status === moduleStatus.pending
      ) {
        this.store.dispatch({
          type: this.actionTypes.initSuccess,
        });
      } else if (
        (
          !this._regionSettings.ready ||
          !this._accountExtension.ready
        ) &&
        this.status === moduleStatus.ready
      ) {
        this.store.dispatch({
          type: this.actionTypes.resetSuccess,
        });
      }
    });
  }

  _isBlank(phoneNumber) {
    if (!phoneNumber) {
      return true;
    }
    return !/\S/.test(phoneNumber);
  }

  isNoToNumber(phoneNumber) {
    if (this._isBlank(phoneNumber)) {
      return true;
    }
    const cleaned = cleanNumber(phoneNumber);
    if (cleaned.length === 0) {
      return true;
    }
    return false;
  }

  isNoAreaCode(phoneNumber) {
    const {
      hasPlus,
      number,
      isServiceNumber
    } = parseNumber(phoneNumber);
    if (
      !isServiceNumber &&
      !hasPlus &&
      number.length === 7 &&
      (this._regionSettings.countryCode === 'CA' || this._regionSettings.countryCode === 'US') &&
      this._regionSettings.areaCode === ''
    ) {
      return true;
    }
    return false;
  }

  _isSpecial(phoneNumber) {
    return phoneNumber && phoneNumber.special;
  }

  _isNotAnExtension(extensionNumber) {
    return extensionNumber &&
      extensionNumber.length <= 5 &&
      !this._accountExtension.isAvailableExtension(extensionNumber);
  }

  async validateNumbers(phoneNumbers) {
    let validateResult = null;
    validateResult = this.validateFormat(phoneNumbers);
    if (!validateResult.result) {
      return validateResult;
    }
    const validatedNumbers = await this.validateWithNumberParser(phoneNumbers);
    return validatedNumbers;
  }

  validateFormat(phoneNumbers) {
    const errors = [];
    phoneNumbers.map((phoneNumber) => {
      if (this.isNoToNumber(phoneNumber)) {
        errors.push({ phoneNumber, type: 'noToNumber' });
        return null;
      }
      if (this.isNoAreaCode(phoneNumber)) {
        errors.push({ phoneNumber, type: 'noAreaCode' });
      }
      return null;
    });
    return {
      result: (errors.length === 0),
      errors
    };
  }

  async validateWithNumberParser(phoneNumbers) {
    const pasedNumers = await this._numberParser(phoneNumbers);
    const errors = [];
    const validatedPhoneNumbers = [];
    pasedNumers.map((phoneNumber) => {
      if (this._isSpecial(phoneNumber)) {
        errors.push({ phoneNumber: phoneNumber.originalString, type: 'specialNumber' });
        return null;
      }
      if (this._isNotAnExtension(phoneNumber.originalString)) {
        errors.push({ phoneNumber: phoneNumber.originalString, type: 'notAnExtension' });
        return null;
      }
      validatedPhoneNumbers.push(phoneNumber);
      return null;
    });
    return {
      result: (errors.length === 0),
      numbers: validatedPhoneNumbers,
      errors,
    };
  }

  async _numberParser(phoneNumbers) {
    const countryCode = this._regionSettings.countryCode;
    const areaCode = this._regionSettings.areaCode;
    const homeCountry = countryCode ? { homeCountry: countryCode } : {};
    const normalizedNumbers = phoneNumbers.map(phoneNumber => (
      normalizeNumber({ phoneNumber, countryCode, areaCode })
    ));
    const response = await this._client.numberParser().parse().post(
      {
        originalStrings: normalizedNumbers,
      },
      homeCountry,
    );
    return response.phoneNumbers;
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.status === moduleStatus.ready;
  }
}
