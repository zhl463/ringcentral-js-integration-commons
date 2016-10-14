import { expect } from 'chai';
import getBlockedNumberReducer from './getBlockedNumberReducer';
import blockedNumberActions from './blockedNumberActions';
import blockedNumberStatus from './blockedNumberStatus';

describe('blocked-number-reducer', () => {
  describe('getStorageReducer', () => {
    it('should be a function', () => {
      expect(getBlockedNumberReducer).to.be.a('function');
    });
    it('should return a reducer function', () => {
      expect(getBlockedNumberReducer()).to.be.a('function');
    });
  });
  describe('reducer', () => {
    const reducer = getBlockedNumberReducer();
    it('should return an initial state', () => {
      expect(reducer()).to.deep.equal({
        status: blockedNumberStatus.pending,
        error: null,
      });
    });
    it('should return original state if no action is given', () => {
      const originalState = {};
      expect(reducer(originalState)).to.equal(originalState);
    });
    it('should return original state if action is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, {
        type: 'foo',
      })).to.equal(originalState);
    });
    describe('blockedNumberActions', () => {
      it('should handle blockedNumberActions.ready', () => {
        expect(reducer({}, {
          type: blockedNumberActions.ready,
        })).to.deep.equal({
          status: blockedNumberStatus.ready,
          error: null,
        });
      });
      it('should handle blockedNumberActions.fetch', () => {
        expect(reducer({}, {
          type: blockedNumberActions.fetch,
        })).to.deep.equal({
          status: blockedNumberStatus.fetching,
          error: null,
        });
      });
      it('should handle blockedNumberActions.fetchSuccess', () => {
        expect(reducer({}, {
          type: blockedNumberActions.fetchSuccess,
        })).to.deep.equal({
          status: blockedNumberStatus.ready,
          error: null,
        });
      });
      it('should handle blockedNumberActions.fetchError', () => {
        expect(reducer({}, {
          type: blockedNumberActions.fetchError,
          error: new Error('test'),
        })).to.deep.equal({
          status: blockedNumberStatus.ready,
          error: new Error('test'),
        });
      });
      it('should handle blockedNumberActions.reset', () => {
        expect(reducer({}, {
          type: blockedNumberActions.reset,
        })).to.deep.equal({
          status: blockedNumberStatus.pending,
          error: null,
        });
      });
    });
  });
});
