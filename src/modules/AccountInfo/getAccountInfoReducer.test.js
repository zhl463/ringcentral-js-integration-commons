import { expect } from 'chai';
import getAccountInfoReducer, {
  getErrorReducer,
  getStatusReducer,
} from './getAccountInfoReducer';

import accountInfoActionTypes from './accountInfoActionTypes';
import accountInfoStatus from './accountInfoStatus';

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
      expect(reducer(undefined, {})).to.equal(accountInfoStatus.pending);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return ready status for the following action types', () => {
      [
        accountInfoActionTypes.init,
        accountInfoActionTypes.fetchSuccess,
        accountInfoActionTypes.fetchError,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(accountInfoStatus.ready);
      });
    });
    it('should return pending status on reset', () => {
      expect(reducer('foo', {
        type: accountInfoActionTypes.reset,
      })).to.equal(accountInfoStatus.pending);
    });
    it('should return fetching status on reset', () => {
      expect(reducer('foo', {
        type: accountInfoActionTypes.fetch,
      })).to.equal(accountInfoStatus.fetching);
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
        type: accountInfoActionTypes.fetchError,
        error,
      })).to.equal(error);
    });
    it('should return null on other action types', () => {
      [
        accountInfoActionTypes.fetch,
        accountInfoActionTypes.fetchSuccess,
        accountInfoActionTypes.reset,
        accountInfoActionTypes.init,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.be.null;
      });
    });
  });
});


describe('getAccountInfoReducer', () => {
  it('should be a function', () => {
    expect(getAccountInfoReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getAccountInfoReducer()).to.be.a('function');
  });
  describe('subscriptionReducer', () => {
    const reducer = getAccountInfoReducer();
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
