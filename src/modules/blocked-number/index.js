import SymbolMap from 'data-types/symbol-map';
import KeyValueMap from 'data-types/key-value-map';
import RcModule, { initFunction } from '../../lib/rc-module';
import { proxify } from '../proxy';
import fetchList from '../../lib/fetch-list';
import blockedNumberStatus from './blocked-number-status';
import blockedNumberActions from './blocked-number-actions';
import getBlockedNumberReducer from './get-blocked-number-reducer';
import blockedNumberEvents from './blocked-number-events';

const keys = new KeyValueMap({
  storage: 'blocked-number-data',
});

const DEFAULT_TTL = 30 * 60 * 1000;

const symbols = new SymbolMap([
  'api',
  'auth',
  'storage',
  'ttl',
]);

export default class BlockedNumber extends RcModule {
  constructor(options = {}) {
    super({
      ...options,
      actions: blockedNumberActions,
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
          this.emit(blockedNumberEvents.statusChange, {
            oldStatus: oldState.status,
            newStatus: newState.status,
          });
        }
        if (newState.error && newState.error !== oldState.error) {
          this.emit(blockedNumberEvents.error, newState.error);
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
          (JSON.stringify(oldData[keys.storage].blockedNumbers) !==
            JSON.stringify(newData[keys.storage].blockedNumbers))
        ) {
          this.emit(blockedNumberEvents.blockedNumberChange, {
            oldData: oldData[keys.storage] && oldData[keys.storage].blockedNumbers,
            newData: newData[keys.storage] && newData[keys.storage].blockedNumbers,
          });
        }
      },
    );
  }

  @initFunction
  init() {
    this[symbols.storage].on(this[symbols.storage].storageEvents.ready, async () => {
      await this.loadBlockedNumbers();
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
  async loadBlockedNumbers(options = {}) {
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
          blockedNumbers: await fetchList(params => (
            this[symbols.api].account().extension().blockedNumber().list(params)
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
    return getBlockedNumberReducer(this.prefix);
  }

  get blockedNumberStatus() {
    return blockedNumberStatus;
  }
  static get blockedNumberStatus() {
    return blockedNumberStatus;
  }

  get blockedNumberEvents() {
    return blockedNumberEvents;
  }
  static get blockedNumberEvents() {
    return blockedNumberEvents;
  }

  get status() {
    return this.state.status;
  }

}
