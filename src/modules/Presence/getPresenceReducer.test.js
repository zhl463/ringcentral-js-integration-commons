import { expect } from 'chai';
import getPresenceReducer, {
  getDndStatusReducer,
} from './getPresenceReducer';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

import actionTypes from './actionTypes';



describe('getDndStatusReducer', () => {
  it('should be a function', () => {
    expect(getDndStatusReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getDndStatusReducer({ types: actionTypes })).to.be.a('function');
  });
  describe('dndStatusReducer', () => {
    const reducer = getDndStatusReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return original state if type is not recognized', () => {
      const originalState = [];
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return action.dndStatus on fetchSuccess', () => {
      const dndStatus = {};
      expect(reducer(null, {
        type: actionTypes.fetchSuccess,
        dndStatus,
      })).to.equal(dndStatus);
    });
    it('should return action.dndStatus on notification', () => {
      const dndStatus = {};
      expect(reducer(null, {
        type: actionTypes.notification,
        dndStatus,
      })).to.equal(dndStatus);
    });
    it('should return null on reset', () => {
      const dndStatus = {};
      expect(reducer(null, {
        type: actionTypes.reset,
        dndStatus,
      })).to.be.null;
    });
  });
});


describe('getPresenceReducer', () => {
  it('should be a function', () => {
    expect(getPresenceReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getPresenceReducer(actionTypes)).to.be.a('function');
  });
  describe('presenceReducer', () => {
    const reducer = getPresenceReducer(actionTypes);
    const statusReducer = getModuleStatusReducer(actionTypes);
    const dndStatusReducer = getDndStatusReducer(actionTypes);
    it('should return combined state', () => {
      expect(reducer(undefined, {}))
        .to.deep.equal({
          status: statusReducer(undefined, {}),
          dndStatus: dndStatusReducer(undefined, {}),
        });
    });
  });
});
