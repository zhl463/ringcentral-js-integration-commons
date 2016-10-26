import RcModule from '../../lib/RcModule';
import accountInfoStatus from './accountInfoStatus';
import accountInfoActionTypes from './accountInfoActionTypes';
import getAccountInfoReducer from './getAccountInfoReducer';

export default class AccountInfo extends RcModule {
  constructor({
    auth,
    client,
    storage,
    ttl = 30 * 60 * 1000,
    ...options,
  }) {
    super({
      ...options,
      actionTypes: accountInfoActionTypes,
    });
    this._auth = auth;
    this._storage = storage;
    this._client = client;
    this._ttl = ttl;
    this._storageKey = 'accountInfo';
    this._reducer = getAccountInfoReducer(this.prefix);
    this._promise = null;
  }
  initialize() {
    this.store.subscribe(() => {
      if (
        this._storage.status !== this._storage.storageStatus.pending &&
        this.status === accountInfoStatus.pending
      ) {
        this.store.dispatch({
          type: this.actionTypes.init,
        });
        if (
          this._auth.isFreshLogin ||
          !this._storage.hasItem(this._storageKey) ||
          Date.now() - this.data > this._ttl
        ) {
          this.loadAccountInfo();
        }
      } else if (
        this._storage.status === this._storage.storageStatus.pending &&
        this.status !== accountInfoStatus.pending
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

  get country() {
    return this.data.accountInfo.serviceInfo.brand.homeCountry;
  }

  get error() {
    return this.state.error;
  }

  get accountInfoStatus() {
    return accountInfoStatus;
  }

  async loadAccountInfo() {
    if (!this._promise) {
      this._promise = (async () => {
        this.store.dispatch({
          type: this.actionTypes.fetch,
        });
        try {
          this._storage.setItem(this._storageKey, {
            accountInfo: await this._client.account().get(),
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
