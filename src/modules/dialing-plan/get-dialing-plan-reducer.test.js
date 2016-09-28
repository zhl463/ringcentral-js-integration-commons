import { expect } from 'chai';
import getDialingPlanReducer from './get-dialing-plan-reducer';
import dialingPlanActions from './dialing-plan-actions';
import dialingPlanStatus from './dialing-plan-status';

describe('dialing-plan-reducer', () => {
  describe('getStorageReducer', () => {
    it('should be a function', () => {
      expect(getDialingPlanReducer).to.be.a('function');
    });
    it('should return a reducer function', () => {
      expect(getDialingPlanReducer()).to.be.a('function');
    });
  });
  describe('reducer', () => {
    const reducer = getDialingPlanReducer();
    it('should return an initial state', () => {
      expect(reducer()).to.deep.equal({
        status: dialingPlanStatus.pending,
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
    describe('dialingPlanActions', () => {
      it('should handle dialingPlanActions.ready', () => {
        expect(reducer({}, {
          type: dialingPlanActions.ready,
        })).to.deep.equal({
          status: dialingPlanStatus.ready,
          error: null,
        });
      });
      it('should handle dialingPlanActions.fetch', () => {
        expect(reducer({}, {
          type: dialingPlanActions.fetch,
        })).to.deep.equal({
          status: dialingPlanStatus.fetching,
          error: null,
        });
      });
      it('should handle dialingPlanActions.fetchSuccess', () => {
        expect(reducer({}, {
          type: dialingPlanActions.fetchSuccess,
        })).to.deep.equal({
          status: dialingPlanStatus.ready,
          error: null,
        });
      });
      it('should handle dialingPlanActions.fetchError', () => {
        expect(reducer({}, {
          type: dialingPlanActions.fetchError,
          error: new Error('test'),
        })).to.deep.equal({
          status: dialingPlanStatus.ready,
          error: new Error('test'),
        });
      });
      it('should handle dialingPlanActions.reset', () => {
        expect(reducer({}, {
          type: dialingPlanActions.reset,
        })).to.deep.equal({
          status: dialingPlanStatus.pending,
          error: null,
        });
      });
    });
  });
});
