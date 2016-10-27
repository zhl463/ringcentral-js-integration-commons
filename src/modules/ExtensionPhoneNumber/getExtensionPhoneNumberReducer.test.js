import { expect } from 'chai';
import getExtensionPhoneNumberReducer, {
  getErrorReducer,
  getStatusReducer,
} from './getExtensionPhoneNumberReducer';

import extensionPhoneNumberActionTypes from './extensionPhoneNumberActionTypes';
import extensionPhoneNumberStatus from './extensionPhoneNumberStatus';

describe('getStatusReducer', () => {
  it('should be a function', () => {
    expect(getStatusReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getStatusReducer()).to.be.a('function');
  });
  describe('statusReducer', () => {
    const reducer = getStatusReducer();
    it('should have initial state of pending', () => {
      expect(reducer(undefined, {})).to.equal(extensionPhoneNumberStatus.pending);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return ready status for the following action types', () => {
      [
        extensionPhoneNumberActionTypes.init,
        extensionPhoneNumberActionTypes.fetchSuccess,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(extensionPhoneNumberStatus.ready);
      });
    });
    it('should return error status on fetchError', () => {
      expect(reducer('foo', {
        type: extensionPhoneNumberActionTypes.fetchError,
      })).to.equal(extensionPhoneNumberStatus.error);
    });
    it('should return pending status on reset', () => {
      expect(reducer('foo', {
        type: extensionPhoneNumberActionTypes.reset,
      })).to.equal(extensionPhoneNumberStatus.pending);
    });
    it('should return fetching status on reset', () => {
      expect(reducer('foo', {
        type: extensionPhoneNumberActionTypes.fetch,
      })).to.equal(extensionPhoneNumberStatus.fetching);
    });
  });
});

describe('getErrorReducer', () => {
  it('should be a function', () => {
    expect(getErrorReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getErrorReducer()).to.be.a('function');
  });
  describe('errorReducer', () => {
    const reducer = getErrorReducer();
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return error on fetchError', () => {
      const error = new Error('test');
      expect(reducer(null, {
        type: extensionPhoneNumberActionTypes.fetchError,
        error,
      })).to.equal(error);
    });
    it('should return null on other action types', () => {
      [
        extensionPhoneNumberActionTypes.fetch,
        extensionPhoneNumberActionTypes.fetchSuccess,
        extensionPhoneNumberActionTypes.reset,
        extensionPhoneNumberActionTypes.init,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.be.null;
      });
    });
  });
});


describe('getExtensionPhoneNumberReducer', () => {
  it('should be a function', () => {
    expect(getExtensionPhoneNumberReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getExtensionPhoneNumberReducer()).to.be.a('function');
  });
  describe('subscriptionReducer', () => {
    const reducer = getExtensionPhoneNumberReducer();
    const errorReducer = getErrorReducer();
    const statusReducer = getStatusReducer();
    it('should return combined state', () => {
      expect(reducer(undefined, {}))
        .to.deep.equal({
          error: errorReducer(undefined, {}),
          status: statusReducer(undefined, {}),
        });
    });
  });
});
