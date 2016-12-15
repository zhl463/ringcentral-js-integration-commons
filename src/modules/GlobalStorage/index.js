import RcModule from '../../lib/RcModule';
import SynchronizedStorage from '../../lib/SynchronizedStorage';

import actionTypes from './actionTypes';
import moduleStatus from '../../enums/moduleStatus';
import getStorageReducer from '../Storage/getStorageReducer';

/**
 * @class
 * @description Alternative implementation of the Storage class.
 *  Allows registeration of reducers so that persisted states can be computed with reducers.
 */
export default class GlobalStorage extends RcModule {
  constructor({
    StorageProvider = SynchronizedStorage,
    ...options,
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._StorageProvider = StorageProvider;
    this._reducers = {};
    this._reducer = getStorageReducer({ types: this.actionTypes, reducers: this._reducers });
  }
  initialize() {
    let storedData = null;
    const storageKey =
      `${this.prefix ? `${this.prefix}-` : ''}GlobalStorage`;
    this._storage = new this._StorageProvider({
      storageKey,
    });
    storedData = this._storage.getData();
    for (const key in storedData) {
      if (!this._reducers[key]) {
        delete storedData[key];
        this._storage.removeItem(key);
      }
    }
    this.store.dispatch({
      type: this.actionTypes.init,
      storageKey,
      data: storedData,
    });
    this._storageHandler = ({ key, value }) => {
      if (this.ready) {
        storedData[key] = value;
        this.store.dispatch({
          type: this.actionTypes.sync,
          key,
          value,
        });
      }
    };
    this._storage.on('storage', this._storageHandler);
    this.store.subscribe(() => {
      if (this.status !== moduleStatus.pending) {
        // save new data to storage when changed
        const currentData = this.data;
        for (const key in currentData) {
          if (storedData[key] !== currentData[key]) {
            this._storage.setItem(key, currentData[key]);
            storedData[key] = currentData[key];
          }
        }
      }
    });
  }

  registerReducer({ key, reducer }) {
    if (this._initialized) {
      throw new Error('Reducers must be registered before initialize');
    }
    if (this._reducers[key]) {
      throw new Error(`Reducer of key: '${key}' already exists`);
    }
    this._reducers[key] = reducer;
  }

  getItem(key) {
    return this.state.data[key];
  }

  get data() {
    return this.state.data;
  }

  get status() {
    return this.state.status;
  }

  get storageKey() {
    return this.state.storageKey;
  }

  get ready() {
    return this.status === moduleStatus.ready;
  }

}
