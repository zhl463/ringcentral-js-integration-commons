import { expect } from 'chai';
import getForwardingNumberReducer from './get-forwarding-number-reducer';
import forwardingNumberActions from './forwarding-number-actions';
import forwardingNumberStatus from './forwarding-number-status';

describe('forwarding-number-reducer', () => {
  describe('getStorageReducer', () => {
    it('should be a function', () => {
      expect(getForwardingNumberReducer).to.be.a('function');
    });
    it('should return a reducer function', () => {
      expect(getForwardingNumberReducer()).to.be.a('function');
    });
  });
  describe('reducer', () => {
    const reducer = getForwardingNumberReducer();
    it('should return an initial state', () => {
      expect(reducer()).to.deep.equal({
        status: forwardingNumberStatus.pending,
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
    describe('forwardingNumberActions', () => {
      it('should handle forwardingNumberActions.ready', () => {
        expect(reducer({}, {
          type: forwardingNumberActions.ready,
        })).to.deep.equal({
          status: forwardingNumberStatus.ready,
          error: null,
        });
      });
      it('should handle forwardingNumberActions.fetch', () => {
        expect(reducer({}, {
          type: forwardingNumberActions.fetch,
        })).to.deep.equal({
          status: forwardingNumberStatus.fetching,
          error: null,
        });
      });
      it('should handle forwardingNumberActions.fetchSuccess', () => {
        expect(reducer({}, {
          type: forwardingNumberActions.fetchSuccess,
        })).to.deep.equal({
          status: forwardingNumberStatus.ready,
          error: null,
        });
      });
      it('should handle forwardingNumberActions.fetchError', () => {
        expect(reducer({}, {
          type: forwardingNumberActions.fetchError,
          error: new Error('test'),
        })).to.deep.equal({
          status: forwardingNumberStatus.ready,
          error: new Error('test'),
        });
      });
      it('should handle forwardingNumberActions.reset', () => {
        expect(reducer({}, {
          type: forwardingNumberActions.reset,
        })).to.deep.equal({
          status: forwardingNumberStatus.pending,
          error: null,
        });
      });
    });
  });
});
