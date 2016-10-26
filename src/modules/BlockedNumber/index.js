import RcModule from '../../lib/RcModule';
import blockedNumberStatus from './blockedNumberStatus';
import blockedNumberActionTypes from './blockedNumberActionTypes';
import getBlockedNumberReducer from './getBlockedNumberReducer';
import fetchList from '../../lib/fetchList';

export default class BlockedNumber extends RcModule {
  constructor({
    auth,
    client,
    storage,
    ttl = 30 * 60 * 1000,
    ...options,
  }) {
    super({
      ...options,
      actionTypes: blockedNumberActionTypes,
    });
    this._auth = auth;
    this._storage = storage;
    this._client = client;
    this._ttl = ttl;
    this._storageKey = 'blockedNumber';
    this._reducer = getBlockedNumberReducer(this.prefix);
    this._promise = null;
  }
  initialize() {
    this.store.subscribe(() => {
      if (
        this._storage.status !== this._storage.storageStatus.pending &&
        this.status === blockedNumberStatus.pending
      ) {
        this.store.dispatch({
          type: this.actionTypes.init,
        });
        if (
          this._auth.isFreshLogin ||
          !this._storage.hasItem(this._storageKey) ||
          Date.now() - this.data.timestamp > this._ttl
        ) {
          this.loadBlockedNumber();
        }
      } else if (
        this._storage.status === this._storage.storageStatus.pending &&
        this.status !== blockedNumberStatus.pending
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

  get numbers() {
    return this.data.blockedNumbers;
  }

  get status() {
    return this.state.status;
  }

  get error() {
    return this.state.error;
  }

  get blockedNumberStatus() {
    return blockedNumberStatus;
  }

  async loadBlockedNumber() {
    if (!this._promise) {
      this._promise = (async () => {
        this.store.dispatch({
          type: this.actionTypes.fetch,
        });
        try {
          this._storage.setItem(this._storageKey, {
            blockedNumbers: await fetchList(params => (
              this._client.account().extension().blockedNumber().list(params)
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
