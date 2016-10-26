import RcModule from '../../lib/RcModule';
import extensionPhoneNumberStatus from './extensionPhoneNumberStatus';
import extensionPhoneNumberActionTypes from './extensionPhoneNumberActionTypes';
import getExtensionPhoneNumberReducer from './getExtensionPhoneNumberReducer';
import fetchList from '../../lib/fetchList';

export default class ExtensionPhoneNumber extends RcModule {
  constructor({
    auth,
    client,
    storage,
    ttl = 30 * 60 * 1000,
    ...options,
  }) {
    super({
      ...options,
      actionTypes: extensionPhoneNumberActionTypes,
    });
    this._auth = auth;
    this._storage = storage;
    this._client = client;
    this._ttl = ttl;
    this._storageKey = 'extensionPhoneNumber';
    this._reducer = getExtensionPhoneNumberReducer(this.prefix);
    this._promise = null;

    this.addSelector(
      'companyNumbers',
      () => this.data.extensionPhoneNumbers,
      phoneNumbers => phoneNumbers.filter(p => p.usageType === 'CompanyNumber'),
    );
  }
  initialize() {
    this.store.subscribe(() => {
      if (
        this._storage.status === this._storage.storageStatus.ready &&
        this.status === extensionPhoneNumberStatus.pending
      ) {
        this.store.dispatch({
          type: this.actionTypes.init,
        });
        if (
          this._auth.isFreshLogin ||
          !this._storage.hasItem(this._storageKey) ||
          Date.now() - this.data.timestamp > this._ttl
        ) {
          this.loadExtensionPhoneNumber();
        }
      } else if (
        this._storage.status === this._storage.storageStatus.pending &&
        this.status !== extensionPhoneNumberStatus.pending
      ) {
        this.store.dispatch({
          type: this.actionTypes.reset,
        });
      }
    });
  }

  get data() {
    return this._storage.getItem(this._storageKey);
  }

  get status() {
    return this.state.status;
  }

  get error() {
    return this.state.error;
  }

  get phoneNumbers() {
    return this.data.extensionPhoneNumbers;
  }

  get companyNumbers() {
    return this._selectors.companyNumbers();
  }

  get extensionPhoneNumberStatus() {
    return extensionPhoneNumberStatus;
  }

  async loadExtensionPhoneNumber() {
    if (!this._promise) {
      this._promise = (async () => {
        this.store.dispatch({
          type: this.actionTypes.fetch,
        });
        try {
          this._storage.setItem(this._storageKey, {
            extensionPhoneNumbers: await fetchList(params => (
              this._client.account().extension().phoneNumber().list(params)
            )),
            timestamp: Date.now(),
          });
          this.store.dispatch({
            type: this.actionTypes.fetchSuccess,
          });
          this._promise = null;
        } catch (error) {
          this.store.dispatch({
            type: this.actions.fetchError,
            error,
          });
          this._promise = null;
          throw error;
        }
      })();
    }
    await this._promise;
  }
}
