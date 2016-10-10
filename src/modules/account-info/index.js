import SymbolMap from 'data-types/symbol-map';
import KeyValueMap from 'data-types/key-value-map';
import RcModule, { initFunction } from '../../lib/rc-module';
import { proxify } from '../proxy';
import accountInfoStatus from './account-info-status';
import accountInfoActions from './account-info-actions';
import getAccountInfoReducer from './get-account-info-reducer';
import accountInfoEvents from './account-info-events';

const keys = new KeyValueMap({
  storage: 'account-info-data',
});

const DEFAULT_TTL = 30 * 60 * 1000;

const symbols = new SymbolMap([
  'api',
  'auth',
  'storage',
  'ttl',
]);

export default class AccountInfo extends RcModule {
  constructor(options = {}) {
    super({
      ...options,
      actions: accountInfoActions,
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
          this.emit(accountInfoEvents.statusChange, {
            oldStatus: oldState.status,
            newStatus: newState.status,
          });
        }
        if (newState.error && newState.error !== oldState.error) {
          this.emit(accountInfoEvents.error, newState.error);
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
          (JSON.stringify(oldData[keys.storage].accountInfo) !==
            JSON.stringify(newData[keys.storage].accountInfo))
        ) {
          this.emit(accountInfoEvents.accountInfoChange, {
            oldData: oldData[keys.storage] && oldData[keys.storage].accountInfo,
            newData: newData[keys.storage] && newData[keys.storage].accountInfo,
          });
        }
      },
    );
  }

  @initFunction
  init() {
    this[symbols.storage].on(this[symbols.storage].storageEvents.ready, async () => {
      await this.loadAccountInfo();
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
  async loadAccountInfo(options = {}) {
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
          accountInfo: await this[symbols.api].account().get(),
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
    return getAccountInfoReducer(this.prefix);
  }

  get accountInfoStatus() {
    return accountInfoStatus;
  }
  static get accountInfoStatus() {
    return accountInfoStatus;
  }

  get accountInfoEvents() {
    return accountInfoEvents;
  }
  static get accountInfoEvents() {
    return accountInfoEvents;
  }

  get status() {
    return this.state.status;
  }
}
