import { expect } from 'chai';
import getDateTimeIntlReducer, {
  getDateTimeIntlStatusReducer,
  getLastErrorReducer,
} from './getDateTimeIntlReducer';

import actionTypes from './actionTypes';
import dateTimeIntlStatus from './dateTimeIntlStatus';

describe('DateTimeIntl :: getDateTimeIntlReducer', () => {
  it('getDateTimeIntlStatusReducer should be a function', () => {
    expect(getDateTimeIntlStatusReducer).to.be.a('function');
  });
  it('getDateTimeIntlStatusReducer should return a reducer', () => {
    expect(getDateTimeIntlStatusReducer(actionTypes)).to.be.a('function');
  });
  describe('statusReducer', () => {
    const reducer = getDateTimeIntlStatusReducer(actionTypes);
    it('should have initial state of idle', () => {
      expect(reducer(undefined, {})).to.equal(dateTimeIntlStatus.idle);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
      .to.equal(originalState);
    });
    it('should return idle status on fetchError/fetchSuccess', () => {
      [
        actionTypes.fetchError,
        actionTypes.fetchSuccess
      ].forEach((type) => {
        expect(reducer('foo', {
          type,
        })).to.equal(dateTimeIntlStatus.idle);
      });
    });
    it('should return fetching status on fetch', () => {
      [
        actionTypes.fetch
      ].forEach((type) => {
        expect(reducer('foo', {
          type,
        })).to.equal(dateTimeIntlStatus.fetching);
      });
    });
  });

  it('getLastErrorReducer should be a function', () => {
    expect(getLastErrorReducer).to.be.a('function');
  });
  it('getLastErrorReducer should return a reducer', () => {
    expect(getLastErrorReducer(actionTypes)).to.be.a('function');
  });
  describe('lastErrorReducer', () => {
    const reducer = getLastErrorReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.equal(null);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
      .to.equal(originalState);
    });
    it('should return null status on reset', () => {
      [
        actionTypes.reset
      ].forEach((type) => {
        expect(reducer('foo', {
          type,
        })).to.equal(null);
      });
    });
    it('should return error status on fetch error', () => {
      [
        actionTypes.fetchError,
      ].forEach((type) => {
        const error = 'error';
        expect(reducer('foo', {
          type,
          error
        })).to.equal(error);
      });
    });
    it('should keep the status on init, fetch, fetchSuccess', () => {
      [
        actionTypes.init,
        actionTypes.fetchSuccess,
        actionTypes.fetch,
      ].forEach((type) => {
        expect(reducer('foo', {
          type,
        })).to.equal('foo');
      });
    });
  });

  it('getDateTimeIntlReducer should be a function', () => {
    expect(getDateTimeIntlReducer).to.be.a('function');
  });
  it('getDateTimeIntlReducer should return a reducer', () => {
    expect(getDateTimeIntlReducer(actionTypes)).to.be.a('function');
  });
});
