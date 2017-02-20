import { expect } from 'chai';
import getStorageReducer, {
  getSettingsReducer,
  getValidityReducer,
  getTimestampReducer,
} from './getStorageReducer';

import actionTypes from './actionTypes';

describe('DateTimeIntl :: getStorageReducer', () => {
  //
  it('getStorageReducer should be a function', () => {
    expect(getStorageReducer).to.be.a('function');
  });
  it('getStorageReducer should return a reducer', () => {
    expect(getStorageReducer(actionTypes)).to.be.a('function');
  });

  it('getSettingsReducer should be a function', () => {
    expect(getSettingsReducer).to.be.a('function');
  });
  it('getSettingsReducer should return a reducer', () => {
    expect(getSettingsReducer(actionTypes)).to.be.a('function');
  });
  describe('getSettingsReducer', () => {
    const reducer = getSettingsReducer(actionTypes);
    it('should have initial state of plain object', () => {
      expect(Object.keys(reducer(undefined, {})).length).to.equal(0);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
      .to.equal(originalState);
    });
    it('should return plain object on reset', () => {
      [
        actionTypes.reset,
      ].forEach((type) => {
        expect(Object.keys(reducer('foo', {
          type,
        })).length).to.equal(0);
      });
    });
    it('should return provider settings on fetch success', () => {
      [
        actionTypes.fetchSuccess,
      ].forEach((type) => {
        const provider = {
          providerName: 'xxx',
        };
        const providerSettings = {
          locales: ['en-US'],
        };
        expect(reducer({}, {
          type,
          provider,
          providerSettings,
        })[provider.providerName]).to.equal(providerSettings);
      });
    });
  });

  it('getValidityReducer should be a function', () => {
    expect(getValidityReducer).to.be.a('function');
  });
  it('getValidityReducer should return a reducer', () => {
    expect(getValidityReducer(actionTypes)).to.be.a('function');
  });
  describe('getValidityReducer', () => {
    const reducer = getValidityReducer(actionTypes);
    it('should have initial state of plain object', () => {
      expect(Object.keys(reducer(undefined, {})).length).to.equal(0);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
      .to.equal(originalState);
    });
    it('should return plain object on reset', () => {
      [
        actionTypes.reset,
      ].forEach((type) => {
        expect(Object.keys(reducer('foo', {
          type,
        })).length).to.equal(0);
      });
    });
    it('should return undefined on fetch', () => {
      [
        actionTypes.fetch,
      ].forEach((type) => {
        const provider = {
          providerName: 'xxx',
        };
        expect(reducer({}, {
          type,
          provider,
        })[provider.providerName]).to.equal(undefined);
      });
    });
    it('should return available status "y" on fetch success', () => {
      [
        actionTypes.fetchSuccess,
      ].forEach((type) => {
        const provider = {
          providerName: 'xxx',
        };
        expect(reducer({}, {
          type,
          provider,
        })[provider.providerName]).to.equal(true);
      });
    });
    it('should return available status "n" on fetch error', () => {
      [
        actionTypes.fetchError,
      ].forEach((type) => {
        const provider = {
          providerName: 'xxx',
        };
        expect(reducer({}, {
          type,
          provider,
        })[provider.providerName]).to.equal(false);
      });
    });
  });

  it('getTimestampReducer should be a function', () => {
    expect(getTimestampReducer).to.be.a('function');
  });
  it('getTimestampReducer should return a reducer', () => {
    expect(getTimestampReducer(actionTypes)).to.be.a('function');
  });
  describe('getTimestampReducer', () => {
    const reducer = getTimestampReducer(actionTypes);
    const timestamp = Date.now();
    it('should have initial state of 0', () => {
      expect(reducer(undefined, {})).to.be.eq(0);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
      .to.equal(originalState);
    });
    it('should return 0 status on reset', () => {
      [
        actionTypes.reset,
      ].forEach((type) => {
        expect(reducer('foo', {
          type,
        })).to.equal(0);
      });
    });
    it('should return timestamp on fetch success', () => {
      [
        actionTypes.fetchSuccess,
        actionTypes.fetchError,
      ].forEach((type) => {
        expect(reducer('foo', {
          type,
          timestamp,
        })).to.be.eq(timestamp);
      });
    });
  });
});
