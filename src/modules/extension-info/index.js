import SymbolMap from 'data-types/symbol-map';
import KeyValueMap from 'data-types/key-value-map';
import RcModule, { initFunction } from '../../lib/rc-module';
import { proxify } from '../proxy';
import extensionInfoStatus from './extension-info-status';
import extensionInfoActions from './extension-info-actions';
import getExtensionInfoReducer from './get-extension-info-reducer';
import extensionInfoEvents from './extension-info-events';

const keys = new KeyValueMap({
  storage: 'extension-info-data',
});

const DEFAULT_TTL = 30 * 60 * 1000;

const symbols = new SymbolMap([
  'api',
  'auth',
  'storage',
  'ttl',
]);

export default class ExtensionInfo extends RcModule {
  constructor(options = {}) {
    super({
      ...options,
      actions: extensionInfoActions,
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
          this.emit(extensionInfoEvents.statusChange, {
            oldStatus: oldState.status,
            newStatus: newState.status,
          });
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
          JSON.stringify(oldData[keys.storage]) !== JSON.stringify(newData[keys.storage])
        ) {
          this.emit(extensionInfoEvents.extensionInfoChange, newData[keys.storage].extensionInfo);
        }
      },
    );
  }

  @initFunction
  init() {
    this[symbols.storage].on(this[symbols.storage].storageEvents.ready, async () => {
      await this.loadExtensionInfo();
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
  async loadExtensionInfo(options = {}) {
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
          extensionInfo: await this[symbols.api].account().extension().get(),
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
    return getExtensionInfoReducer(this.prefix);
  }

  get extensionInfoStatus() {
    return extensionInfoStatus;
  }
  static get extensionInfoStatus() {
    return extensionInfoStatus;
  }

  get extensionInfoEvents() {
    return extensionInfoEvents;
  }
  static get extensionInfoEvents() {
    return extensionInfoEvents;
  }

  get status() {
    return this.state.status;
  }
}
