import RcModule from '../../lib/RcModule';
import ensureExist from '../../lib/ensureExist';
import getIntlDateTimeFormatter from '../../lib/getIntlDateTimeFormatter';
import actionTypes from './actionTypes';
import getDateTimeFormatReducer from './getDateTimeFormatReducer';
import moduleStatus from '../../enums/moduleStatus';

/**
 * @class DateTimeFormat
 * @description Simple date and time formatting manager.
 */
export default class DateTimeFormat extends RcModule {
  constructor({
    locale,
    ...options,
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._locale = ensureExist(locale, 'locale');

    this._reducer = getDateTimeFormatReducer(this.actionTypes);

    this._formatters = {};
  }
  _shouldInit() {
    return this.pending && this._locale.ready;
  }
  _shouldReset() {
    return this.ready && !this._locale.ready;
  }
  _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
      this._defaultFormatter = getIntlDateTimeFormatter();
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
  initialize() {
    this._store.subscribe(() => this._onStateChange);
  }
  addFormatter({
    name,
    formatter,
  }) {
    if (!name) {
      throw new Error('`name` property cannot be empty.');
    }
    if (this._formatters[name]) {
      throw new Error(`A formatter with the same name: ${name} already exists.`);
    }
    if (typeof formatter !== 'function') {
      throw new Error('formatter must be a function.');
    }
    this._formatters[name] = formatter;
  }

  formatDateTime({
    name,
    utcTimestamp,
    locale = this._locale.currentLocale,
    type,
  }) {
    if (name && typeof this._formatters[name] === 'function') {
      return this._formatters[name]({
        utcTimestamp,
        locale,
        type,
      });
    }
    return this._defaultFormatter({
      utcTimestamp,
      locale,
      type,
    });
  }
  formatDate({
    name,
    utcTimestamp,
    locale,
  }) {
    return this.formatDateTime({
      name,
      utcTimestamp,
      locale,
      type: 'date',
    });
  }
  formatTime({
    name,
    utcTimestamp,
    locale,
  }) {
    return this.formatDateTime({
      name,
      utcTimestamp,
      locale,
      type: 'time',
    });
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.state.status === moduleStatus.ready;
  }

  get pending() {
    return this.state.status === moduleStatus.pending;
  }
}
