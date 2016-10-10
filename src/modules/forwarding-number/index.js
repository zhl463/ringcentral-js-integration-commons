import SymbolMap from 'data-types/symbol-map';
import KeyValueMap from 'data-types/key-value-map';
import RcModule, { initFunction } from '../../lib/rc-module';
import { proxify } from '../proxy';
import fetchList from '../../lib/fetch-list';
import forwardingNumberStatus from './forwarding-number-status';
import forwardingNumberActions from './forwarding-number-actions';
import getForwardingNumberReducer from './get-forwarding-number-reducer';
import forwardingNumberEvents from './forwarding-number-events';

const keys = new KeyValueMap({
  storage: 'forwarding-number-data',
});

const DEFAULT_TTL = 30 * 60 * 1000;

const symbols = new SymbolMap([
  'api',
  'auth',
  'storage',
  'ttl',
]);

export default class ForwardingNumber extends RcModule {
  constructor(options = {}) {
    super({
      ...options,
      actions: forwardingNumberActions,
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
          this.emit(forwardingNumberEvents.statusChange, {
            oldStatus: oldState.status,
            newStatus: newState.status,
          });
        }
        if (newState.error && newState.error !== oldState.error) {
          this.emit(forwardingNumberEvents.error, newState.error);
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
          (JSON.stringify(oldData[keys.storage].forwardingNumbers) !==
            JSON.stringify(newData[keys.storage].forwardingNumbers))
        ) {
          this.emit(forwardingNumberEvents.forwardingNumberChange, {
            oldData: oldData[keys.storage] && oldData[keys.storage].forwardingNumbers,
            newData: newData[keys.storage] && newData[keys.storage].forwardingNumbers,
          });
        }
      },
    );
  }

  @initFunction
  init() {
    this[symbols.storage].on(this[symbols.storage].storageEvents.ready, async () => {
      await this.loadForwardingNumbers();
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
  async loadForwardingNumbers(options = {}) {
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
          forwardingNumbers: await fetchList(params => (
            this[symbols.api].account().extension().forwardingNumber().list(params)
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
    return getForwardingNumberReducer(this.prefix);
  }

  get forwardingNumberStatus() {
    return forwardingNumberStatus;
  }
  static get forwardingNumberStatus() {
    return forwardingNumberStatus;
  }

  get forwardingNumberEvents() {
    return forwardingNumberEvents;
  }
  static get forwardingNumberEvents() {
    return forwardingNumberEvents;
  }

  get status() {
    return this.state.status;
  }

}
