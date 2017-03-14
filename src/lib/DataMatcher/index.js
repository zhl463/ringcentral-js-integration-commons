import 'core-js/fn/array/every';
import RcModule from '../RcModule';
import { prefixEnum } from '../Enum';
import moduleStatus from '../../enums/moduleStatus';

import actionTypesBase from './actionTypesBase';
import getMatcherReducer from './getMatcherReducer';
import getCacheReducer from './getCacheReducer';

import { getCacheKey, matchResult } from './helpers';

export function checkName(name) {
  if (!name) {
    throw new Error('DataMatcher: "name" is required.');
  }
  if (typeof name !== 'string') {
    throw new Error('DataMatcher: "name" must be a string.');
  }
}

const DEFAULT_TTL = 30 * 60 * 1000;
const DEFAULT_NO_MATCHER_TTL = 30 * 1000;

export default class DataMatcher extends RcModule {
  constructor({
    name,
    auth,
    storage,
    ttl = DEFAULT_TTL,
    noMatchTtl = DEFAULT_NO_MATCHER_TTL,
    actionTypes = prefixEnum({ enumMap: actionTypesBase, prefix: name }),
    storageKey = `${name}Data`,
    getReducer = getMatcherReducer,
    getDataReducer = getCacheReducer,
    ...options,
  }) {
    checkName(name);
    super({
      ...options,
      actionTypes,
    });

    this._querySources = new Map();
    this._searchSource = {};

    this._auth = auth;
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
        cache: getDataReducer(this.actionTypes),
      });
    }
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
  }

  _onStateChange() {
    if (this._shouldInit()) {
      this._initModuleStatus();
      this.triggerMatch();
    } else if (this._shouldReset()) {
      this._resetModuleStatus();
    }
  }

  _shouldInit() {
    return (
      !this.ready &&
      this._auth.loggedIn &&
      (!this._storage || this._storage.ready) &&
      this._readyCheck()
    );
  }

  _shouldReset() {
    return (
      this.ready &&
      (
        !this._auth.loggedIn ||
        ((!!this._storage) && !this._storage.ready)
      )
    );
  }

  _initModuleStatus() {
    this.store.dispatch({
      type: this.actionTypes.initSuccess,
      expiredKeys: this._getExpiredKeys(),
    });
  }

  _resetModuleStatus() {
    this.store.dispatch({
      type: this.actionTypes.resetSuccess,
    });
  }

  _readyCheck() {
    return Object.keys(this._searchSource)
      .every(sourceName => this._searchSource[sourceName].readyCheckFn()) &&
      [...this._querySources.values()].every(readyCheckFn => readyCheckFn());
  }

  _getExpiredKeys() {
    const expiredKeys = [];
    const now = Date.now();
    const matchRecord = this.cache.matchRecord;
    Object.keys(matchRecord).forEach((key) => {
      const ttl =
        matchRecord[key].result === matchResult.notFound ? this._noMatchTtl : this._ttl;
      if (now - matchRecord[key].timestamp > ttl) {
        expiredKeys.push(key);
      }
    });
    return expiredKeys;
  }

  addSearchSource({ sourceName, searchFn, readyCheckFn }) {
    if (!sourceName) {
      throw new Error('DataMatcher: "sourceName" is required.');
    }
    if (this._searchSource[sourceName]) {
      throw new Error(`DataMatcher: A source named "${sourceName}" already exists.`);
    }
    if (typeof searchFn !== 'function') {
      throw new Error('DataMatcher: "searchFn" must be a function.');
    }
    if (typeof readyCheckFn !== 'function') {
      throw new Error('DataMatcher: "readyCheckFn" must be a function.');
    }
    this._searchSource[sourceName] = {
      searchFn,
      readyCheckFn,
    };
  }

  addQuerySource({ getQueriesFn, readyCheckFn }) {
    if (typeof getQueriesFn !== 'function') {
      throw new Error('DataMatcher: "getQueriesFn" must be a function.');
    }
    if (typeof readyCheckFn !== 'function') {
      throw new Error('DataMatcher: "readyCheckFn" must be a function.');
    }
    if (this._querySources.has(getQueriesFn)) {
      throw new Error('DataMatcher: "getQueriesFn" is already added.');
    }
    this._querySources.set(getQueriesFn, readyCheckFn);
  }

  async triggerMatch() {
    if (!this.ready) {
      return;
    }

    let queries = [];
    this._querySources.forEach((_, getQueriesFn) => {
      queries = queries.concat(getQueriesFn());
    });
    queries = [...(new Set(queries))];
    if (queries.length) {
      await this.match({ queries });
    }
  }

  match({ queries, ignoreCache = false }) {
    return Promise.all(Object.keys(this._searchSource).map(sourceName => (
      this._matchSource({
        sourceName,
        queries: [...new Set(queries)], // new Set for making unique
        ignoreCache,
      })
    )));
  }

  _filterQueriesFromCache({ sourceName, queries }) {
    const now = Date.now();
    return queries.filter((query) => {
      const cacheKey = getCacheKey(sourceName, query);
      const cache = this.cache;
      return !(
        (cache.matchRecord[cacheKey] &&
        (now - cache.matchRecord[cacheKey].timestamp) < (
          cache.matchRecord[cacheKey].result === matchResult.notFound ?
            this._noMatchTtl : this._ttl
        )) ||
        this.state.matching.indexOf(cacheKey) !== -1
      );
    });
  }

  async _matchSource({ sourceName, queries, ignoreCache }) {
    const filteredQueries =
      ignoreCache ? queries : this._filterQueriesFromCache({ sourceName, queries });
    if (filteredQueries.length) {
      this._startMatch({
        sourceName,
        queries: filteredQueries,
      });
      try {
        const data = await this._searchSource[sourceName].searchFn({
          queries: filteredQueries,
        });
        this._finishMatch({
          sourceName,
          queries: filteredQueries,
          data,
        });
      } catch (error) {
        this._onMatchError({
          sourceName,
          queries: filteredQueries,
          error,
        });
      }
    }
  }

  _startMatch({ sourceName, queries }) {
    this.store.dispatch({
      type: this.actionTypes.match,
      sourceName,
      queries,
    });
  }

  _finishMatch({ sourceName, queries, data }) {
    this.store.dispatch({
      type: this.actionTypes.matchSuccess,
      sourceName,
      queries,
      data,
    });
  }

  _onMatchError({ sourceName, queries, error }) {
    this.store.dispatch({
      type: this.actionTypes.matchError,
      sourceName,
      queries,
      error,
    });
  }

  get matcherStatus() {
    return this._matcherStatus;
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.state.status === moduleStatus.ready;
  }

  get cache() {
    return this._storage ?
      this._storage.getItem(this._storageKey) :
      this.state.cache;
  }

  get dataMapping() {
    return (this.cache && this.cache.dataMap) || {};
  }
}
