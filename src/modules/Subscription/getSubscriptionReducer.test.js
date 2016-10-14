import { expect } from 'chai';
import getSubscriptionReducer from './getSubscriptionReducer';
import subscriptionActions from './subscriptionActions';
import subscriptionStatus from './subscriptionStatus';

describe('subscription-reducer', () => {
  describe('getSubscriptionReducer', () => {
    it('should be a function', () => {
      expect(getSubscriptionReducer).to.be.a('function');
    });
    it('should return a reducer function', () => {
      expect(getSubscriptionReducer()).to.exist;
    });
  });
  describe('reducer', () => {
    const reducer = getSubscriptionReducer();
    it('should be a function', () => {
      expect(reducer).to.be.a('function');
    });
    it('should return an initial state', () => {
      expect(reducer()).to.deep.equal({
        filters: [],
        status: subscriptionStatus.pending,
        error: null,
        lastMessage: null,
      });
    });
    it('should return original state if no action is given', () => {
      const originalState = {};
      expect(reducer(originalState)).to.equal(originalState);
    });
    it('should return original state if action type if not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, {
        type: 'foo',
      })).to.equal(originalState);
    });
    describe('subscriptionActions', () => {
      it('should handle subscriptionActions.setFilters', () => {
        const originalState = reducer();
        expect(reducer(originalState, {
          type: subscriptionActions.setFilters,
          filters: ['filter-a', 'filter-b'],
        })).to.deep.equal({
          ...originalState,
          filters: ['filter-a', 'filter-b'],
        });
      });
      it('should handle subscriptionActions.notification', () => {
        const originalState = reducer();
        expect(reducer(originalState, {
          type: subscriptionActions.notification,
          message: 'hello world',
        })).to.deep.equal({
          ...originalState,
          lastMessage: 'hello world',
        });
      });
      it('should handle subscriptionActions.ready', () => {
        const originalState = reducer();
        expect(reducer(originalState, {
          type: subscriptionActions.ready,
        })).to.deep.equal({
          ...originalState,
          status: subscriptionStatus.notSubscribed,
        });
      });
      it('should handle subscriptionActions.subscribeSuccess', () => {
        const originalState = reducer();
        expect(reducer(originalState, {
          type: subscriptionActions.subscribeSuccess,
        })).to.deep.equal({
          ...originalState,
          status: subscriptionStatus.subscribed,
        });
      });
      it('should handle subscriptionActions.subscribeError', () => {
        const originalState = reducer();
        expect(reducer(originalState, {
          type: subscriptionActions.subscribeError,
          error: new Error('test'),
        })).to.deep.equal({
          ...originalState,
          status: subscriptionStatus.notSubscribed,
          error: new Error('test'),
        });
      });
      it('should handle subscriptionActions.renewSuccess', () => {
        const originalState = reducer();
        expect(reducer(originalState, {
          type: subscriptionActions.renewSuccess,
        })).to.deep.equal({
          ...originalState,
          status: subscriptionStatus.subscribed,
        });
      });
      it('should handle subscriptionActions.renewError', () => {
        const originalState = reducer();
        expect(reducer(originalState, {
          type: subscriptionActions.renewError,
          error: new Error('test'),
        })).to.deep.equal({
          ...originalState,
          status: subscriptionStatus.notSubscribed,
          error: new Error('test'),
        });
      });
      it('should handle subscriptionActions.removeSuccess', () => {
        const originalState = reducer();
        expect(reducer(originalState, {
          type: subscriptionActions.removeSuccess,
        })).to.deep.equal({
          ...originalState,
          status: subscriptionStatus.notSubscribed,
        });
      });
      it('should handle subscriptionActions.removeError', () => {
        const originalState = reducer();
        expect(reducer(originalState, {
          type: subscriptionActions.removeError,
          error: new Error('test'),
        })).to.deep.equal({
          ...originalState,
          status: subscriptionStatus.subscribed,
          error: new Error('test'),
        });
      });
      it('should handle subscriptionActions.reset', () => {
        const originalState = reducer();
        expect(reducer(originalState, {
          type: subscriptionActions.reset,
        })).to.deep.equal({
          ...originalState,
          lastMessage: null,
          error: null,
          status: subscriptionStatus.pending,
        });
      });
    });
  });
});
