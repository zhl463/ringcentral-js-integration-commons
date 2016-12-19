import RcModule from '../../lib/RcModule';
import fetchList from '../../lib/fetchList';
import moduleStatus from '../../enums/moduleStatus';
import actionTypes from './actionTypes';
import getDialingPlanReducer, {
  getPlansReducer,
  getTimestampReducer,
} from './getDialingPlanReducer';

const DEFAULT_TTL = 30 * 60 * 1000;
const DEFAULT_RETRY = 60 * 1000;

export default class DialingPlan extends RcModule {
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
    this._plansStorageKey = 'dialingPlans';
    this._timestampStorageKey = 'dialingPlanTimestamp';
    this._reducer = getDialingPlanReducer(this.actionTypes);

    this._storage.registerReducer({
      key: this._plansStorageKey,
      reducer: getPlansReducer(this.actionTypes),
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
          await this.loadDialingPlan();
        } else {
          this._startPolling();
        }
        this.store.dispatch({
          type: this.actionTypes.initSuccess,
        });
      } else if (
        (!this._auth.loggedIn || !this._storage.ready) &&
        this.ready
      ) {
        this._stopPolling();
        this._promise = null;
        this.store.dispatch({
          type: this.actionTypes.reset,
        });
      }
    });
  }

  get plans() {
    return this._storage.getItem(this._plansStorageKey);
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

  _startPolling(t = this.timestamp + this._ttl + 10 - Date.now()) {
    this._stopPolling();
    this._timeoutId = setTimeout(() => {
      this._timeoutId = null;
      if (!this._tabManager || this._tabManager.active) {
        if (!this.timestamp || Date.now() - this.timestamp > this._ttl) {
          this.loadDialingPlan();
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

  _stopPolling() {
    if (this._timeoutId) clearTimeout(this._timeoutId);
  }

  async _loadDialingPlan() {
    this.store.dispatch({
      type: this.actionTypes.fetch,
    });
    const id = this._auth.id;
    try {
      const plans = (await fetchList(params => (
        this._client.account().dialingPlan().list(params)
      ))).map(p => ({
        id: p.id,
        isoCode: p.isoCode,
        callingCode: p.callingCode,
      }));
      if (this._auth.id === id) {
        this.store.dispatch({
          type: this.actionTypes.fetchSuccess,
          plans,
          timestamp: Date.now(),
        });
        this._startPolling();
        this._promise = null;
      }
    } catch (error) {
      if (this._auth.id === id) {
        this._promise = null;
        this.store.dispatch({
          type: this.actionTypes.fetchError,
          error,
        });
        this._startPolling(this._timeToRetry);
        throw error;
      }
    }
  }
  loadDialingPlan() {
    if (!this._promise) {
      this._promise = this._loadDialingPlan();
    }
    return this._promise;
  }
}

