import { expect } from 'chai';
import getStorageReducer from '../../../src/modules/storage/get-storage-reducer';
import storageActions from '../../../src/modules/storage/storage-actions';
import storageStatus from '../../../src/modules/storage/storage-status';
import { prefixActions } from '../../../src/lib/redux-helper';

describe('storage-reducer', () => {
  describe('getStorageReducer', () => {
    it('should be a function', () => {
      expect(getStorageReducer).to.be.a('function');
    });
    it('should return a reducer function', () => {
      expect(getStorageReducer()).to.exist;
    });
  });
  describe('reducer', () => {
    const reducer = getStorageReducer();
    it('should be a function', () => {
      expect(reducer).to.be.a('function');
    });
    it('should return a initial state', () => {
      expect(reducer()).to.deep.equal({
        data: {},
        key: null,
        status: storageStatus.pending,
        version: 0,
        error: null,
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
    describe('storageActions', () => {
      it('should handle storageActions.init', () => {
        expect(reducer(reducer(), {
          type: storageActions.init,
          data: { check: true },
          key: 'storage-key',
          status: storageStatus.saved,
          error: null,
        })).to.deep.equal({
          data: { check: true },
          key: 'storage-key',
          status: storageStatus.saved,
          version: 1,
          error: null,
        });
      });
      it('should handle storageActions.update', () => {
        const initialState = {
          key: 'storage-key',
          data: {
            foo: 'bar',
          },
          status: storageStatus.saved,
          version: 3,
          error: null,
        };
        expect(reducer(initialState, {
          type: storageActions.update,
          data: {
            foo: 'baz',
          },
        })).to.deep.equal({
          ...initialState,
          data: {
            ...initialState.data,
            foo: 'baz',
          },
          version: 4,
          status: storageStatus.dirty,
        });
      });
      it('should handle storageActions.remove', () => {
        const initialState = {
          key: 'storage-key',
          data: {
            foo: 'bar',
          },
          status: storageStatus.saved,
          version: 5,
          error: null,
        };
        expect(reducer(initialState, {
          type: storageActions.remove,
          key: 'foo',
        })).to.deep.equal({
          ...initialState,
          data: {},
          version: 6,
          status: storageStatus.dirty,
        });
      });
      it('should handle storageActions.save', () => {
        const initialState = {
          key: 'storage-key',
          data: {
            foo: 'bar',
          },
          status: storageStatus.dirty,
          error: null,
        };
        expect(reducer(initialState, {
          type: storageActions.save,
        })).to.deep.equal({
          ...initialState,
          status: storageStatus.saving,
        });
      });
      it('should handle storageActions.saveSuccess', () => {
        const initialState = {
          key: 'storage-key',
          data: {
            foo: 'bar',
          },
          status: storageStatus.dirty,
          version: 3,
          error: null,
        };
        expect(reducer(initialState, {
          type: storageActions.saveSuccess,
          version: 3,
        })).to.deep.equal({
          ...initialState,
          status: storageStatus.saved,
        });
        expect(reducer(initialState, {
          type: storageActions.saveSuccess,
          version: 5,
        })).to.equal(initialState);
      });
      it('should handle storageActions.saveError', () => {
        const initialState = {
          key: 'storage-key',
          data: {
            foo: 'bar',
          },
          status: storageStatus.dirty,
          version: 4,
          error: null,
        };
        expect(reducer(initialState, {
          type: storageActions.saveError,
          version: 4,
          error: new Error('test'),
        })).to.deep.equal({
          ...initialState,
          error: new Error('test'),
          status: storageStatus.dirty,
        });
        expect(reducer(initialState, {
          type: storageActions.saveError,
          version: 7,
          error: new Error('test'),
        })).to.equal(initialState);
      });
      it('should handle storageActions.load', () => {
        const initialState = {
          key: 'storage-key',
          data: {
            foo: 'bar',
          },
          status: storageStatus.saved,
          error: null,
          version: 4,
        };
        expect(reducer(initialState, {
          type: storageActions.load,
          data: {
            foo: 'baz',
          },
        })).to.deep.equal({
          ...initialState,
          data: {
            foo: 'baz',
          },
          version: initialState.version + 1,
          status: storageStatus.saved,
        });
      });
      it('should handle storageActions.reset', () => {
        const initialState = {
          key: 'storage-key',
          data: {
            foo: 'bar',
          },
          status: storageStatus.saved,
          error: null,
          version: 4,
        };
        expect(reducer(initialState, {
          type: storageActions.reset,
        })).to.deep.equal({
          status: storageStatus.pending,
          data: {},
          key: null,
          version: initialState.version + 1,
          error: null,
        });
      });
    });
  });
});
