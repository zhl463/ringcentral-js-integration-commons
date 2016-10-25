import { expect } from 'chai';
import getForwardingNumberReducer, {
  getErrorReducer,
  getStatusReducer,
} from './getForwardingNumberReducer';

import forwardingNumberActionTypes from './forwardingNumberActionTypes';
import forwardingNumberStatus from './forwardingNumberStatus';

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
      expect(reducer(undefined, {})).to.equal(forwardingNumberStatus.pending);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return ready status for the following action types', () => {
      [
        forwardingNumberActionTypes.init,
        forwardingNumberActionTypes.fetchSuccess,
        forwardingNumberActionTypes.fetchError,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(forwardingNumberStatus.ready);
      });
    });
    it('should return pending status on reset', () => {
      expect(reducer('foo', {
        type: forwardingNumberActionTypes.reset,
      })).to.equal(forwardingNumberStatus.pending);
    });
    it('should return fetching status on reset', () => {
      expect(reducer('foo', {
        type: forwardingNumberActionTypes.fetch,
      })).to.equal(forwardingNumberStatus.fetching);
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
        type: forwardingNumberActionTypes.fetchError,
        error,
      })).to.equal(error);
    });
    it('should return null on other action types', () => {
      [
        forwardingNumberActionTypes.fetch,
        forwardingNumberActionTypes.fetchSuccess,
        forwardingNumberActionTypes.reset,
        forwardingNumberActionTypes.init,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.be.null;
      });
    });
  });
});


describe('getForwardingNumberReducer', () => {
  it('should be a function', () => {
    expect(getForwardingNumberReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getForwardingNumberReducer()).to.be.a('function');
  });
  describe('subscriptionReducer', () => {
    const reducer = getForwardingNumberReducer();
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
