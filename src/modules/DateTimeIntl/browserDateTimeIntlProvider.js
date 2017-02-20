
const intlOptions = {
  time: {
    hour: 'numeric',
    minute: 'numeric',
    // second: 'numeric',
    hour12: false,
  },
  date: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  },
  dateTime: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    // second: 'numeric',
    hour12: false,
  }
};

export default class BrowserDateTimeIntlProvider {
  constructor({
    locale,
  }) {
    this._locale = locale;
    this._formatters = {};
  }

  get ready() {
    return this._locale.ready;
  }

  getSettings() {
    const currentLocale = this._locale.currentLocale;
    return {
      currentLocale,
    };
  }

  formatDateTime({ settings, utcString, type }) {
    const date = new Date(utcString);
    const locale = (settings && settings.currentLocale) || 'en-US';

    switch (type) {
      case 'long': {
        return this._getFormatter(locale, intlOptions.dateTime).format(date);
      }

      case 'date': {
        return this._getFormatter(locale, intlOptions.date).format(date);
      }

      case 'time': {
        return this._getFormatter(locale, intlOptions.time).format(date);
      }

      default: {
        const now = new Date();
        const isToday = (
          now.getFullYear() === date.getFullYear() &&
          now.getMonth() === date.getMonth() &&
          now.getDate() === date.getDate()
        );
        return (isToday ?
          this._getFormatter(locale, intlOptions.time).format(date) :
          this._getFormatter(locale, intlOptions.date).format(date)
        );
      }

    }
  }

  _getFormatter(locale, options) {
    const key = JSON.stringify([locale, options]);
    let formatter = this._formatters[key];
    if (!formatter) {
      formatter = this._formatters[key] =
        new Intl.DateTimeFormat(locale, options);
    }
    return formatter;
  }
}
