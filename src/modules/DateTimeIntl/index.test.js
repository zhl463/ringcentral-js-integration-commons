import { expect } from 'chai';
import sinon from 'sinon';
import { createStore } from 'redux';
import DateTimeIntl from './index';
import getDateTimeIntlReducer from './getDateTimeIntlReducer';
import actionTypes from './actionTypes';

describe('DateTimeIntl Unit Test', () => {
  let dateTimeIntl;
  let store;

  beforeEach(() => {
    dateTimeIntl = sinon.createStubInstance(DateTimeIntl);
    store = createStore(getDateTimeIntlReducer(actionTypes));
    dateTimeIntl._store = store;
    dateTimeIntl._actionTypes = actionTypes;
    [
      '_onStateChange',
      '_shouldInit',
      '_shouldReset',
      '_shouldLoad',
      '_initProvider',
      '_resetModuleStatus',
      '_providersReadyCheck',
      '_loadSettings',
      '_loadProviderByName',
      '_loadProvider',
      '_detectPriorProvider',
      '_prioritizeProviders',
      '_addFallbackProvider',
      'formatDateTime',
      'addProvider'
    ].forEach((key) => {
      dateTimeIntl[key].restore();
    });
  });

  describe('_onStateChange', () => {
    it('_initProvider should be called once when _shouldInit is true', async () => {
      sinon.stub(dateTimeIntl, '_shouldInit').callsFake(() => true);
      sinon.stub(dateTimeIntl, '_shouldReset').callsFake(() => false);
      sinon.stub(dateTimeIntl, '_shouldLoad').callsFake(() => false);
      sinon.stub(dateTimeIntl, '_initProvider');
      sinon.stub(dateTimeIntl, '_resetModuleStatus');
      sinon.stub(dateTimeIntl, '_loadSettings');
      await dateTimeIntl._onStateChange();
      sinon.assert.calledOnce(dateTimeIntl._initProvider);
      sinon.assert.notCalled(dateTimeIntl._loadSettings);
      sinon.assert.notCalled(dateTimeIntl._resetModuleStatus);
    });

    it('_initProvider and _loadSettings should be called once when _shouldInit and _shouldLoad is true', async () => {
      sinon.stub(dateTimeIntl, '_shouldInit').callsFake(() => true);
      sinon.stub(dateTimeIntl, '_shouldReset').callsFake(() => false);
      sinon.stub(dateTimeIntl, '_shouldLoad').callsFake(() => true);
      sinon.stub(dateTimeIntl, '_loadSettings').callsFake(
        () => ({ then: callback => callback() })
      );
      sinon.stub(dateTimeIntl, '_initProvider');
      sinon.stub(dateTimeIntl, '_resetModuleStatus');
      await dateTimeIntl._onStateChange();
      sinon.assert.calledOnce(dateTimeIntl._initProvider);
      sinon.assert.calledOnce(dateTimeIntl._loadSettings);
      sinon.assert.notCalled(dateTimeIntl._resetModuleStatus);
    });

    it('_resetModuleStatus should be called once when _shouldReset is true', async () => {
      sinon.stub(dateTimeIntl, '_shouldInit').callsFake(() => false);
      sinon.stub(dateTimeIntl, '_shouldReset').callsFake(() => true);
      sinon.stub(dateTimeIntl, '_shouldLoad').callsFake(() => false);
      sinon.stub(dateTimeIntl, '_initProvider');
      sinon.stub(dateTimeIntl, '_resetModuleStatus');
      sinon.stub(dateTimeIntl, '_loadSettings');
      await dateTimeIntl._onStateChange();
      sinon.assert.notCalled(dateTimeIntl._initProvider);
      sinon.assert.notCalled(dateTimeIntl._loadSettings);
      sinon.assert.calledOnce(dateTimeIntl._resetModuleStatus);
    });

    it('_initProvider and _resetModuleStatus should Not be called', async () => {
      sinon.stub(dateTimeIntl, '_shouldInit').callsFake(() => false);
      sinon.stub(dateTimeIntl, '_shouldReset').callsFake(() => false);
      sinon.stub(dateTimeIntl, '_shouldLoad').callsFake(() => false);
      sinon.stub(dateTimeIntl, '_initProvider');
      sinon.stub(dateTimeIntl, '_resetModuleStatus');
      sinon.stub(dateTimeIntl, '_loadSettings');
      await dateTimeIntl._onStateChange();
      sinon.assert.notCalled(dateTimeIntl._initProvider);
      sinon.assert.notCalled(dateTimeIntl._loadSettings);
      sinon.assert.notCalled(dateTimeIntl._resetModuleStatus);
    });
  });

  describe('_shouldInit', () => {
    it('should return true when dateTimeIntl is pending and storage is ready and _providersReadyCheck return true', () => {
      dateTimeIntl._storage = {
        ready: true,
      };
      sinon.stub(dateTimeIntl, '_providersReadyCheck').callsFake(() => true);
      sinon.stub(dateTimeIntl, 'pending', { get: () => true });
      const result = dateTimeIntl._shouldInit();
      expect(result).to.equal(true);
    });

    it('should return false when dateTimeIntl is pending and storage is not ready and _providersReadyCheck return true', () => {
      dateTimeIntl._storage = {
        ready: false,
      };
      sinon.stub(dateTimeIntl, '_providersReadyCheck').callsFake(() => true);
      sinon.stub(dateTimeIntl, 'pending', { get: () => true });
      const result = dateTimeIntl._shouldInit();
      expect(result).to.equal(false);
    });

    it('should return false when dateTimeIntl is pending and storage is ready and _providersReadyCheck return false', () => {
      dateTimeIntl._storage = {
        ready: true,
      };
      sinon.stub(dateTimeIntl, '_providersReadyCheck').callsFake(() => false);
      sinon.stub(dateTimeIntl, 'pending', { get: () => true });
      const result = dateTimeIntl._shouldInit();
      expect(result).to.equal(false);
    });

    it('should return false when dateTimeIntl is pending and storage is ready and _providersReadyCheck return false', () => {
      dateTimeIntl._storage = {
        ready: true,
      };
      sinon.stub(dateTimeIntl, '_providersReadyCheck').callsFake(() => false);
      sinon.stub(dateTimeIntl, 'pending', { get: () => true });
      const result = dateTimeIntl._shouldInit();
      expect(result).to.equal(false);
    });

    it('should return false when dateTimeIntl is not pending and storage is ready and _providersReadyCheck return true', () => {
      dateTimeIntl._storage = {
        ready: true,
      };
      sinon.stub(dateTimeIntl, '_providersReadyCheck').callsFake(() => true);
      sinon.stub(dateTimeIntl, 'pending', { get: () => false });
      const result = dateTimeIntl._shouldInit();
      expect(result).to.equal(false);
    });

    it('should return false when dateTimeIntl is not pending and storage is not ready and _providersReadyCheck return true', () => {
      dateTimeIntl._storage = {
        ready: false,
      };
      sinon.stub(dateTimeIntl, '_providersReadyCheck').callsFake(() => true);
      sinon.stub(dateTimeIntl, 'pending', { get: () => false });
      const result = dateTimeIntl._shouldInit();
      expect(result).to.equal(false);
    });

    it('should return false when dateTimeIntl is not pending and storage is ready and _providersReadyCheck return false', () => {
      dateTimeIntl._storage = {
        ready: true,
      };
      sinon.stub(dateTimeIntl, '_providersReadyCheck').callsFake(() => false);
      sinon.stub(dateTimeIntl, 'pending', { get: () => false });
      const result = dateTimeIntl._shouldInit();
      expect(result).to.equal(false);
    });

    it('should return false when dateTimeIntl is not pending and storage is ready and _providersReadyCheck return false', () => {
      dateTimeIntl._storage = {
        ready: true,
      };
      sinon.stub(dateTimeIntl, '_providersReadyCheck').callsFake(() => false);
      sinon.stub(dateTimeIntl, 'pending', { get: () => false });
      const result = dateTimeIntl._shouldInit();
      expect(result).to.equal(false);
    });
  });

  describe('_shouldLoad', () => {
    it('should return true when dateTimeIntl cache is not null and _auth is FreshLogin and cache not expired', () => {
      dateTimeIntl._auth = {
        isFreshLogin: true,
      };
      dateTimeIntl._ttl = 5 * 60 * 1000;
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => ({ timestamp: Date.now() })
      });
      const result = dateTimeIntl._shouldLoad();
      expect(result).to.equal(true);
    });

    it('should return true when dateTimeIntl cache is null and _auth is not FreshLogin', () => {
      dateTimeIntl._auth = {
        isFreshLogin: false,
      };
      dateTimeIntl._ttl = 5 * 60 * 1000;
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => null
      });
      const result = dateTimeIntl._shouldLoad();
      expect(result).to.equal(true);
    });

    it('should return true when dateTimeIntl cache is not null and _auth is not FreshLogin and cache expired', () => {
      dateTimeIntl._auth = {
        isFreshLogin: false,
      };
      dateTimeIntl._ttl = 5 * 60 * 1000;
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => ({ timestamp: 0 })
      });
      const result = dateTimeIntl._shouldLoad();
      expect(result).to.equal(true);
    });

    it('should return false when dateTimeIntl cache is not null and _auth is not FreshLogin and cache not expired', () => {
      dateTimeIntl._auth = {
        isFreshLogin: false,
      };
      dateTimeIntl._ttl = 5 * 60 * 1000;
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => ({ timestamp: Date.now() })
      });
      const result = dateTimeIntl._shouldLoad();
      expect(result).to.equal(false);
    });
  });

  describe('_shouldReset', () => {
    it('should return true when dateTimeIntl is ready and storage is not ready', () => {
      dateTimeIntl._storage = {
        ready: false,
      };
      sinon.stub(dateTimeIntl, 'ready', { get: () => true });
      const result = dateTimeIntl._shouldReset();
      expect(result).to.equal(true);
    });

    it('should return false when dateTimeIntl is not ready and storage is not ready', () => {
      dateTimeIntl._storage = {
        ready: false,
      };
      sinon.stub(dateTimeIntl, 'ready', { get: () => false });
      const result = dateTimeIntl._shouldReset();
      expect(result).to.equal(false);
    });

    it('should return false when dateTimeIntl is not ready and storage is ready', () => {
      dateTimeIntl._storage = {
        ready: true,
      };
      sinon.stub(dateTimeIntl, 'ready', { get: () => false });
      const result = dateTimeIntl._shouldReset();
      expect(result).to.equal(false);
    });

    it('should return true when dateTimeIntl is ready and storage is ready and cache is expired', () => {
      dateTimeIntl._storage = {
        ready: true,
      };
      dateTimeIntl._ttl = 5 * 60 * 1000;
      sinon.stub(dateTimeIntl, 'ready', { get: () => true });
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => ({ timestamp: 0 })
      });
      const result = dateTimeIntl._shouldReset();
      expect(result).to.equal(true);
    });

    it('should return false when dateTimeIntl is ready and storage is ready and cache is not expired', () => {
      dateTimeIntl._storage = {
        ready: true,
      };
      dateTimeIntl._ttl = 5 * 60 * 1000;
      sinon.stub(dateTimeIntl, 'ready', { get: () => true });
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => ({ timestamp: Date.now() })
      });
      const result = dateTimeIntl._shouldReset();
      expect(result).to.equal(false);
    });

    it('should return true when dateTimeIntl is ready and storage is ready and cache is null', () => {
      dateTimeIntl._storage = {
        ready: true,
      };
      dateTimeIntl._ttl = 5 * 60 * 1000;
      sinon.stub(dateTimeIntl, 'ready', { get: () => true });
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => null
      });
      const result = dateTimeIntl._shouldReset();
      expect(result).to.equal(true);
    });
  });

  describe('_initProvider', () => {
    it('shoud call _detectPriorProvider', () => {
      sinon.stub(dateTimeIntl, '_detectPriorProvider');
      dateTimeIntl._initProvider();
      sinon.assert.calledOnce(dateTimeIntl._detectPriorProvider);
    });
  });

  describe('_providersReadyCheck', () => {
    it('shoud return true if _providersPrioritized is blank array', () => {
      dateTimeIntl._providersPrioritized = [];
      const result = dateTimeIntl._providersReadyCheck();
      expect(result).to.equal(true);
    });

    it('shoud return true if _providersPrioritized is all ready', () => {
      dateTimeIntl._providersPrioritized = [{
        readyCheckFn: () => true,
      }];
      const result = dateTimeIntl._providersReadyCheck();
      expect(result).to.equal(true);
    });

    it('shoud return false if _providersPrioritized ready check failed', () => {
      dateTimeIntl._providersPrioritized = [{
        readyCheckFn: () => false,
      }];
      const result = dateTimeIntl._providersReadyCheck();
      expect(result).to.equal(false);
    });

    it('shoud return false if _providersPrioritized some ready check failed', () => {
      dateTimeIntl._providersPrioritized = [{
        readyCheckFn: () => false,
      }, {
        readyCheckFn: () => true,
      }];
      const result = dateTimeIntl._providersReadyCheck();
      expect(result).to.equal(false);
    });
  });

  describe('_loadSettings', () => {
    it('shoud call _loadProvider once', async () => {
      dateTimeIntl._providersPrioritized = [1];
      sinon.stub(dateTimeIntl, '_loadProvider');
      await dateTimeIntl._loadSettings();
      sinon.assert.calledOnce(dateTimeIntl._loadProvider);
    });

    it('shoud call _loadProvider twice', async () => {
      dateTimeIntl._providersPrioritized = [1, 2];
      sinon.stub(dateTimeIntl, '_loadProvider');
      await dateTimeIntl._loadSettings();
      sinon.assert.callCount(dateTimeIntl._loadProvider, 2);
    });
  });

  describe('_loadProviderByName', () => {
    it('shoud call _loadProvider once', () => {
      dateTimeIntl._providers = { test: '11' };
      sinon.stub(dateTimeIntl, '_loadProvider');
      dateTimeIntl._loadProviderByName('test');
      sinon.assert.calledOnce(dateTimeIntl._loadProvider);
    });

    it('shoud not call _loadProvider', () => {
      dateTimeIntl._providers = {};
      sinon.stub(dateTimeIntl, '_loadProvider');
      dateTimeIntl._loadProviderByName('test');
      sinon.assert.notCalled(dateTimeIntl._loadProvider);
    });
  });

  describe('_loadProvider', () => {
    it('shoud return success true and call _detectPriorProvider once', async () => {
      const provider = {
        getSettingsFn: () => ({}),
      };
      sinon.stub(dateTimeIntl, '_detectPriorProvider');
      const result = await dateTimeIntl._loadProvider(provider);
      sinon.assert.calledOnce(dateTimeIntl._detectPriorProvider);
      expect(result).to.equal(true);
    });

    it('shoud return success false and call _detectPriorProvider once', async () => {
      const provider = {
        getSettingsFn: () => {
          throw new Error('error');
        },
      };
      sinon.stub(dateTimeIntl, '_detectPriorProvider');
      const result = await dateTimeIntl._loadProvider(provider);
      sinon.assert.calledOnce(dateTimeIntl._detectPriorProvider);
      expect(result).to.equal(false);
    });
  });

  describe('_detectPriorProvider', () => {
    it('shoud set _priorProvider to be null if _providersPrioritized is blank array', async () => {
      dateTimeIntl._providersPrioritized = [];
      dateTimeIntl._detectPriorProvider();
      expect(dateTimeIntl._priorProvider).to.equal(null);
    });

    it('shoud set _priorProvider success validity is y', () => {
      dateTimeIntl._providersPrioritized = [{
        providerName: 'test',
      }];
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => ({ validity: { test: 'y' } })
      });
      dateTimeIntl._detectPriorProvider();
      expect(dateTimeIntl._priorProvider).to.deep.equal({
        providerName: 'test',
      });
    });

    it('shoud set _priorProvider success when validity is true', () => {
      dateTimeIntl._providersPrioritized = [{
        providerName: 'test',
      }];
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => ({ validity: { test: true } })
      });
      dateTimeIntl._detectPriorProvider();
      expect(dateTimeIntl._priorProvider).to.deep.equal({
        providerName: 'test',
      });
    });

    it('shoud not set _priorProvider if validity is undefined', () => {
      dateTimeIntl._providersPrioritized = [{
        providerName: 'test',
      }];
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => ({})
      });
      dateTimeIntl._detectPriorProvider();
      expect(dateTimeIntl._priorProvider).to.equal(null);
    });

    it('shoud set _priorProvider with first provider', () => {
      dateTimeIntl._providersPrioritized = [{
        providerName: 'test',
      }, {
        providerName: 'test1',
      }];
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => ({ validity: { test: true } })
      });
      dateTimeIntl._detectPriorProvider();
      expect(dateTimeIntl._priorProvider).to.deep.equal({
        providerName: 'test',
      });
    });
  });

  describe('_prioritizeProviders', () => {
    it('shoud set _providersPrioritized blank array if _providers is blank array', () => {
      dateTimeIntl._providers = {};
      dateTimeIntl._prioritizeProviders();
      expect(dateTimeIntl._providersPrioritized).to.deep.equal([]);
    });

    it('shoud set _providersPrioritized success', () => {
      dateTimeIntl._providers = {
        test: {
          priorityNumber: 1,
        }
      };
      dateTimeIntl._prioritizeProviders();
      expect(dateTimeIntl._providersPrioritized).to.deep.equal([
        {
          priorityNumber: 1,
        }
      ]);
    });

    it('shoud set _providersPrioritized sort by priorityNumber', () => {
      dateTimeIntl._providers = {
        test: {
          priorityNumber: 1,
        },
        test2: {
          priorityNumber: 2,
        }
      };
      dateTimeIntl._prioritizeProviders();
      expect(dateTimeIntl._providersPrioritized).to.deep.equal([
        {
          priorityNumber: 2,
        },
        {
          priorityNumber: 1,
        }
      ]);
    });
  });

  describe('_addFallbackProvider', () => {
    it('shoud call addProvider once', () => {
      dateTimeIntl._providers = {};
      sinon.stub(dateTimeIntl, 'addProvider');
      dateTimeIntl._addFallbackProvider();
      sinon.assert.calledOnce(dateTimeIntl.addProvider);
    });

    it('shoud not call addProvider', () => {
      dateTimeIntl._providers = { $browser$: 1 };
      dateTimeIntl._locale = 'en-US';
      sinon.stub(dateTimeIntl, 'addProvider');
      dateTimeIntl._addFallbackProvider();
      sinon.assert.notCalled(dateTimeIntl.addProvider);
    });
  });

  describe('_addFallbackProvider', () => {
    it('shoud call _priorProvider if providerName is not defined', () => {
      dateTimeIntl._providers = {};
      dateTimeIntl._priorProvider = {
        formatDateTimeFn: () => '123456'
      };
      dateTimeIntl._fallbackProvider = null;
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => ({ settings: {} })
      });
      const result = dateTimeIntl.formatDateTime({
        utcString: '2017-02-16T12:11:39.290Z'
      });
      expect(result).to.equal('123456');
    });

    it('shoud call _fallbackProvider if providerName and _priorProvider is not defined', () => {
      dateTimeIntl._providers = {};
      dateTimeIntl._priorProvider = null;
      dateTimeIntl._fallbackProvider = {
        formatDateTimeFn: () => '1234567'
      };
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => ({ settings: {} })
      });
      const result = dateTimeIntl.formatDateTime({
        utcString: '2017-02-16T12:11:39.290Z'
      });
      expect(result).to.equal('1234567');
    });

    it('shoud throw error: DateTimeIntl: Can not find any available format provider.', () => {
      dateTimeIntl._providers = {};
      dateTimeIntl._priorProvider = null;
      dateTimeIntl._fallbackProvider = null;
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => ({ settings: {} })
      });
      let error = null;
      try {
        dateTimeIntl.formatDateTime({
          utcString: '2017-02-16T12:11:39.290Z'
        });
      } catch (e) {
        error = e.message;
      }
      expect(error).to.equal('DateTimeIntl: Can not find any available format provider.');
    });

    it('shoud call provider from providerName', () => {
      dateTimeIntl._providers = {
        test: {
          formatDateTimeFn: () => '12345678',
        }
      };
      dateTimeIntl._priorProvider = null;
      dateTimeIntl._fallbackProvider = null;
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => ({ settings: {} })
      });
      const result = dateTimeIntl.formatDateTime({
        utcString: '2017-02-16T12:11:39.290Z',
        providerName: 'test',
      });
      expect(result).to.equal('12345678');
    });

    it('shoud throw error: DateTimeIntl: Can not find format provider "test".', () => {
      dateTimeIntl._providers = {};
      dateTimeIntl._priorProvider = null;
      dateTimeIntl._fallbackProvider = null;
      sinon.stub(dateTimeIntl, 'cache', {
        get: () => ({ settings: {} })
      });
      let error = null;
      try {
        dateTimeIntl.formatDateTime({
          utcString: '2017-02-16T12:11:39.290Z',
          providerName: 'test',
        });
      } catch (e) {
        error = e.message;
      }
      expect(error).to.equal('DateTimeIntl: Can not find format provider "test".');
    });
  });

  describe('addProvider', () => {
    it('should throw error: DateTimeIntl: "providerName" is required.', () => {
      let error = null;
      try {
        dateTimeIntl.addProvider({});
      } catch (e) {
        error = e.message;
      }
      expect(error).to.equal('DateTimeIntl: "providerName" is required.');
    });

    it('should throw error: DateTimeIntl: A provider named "test" already exists.', () => {
      dateTimeIntl._providers = { test: '123' };
      let error = null;
      try {
        dateTimeIntl.addProvider({
          providerName: 'test',
        });
      } catch (e) {
        error = e.message;
      }
      expect(error).to.equal('DateTimeIntl: A provider named "test" already exists.');
    });

    it('should throw error: DateTimeIntl: "priorityNumber" must be a number.', () => {
      dateTimeIntl._providers = {};
      let error = null;
      try {
        dateTimeIntl.addProvider({
          providerName: 'test',
          priorityNumber: 'a',
        });
      } catch (e) {
        error = e.message;
      }
      expect(error).to.equal('DateTimeIntl: "priorityNumber" must be a number.');
    });

    it('should throw error: DateTimeIntl: "priorityNumber" should not less than 0.', () => {
      dateTimeIntl._providers = {};
      let error = null;
      try {
        dateTimeIntl.addProvider({
          providerName: 'test',
          priorityNumber: -1,
        });
      } catch (e) {
        error = e.message;
      }
      expect(error).to.equal('DateTimeIntl: "priorityNumber" should not less than 0.');
    });

    it('should throw error: DateTimeIntl: "readyCheckFn" must be a function.', () => {
      dateTimeIntl._providers = {};
      let error = null;
      try {
        dateTimeIntl.addProvider({
          providerName: 'test',
          priorityNumber: 1,
          readyCheckFn: '123',
        });
      } catch (e) {
        error = e.message;
      }
      expect(error).to.equal('DateTimeIntl: "readyCheckFn" must be a function.');
    });

    it('should throw error: DateTimeIntl: "readyCheckFn" must be a function.', () => {
      dateTimeIntl._providers = {};
      let error = null;
      try {
        dateTimeIntl.addProvider({
          providerName: 'test',
          priorityNumber: 1,
          readyCheckFn: () => null,
          getSettingsFn: '123',
        });
      } catch (e) {
        error = e.message;
      }
      expect(error).to.equal('DateTimeIntl: "getSettingsFn" must be a function.');
    });

    it('should throw error: DateTimeIntl: "formatDateTimeFn" must be a function.', () => {
      dateTimeIntl._providers = {};
      let error = null;
      try {
        dateTimeIntl.addProvider({
          providerName: 'test',
          priorityNumber: 1,
          readyCheckFn: () => null,
          getSettingsFn: () => null,
          formatDateTimeFn: '123'
        });
      } catch (e) {
        error = e.message;
      }
      expect(error).to.equal('DateTimeIntl: "formatDateTimeFn" must be a function.');
    });

    it('should call _prioritizeProviders', () => {
      dateTimeIntl._providers = {};
      sinon.stub(dateTimeIntl, '_prioritizeProviders');
      dateTimeIntl.addProvider({
        providerName: 'test',
        priorityNumber: 1,
        readyCheckFn: () => null,
        getSettingsFn: () => null,
        formatDateTimeFn: () => null,
      });
      sinon.assert.calledOnce(dateTimeIntl._prioritizeProviders);
    });
  });
});
