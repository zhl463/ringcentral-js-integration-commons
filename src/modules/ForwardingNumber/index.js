import RcModule from '../../lib/RcModule';
import forwardingNumberStatus from './forwardingNumberStatus';
import forwardingNumberActionTypes from './forwardingNumberActionTypes';
import getForwardingNumberReducer from './getForwardingNumberReducer';
import fetchList from '../../lib/fetchList';

export default class ForwardingNumber extends RcModule {
  constructor({
    auth,
    client,
    storage,
    ttl = 30 * 60 * 1000,
    ...options,
  }) {
    super({
      ...options,
      actionTypes: forwardingNumberActionTypes,
    });
    this._auth = auth;
    this._storage = storage;
    this._client = client;
    this._ttl = ttl;
    this._storageKey = 'forwardingNumber';
    this._reducer = getForwardingNumberReducer(this.prefix);
    this._promise = null;
  }
  initialize() {
    this.store.subscribe(() => {
      if (
        this._storage.status !== this._storage.storageStatus.pending &&
        this.status === forwardingNumberStatus.pending
      ) {
        if (
          this._auth.isFreshLogin ||
          !this._storage.hasItem(this._storageKey) ||
          Date.now() - this.data.timestamp > this._ttl
        ) {
          this.loadForwardingNumber();
        } else {
          this.store.dispatch({
            type: this.actionTypes.init,
          });
        }
      } else if (
        this._storage.status === this._storage.storageStatus.pending &&
        this.status !== forwardingNumberStatus.pending
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
    return this.data.forwardingNumbers;
  }

  get status() {
    return this.state.status;
  }

  get error() {
    return this.state.error;
  }

  get forwardingNumberStatus() {
    return forwardingNumberStatus;
  }

  async loadForwardingNumber() {
    if (!this._promise) {
      this._promise = (async () => {
        this.store.dispatch({
          type: this.actionTypes.fetch,
        });
        try {
          this._storage.setItem(this._storageKey, {
            forwardingNumbers: await fetchList(params => (
              this._client.account().extension().forwardingNumber().list(params)
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
