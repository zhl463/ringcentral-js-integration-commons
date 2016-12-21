import { expect } from 'chai';
import getModuleStatusReducer from './';
import moduleStatus from '../../enums/moduleStatus';

const actionTypes = {
  init: 'init',
  initSuccess: 'initSuccess',
  reset: 'reset',
  resetSuccess: 'resetSuccess',
};

describe('getModuleStatusReducer', () => {
  it('should be a function', () => {
    expect(getModuleStatusReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getModuleStatusReducer({ types: actionTypes })).to.be.a('function');
  });
  describe('defaultDataReducer', () => {
    const reducer = getModuleStatusReducer(actionTypes);
    it('should have initial state of moduleStatus.pending', () => {
      expect(reducer(undefined, {})).to.equal(moduleStatus.pending);
    });
    it('should return original state if type is not recognized', () => {
      const originalState = [];
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return moduleStatus.initializing on init', () => {
      expect(reducer(null, {
        type: actionTypes.init,
      })).to.equal(moduleStatus.initializing);
    });
    it('should return moduleStatus.ready on initSuccess', () => {
      expect(reducer(null, {
        type: actionTypes.initSuccess,
      })).to.equal(moduleStatus.ready);
    });
    it('should return moduleStatus.resetting on reset', () => {
      expect(reducer(null, {
        type: actionTypes.reset,
      })).to.equal(moduleStatus.resetting);
    });
    it('should return moduleStatus.pending on resetSuccess', () => {
      expect(reducer(null, {
        type: actionTypes.resetSuccess,
      })).to.equal(moduleStatus.pending);
    });
  });
});
