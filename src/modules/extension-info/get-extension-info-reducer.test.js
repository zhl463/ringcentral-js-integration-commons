import { expect } from 'chai';
import getExtensionInfoReducer from './get-extension-info-reducer';
import extensionInfoActions from './extension-info-actions';
import extensionInfoStatus from './extension-info-status';

describe('extension-info-reducer', () => {
  describe('getStorageReducer', () => {
    it('should be a function', () => {
      expect(getExtensionInfoReducer).to.be.a('function');
    });
    it('should return a reducer function', () => {
      expect(getExtensionInfoReducer()).to.be.a('function');
    });
  });
  describe('reducer', () => {
    const reducer = getExtensionInfoReducer();
    it('should return an initial state', () => {
      expect(reducer()).to.deep.equal({
        status: extensionInfoStatus.pending,
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
    describe('extensionInfoActions', () => {
      it('should handle extensionInfoActions.ready', () => {
        expect(reducer({}, {
          type: extensionInfoActions.ready,
        })).to.deep.equal({
          status: extensionInfoStatus.ready,
          error: null,
        });
      });
      it('should handle extensionInfoActions.fetch', () => {
        expect(reducer({}, {
          type: extensionInfoActions.fetch,
        })).to.deep.equal({
          status: extensionInfoStatus.fetching,
          error: null,
        });
      });
      it('should handle extensionInfoActions.fetchSuccess', () => {
        expect(reducer({}, {
          type: extensionInfoActions.fetchSuccess,
        })).to.deep.equal({
          status: extensionInfoStatus.ready,
          error: null,
        });
      });
      it('should handle extensionInfoActions.fetchError', () => {
        expect(reducer({}, {
          type: extensionInfoActions.fetchError,
          error: new Error('test'),
        })).to.deep.equal({
          status: extensionInfoStatus.ready,
          error: new Error('test'),
        });
      });
      it('should handle extensionInfoActions.reset', () => {
        expect(reducer({}, {
          type: extensionInfoActions.reset,
        })).to.deep.equal({
          status: extensionInfoStatus.pending,
          error: null,
        });
      });
    });
  });
});
