import RcModule from '../../lib/RcModule';
import isBlank from '../../lib/isBlank';
import normalizeNumber from '../../lib/normalizeNumber';
import actionTypes from './actionTypes';
import moduleStatuses from '../../enums/moduleStatuses';
import getContactsReducer from './getContactsReducer';

function addPhoneToContact(contact, phone, type) {
  const phoneNumber = normalizeNumber(phone);
  if (isBlank(phoneNumber)) {
    return;
  }
  const existedPhone = contact.phoneNumbers.find(
    number => number && number.phoneNumber === phone
  );
  if (existedPhone) {
    existedPhone.type = type;
  } else {
    contact.phoneNumbers.push({
      phoneNumber: phone,
      type,
    });
  }
}

export default class Contacts extends RcModule {
  constructor({
    addressBook,
    accountExtension,
    accountPhoneNumber,
    ...options,
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._addressBook = addressBook;
    this._accountExtension = accountExtension;
    this._accountPhoneNumber = accountPhoneNumber;
    this._reducer = getContactsReducer(this.actionTypes);

    this.addSelector(
      'companyContacts',
      () => this._accountExtension.availableExtensions,
      () => this._accountPhoneNumber.extensionToPhoneNumberMap,
      (extensions, extensionToPhoneNumberMap) => {
        const newExtensions = [];
        extensions.forEach((extension) => {
          if (!(extension.status === 'Enabled' &&
            ['DigitalUser', 'User'].indexOf(extension.type) >= 0)) {
            return;
          }
          const contact = {
            type: 'company',
            id: extension.id,
            firstName: extension.contact && extension.contact.firstName,
            lastName: extension.contact && extension.contact.lastName,
            email: extension.contact && extension.contact.email,
            extensionNumber: extension.ext,
            phoneNumbers: [],
          };
          if (isBlank(contact.extensionNumber)) {
            return;
          }
          const phones = extensionToPhoneNumberMap[contact.extensionNumber];
          if (phones && phones.length > 0) {
            phones.forEach((phone) => {
              addPhoneToContact(contact, phone, 'directPhone');
            });
          }
          newExtensions.push(contact);
        });
        return newExtensions;
      }
    );

    this.addSelector(
      'personalContacts',
      () => this._addressBook.contacts,
      (rawContacts) => {
        const contacts = [];
        rawContacts.forEach((rawContact) => {
          const contact = {
            type: 'personal',
            phoneNumbers: [],
            ...rawContact,
          };
          Object.keys(contact).forEach((key) => {
            if (key.toLowerCase().indexOf('phone') === -1) {
              return;
            }
            if (typeof contact[key] !== 'string') {
              return;
            }
            addPhoneToContact(contact, contact[key], key);
          });
          contacts.push(contact);
        });
        return contacts;
      }
    );
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
  }

  _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
    } else if (this._shouldReset()) {
      this._resetModuleStatus();
    }
  }

  _shouldInit() {
    return (
      this._addressBook.ready &&
      this._accountExtension.ready &&
      this._accountPhoneNumber.ready &&
      this.pending
    );
  }

  _shouldReset() {
    return (
      (
        !this._addressBook.ready ||
        !this._accountExtension.ready ||
        !this._accountPhoneNumber.ready
      ) &&
      this.ready
    );
  }

  _resetModuleStatus() {
    this.store.dispatch({
      type: this.actionTypes.resetSuccess,
    });
  }

  get ready() {
    return this.status === moduleStatuses.ready;
  }

  get pending() {
    return this.status === moduleStatuses.pending;
  }

  get companyContacts() {
    return this._selectors.companyContacts();
  }

  get personalContacts() {
    return this._selectors.personalContacts();
  }
}
