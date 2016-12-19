import mask from 'json-mask';
import RcModule from '../../lib/RcModule';
import actionTypes from './actionTypes';
import getAccountInfoReducer, {
  getInfoReducer,
  getTimestampReducer,
} from './getAccountInfoReducer';
import moduleStatus from '../../enums/moduleStatus';

const DEFAULT_MASK = [
  'id,mainNumber,status',
  'operator(id,extensionNumber)',
  'serviceInfo(brand(id,homeCountry(isoCode)))',
  `regionalSettings(${[
    'timezone(id,name,bias)',
    'homeCountry(id)',
    'language(localeCode)',
    'formattingLocale(localeCode)',
    'timeFormat',
  ].join(',')})`,
].join(',');

const DEFAULT_TTL = 30 * 60 * 1000;
const DEFAULT_RETRY = 60 * 1000;

export default class AccountInfo extends RcModule {
  constructor({
    auth,
    client,
    storage,
    tabManager,
    ttl = DEFAULT_TTL,
    timeToRetry = DEFAULT_RETRY,
    ...options
  }) {
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
    this._infoStorageKey = 'accountInfo';
    this._timestampStorageKey = 'accountInfoTimestamp';
    this._reducer = getAccountInfoReducer(this.actionTypes);

    this._storage.registerReducer({
      key: this._infoStorageKey,
      reducer: getInfoReducer(this.actionTypes),
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
          await this.loadAccountInfo();
        } else {
          this._retry();
        }
        this.store.dispatch({
          type: this.actionTypes.initSuccess,
        });
      } else if (
        (!this._auth.loggedIn || !this._storage.ready) &&
        this.ready
      ) {
        this._stopRetry();
        this._promise = null;
        this.store.dispatch({
          type: this.actionTypes.reset,
        });
      }
    });
  }

  _retry(t = this._timeToRetry) {
    this._stopRetry();
    this._timeoutId = setTimeout(() => {
      this._timeoutId = null;
      if (!this.timestamp || Date.now() - this.timestamp > this._ttl) {
        if (!this._tabManager || this._tabManager.active) {
          this.loadAccountInfo();
        } else {
          // continue retry checks in case tab becomes main tab
          this._retry();
        }
      }
    }, t);
  }

  _stopRetry() {
    if (this._timeoutId) clearTimeout(this._timeoutId);
  }

  async _loadAccountInfo() {
    this.store.dispatch({
      type: this.actionTypes.fetch,
    });
    const id = this._auth.id;
    try {
      const info = mask(await this._client.account().get(), DEFAULT_MASK);
      if (this._auth.id === id) {
        this.store.dispatch({
          type: this.actionTypes.fetchSuccess,
          info,
          timestamp: Date.now(),
        });
        this._promise = null;
      }
    } catch (error) {
      if (this._auth.id === id) {
        this._promise = null;
        this.store.dispatch({
          type: this.actionTypes.fetchError,
          error,
        });
        this._retry();
        throw error;
      }
    }
  }

  loadAccountInfo() {
    if (!this._promise) {
      this._promise = this._loadAccountInfo();
    }
    return this._promise;
  }

  get info() {
    return this._storage.getItem(this._infoStorageKey);
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

  get id() {
    return this.info.id;
  }

  get country() {
    return this.info.serviceInfo && this.info.serviceInfo.brand.homeCountry;
  }

  get mainCompanyNumber() {
    return this.info.mainNumber;
  }
}
