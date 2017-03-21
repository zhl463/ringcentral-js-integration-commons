import 'core-js/fn/array/every';
import RcModule from '../RcModule';
import { prefixEnum } from '../Enum';
import moduleStatuses from '../../enums/moduleStatuses';
import baseActionTypes from './baseActionTypes';
import getDefaultReducer from './getDefaultReducer';
import getDefaultDataReducer from './getDefaultDataReducer';

export function checkName(name) {
  if (!name) {
    throw new Error('DataMatcher: "name" is required.');
  }
  if (typeof name !== 'string') {
    throw new Error('DataMatcher: "name" must be a string.');
  }
}

export function getQueryKey(name, query) {
  return `${name}-${query}`;
}

const DEFAULT_TTL = 30 * 1000;
const DEFAULT_NO_MATCH_TTL = 30 * 1000;

export default class DataMatcher extends RcModule {
  constructor({
    name,
    storage,
    ttl = DEFAULT_TTL,
    noMatchTtl = DEFAULT_NO_MATCH_TTL,
    actionTypes = prefixEnum({ base: baseActionTypes, prefix: name }),
    storageKey = `${name}Data`,
    getReducer = getDefaultReducer,
    getDataReducer = getDefaultDataReducer,
    ...options,
  } = {}) {
    checkName(name);
    super({
      ...options,
      actionTypes,
    });

    this._querySources = new Map();
    this._searchProviders = new Map();
    this._matchPromises = new Map();
    this._storage = storage;
    this._ttl = ttl;
    this._noMatchTtl = noMatchTtl;

    this._storageKey = storageKey;

    if (this._storage) {
      this._reducer = getReducer(this.actionTypes);
      this._storage.registerReducer({
        key: this._storageKey,
        reducer: getDataReducer(this.actionTypes)
      });
    } else {
      this._reducer = getReducer(this.actionTypes, {
        data: getDataReducer(this.actionTypes),
      });
    }

    this.addSelector('data',
      () => (
        this._storage ?
          this._storage.getItem(this._storageKey) :
          this.state.data
      ),
      data => (data || {}),
    );

    this.addSelector('dataMapping',
      this._selectors.data,
      (data) => {
        const dataMap = {};
        Object.keys(data).forEach((query) => {
          const queryResult = data[query];
          if (!queryResult) {
            return;
          }
          let matchesList = [];
          Object.keys(queryResult).forEach((providerName) => {
            if (queryResult[providerName] && queryResult[providerName].data.length > 0) {
              matchesList = matchesList.concat(queryResult[providerName].data);
            }
          });
          if (matchesList.length > 0) {
            dataMap[query] = matchesList;
          }
        });
        return dataMap;
      }
    );
    this._requestCounter = 0;
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
  }
  _getQueries() {
    const output = new Set();
    if (this.querySourcesReady) {
      this._querySources.forEach((_, getQueriesFn) => {
        getQueriesFn().forEach((query) => {
          output.add(query);
        });
      });
    }
    return [...output];
  }
  _cleanUp() {
    this.store.dispatch({
      type: this.actionTypes.cleanUp,
      queries: this._getQueries(),
      timestamp: Date.now(),
      ttl: this._ttl,
    });
  }
  _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
      this._cleanUp();
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
    } else if (this._shouldReset()) {
      this.store.dispatch({
        type: this.actionTypes.reset,
      });
      this.store.dispatch({
        type: this.actionTypes.resetSuccess,
      });
    }
  }

  _shouldInit() {
    return !!(
      this.pending &&
      (!this._storage || this._storage.ready) &&
      this.searchProvidersReady &&
      this.querySourcesReady
    );
  }

  _shouldReset() {
    return !!(
      this.ready &&
      (
        (!!this._storage && !this._storage.ready) ||
        !this.searchProvidersReady ||
        !this.querySourcesReady
      )
    );
  }

  get searchProvidersReady() {
    return [...this._searchProviders.values()]
      .every(({ readyCheckFn }) => readyCheckFn());
  }
  get querySourcesReady() {
    return [...this._querySources.values()]
      .every(readyCheckFn => readyCheckFn());
  }

  addSearchProvider({ name, searchFn, readyCheckFn }) {
    if (!name) {
      throw new Error(
        `${this.constructor.name}: "name" is required.`
      );
    }
    if (this._searchProviders.has(name)) {
      throw new Error(
        `${this.constructor.name}: A provider named "${name}" already exists.`
      );
    }
    if (typeof searchFn !== 'function') {
      throw new Error(
        `${this.constructor.name}: "searchFn" must be a function.`
      );
    }
    if (typeof readyCheckFn !== 'function') {
      throw new Error(
        `${this.constructor.name}: "readyCheckFn" must be a function.`
      );
    }
    this._searchProviders.set(name, {
      searchFn,
      readyCheckFn,
    });
  }

  addQuerySource({ getQueriesFn, readyCheckFn }) {
    if (typeof getQueriesFn !== 'function') {
      throw new Error(
        `${this.constructor.name}: "getQueriesFn" must be a function.`
      );
    }
    if (typeof readyCheckFn !== 'function') {
      throw new Error(
        `${this.constructor.name}: "readyCheckFn" must be a function.`
      );
    }
    if (this._querySources.has(getQueriesFn)) {
      throw new Error(
        `${this.constructor.name}: this getQueryFn has already been added.`
      );
    }
    this._querySources.set(getQueriesFn, readyCheckFn);
  }
  async triggerMatch() {
    if (this.ready) {
      this._cleanUp();
      await this.match({
        queries: this._getQueries(),
      });
    }
  }

  async match({
    queries,
    ignoreCache = false
  }) {
    await Promise.all([...this._searchProviders.keys()]
      .map(name => (
        this._matchSource({
          name,
          queries,
          ignoreCache,
        })
      )));
  }
  async _fetchMatchResult({
    name,
    queries,
  }) {
    const requestId = this._requestCounter;
    this._requestCounter += 1;
    try {
      this.store.dispatch({
        type: this.actionTypes.match,
        queries,
        name,
      });
      const provider = this._searchProviders.get(name);
      if (!provider) {
        throw new Error(
          `${this.constructor.name}: provider named "${name} does not exist`
        );
      }
      const promise = provider
        .searchFn({
          queries,
        });
      queries.forEach((query) => {
        // cache the promise
        const queryKey = getQueryKey(name, query);
        this._matchPromises.set(queryKey, {
          promise,
          requestId,
        });
      });
      const data = await promise;
      queries.forEach((query) => {
        // clear the cached promise
        const queryKey = getQueryKey(name, query);
        if (
          this._matchPromises.get(queryKey) &&
          this._matchPromises.get(queryKey).requestId === requestId
        ) {
          this._matchPromises.delete(queryKey);
        }
      });
      this.store.dispatch({
        type: this.actionTypes.matchSuccess,
        name,
        queries,
        data,
        timestamp: Date.now(),
      });
    } catch (error) {
      queries.forEach((query) => {
        // clear the cached promise
        const queryKey = getQueryKey(name, query);
        if (
          this._matchPromises.get(queryKey) &&
          this._matchPromises.get(queryKey).requestId === requestId
        ) {
          this._matchPromises.delete(queryKey);
        }
      });
      this.store.dispatch({
        type: this.actionTypes.matchError,
        name,
        queries,
        error,
        timestamp: Date.now(),
      });
      throw error;
    }
  }
  async _matchSource({
    name,
    queries,
    ignoreCache
  }) {
    const now = Date.now();
    const promises = [];
    const filteredQueries = [];
    const data = this.data;
    queries.forEach((query) => {
      const queryKey = getQueryKey(name, query);
      if (this._matchPromises.has(queryKey)) {
        promises.push(this._matchPromises.get(queryKey));
      } else if (
        ignoreCache ||
        !data[query] ||
        !data[query][name] ||
        now - data[query][name]._t > this._noMatchTtl
      ) {
        filteredQueries.push(query);
      }
    });
    if (filteredQueries.length) {
      promises.push(this._fetchMatchResult({
        name,
        queries,
      }));
    }

    if (promises.length) {
      await Promise.all(promises);
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

  get data() {
    return this._selectors.data();
  }

  get dataMapping() {
    return this._selectors.dataMapping();
  }
}
