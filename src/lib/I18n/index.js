export const DEFAULT_LOCALE = 'en-US';
export const RUNTIME = {
  locale: DEFAULT_LOCALE,
  instances: new Set(),
};

/**
 * @function
 * @description Set currrent runtime locale and load the locale files accordingly
 * @param {String} locale - The desired locale.
 * @return Promise<undefined>
 */
async function setLocale(locale) {
  RUNTIME.locale = locale;
  for (const i of RUNTIME.instances) {
    await i._load(locale);
  }
}

/**
 * @class
 * @description I18n is a simple localizations helper class that represents a set of locale files.
 */
export default class I18n {
  /**
   * @constructor
   * @description Accepts a loadLocale function that should be async and resolve to the locale
   *  object when invoked.
   * @param {String => Promise<Object>} loadLocale - Asynchronous locale loader function.
   */
  constructor(loadLocale) {
    if (typeof loadLocale !== 'function') {
      throw new Error('loadLocale must be a function');
    }
    this._loadLocale = loadLocale;
    this._cache = {};
    RUNTIME.instances.add(this);
    this._load(DEFAULT_LOCALE);
    this._load(RUNTIME.locale);
  }
  async _load(locale) {
    if (!this._cache[locale]) {
      let data;
      try {
        data = await (async () => this._loadLocale(locale))();
      } catch (error) {
        /* ignore error */
        data = {};
      }
      this._cache[locale] = data;
    }
  }
  getString(key, locale = RUNTIME.locale) {
    if (
      this._cache[locale] &&
      this._cache[locale]::Object.prototype.hasOwnProperty(key)
    ) {
      return this._cache[locale][key];
    }
    if (
      this._cache[DEFAULT_LOCALE] &&
      this._cache[DEFAULT_LOCALE]::Object.prototype.hasOwnProperty(key)
    ) {
      return this._cache[DEFAULT_LOCALE][key];
    }
    return key;
  }

  get currentLocale() {
    return RUNTIME.locale;
  }

  get setLocale() {
    return setLocale;
  }
  static get setLocale() {
    return setLocale;
  }
}
