import RcModule from '../../lib/RcModule';
import NamedStorage from '../../lib/NamedStorage';
import storageStatus from './storageStatus';
import storageActionTypes from './storageActionTypes';
import getStorageReducer from './getStorageReducer';

export default class Storage extends RcModule {
  constructor({
    auth,
    StorageProvider = NamedStorage,
    ...options,
  } = {}) {
    super({
      ...options,
      actionTypes: storageActionTypes,
    });
    this._auth = auth;
    this._StorageProvider = StorageProvider;
    this._storage = null;
    this._reducer = getStorageReducer(this.prefix);
  }
  initialize() {
    this.store.subscribe(() => {
      if (
        this._auth.status === this._auth.authStatus.loggedIn &&
        this.status !== storageStatus.ready
      ) {
        const storageKey = `${this.prefix ? `${this.prefix}-` : ''}storage-${this._auth.ownerId}`;
        this._storage = new this._StorageProvider({ storageKey });

        const initialData = this._storage.getData() || {};
        this.store.dispatch({
          type: this.actionTypes.init,
          storageKey,
          data: initialData,
        });
        this._unsubscribe = this._storage.subscribe(updatedData => {
          if (this.status === storageStatus.ready) {
            this.store.dispatch({
              type: this.actions.load,
              data: updatedData,
            });
          }
        });
      } else if (
        this._auth.status === this._auth.authStatus.notLoggedIn &&
        this.status !== storageStatus.pending
      ) {
        this.store.dispatch({
          type: this.actionTypes.reset,
        });
        if (this._unsubscribe) {
          this._unsubscribe();
        }
        if (this._storage) {
          this._storage.destroy();
          this._storage = null;
        }
      }
    });
    this._auth.addBeforeLogoutHandler(() => {
      this.store.dispatch({
        type: this.actionTypes.reset,
      });
      if (this._unsubscribe) {
        this._unsubscribe();
      }
      if (this._storage) {
        this._storage.destroy();
        this._storage = null;
      }
    });
  }

  getItem(key) {
    return this.data[key];
  }

  setItem(key, value) {
    this.store.dispatch({
      type: this.actionTypes.set,
      key,
      value,
    });
    this._storage.setData(this.data);
  }

  hasItem(key) {
    return this.data::Object.prototype.hasOwnProperty(key);
  }
  removeItem(key) {
    this.store.dispatch({
      type: this.actionTypes.remove,
      key,
    });
    this._storage.setData(this.data);
  }

  get data() {
    return this.state.data;
  }

  get status() {
    return this.state.status;
  }

  get storageStatus() {
    return storageStatus;
  }

}
