import RcModule from '../../lib/RcModule';
import sliceExecute from '../../lib/sliceExecute';
import moduleStatus from '../../enums/moduleStatus';
import actionTypes from './actionTypes';
import getDateTimeIntlReducer from './getDateTimeIntlReducer';
import getStorageReducer from './getStorageReducer';
import BrowserDateTimeIntlProvider from './browserDateTimeIntlProvider';

const FallbackProviderName = '$browser$';

export default class DateTimeIntl extends RcModule {
  constructor({
    auth,
    locale,
    storage,
    ttl = 5 * 60 * 1000,
    ...options,
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._auth = auth;
    this._locale = locale;
    this._storage = storage;
    this._ttl = ttl;
    // define
    this._providers = {};
    this._providersPrioritized = [];
    this._priorProvider = null;
    this._fallbackProvider = null;
    this._reducer = getDateTimeIntlReducer(this.actionTypes);
    // storage
    this._storageKey = 'dateTimeIntl';
    this._storageReducer = getStorageReducer(this.actionTypes);
    this._storage.registerReducer({ key: this._storageKey, reducer: this._storageReducer });
  }

  async _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
      if (this._shouldLoad()) {
        await this._loadSettings();
        this._initProvider();
      } else {
        this._initProvider();
      }
    } else if (this._shouldReset()) {
      this._resetModuleStatus();
    }
  }

  initialize() {
    this._addFallbackProvider();
    this.store.subscribe(async () => {
      await this._onStateChange();
    });
  }

  _shouldInit() {
    return this.pending &&
      this._storage.ready &&
      this._providersReadyCheck();
  }

  _shouldLoad() {
    return this._auth.isFreshLogin ||
      !this.cache ||
      ((Date.now() - this.cache.timestamp) > this._ttl);
  }

  _shouldReset() {
    return (
      (
        this.ready &&
        !this._storage.ready
      ) ||
      (
        this.ready &&
        this._storage.ready &&
        (
          !this.cache ||
          ((Date.now() - this.cache.timestamp) > this._ttl)
        )
      )
    );
  }

  _initProvider() {
    this._detectPriorProvider();
    this.store.dispatch({
      type: this.actionTypes.initSuccess,
    });
  }

  _resetModuleStatus() {
    this.store.dispatch({
      type: this.actionTypes.resetSuccess,
    });
  }

  _providersReadyCheck() {
    let ready = true;
    this._providersPrioritized.forEach((provider) => {
      ready = ready && provider.readyCheckFn();
    });
    return ready;
  }

  async _loadSettings() {
    await sliceExecute({
      array: this._providersPrioritized,
      threshold: 1,
      handler: async (items) => {
        const provider = items[0];
        await this._loadProvider(provider);
      },
    });
  }

  // for test used
  _loadProviderByName(providerName) {
    const provider = this._providers[providerName];
    if (provider) {
      this._loadProvider(provider);
    }
  }

  async _loadProvider(provider) {
    let success = true;
    this.store.dispatch({
      type: this.actionTypes.fetch,
      provider,
    });
    try {
      const providerSettings = await provider.getSettingsFn();
      this.store.dispatch({
        type: this.actionTypes.fetchSuccess,
        timestamp: Date.now(),
        provider,
        providerSettings,
      });
    } catch (error) {
      success = false;
      this.store.dispatch({
        type: this.actionTypes.fetchError,
        timestamp: Date.now(),
        provider,
        error,
      });
    }
    this._detectPriorProvider();
    return success;
  }

  _detectPriorProvider() {
    this._priorProvider = null;
    this._providersPrioritized.forEach((provider) => {
      if (
        this._priorProvider === null &&
        this.cache.validity && (
          this.cache.validity[provider.providerName] === 'y' ||
          this.cache.validity[provider.providerName] === true
        )
      ) {
        this._priorProvider = provider;
      }
    });
  }

  _prioritizeProviders() {
    const array = this._providersPrioritized = [];
    Object.keys(this._providers).forEach((key) => {
      array.push(this._providers[key]);
    });
    array.sort((a, b) =>
      b.priorityNumber - a.priorityNumber
    );
  }

  _addFallbackProvider() {
    const providerName = FallbackProviderName;
    if (!this._providers[providerName]) {
      const provider = new BrowserDateTimeIntlProvider({
        locale: this._locale,
      });
      this._fallbackProvider = this.addProvider({
        providerName,
        priorityNumber: -1, // the lowest priority
        readyCheckFn: () => provider.ready,
        getSettingsFn: args => provider.getSettings(args),
        formatDateTimeFn: args => provider.formatDateTime(args),
      });
    }
  }

  formatDateTime({ utcString, providerName, ...opts }) {
    let provider;
    if (providerName) {
      provider = this._providers[providerName];
      if (!provider) {
        throw new Error(`DateTimeIntl: Can not find format provider "${providerName}".`);
      }
    } else {
      provider = this._priorProvider || this._fallbackProvider;
      if (!provider) {
        throw new Error('DateTimeIntl: Can not find any available format provider.');
      }
    }
    const settings = this.cache.settings[provider.providerName];
    return provider.formatDateTimeFn({
      settings,
      utcString,
      ...opts,
    });
  }

  // priorityNumber should not less than 0,
  // the greater priorityNumber the higher priority
  addProvider({
    providerName,
    priorityNumber,
    readyCheckFn,
    getSettingsFn,
    formatDateTimeFn,
  }) {
    if (!providerName) {
      throw new Error('DateTimeIntl: "providerName" is required.');
    }
    if (this._providers[providerName]) {
      throw new Error(`DateTimeIntl: A provider named "${providerName}" already exists.`);
    }
    if (typeof priorityNumber !== 'number') {
      throw new Error('DateTimeIntl: "priorityNumber" must be a number.');
    }
    if (priorityNumber < 0 && providerName !== FallbackProviderName) {
      throw new Error('DateTimeIntl: "priorityNumber" should not less than 0.');
    }
    if (typeof readyCheckFn !== 'function') {
      throw new Error('DateTimeIntl: "readyCheckFn" must be a function.');
    }
    if (typeof getSettingsFn !== 'function') {
      throw new Error('DateTimeIntl: "getSettingsFn" must be a function.');
    }
    if (typeof formatDateTimeFn !== 'function') {
      throw new Error('DateTimeIntl: "formatDateTimeFn" must be a function.');
    }
    const provider = {
      providerName,
      priorityNumber,
      readyCheckFn,
      getSettingsFn,
      formatDateTimeFn,
    };
    this._providers[providerName] = provider;
    this._prioritizeProviders();
    return provider;
  }

  get status() {
    return this.state.status;
  }

  get dateTimeIntlStatus() {
    return this.state.dateTimeIntlStatus;
  }

  get ready() {
    return this.status === moduleStatus.ready;
  }

  get pending() {
    return this.status === moduleStatus.pending;
  }

  get cache() {
    return this._storage.getItem(this._storageKey);
  }
}
