import { expect } from 'chai';
import getAccountInfoReducer from './getAccountInfoReducer';
import accountInfoActions from './accountInfoActions';
import accountInfoStatus from './accountInfoStatus';

describe('account-info-reducer', () => {
  describe('getStorageReducer', () => {
    it('should be a function', () => {
      expect(getAccountInfoReducer).to.be.a('function');
    });
    it('should return a reducer function', () => {
      expect(getAccountInfoReducer()).to.be.a('function');
    });
  });
  describe('reducer', () => {
    const reducer = getAccountInfoReducer();
    it('should return an initial state', () => {
      expect(reducer()).to.deep.equal({
        status: accountInfoStatus.pending,
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
    describe('accountInfoActions', () => {
      it('should handle accountInfoActions.ready', () => {
        expect(reducer({}, {
          type: accountInfoActions.ready,
        })).to.deep.equal({
          status: accountInfoStatus.ready,
          error: null,
        });
      });
      it('should handle accountInfoActions.fetch', () => {
        expect(reducer({}, {
          type: accountInfoActions.fetch,
        })).to.deep.equal({
          status: accountInfoStatus.fetching,
          error: null,
        });
      });
      it('should handle accountInfoActions.fetchSuccess', () => {
        expect(reducer({}, {
          type: accountInfoActions.fetchSuccess,
        })).to.deep.equal({
          status: accountInfoStatus.ready,
          error: null,
        });
      });
      it('should handle accountInfoActions.fetchError', () => {
        expect(reducer({}, {
          type: accountInfoActions.fetchError,
          error: new Error('test'),
        })).to.deep.equal({
          status: accountInfoStatus.ready,
          error: new Error('test'),
        });
      });
      it('should handle accountInfoActions.reset', () => {
        expect(reducer({}, {
          type: accountInfoActions.reset,
        })).to.deep.equal({
          status: accountInfoStatus.pending,
          error: null,
        });
      });
    });
  });
});
