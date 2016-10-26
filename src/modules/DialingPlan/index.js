import RcModule from '../../lib/RcModule';
import dialingPlanStatus from './dialingPlanStatus';
import dialingPlanActionTypes from './dialingPlanActionTypes';
import getDialingPlanReducer from './getDialingPlanReducer';
import fetchList from '../../lib/fetchList';

export default class DialingPlan extends RcModule {
  constructor({
    auth,
    client,
    storage,
    ttl = 30 * 60 * 1000,
    ...options,
  }) {
    super({
      ...options,
      actionTypes: dialingPlanActionTypes,
    });
    this._auth = auth;
    this._storage = storage;
    this._client = client;
    this._ttl = ttl;
    this._storageKey = 'dialingPlan';
    this._reducer = getDialingPlanReducer(this.prefix);
    this._promise = null;
  }
  initialize() {
    this.store.subscribe(() => {
      if (
        this._storage.status !== this._storage.storageStatus.pending &&
        this.status === dialingPlanStatus.pending
      ) {
        this.store.dispatch({
          type: this.actionTypes.init,
        });
        if (
          this._auth.isFreshLogin ||
          !this._storage.hasItem(this._storageKey) ||
          Date.now() - this.data.timestamp > this._ttl
        ) {
          this.loadDialingPlan();
        }
      } else if (
        this._storage.status === this._storage.storageStatus.pending &&
        this.status !== dialingPlanStatus.pending
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

  get plans() {
    return this.data.dialingPlans;
  }

  get status() {
    return this.state.status;
  }

  get error() {
    return this.state.error;
  }

  get dialingPlanStatus() {
    return dialingPlanStatus;
  }

  async loadDialingPlan() {
    if (!this._promise) {
      this._promise = (async () => {
        this.store.dispatch({
          type: this.actionTypes.fetch,
        });
        try {
          this._storage.setItem(this._storageKey, {
            dialingPlans: await fetchList(params => (
              this._client.account().dialingPlan().list(params)
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
