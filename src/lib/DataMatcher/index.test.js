import { expect } from 'chai';
import sinon from 'sinon';
import { createStore } from 'redux';
import DataMatcher from './index';
import getMatcherReducer from './getMatcherReducer';
import getCacheReducer from './getCacheReducer';
import actionTypes from './actionTypesBase';
import { matchResult } from './helpers';

describe('DataMatcher Unit Test', () => {
  let dataMatcher;
  let store;

  beforeEach(() => {
    dataMatcher = sinon.createStubInstance(DataMatcher);
    store = createStore(getMatcherReducer(actionTypes, {
      cache: getCacheReducer(actionTypes),
    }));
    dataMatcher._store = store;
    dataMatcher._actionTypes = actionTypes;
    [
      '_onStateChange',
      '_shouldInit',
      '_shouldReset',
      '_initModuleStatus',
      '_resetModuleStatus',
      '_readyCheck',
      '_getExpiredKeys',
      'addSearchSource',
      'addQuerySource',
      'triggerMatch',
      'match',
      '_filterQueriesFromCache',
      '_matchSource',
      '_startMatch',
      '_finishMatch',
      '_onMatchError',
    ].forEach((key) => {
      dataMatcher[key].restore();
    });
  });

  describe('_onStateChange', () => {
    it('triggerMatch should be called once when _shouldInit is true', () => {
      sinon.stub(dataMatcher, '_shouldInit').callsFake(() => true);
      sinon.stub(dataMatcher, '_shouldReset').callsFake(() => false);
      sinon.stub(dataMatcher, 'triggerMatch');
      sinon.stub(dataMatcher, '_initModuleStatus');
      sinon.stub(dataMatcher, '_getExpiredKeys');
      sinon.stub(dataMatcher, '_resetModuleStatus');
      dataMatcher._onStateChange();
      sinon.assert.calledOnce(dataMatcher.triggerMatch);
      sinon.assert.calledOnce(dataMatcher._initModuleStatus);
      sinon.assert.notCalled(dataMatcher._resetModuleStatus);
    });

    it('_resetModuleStatus should be called once when _shouldReset is true', () => {
      sinon.stub(dataMatcher, '_shouldInit').callsFake(() => false);
      sinon.stub(dataMatcher, '_shouldReset').callsFake(() => true);
      sinon.stub(dataMatcher, '_resetModuleStatus');
      sinon.stub(dataMatcher, 'triggerMatch');
      sinon.stub(dataMatcher, '_initModuleStatus');
      dataMatcher._onStateChange();
      sinon.assert.notCalled(dataMatcher.triggerMatch);
      sinon.assert.notCalled(dataMatcher._initModuleStatus);
      sinon.assert.calledOnce(dataMatcher._resetModuleStatus);
    });

    it('triggerMatch and _resetModuleStatus should Not be called', () => {
      sinon.stub(dataMatcher, '_shouldInit').callsFake(() => false);
      sinon.stub(dataMatcher, '_shouldReset').callsFake(() => false);
      sinon.stub(dataMatcher, '_resetModuleStatus');
      sinon.stub(dataMatcher, 'triggerMatch');
      sinon.stub(dataMatcher, '_initModuleStatus');
      dataMatcher._onStateChange();
      sinon.assert.notCalled(dataMatcher._resetModuleStatus);
      sinon.assert.notCalled(dataMatcher._initModuleStatus);
      sinon.assert.notCalled(dataMatcher.triggerMatch);
    });
  });

  describe('_shouldInit', () => {
    describe('when dataMatcher is not ready', () => {
      beforeEach(() => {
        sinon.stub(dataMatcher, 'ready', { get: () => false });
      });

      describe('when _auth is loggedIn', () => {
        beforeEach(() => {
          dataMatcher._auth = {
            loggedIn: true,
          };
        });

        it('Should return true when _storage is ready and _readyCheck return true', () => {
          dataMatcher._storage = {
            ready: true
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => true);
          expect(dataMatcher._shouldInit()).to.equal(true);
        });

        it('Should return false when _storage is ready and _readyCheck return false', () => {
          dataMatcher._storage = {
            ready: true
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => false);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is not ready and _readyCheck return true', () => {
          dataMatcher._storage = {
            ready: false
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => true);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is not ready and _readyCheck return false', () => {
          dataMatcher._storage = {
            ready: false
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => false);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return true when _storage is undefined and _readyCheck return true', () => {
          dataMatcher._storage = undefined;
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => true);
          expect(dataMatcher._shouldInit()).to.equal(true);
        });

        it('Should return false when _storage is undefined and _readyCheck return false', () => {
          dataMatcher._storage = undefined;
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => false);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });
      });

      describe('when _auth is not loggedIn', () => {
        beforeEach(() => {
          dataMatcher._auth = {
            loggedIn: false,
          };
        });

        it('Should return false when _storage is ready and _readyCheck return true', () => {
          dataMatcher._storage = {
            ready: false
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => true);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is ready and _readyCheck return false', () => {
          dataMatcher._storage = {
            ready: true
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => false);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is not ready and _readyCheck return true', () => {
          dataMatcher._storage = {
            ready: false
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => true);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is not ready and _readyCheck return false', () => {
          dataMatcher._storage = {
            ready: false
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => false);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is undefined and _readyCheck return true', () => {
          dataMatcher._storage = undefined;
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => true);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is undefined and _readyCheck return false', () => {
          dataMatcher._storage = undefined;
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => false);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });
      });
    });

    describe('when dataMatcher is ready', () => {
      beforeEach(() => {
        sinon.stub(dataMatcher, 'ready', { get: () => true });
      });

      describe('when _auth is loggedIn', () => {
        beforeEach(() => {
          dataMatcher._auth = {
            loggedIn: true,
          };
        });

        it('Should return false when _storage is ready and _readyCheck return true', () => {
          dataMatcher._storage = {
            ready: true
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => true);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is ready and _readyCheck return false', () => {
          dataMatcher._storage = {
            ready: true
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => false);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is not ready and _readyCheck return true', () => {
          dataMatcher._storage = {
            ready: false
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => true);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is not ready and _readyCheck return false', () => {
          dataMatcher._storage = {
            ready: false
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => false);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is undefined and _readyCheck return true', () => {
          dataMatcher._storage = undefined;
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => true);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is undefined and _readyCheck return false', () => {
          dataMatcher._storage = undefined;
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => false);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });
      });

      describe('when _auth is not loggedIn', () => {
        beforeEach(() => {
          dataMatcher._auth = {
            loggedIn: false,
          };
        });

        it('Should return false when _storage is ready and _readyCheck return true', () => {
          dataMatcher._storage = {
            ready: false
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => true);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is ready and _readyCheck return false', () => {
          dataMatcher._storage = {
            ready: true
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => false);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is not ready and _readyCheck return true', () => {
          dataMatcher._storage = {
            ready: false
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => true);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is not ready and _readyCheck return false', () => {
          dataMatcher._storage = {
            ready: false
          };
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => false);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is undefined and _readyCheck return true', () => {
          dataMatcher._storage = undefined;
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => true);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });

        it('Should return false when _storage is undefined and _readyCheck return false', () => {
          dataMatcher._storage = undefined;
          sinon.stub(dataMatcher, '_readyCheck').callsFake(() => false);
          expect(dataMatcher._shouldInit()).to.equal(false);
        });
      });
    });
  });

  describe('_shouldReset', () => {
    describe('when dataMatcher is ready', () => {
      beforeEach(() => {
        sinon.stub(dataMatcher, 'ready', { get: () => true });
      });

      describe('when _auth is loggedIn', () => {
        beforeEach(() => {
          dataMatcher._auth = {
            loggedIn: true,
          };
        });

        it('Should return true when _storage is not ready', () => {
          dataMatcher._storage = {
            ready: false
          };
          expect(dataMatcher._shouldReset()).to.equal(true);
        });

        it('Should return false when _storage is ready', () => {
          dataMatcher._storage = {
            ready: true
          };
          expect(dataMatcher._shouldReset()).to.equal(false);
        });

        it('Should return false when _storage is undefined', () => {
          dataMatcher._storage = undefined;
          expect(dataMatcher._shouldReset()).to.equal(false);
        });
      });

      describe('when _auth is not loggedIn', () => {
        beforeEach(() => {
          dataMatcher._auth = {
            loggedIn: false,
          };
        });

        it('Should return true when _storage is not ready', () => {
          dataMatcher._storage = {
            ready: false
          };
          expect(dataMatcher._shouldReset()).to.equal(true);
        });

        it('Should return true when _storage is ready', () => {
          dataMatcher._storage = {
            ready: true
          };
          expect(dataMatcher._shouldReset()).to.equal(true);
        });

        it('Should return true when _storage is undefined', () => {
          dataMatcher._storage = undefined;
          expect(dataMatcher._shouldReset()).to.equal(true);
        });
      });
    });

    describe('when dataMatcher is not ready', () => {
      beforeEach(() => {
        sinon.stub(dataMatcher, 'ready', { get: () => false });
      });

      describe('when _auth is loggedIn', () => {
        beforeEach(() => {
          dataMatcher._auth = {
            loggedIn: true,
          };
        });

        it('Should return false when _storage is not ready', () => {
          dataMatcher._storage = {
            ready: false
          };
          expect(dataMatcher._shouldReset()).to.equal(false);
        });

        it('Should return false when _storage is ready', () => {
          dataMatcher._storage = {
            ready: true
          };
          expect(dataMatcher._shouldReset()).to.equal(false);
        });

        it('Should return false when _storage is undefined', () => {
          dataMatcher._storage = undefined;
          expect(dataMatcher._shouldReset()).to.equal(false);
        });
      });

      describe('when _auth is not loggedIn', () => {
        beforeEach(() => {
          dataMatcher._auth = {
            loggedIn: false,
          };
        });

        it('Should return false when _storage is not ready', () => {
          dataMatcher._storage = {
            ready: false
          };
          expect(dataMatcher._shouldReset()).to.equal(false);
        });

        it('Should return false when _storage is ready', () => {
          dataMatcher._storage = {
            ready: true
          };
          expect(dataMatcher._shouldReset()).to.equal(false);
        });

        it('Should return false when _storage is undefined', () => {
          dataMatcher._storage = undefined;
          expect(dataMatcher._shouldReset()).to.equal(false);
        });
      });
    });
  });

  describe('_readyCheck', () => {
    describe('when _querySources is blank', () => {
      beforeEach(() => {
        dataMatcher._querySources = new Map();
      });

      it('should return true if _searchSource is blank and ', () => {
        dataMatcher._searchSource = {};
        expect(dataMatcher._readyCheck()).to.equal(true);
      });

      it('should return true if _searchSource is all ready', () => {
        dataMatcher._searchSource = {
          test: {
            readyCheckFn: () => true,
          },
        };
        expect(dataMatcher._readyCheck()).to.equal(true);
      });

      it('should return false if one of _searchSource is not ready', () => {
        dataMatcher._searchSource = {
          test: {
            readyCheckFn: () => false,
          },
        };
        expect(dataMatcher._readyCheck()).to.equal(false);
      });
    });

    describe('_querySources is all ready', () => {
      beforeEach(() => {
        dataMatcher._querySources = new Map();
        dataMatcher._querySources.set(
          () => null,
          () => true,
        );
      });

      it('should return true if _searchSource is blank', () => {
        dataMatcher._searchSource = {};
        expect(dataMatcher._readyCheck()).to.equal(true);
      });

      it('should return true if _searchSource is all ready', () => {
        dataMatcher._searchSource = {
          test: {
            readyCheckFn: () => true,
          },
        };
        expect(dataMatcher._readyCheck()).to.equal(true);
      });
    });

    describe('_querySources is all ready', () => {
      beforeEach(() => {
        dataMatcher._querySources = new Map();
        dataMatcher._querySources.set(
          () => null,
          () => false,
        );
      });

      it(`should return false if _searchSource is blank and
          one of _querySources is not ready`, () => {
        dataMatcher._searchSource = {};
        expect(dataMatcher._readyCheck()).to.equal(false);
      });

      it(`should return false if one of _searchSource is not ready
          and one of _querySources is not ready`, () => {
        dataMatcher._searchSource = {
          test: {
            readyCheckFn: () => false,
          },
        };
        expect(dataMatcher._readyCheck()).to.equal(false);
      });
    });
  });

  describe('_getExpiredKeys', () => {
    it('should return empty keys if matchRecord in cache is empty', () => {
      sinon.stub(dataMatcher, 'cache', { get: () => ({ matchRecord: {} }) });
      const result = dataMatcher._getExpiredKeys();
      expect(result).to.deep.equal([]);
    });

    it('should return expired keys if matchRecord which is found is expired', () => {
      dataMatcher._ttl = 30 * 60 * 1000;
      dataMatcher._noMatchTtl = 30 * 1000;
      sinon.stub(dataMatcher, 'cache', {
        get: () => ({
          matchRecord: {
            test: {
              result: matchResult.found,
              timestamp: 0,
            }
          }
        })
      });
      const result = dataMatcher._getExpiredKeys();
      expect(result).to.deep.equal(['test']);
    });

    it('should return expired keys if matchRecord which is unfound is expired', () => {
      dataMatcher._ttl = 30 * 60 * 1000;
      dataMatcher._noMatchTtl = 30 * 1000;
      sinon.stub(dataMatcher, 'cache', {
        get: () => ({
          matchRecord: {
            test: {
              result: matchResult.notFound,
              timestamp: 0,
            }
          }
        })
      });
      const result = dataMatcher._getExpiredKeys();
      expect(result).to.deep.equal(['test']);
    });

    it('should return empty keys if matchRecord is not expired', () => {
      dataMatcher._ttl = 30 * 60 * 1000;
      dataMatcher._noMatchTtl = 30 * 1000;
      sinon.stub(dataMatcher, 'cache', {
        get: () => ({
          matchRecord: {
            test: {
              result: matchResult.found,
              timestamp: Date.now(),
            }
          }
        })
      });
      const result = dataMatcher._getExpiredKeys();
      expect(result).to.deep.equal([]);
    });
  });

  describe('addSearchSource', () => {
    it('should raise that source name is required', () => {
      const searchFn = () => null;
      const readyCheckFn = () => null;
      let error = null;
      try {
        dataMatcher.addSearchSource({ searchFn, readyCheckFn });
      } catch (e) {
        error = e;
      }
      expect(error.message).to.equal('DataMatcher: "sourceName" is required.');
    });

    it('should raise that source name already exists', () => {
      dataMatcher._searchSource = {};
      const sourceName = 'test';
      const searchFn = () => null;
      const readyCheckFn = () => null;
      dataMatcher._searchSource[sourceName] = {};
      let error = null;
      try {
        dataMatcher.addSearchSource({ sourceName, searchFn, readyCheckFn });
      } catch (e) {
        error = e;
      }
      expect(error.message).to.equal('DataMatcher: A source named "test" already exists.');
    });

    it('should raise that searchFn is not a function', () => {
      dataMatcher._searchSource = {};
      const sourceName = 'test';
      const searchFn = 'abc';
      const readyCheckFn = () => null;
      let error = null;
      try {
        dataMatcher.addSearchSource({ sourceName, searchFn, readyCheckFn });
      } catch (e) {
        error = e;
      }
      expect(error.message).to.equal('DataMatcher: "searchFn" must be a function.');
    });

    it('should raise that readyCheckFn is not a function', () => {
      dataMatcher._searchSource = {};
      const sourceName = 'test';
      const readyCheckFn = 'abc';
      const searchFn = () => null;
      let error = null;
      try {
        dataMatcher.addSearchSource({ sourceName, searchFn, readyCheckFn });
      } catch (e) {
        error = e;
      }
      expect(error.message).to.equal('DataMatcher: "readyCheckFn" must be a function.');
    });

    it('should add source to _searchSource', () => {
      dataMatcher._searchSource = {};
      const sourceName = 'test';
      const searchFn = () => null;
      const readyCheckFn = () => null;
      dataMatcher.addSearchSource({ sourceName, searchFn, readyCheckFn });
      expect(dataMatcher._searchSource).to.have.keys(sourceName);
    });
  });

  describe('addQuerySource', () => {
    it('should raise that getQueriesFn is not a function', () => {
      const getQueriesFn = 'test';
      const readyCheckFn = () => null;
      let error = null;
      try {
        dataMatcher.addQuerySource({ getQueriesFn, readyCheckFn });
      } catch (e) {
        error = e;
      }
      expect(error.message).to.equal('DataMatcher: "getQueriesFn" must be a function.');
    });

    it('should raise that readyCheckFn is not a function', () => {
      const getQueriesFn = () => null;
      const readyCheckFn = 'test';
      let error = null;
      try {
        dataMatcher.addQuerySource({ getQueriesFn, readyCheckFn });
      } catch (e) {
        error = e;
      }
      expect(error.message).to.equal('DataMatcher: "readyCheckFn" must be a function.');
    });

    it('should raise that getQueriesFn already exists', () => {
      const getQueriesFn = () => null;
      const readyCheckFn = () => null;
      dataMatcher._querySources = new Map();
      dataMatcher._querySources.set(getQueriesFn, null);
      let error = null;
      try {
        dataMatcher.addQuerySource({ getQueriesFn, readyCheckFn });
      } catch (e) {
        error = e;
      }
      expect(error.message).to.equal('DataMatcher: "getQueriesFn" is already added.');
    });

    it('should add getQueriesFn to _querySources', () => {
      const getQueriesFn = () => null;
      const readyCheckFn = () => null;
      dataMatcher._querySources = new Map();
      dataMatcher.addQuerySource({ getQueriesFn, readyCheckFn });
      expect(dataMatcher._querySources.has(getQueriesFn)).to.equal(true);
    });
  });

  describe('triggerMatch', () => {
    it('should call match with queries params', async () => {
      sinon.stub(dataMatcher, 'match');
      sinon.stub(dataMatcher, 'ready', { get: () => true });
      const getQueriesFn = () => [1, 2, 3];
      const readyCheckFn = () => null;
      dataMatcher._querySources = new Map();
      dataMatcher._querySources.set(getQueriesFn, readyCheckFn);
      await dataMatcher.triggerMatch();
      sinon.assert.calledWith(dataMatcher.match, { queries: [1, 2, 3] });
    });

    it('should not call match if dataMatcher is not ready', async () => {
      sinon.stub(dataMatcher, 'match');
      sinon.stub(dataMatcher, 'ready', { get: () => false });
      const getQueriesFn = () => [1, 2, 3];
      const readyCheckFn = () => null;
      dataMatcher._querySources = new Map();
      dataMatcher._querySources.set(getQueriesFn, readyCheckFn);
      await dataMatcher.triggerMatch();
      sinon.assert.notCalled(dataMatcher.match);
    });

    it('should not call match if queries length is zero', async () => {
      sinon.stub(dataMatcher, 'match');
      sinon.stub(dataMatcher, 'ready', { get: () => true });
      const getQueriesFn = () => [];
      const readyCheckFn = () => null;
      dataMatcher._querySources = new Map();
      dataMatcher._querySources.set(getQueriesFn, readyCheckFn);
      await dataMatcher.triggerMatch();
      sinon.assert.notCalled(dataMatcher.match);
    });
  });

  describe('match', () => {
    it('should not call _matchSource if _searchSource is empty', async () => {
      dataMatcher._searchSource = {};
      sinon.stub(dataMatcher, '_matchSource');
      const queries = [1];
      await dataMatcher.match({ queries });
      sinon.assert.notCalled(dataMatcher._matchSource);
    });

    it('should call _matchSource once if _searchSource has one key', async () => {
      dataMatcher._searchSource = {
        test: 1,
      };
      sinon.stub(dataMatcher, '_matchSource');
      const queries = [1];
      await dataMatcher.match({ queries });
      sinon.assert.calledOnce(dataMatcher._matchSource);
    });

    it('should call _matchSource twice if _searchSource has two key', async () => {
      dataMatcher._searchSource = {
        test: 1,
        test2: 2,
      };
      sinon.stub(dataMatcher, '_matchSource');
      const queries = [1];
      await dataMatcher.match({ queries });
      sinon.assert.callCount(dataMatcher._matchSource, 2);
    });
  });

  describe('_filterQueriesFromCache', () => {
    it('should filter query if query is not expired ', () => {
      const queries = ['1234'];
      const sourceName = 'test';
      dataMatcher._ttl = 30 * 60 * 1000;
      dataMatcher._noMatchTtl = 30 * 1000;
      sinon.stub(dataMatcher, 'state', {
        get: () => ({
          matching: [],
        }),
      });
      sinon.stub(dataMatcher, 'cache', {
        get: () => ({
          matchRecord: {
            '["test","1234"]': {
              result: matchResult.notFound,
              timestamp: Date.now(),
            }
          }
        }),
      });
      const result = dataMatcher._filterQueriesFromCache({ sourceName, queries });
      expect(result).to.deep.equal([]);
    });

    it('should return query if query is expired ', () => {
      const queries = ['1234'];
      const sourceName = 'test';
      dataMatcher._ttl = 30 * 60 * 1000;
      dataMatcher._noMatchTtl = 30 * 1000;
      sinon.stub(dataMatcher, 'state', {
        get: () => ({
          matching: [],
        }),
      });
      sinon.stub(dataMatcher, 'cache', {
        get: () => ({
          matchRecord: {
            '["test","1234"]': {
              result: matchResult.notFound,
              timestamp: 0,
            }
          }
        }),
      });
      const result = dataMatcher._filterQueriesFromCache({ sourceName, queries });
      expect(result).to.deep.equal(['1234']);
    });

    it('should filter query if query is matching', () => {
      const queries = ['1234'];
      const sourceName = 'test';
      dataMatcher._ttl = 30 * 60 * 1000;
      dataMatcher._noMatchTtl = 30 * 1000;
      sinon.stub(dataMatcher, 'state', {
        get: () => ({
          matching: ['["test","1234"]'],
        }),
      });
      sinon.stub(dataMatcher, 'cache', {
        get: () => ({
          matchRecord: {}
        }),
      });
      const result = dataMatcher._filterQueriesFromCache({ sourceName, queries });
      expect(result).to.deep.equal([]);
    });

    it('should all queries if matching and matchRecord are empty', () => {
      const queries = ['1234'];
      const sourceName = 'test';
      dataMatcher._ttl = 30 * 60 * 1000;
      dataMatcher._noMatchTtl = 30 * 1000;
      sinon.stub(dataMatcher, 'state', {
        get: () => ({
          matching: [],
        }),
      });
      sinon.stub(dataMatcher, 'cache', {
        get: () => ({
          matchRecord: {}
        }),
      });
      const result = dataMatcher._filterQueriesFromCache({ sourceName, queries });
      expect(result).to.deep.equal(['1234']);
    });
  });

  describe('_matchSource', () => {
    it('should not call _startMatch if queries is empty', async () => {
      sinon.stub(dataMatcher, '_filterQueriesFromCache');
      sinon.stub(dataMatcher, '_startMatch');
      sinon.stub(dataMatcher, '_finishMatch');
      sinon.stub(dataMatcher, '_onMatchError');
      const sourceName = 'test';
      const queries = [];
      const ignoreCache = true;
      await dataMatcher._matchSource({ sourceName, queries, ignoreCache });
      sinon.assert.notCalled(dataMatcher._startMatch);
      sinon.assert.notCalled(dataMatcher._onMatchError);
    });

    it(`should not call _startMatch if ignoreCache is false
        and _filterQueriesFromCache is empty`, async () => {
      sinon.stub(dataMatcher, '_filterQueriesFromCache').callsFake(
        () => [],
      );
      sinon.stub(dataMatcher, '_startMatch');
      sinon.stub(dataMatcher, '_finishMatch');
      sinon.stub(dataMatcher, '_onMatchError');
      const sourceName = 'test';
      const queries = [];
      const ignoreCache = false;
      await dataMatcher._matchSource({ sourceName, queries, ignoreCache });
      sinon.assert.notCalled(dataMatcher._startMatch);
      sinon.assert.notCalled(dataMatcher._onMatchError);
    });

    it('should call _startMatch and _finishMatch', async () => {
      sinon.stub(dataMatcher, '_filterQueriesFromCache');
      sinon.stub(dataMatcher, '_startMatch');
      sinon.stub(dataMatcher, '_finishMatch');
      sinon.stub(dataMatcher, '_onMatchError');
      const sourceName = 'test';
      const queries = ['1234'];
      const ignoreCache = true;
      dataMatcher._searchSource = {
        test: {
          searchFn: () => ['123'],
        }
      };
      await dataMatcher._matchSource({ sourceName, queries, ignoreCache });
      sinon.assert.calledOnce(dataMatcher._startMatch);
      sinon.assert.calledOnce(dataMatcher._finishMatch);
      sinon.assert.notCalled(dataMatcher._onMatchError);
    });

    it('should call _onMatchError when match throw error', async () => {
      sinon.stub(dataMatcher, '_filterQueriesFromCache');
      sinon.stub(dataMatcher, '_startMatch');
      sinon.stub(dataMatcher, '_finishMatch');
      sinon.stub(dataMatcher, '_onMatchError');
      const sourceName = 'test';
      const queries = ['1234'];
      const ignoreCache = true;
      dataMatcher._searchSource = {
        test: {
          searchFn: () => {
            throw new Error('error');
          },
        }
      };
      await dataMatcher._matchSource({ sourceName, queries, ignoreCache });
      sinon.assert.calledOnce(dataMatcher._startMatch);
      sinon.assert.notCalled(dataMatcher._finishMatch);
      sinon.assert.calledOnce(dataMatcher._onMatchError);
    });
  });
});
