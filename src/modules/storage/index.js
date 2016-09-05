import SymbolMap from 'data-types/symbol-map';
import Loganberry from 'loganberry';
import KeyValueMap from 'data-types/key-value-map';
import RcModule, { initFunction } from '../../lib/rc-module';
import { proxify } from '../../modules/proxy';
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
      storage = localStorage,
      auth,
    } = options;
    this[symbols.storage] = storage;
    this[symbols.auth] = auth;

    this.on('state-update', ({ oldState, newState }) => {
      if (!oldState || oldState.status !== newState.status) {
        this::emit(storageEvents.statusChanged, newState.status);
      }
      if (!oldState || oldState.data !== newState.data) {
        this.emit(storageEvents.dataChanged, newState.data);
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

      let data = null;
      let error = null;
      let status = storageStatus.saved;
      if (this[symbols.storage]) {
        try {
          const json = await (async () => this[symbols.storage].getItem(key))();
          if (json) {
            data = JSON.parse(json);
          }
        } catch (e) {
          status = storageStatus.dirty;
          error = e;
        }
      }
      if (!data) data = {};

      this.store.dispatch({
        type: this.actions.init,
        key,
        data,
        error,
        status,
      });
    });

    this[symbols.auth].on(this[symbols.auth].events.notLoggedIn, () => {
      this.store.dispatch({
        type: this.actions.reset,
      });
    });
  }

  @proxify
  async setItem(key, value) {
    if (!this.state || this.state.status === storageStatus.pending) {
      throw new Error('Storage is not ready');
    }
    this.store.dispatch({
      type: this.actions.update,
      data: {
        [key]: value,
      },
    });
    await this.save();
  }

  @proxify
  async setData(data) {
    if (!this.state || this.state.status === storageStatus.pending) {
      throw new Error('Storage is not ready');
    }
    this.store.dispatch({
      type: this.action.update,
      data,
    });
    if (this[symbols.storage]) {
      await (
        async () => this[symbols.storage].setItem(this.key, JSON.stringify(this.getData()))
      )();
    }
    this.store.dispatch({
      type: this.action.save,
    });
  }

  @proxify
  async removeItem(key) {
    if (!this.state || this.state.status === storageStatus.pending) {
      throw new Error('Storage is not ready');
    }
    this.store.dispatch({
      type: this.action.remove,
      key,
    });
    if (this[symbols.storage]) {
      await (
        async () => this[symbols.storage].removeItem(this.key)
      )();
    }
    this.store.dispatch({
      type: this.action.save,
    });
  }

  @proxify
  async removeData() {
    if (!this.state || this.state.status === storageStatus.pending) {
      throw new Error('Storage is not ready');
    }
    if (!this[symbols.storage]) {
      throw new Error('No storage option was supplied');
    }
    await (async () => this[symbols.storage].removeItem(this.key))();
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
