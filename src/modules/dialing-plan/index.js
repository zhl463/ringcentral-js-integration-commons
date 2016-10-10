import SymbolMap from 'data-types/symbol-map';
import KeyValueMap from 'data-types/key-value-map';
import RcModule, { initFunction } from '../../lib/rc-module';
import { proxify } from '../proxy';
import fetchList from '../../lib/fetch-list';
import dialingPlanStatus from './dialing-plan-status';
import dialingPlanActions from './dialing-plan-actions';
import getDialingPlanReducer from './get-dialing-plan-reducer';
import dialingPlanEvents from './dialing-plan-events';

const keys = new KeyValueMap({
  storage: 'dialing-plan-data',
});

const DEFAULT_TTL = 30 * 60 * 1000;

const symbols = new SymbolMap([
  'api',
  'auth',
  'storage',
  'ttl',
]);

export default class DialingPlan extends RcModule {
  constructor(options = {}) {
    super({
      ...options,
      actions: dialingPlanActions,
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
          this.emit(dialingPlanEvents.statusChange, {
            oldStatus: oldState.status,
            newStatus: newState.status,
          });
        }
        if (newState.error && newState.error !== oldState.error) {
          this.emit(dialingPlanEvents.error, newState.error);
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
          (JSON.stringify(oldData[keys.storage].dialingPlans) !==
            JSON.stringify(newData[keys.storage].dialingPlans))
        ) {
          this.emit(dialingPlanEvents.dialingPlanChange, {
            oldData: oldData[keys.storage] && oldData[keys.storage].dialingPlans,
            newData: newData[keys.storage] && newData[keys.storage].dialingPlans,
          });
        }
      },
    );
  }

  @initFunction
  init() {
    this[symbols.storage].on(this[symbols.storage].storageEvents.ready, async () => {
      await this.loadDialingPlans();
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
  async loadDialingPlans(options = {}) {
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
          dialingPlans: await fetchList(params => (
            this[symbols.api].account().dialingPlan().list(params)
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
    return getDialingPlanReducer(this.prefix);
  }

  get dialingPlanStatus() {
    return dialingPlanStatus;
  }
  static get dialingPlanStatus() {
    return dialingPlanStatus;
  }

  get dialingPlanEvents() {
    return dialingPlanEvents;
  }
  static get dialingPlanEvents() {
    return dialingPlanEvents;
  }

  get status() {
    return this.state.status;
  }
}
