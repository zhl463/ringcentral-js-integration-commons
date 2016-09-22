import SymbolMap from 'data-types/symbol-map';
import Loganberry from 'loganberry';
import KeyValueMap from 'data-types/key-value-map';
import RcModule, { initFunction } from '../../lib/rc-module';
import { proxify } from '../../modules/proxy';
import NamedStorage from '../../lib/named-storage';
import getStorageReducer from './get-storage-reducer';
import storageActions from './storage-actions';
import storageStatus from './storage-status';
import storageEvents from './storage-events';
import { emit } from '../../lib/utils';

const logger = new Loganberry({
  prefix: 'storage',
});

const symbols = new SymbolMap([
  'storage',
  'storageProvider',
  'unsubscribeStorage',
]);

const CONSTANTS = new KeyValueMap({
  status: storageStatus,
  events: storageEvents,
});

export default class Storage extends RcModule {
  constructor(options) {
    super({
      ...options,
      actions: storageActions,
    });
    const {
      StorageProvider = NamedStorage,
      auth,
    } = options;
    this[symbols.storage] = null;
    this[symbols.storageProvider] = StorageProvider;
    this[symbols.auth] = auth;

    this.on('state-change', ({ oldState, newState }) => {
      if (!oldState || oldState.status !== newState.status) {
        this::emit(storageEvents.statusChanged, newState.status);
      }
      if (!oldState || oldState.data !== newState.data) {
        this.emit(storageEvents.dataChanged, newState.data);
      }
      if (newState.key && (!oldState || !oldState.key)) {
        this.emit(storageEvents.ready);
      }
    });
  }
  get reducer() {
    return getStorageReducer(this.prefix);
  }

  get key() {
    return this.state.key;
  }

  get status() {
    return this.state.status;
  }

  get constants() {
    return CONSTANTS;
  }

  @initFunction
  init() {
    this[symbols.auth].on(this[symbols.auth].events.loggedIn, async () => {
      const key = `${this.prefix ? `${this.prefix}-` : ''}storage-${this[symbols.auth].ownerId}`;
      this[symbols.storage] = new this[symbols.storageProvider]({ key });

      let data = null;
      let error = null;
      let status = storageStatus.saved;

      try {
        data = await (async () => this[symbols.storage].getData())();
      } catch (e) {
        status = storageStatus.dirty;
        error = e;
      }

      if (!data) data = {};

      this.store.dispatch({
        type: this.actions.init,
        key,
        data,
        error,
        status,
      });

      this[symbols.unsubscribeStorage] = this[symbols.storage].subscribe(newData => {
        this.store.dispatch({
          type: this.actions.load,
          data: newData,
        });
      });
    });

    this[symbols.auth].on(this[symbols.auth].events.notLoggedIn, () => {
      this.store.dispatch({
        type: this.actions.reset,
      });
      this[symbols.unsubscribeStorage]();
      this[symbols.storage].destroy();
      this[symbols.storage] = null;
    });
  }

  @proxify
  async setItem(key, value) {
    await this.setData({
      [key]: value,
    });
  }

  @proxify
  async setData(data) {
    if (!this.state || this.state.status === storageStatus.pending) {
      throw new Error('Storage is not ready');
    }
    this.store.dispatch({
      type: this.actions.update,
      data,
    });
    try {
      this.store.dispatch({
        type: this.actions.save,
      });
      await(
        async () => this[symbols.storage].setData(this.getData())
      )();
      this.store.dispatch({
        type: this.actions.saveSuccess,
      });
    } catch (error) {
      this.store.dispatch({
        type: this.actions.saveError,
        error,
      });
    }
  }

  @proxify
  async removeItem(key) {
    if (!this.state || this.state.status === storageStatus.pending) {
      throw new Error('Storage is not ready');
    }
    this.store.dispatch({
      type: this.actions.remove,
      key,
    });
    try {
      this.store.dispatch({
        type: this.actions.save,
      });
      await(
        async () => this[symbols.storage].setData(this.getData())
      )();
      this.store.dispatch({
        type: this.actions.saveSuccess,
      });
    } catch (error) {
      this.store.dispatch({
        type: this.actions.saveError,
        error,
      });
    }
  }

  getItem(key) {
    return this.state.data[key];
  }

  getData() {
    return {
      ...this.state.data,
    };
  }
}
