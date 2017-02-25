import { expect } from 'chai';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';
import getCallReducer, {
  getCallStatusReducer,
  getToNumberReducer,
  getLastCallNumberReducer,
} from './getCallReducer';

import actionTypes from './actionTypes';
import callStatus from './callStatus';

describe('Call ::', () => {
  it('getCallReducer should be a function', () => {
    expect(getCallReducer).to.be.a('function');
  });
  describe('getToNumberReducer', () => {
    it('should be a function', () => {
      expect(getToNumberReducer).to.be.a('function');
    });
    const reducer = getToNumberReducer(actionTypes);
    it('should have empty string as initial state', () => {
      expect(reducer(undefined, {})).to.equal('');
    });
    it('should return original state if actionType is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
      .to.equal(originalState);
    });
    it('should return data on toNumberChanged', () => {
      const data = 'bar';
      expect(reducer('foo', {
        type: actionTypes.toNumberChanged,
        data
      })).to.equal(data);
    });
    it('should return data on connectError', () => {
      const state = 'foo';
      expect(reducer(state, {
        type: actionTypes.connectError
      })).to.equal(state);
    });
    it('should return empty string on connectSuccess', () => {
      expect(reducer('foo', {
        type: actionTypes.connectSuccess,
      })).to.equal('');
    });
    it('should return \'\' on resetSuccess', () => {
      expect(reducer('', {
        type: actionTypes.resetSuccess,
      })).to.deep.equal('');
    });
  });
  describe('getLastCallNumberReducer', () => {
    it('should be a function', () => {
      expect(getLastCallNumberReducer).to.be.a('function');
    });
    const reducer = getLastCallNumberReducer(actionTypes);
    it('should be null as initial state', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return original state if actionType is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
      .to.equal(originalState);
    });
    it('should return action.number on connect', () => {
      const number = {};
      expect(reducer(null, {
        type: actionTypes.connect,
        number,
      })).to.equal(number);
    });
  });
  describe('getCallStatusReducer', () => {
    it('should be a function', () => {
      expect(getCallStatusReducer).to.be.a('function');
    });
    const reducer = getCallStatusReducer(actionTypes);
    it('should have initiate state of idle', () => {
      expect(reducer(undefined, {})).to.equal(callStatus.idle);
    });
    it('should return original state if actionType is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
      .to.equal(originalState);
    });
    it('should return connecting status if actionType is connect', () => {
      expect(reducer('foo', {
        type: actionTypes.connect,
      })).to.equal(callStatus.connecting);
    });
    it('should return idle status if actionType is connectSuccess or connectError', () => {
      expect(reducer('foo', {
        type: actionTypes.connectSuccess,
      })).to.equal(callStatus.idle);
      expect(reducer('foo', {
        type: actionTypes.connectError,
      })).to.equal(callStatus.idle);

    });
  });
  describe('getCallReducer', () => {
    it('should be a function', () => {
      expect(getCallReducer).to.be.a('function');
    });
    it('should return a reducer', () => {
      const reducer = getCallReducer();
      const moduleStatusReducer = getModuleStatusReducer();
      const toNumberReducer = getToNumberReducer();
      it('should return combined state', () => {
        expect(reducer(undefined, {}))
          .to.deep.equal({
            status: moduleStatusReducer(undefined, {}),
            toNumber: toNumberReducer(undefined, {}),
          });
      });
    });
  });
});
