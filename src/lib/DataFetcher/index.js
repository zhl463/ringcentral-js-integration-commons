import RcModule from '../RcModule';
import { prefixEnum } from '../Enum';
import getDataFetcherReducer, {
  getDefaultDataReducer,
  getDefaultTimestampReducer,
} from './getDataFetcherReducer';
import moduleStatus from '../../enums/moduleStatus';
import actionTypesBase from './actionTypesBase';

const DEFAULT_TTL = 30 * 60 * 1000;
const DEFAULT_RETRY = 60 * 1000;

export default class DataFetcher extends RcModule {
  constructor({
    auth,
    client,
    storage,
    tabManager,
    ttl = DEFAULT_TTL,
    timeToRetry = DEFAULT_RETRY,
    polling = false,
    name,
    actionTypes = prefixEnum({ enumMap: actionTypesBase, prefix: name }),
    getReducer = getDataFetcherReducer,
    getDataReducer = getDefaultDataReducer,
    getTimestampReducer = getDefaultTimestampReducer,
    dataStorageKey = `${name}Data`,
    timestampStorageKey = `${name}Timestamp`,
    fetchFunction,
    ...options
  }) {
    if (!name) {
      throw new Error('name must be defined');
    }
    if (typeof fetchFunction !== 'function') {
      throw new Error('fetchFunction must be a asynchronous function');
    }
    super({
      ...options,
      actionTypes,
    });
    this._auth = auth;
    this._storage = storage;
    this._client = client;
    this._tabManager = tabManager;
    this._ttl = ttl;
    this._timeToRetry = timeToRetry;
    this._polling = polling;
    this._fetchFunction = fetchFunction;

    this._dataStorageKey = dataStorageKey;
    this._timestampStorageKey = timestampStorageKey;
    this._reducer = getReducer(this.actionTypes);

    this._storage.registerReducer({
      key: this._dataStorageKey,
      reducer: getDataReducer(this.actionTypes),
    });
    this._storage.registerReducer({
      key: this._timestampStorageKey,
      reducer: getTimestampReducer(this.actionTypes),
    });

    this._promise = null;
    this._timeoutId = null;
  }
  initialize() {
    this.store.subscribe(async () => {
      if (
        this._auth.loggedIn &&
        this._storage.ready &&
        this.status === moduleStatus.pending
      ) {
        this.store.dispatch({
          type: this.actionTypes.init,
        });
        if (
          (!this._tabManager || this._tabManager.active) &&
          (
            this._auth.isFreshLogin ||
            !this.timestamp ||
            Date.now() - this.timestamp > this._ttl
          )
        ) {
          await this.fetchData();
        } else {
          if (this._polling) {
            this._startPolling();
          } else {
            this._retry();
          }
        }
        this.store.dispatch({
          type: this.actionTypes.initSuccess,
        });
      } else if (
        (!this._auth.loggedIn || !this._storage.ready) &&
        this.ready
      ) {
        this._clearTimeout();
        this._promise = null;
        this.store.dispatch({
          type: this.actionTypes.resetSuccess,
        });
      }
    });
  }

  get data() {
    return this._storage.getItem(this._dataStorageKey);
  }

  get timestamp() {
    return this._storage.getItem(this._timestampStorageKey);
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.state.status === moduleStatus.ready;
  }

  _clearTimeout() {
    if (this._timeoutId) clearTimeout(this._timeoutId);
  }
  _startPolling(t = this.timestamp + this._ttl + 10 - Date.now()) {
    this._clearTimeout();
    this._timeoutId = setTimeout(() => {
      this._timeoutId = null;
      if (!this._tabManager || this._tabManager.active) {
        if (!this.timestamp || Date.now() - this.timestamp > this._ttl) {
          this.fetchData();
        } else {
          this._startPolling();
        }
      } else {
        if (this.timestamp && Date.now() - this.timestamp < this._ttl) {
          this._startPolling();
        } else {
          this._startPolling(this._timeToRetry);
        }
      }
    }, t);
  }
  _retry(t = this._timeToRetry) {
    this._clearTimeout();
    this._timeoutId = setTimeout(() => {
      this._timeoutId = null;
      if (!this.timestamp || Date.now() - this.timestamp > this._ttl) {
        if (!this._tabManager || this._tabManager.active) {
          this.fetchData();
        } else {
          // continue retry checks in case tab becomes main tab
          this._retry();
        }
      }
    }, t);
  }

  async _fetchData() {
    this.store.dispatch({
      type: this.actionTypes.fetch,
    });
    const ownerId = this._auth.ownerId;
    try {
      const data = await this._fetchFunction();
      if (this._auth.ownerId === ownerId) {
        this.store.dispatch({
          type: this.actionTypes.fetchSuccess,
          data,
          timestamp: Date.now(),
        });
        if (this._polling) {
          this._startPolling();
        }
        this._promise = null;
      }
    } catch (error) {
      if (this._auth.ownerId === ownerId) {
        this._promise = null;
        this.store.dispatch({
          type: this.actionTypes.fetchError,
          error,
        });
        if (this._polling) {
          this._startPolling(this._timeToRetry);
        } else {
          this._retry();
        }
        throw error;
      }
    }
  }
  fetchData() {
    if (!this._promise) {
      this._promise = this._fetchData();
    }
    return this._promise;
  }
}
