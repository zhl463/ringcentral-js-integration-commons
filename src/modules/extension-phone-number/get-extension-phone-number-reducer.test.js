import { expect } from 'chai';
import getExtensionPhoneNumberReducer from './get-extension-phone-number-reducer';
import extensionPhoneNumberActions from './extension-phone-number-actions';
import extensionPhoneNumberStatus from './extension-phone-number-status';

describe('extension-phone-number-reducer', () => {
  describe('getStorageReducer', () => {
    it('should be a function', () => {
      expect(getExtensionPhoneNumberReducer).to.be.a('function');
    });
    it('should return a reducer function', () => {
      expect(getExtensionPhoneNumberReducer()).to.be.a('function');
    });
  });
  describe('reducer', () => {
    const reducer = getExtensionPhoneNumberReducer();
    it('should return an initial state', () => {
      expect(reducer()).to.deep.equal({
        status: extensionPhoneNumberStatus.pending,
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
    describe('extensionPhoneNumberActions', () => {
      it('should handle extensionPhoneNumberActions.ready', () => {
        expect(reducer({}, {
          type: extensionPhoneNumberActions.ready,
        })).to.deep.equal({
          status: extensionPhoneNumberStatus.ready,
          error: null,
        });
      });
      it('should handle extensionPhoneNumberActions.fetch', () => {
        expect(reducer({}, {
          type: extensionPhoneNumberActions.fetch,
        })).to.deep.equal({
          status: extensionPhoneNumberStatus.fetching,
          error: null,
        });
      });
      it('should handle extensionPhoneNumberActions.fetchSuccess', () => {
        expect(reducer({}, {
          type: extensionPhoneNumberActions.fetchSuccess,
        })).to.deep.equal({
          status: extensionPhoneNumberStatus.ready,
          error: null,
        });
      });
      it('should handle extensionPhoneNumberActions.fetchError', () => {
        expect(reducer({}, {
          type: extensionPhoneNumberActions.fetchError,
          error: new Error('test'),
        })).to.deep.equal({
          status: extensionPhoneNumberStatus.ready,
          error: new Error('test'),
        });
      });
      it('should handle extensionPhoneNumberActions.reset', () => {
        expect(reducer({}, {
          type: extensionPhoneNumberActions.reset,
        })).to.deep.equal({
          status: extensionPhoneNumberStatus.pending,
          error: null,
        });
      });
    });
  });
});
