import formatMessage from 'format-message';
import RcModule from '../../lib/RcModule';

import I18n, {
  DEFAULT_LOCALE,
  PSEUDO_LOCALE,
} from '../../lib/I18n';
import moduleStatus from '../../enums/moduleStatus';
import actionTypes from './actionTypes';
import getLocaleReducer from './getLocaleReducer';

/* eslint-disable global-require */


/**
 *  @function
 *  @description Check if the current environement requires the Intl polyfill.
 *  @return {Promise}
 */
function checkIntl() {
  return new Promise((resolve) => {
    if (!global.Intl) {
      if (process.browser) {
        require.ensure([
          'intl',
          'intl/locale-data/jsonp/en',
          'intl/locale-data/jsonp/de',
          'intl/locale-data/jsonp/fr',
        ], (require) => {
          require('intl');
          require('intl/locale-data/jsonp/en');
          require('intl/locale-data/jsonp/de');
          require('intl/locale-data/jsonp/fr');

          resolve();
        }, 'intl');
      } else {
        require('intl');
        resolve();
      }
    } else {
      resolve();
    }
  });
}

export default class Locale extends RcModule {
  constructor({
    defaultLocale = DEFAULT_LOCALE,
    ...options
  } = {}) {
    super({
      ...options,
      actionTypes,
    });
    this._reducer = getLocaleReducer({ defaultLocale, types: this.actionTypes });
  }
  initialize() {
    (async () => {
      await checkIntl();
      await this.setLocale(this.currentLocale);
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
    })();
  }

  /**
   * @property {String} currentLocale
   */
  get currentLocale() {
    return this.state.currentLocale;
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.state.status === moduleStatus.ready;
  }

  /**
   *  @function
   *  @description Sets the desired locale as the current locale. This will also
   *    set all I18n instances to the same locale, as well as set formatMessage to use
   *    the same locale.
   *  @param {String} locale
   *  @return {Promise}
   */
  async setLocale(locale) {
    await I18n.setLocale(locale);
    formatMessage.setup({
      locale: this.currentLocale === PSEUDO_LOCALE ? DEFAULT_LOCALE : this.currentLocale,
    });
    this.store.dispatch({
      type: this.actionTypes.setLocale,
      locale,
    });
  }
}
