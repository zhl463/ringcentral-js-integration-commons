import RcModule from '../RcModule';
import { prefixEnum } from '../Enum';
import ensureExist from '../ensureExist';

import moduleStatuses from '../../enums/moduleStatuses';
import baseActionTypes from './baseActionTypes';
import getDefaultReducer from './getDefaultReducer';

/**
 * @function defaultIdentityFunction
 * @description Identity function returns a deterministic id value for each item.
 * @param {Object} item
 * @return {String}
 */
export function defaultIdentityFunction(item) {
  return item.id;
}

/**
 * @function
 * @description Convert array of { name, id } objects into a map.
 * @param {[{ name: String, id: String }]} loggingList
 * @return {{ [ids]: { [names]: true } }}
 */
export function convertListToMap(loggingList) {
  const mapping = {};
  loggingList.forEach((item) => {
    if (!mapping[item.id]) {
      mapping[item.id] = {
        [item.name]: true,
      };
    } else {
      mapping[item.id][item.name] = true;
    }
  });
  return mapping;
}

/**
 * @class
 * @description Base class implementation for loggers.
 */
export default class LoggerBase extends RcModule {
  /**
   * @constructor
   * @param {String} params.name - name of the class
   * @param {Object} params.actionTypes
   * @param {Function} params.getReducer
   * @param {Function} params.identityFunction - function that can derive an unique
   *    id from items.
   */
  constructor({
    name,
    actionTypes = prefixEnum({ base: baseActionTypes, prefix: name }),
    getReducer = getDefaultReducer,
    identityFunction = defaultIdentityFunction,
    ...options,
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._name = this::ensureExist(name, 'name');
    this._identityFunction = this::ensureExist(identityFunction, 'identityFunction');

    this._reducer = getReducer(this.actionTypes);

    this._logPromises = new Map();
    this._logProviders = new Map();

    this.addSelector('loggingMap',
      () => this.loggingList,
      convertListToMap,
    );
  }

  addLogProvider({
    name,
    logFn,
    readyCheckFn,
    ...options,
  } = {}) {
    if (!name) {
      throw new Error(
        `${this.constructor.name}: "name" is required.`
      );
    }
    if (this._logProviders.has(name)) {
      throw new Error(
        `${this.constructor.name}: A provider named "${name}" already exists.`
      );
    }
    if (typeof logFn !== 'function') {
      throw new Error(
        `${this.constructor.name}: "logFn" must be a function.`
      );
    }
    if (typeof readyCheckFn !== 'function') {
      throw new Error(
        `${this.constructor.name}: "readyCheckFn" must be a function.`
      );
    }
    this._logProviders.set(name, {
      logFn,
      readyCheckFn,
      ...options,
    });
  }

  get logProvidersReady() {
    return [...this._logProviders.values()]
      .every(provider => provider.readyCheckFn());
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
  }

  _shouldInit() {
    return this.pending &&
      this.logProvidersReady;
  }
  _shouldReset() {
    return this.ready &&
      !this.logProvidersReady;
  }

  async _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
      if (typeof this._onInit === 'function') {
        await this._onInit();
      }
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
    } else if (this._shouldReset()) {
      this.store.dispatch({
        type: this.actionTypes.reset,
      });
      if (typeof this._onReset === 'function') {
        await this._onReset();
      }
      this.store.dispatch({
        type: this.actionTypes.resetSuccess,
      });
    }
  }

  async _log({ item, name, ...options } = {}) {
    if (!this.ready) {
      throw new Error(`${this.constructor.name}._log: module is not ready.`);
    }
    if (!item) {
      throw new Error(`${this.constructor.name}._log: options.item is undefined.`);
    }
    if (!name) {
      throw new Error(`${this.constructor.name}._log: options.name is undefined.`);
    }
    if (!this._logProviders.has(name)) {
      throw new Error(`${this.constructor.name}._log: provider '${name}' does not exist.`);
    }

    const id = this._identityFunction(item);
    const key = `${name}-${id}`;
    // wait for the previous log action to finish
    if (this._logPromises.has(key)) {
      await this._logPromises.get(key);
    }
    try {
      this.store.dispatch({
        type: this.actionTypes.log,
        name,
        id,
      });
      const promise = this._logProviders.get(name).logFn({ item, ...options });
      this._logPromises.set(key, promise);
      await promise;
      this._logPromises.delete(key);
      this.store.dispatch({
        type: this.actionTypes.logSuccess,
        name,
        id,
      });
    } catch (error) {
      this._logPromises.delete(key);
      this.store.dispatch({
        type: this.actionTypes.logError,
        error,
        name,
        id,
      });
      throw error;
    }
  }

  async log({ item, name, ...options }) {
    if (!this.ready) {
      throw new Error(`${this.constructor.name}.log: module is not ready.`);
    }
    if (!item) {
      throw new Error(`${this.constructor.name}.log: options.item is undefined.`);
    }

    if (name) {
      if (!this._logProviders.has(name)) {
        throw new Error(`${this.constructor.name}.log: provider '${name}' does not exist.`);
      }
      await this._log({ item, name, ...options });
    } else {
      await Promise.all(
        [...this._logProviders.keys()]
          .map(key => this._log({ item, name: key, ...options }))
      );
    }
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.state.status === moduleStatuses.ready;
  }

  get pending() {
    return this.state.status === moduleStatuses.pending;
  }

  get loggingList() {
    return this.state.loggingList;
  }

  get loggingMap() {
    return this._selectors.loggingMap();
  }

}
