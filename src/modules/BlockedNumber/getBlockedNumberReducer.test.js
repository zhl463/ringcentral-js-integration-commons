import { expect } from 'chai';
import getBlockedNumberReducer, {
  getErrorReducer,
  getStatusReducer,
} from './getBlockedNumberReducer';

import blockedNumberActionTypes from './blockedNumberActionTypes';
import blockedNumberStatus from './blockedNumberStatus';

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
      expect(reducer(undefined, {})).to.equal(blockedNumberStatus.pending);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return ready status for the following action types', () => {
      [
        blockedNumberActionTypes.init,
        blockedNumberActionTypes.fetchSuccess,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(blockedNumberStatus.ready);
      });
    });
    it('should return error status on fetchError', () => {
      expect(reducer('foo', {
        type: blockedNumberActionTypes.fetchError,
      })).to.equal(blockedNumberStatus.error);
    });
    it('should return pending status on reset', () => {
      expect(reducer('foo', {
        type: blockedNumberActionTypes.reset,
      })).to.equal(blockedNumberStatus.pending);
    });
    it('should return fetching status on reset', () => {
      expect(reducer('foo', {
        type: blockedNumberActionTypes.fetch,
      })).to.equal(blockedNumberStatus.fetching);
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
        type: blockedNumberActionTypes.fetchError,
        error,
      })).to.equal(error);
    });
    it('should return null on other action types', () => {
      [
        blockedNumberActionTypes.fetch,
        blockedNumberActionTypes.fetchSuccess,
        blockedNumberActionTypes.reset,
        blockedNumberActionTypes.init,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.be.null;
      });
    });
  });
});


describe('getBlockedNumberReducer', () => {
  it('should be a function', () => {
    expect(getBlockedNumberReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getBlockedNumberReducer()).to.be.a('function');
  });
  describe('subscriptionReducer', () => {
    const reducer = getBlockedNumberReducer();
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
