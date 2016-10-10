import SymbolMap from 'data-types/symbol-map';
import KeyValueMap from 'data-types/key-value-map';
import RcModule, { initFunction } from '../../lib/rc-module';
import { proxify } from '../proxy';
import fetchList from '../../lib/fetch-list';
import extensionPhoneNumberStatus from './extension-phone-number-status';
import extensionPhoneNumberActions from './extension-phone-number-actions';
import getExtensionPhoneNumberReducer from './get-extension-phone-number-reducer';
import extensionPhoneNumberEvents from './extension-phone-number-events';

const keys = new KeyValueMap({
  storage: 'extension-phone-number-data',
});

const DEFAULT_TTL = 30 * 60 * 1000;

const symbols = new SymbolMap([
  'api',
  'auth',
  'storage',
  'ttl',
]);

export default class ExtensionPhoneNumber extends RcModule {
  constructor(options = {}) {
    super({
      ...options,
      actions: extensionPhoneNumberActions,
    });
    const {
      api,
      auth,
      storage,
      ttl = DEFAULT_TTL,
    } = options;
    this[symbols.api] = api;
    this[symbols.auth] = auth;
    this[symbols.storage] = storage;
    this[symbols.ttl] = ttl;

    this.on('state-change', ({ oldState, newState }) => {
      if (oldState) {
        if (oldState.status !== newState.status) {
          this.emit(extensionPhoneNumberEvents.statusChange, {
            oldStatus: oldState.status,
            newStatus: newState.status,
          });
        }
        if (newState.error && newState.error !== oldState.error) {
          this.emit(extensionPhoneNumberEvents.error, newState.error);
        }
      }
    });
    this[symbols.storage].on(
      this[symbols.storage].storageEvents.dataChange,
      ({ oldData, newData }) => {
        if (!oldData[keys.storage] && !newData[keys.storage]) return;
        if (
          oldData[keys.storage] && !newData[keys.storage] ||
          !oldData[keys.storage] && newData[keys.storage] ||
          oldData[keys.storage] !== newData[keys.storage] &&
          (JSON.stringify(oldData[keys.storage].phoneNumbers) !==
            JSON.stringify(newData[keys.storage].phoneNumbers))
        ) {
          this.emit(extensionPhoneNumberEvents.extensionPhoneNumberChange, {
            oldData: oldData[keys.storage] && oldData[keys.storage].phoneNumbers,
            newData: newData[keys.storage] && newData[keys.storage].phoneNumbers,
          });
        }
      },
    );
  }

  @initFunction
  init() {
    this[symbols.storage].on(this[symbols.storage].storageEvents.ready, async () => {
      await this.loadExtensionPhoneNumbers();
      this.store.dispatch({
        type: this.actions.ready,
      });
    });
    this[symbols.storage].on(this[symbols.storage].storageEvents.pending, () => {
      this.store.dispatch({
        type: this.actions.reset,
      });
    });
  }
  get data() {
    return this[symbols.storage].getItem(keys.storage);
  }
  @proxify
  async loadExtensionPhoneNumbers(options = {}) {
    const {
      force = false,
    } = options;
    let data = this[symbols.storage].getItem(keys.storage);
    if (force || !data || Date.now() - data.timestamp > this[symbols.ttl]) {
      try {
        this.store.dispatch({
          type: this.actions.fetch,
        });
        data = {
          phoneNumbers: await fetchList(params => (
            this[symbols.api].account().extension().phoneNumber().list(params)
          )),
          timestamp: Date.now(),
        };
        this[symbols.storage].setItem(keys.storage, data);
        this.store.dispatch({
          type: this.actions.fetchSuccess,
        });
      } catch (error) {
        this.store.dispatch({
          type: this.actions.fetchError,
          error,
        });
        throw error;
      }
    }
    return data;
  }
  get reducer() {
    return getExtensionPhoneNumberReducer(this.prefix);
  }

  get extensionPhoneNumberStatus() {
    return extensionPhoneNumberStatus;
  }

  static get extensionPhoneNumberStatus() {
    return extensionPhoneNumberStatus;
  }

  get extensionPhoneNumberEvents() {
    return extensionPhoneNumberEvents;
  }

  static get extensionPhoneNumberEvents() {
    return extensionPhoneNumberEvents;
  }

  get status() {
    return this.state.status;
  }

  get phoneNumbers() {
    return this.data.phoneNumbers;
  }

  get directNumbers() {
    return this.phoneNumbers.filter(p => p.usageType === 'DirectNumber');
  }

  get companyNumbers() {
    return this.phoneNumbers.filter(p => p.usageType === 'CompanyNumber');
  }

  get companyFaxNumbers() {
    return this.phoneNumbers.filter(p => p.usageType === 'CompanyFaxNumber');
  }

  get mainCompanyNumber() {
    return this.phoneNumbers.find(p => p.usageType === 'MainCompanyNumber');
  }

  get smsNumbers() {
    return this.phoneNumbers.filter(p => p.features.indexOf('SmsSender') > -1);
  }

  // get callerIds() {
  //   return this.phoneNumbers.filter(p => p.features.indexOf('CallerId') > -1);
  // }

  filter(usageTypes) {
    if (!usageTypes) return this.phoneNumbers;
    let types = usageTypes;
    if (!Array.isArray(types)) {
      types = [types];
    }
    types = types.map(t => t.toLowerCase());
    return this.phoneNumber.filter(p => types.indexOf(p.usageType.toLowerCase()) > -1);
  }
}
