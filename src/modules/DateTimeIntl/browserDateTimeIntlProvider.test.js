import { expect } from 'chai';
import BrowserDateTimeIntlProvider from './browserDateTimeIntlProvider';

describe('BrowserDateTimeIntlProvider', () => {
  const provider = new BrowserDateTimeIntlProvider({
    locale: {
      currentLocale: 'en-US',
    },
  });
  let settings = null;
  it('getSettings should be a function', () => {
    expect(provider.getSettings).to.be.a('function');
    settings = provider.getSettings();
    it('getSettings should return a settings object', () => {
      expect(settings).to.be.a('object');
      it('settings should contains locales', () => {
        expect(settings.locales).to.be.a('array');
      });
    });
  });

  it('formatDateTime should be a function', () => {
    expect(provider.formatDateTime).to.be.a('function');

    it('formatDateTime should return a string', () => {
      const utcString = '2017-01-17T23:04:17.965Z';
      expect(provider.formatDateTime({
        settings,
        utcString,
        type: 'long',
      })).to.be.a('string');
      expect(provider.formatDateTime({
        settings,
        utcString,
        type: 'date',
      })).to.be.a('string');
      expect(provider.formatDateTime({
        settings,
        utcString,
        type: 'time',
      })).to.be.a('string');
      expect(provider.formatDateTime({
        settings,
        utcString,
        type: '',
      })).to.be.a('string');
    });
  });
});
