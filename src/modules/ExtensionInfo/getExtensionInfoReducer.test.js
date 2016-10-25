import { expect } from 'chai';
import getExtensionInfoReducer, {
  getErrorReducer,
  getStatusReducer,
} from './getExtensionInfoReducer';

import extensionInfoActionTypes from './extensionInfoActionTypes';
import extensionInfoStatus from './extensionInfoStatus';

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
      expect(reducer(undefined, {})).to.equal(extensionInfoStatus.pending);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return ready status for the following action types', () => {
      [
        extensionInfoActionTypes.init,
        extensionInfoActionTypes.fetchSuccess,
        extensionInfoActionTypes.fetchError,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(extensionInfoStatus.ready);
      });
    });
    it('should return pending status on reset', () => {
      expect(reducer('foo', {
        type: extensionInfoActionTypes.reset,
      })).to.equal(extensionInfoStatus.pending);
    });
    it('should return fetching status on reset', () => {
      expect(reducer('foo', {
        type: extensionInfoActionTypes.fetch,
      })).to.equal(extensionInfoStatus.fetching);
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
        type: extensionInfoActionTypes.fetchError,
        error,
      })).to.equal(error);
    });
    it('should return null on other action types', () => {
      [
        extensionInfoActionTypes.fetch,
        extensionInfoActionTypes.fetchSuccess,
        extensionInfoActionTypes.reset,
        extensionInfoActionTypes.init,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.be.null;
      });
    });
  });
});


describe('getExtensionInfoReducer', () => {
  it('should be a function', () => {
    expect(getExtensionInfoReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getExtensionInfoReducer()).to.be.a('function');
  });
  describe('subscriptionReducer', () => {
    const reducer = getExtensionInfoReducer();
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
