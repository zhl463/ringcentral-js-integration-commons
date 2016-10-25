import { expect } from 'chai';
import getDialingPlanReducer, {
  getErrorReducer,
  getStatusReducer,
} from './getDialingPlanReducer';

import dialingPlanActionTypes from './dialingPlanActionTypes';
import dialingPlanStatus from './dialingPlanStatus';

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
      expect(reducer(undefined, {})).to.equal(dialingPlanStatus.pending);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return ready status for the following action types', () => {
      [
        dialingPlanActionTypes.init,
        dialingPlanActionTypes.fetchSuccess,
        dialingPlanActionTypes.fetchError,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(dialingPlanStatus.ready);
      });
    });
    it('should return pending status on reset', () => {
      expect(reducer('foo', {
        type: dialingPlanActionTypes.reset,
      })).to.equal(dialingPlanStatus.pending);
    });
    it('should return fetching status on reset', () => {
      expect(reducer('foo', {
        type: dialingPlanActionTypes.fetch,
      })).to.equal(dialingPlanStatus.fetching);
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
        type: dialingPlanActionTypes.fetchError,
        error,
      })).to.equal(error);
    });
    it('should return null on other action types', () => {
      [
        dialingPlanActionTypes.fetch,
        dialingPlanActionTypes.fetchSuccess,
        dialingPlanActionTypes.reset,
        dialingPlanActionTypes.init,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.be.null;
      });
    });
  });
});


describe('getDialingPlanReducer', () => {
  it('should be a function', () => {
    expect(getDialingPlanReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getDialingPlanReducer()).to.be.a('function');
  });
  describe('subscriptionReducer', () => {
    const reducer = getDialingPlanReducer();
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
