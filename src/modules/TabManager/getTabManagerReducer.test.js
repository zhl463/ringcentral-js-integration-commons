import { expect } from 'chai';
import getTabManagerReducer, {
  getStatusReducer,
  getEventReducer,
  getActiveReducer,
} from './getTabManagerReducer';

import actionTypes from './actionTypes';
import moduleStatus from '../../enums/moduleStatus';

describe('getStatusReducer', () => {
  it('should be a function', () => {
    expect(getStatusReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getStatusReducer(actionTypes)).to.be.a('function');
  });
  describe('statusReducer', () => {
    const reducer = getStatusReducer(actionTypes);
    it('should have initial state of moduleStatus.pending', () => {
      expect(reducer(undefined, {})).to.equal(moduleStatus.pending);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return moduleStatus.ready on init action type', () => {
      expect(reducer(null, {
        type: actionTypes.init,
      })).to.equal(moduleStatus.ready);
    });
  });
});


describe('getEventReducer', () => {
  it('should be a function', () => {
    expect(getEventReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getEventReducer(actionTypes)).to.be.a('function');
  });
  describe('eventReducer', () => {
    const reducer = getEventReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return null for all actions except for event', () => {
      expect(reducer('foo', { type: 'foo' }))
        .to.equal(null);
    });
    it('should return { name, args } on event action type', () => {
      expect(reducer(null, {
        type: actionTypes.event,
        event: 'foo',
        args: ['bar'],
      })).to.deep.equal({
        name: 'foo',
        args: ['bar'],
      });
    });
  });
});

describe('getActiveReducer', () => {
  it('should be a function', () => {
    expect(getActiveReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getActiveReducer(actionTypes)).to.be.a('function');
  });
  describe('activeReducer', () => {
    const reducer = getActiveReducer(actionTypes);
    it('should have initial state of false', () => {
      expect(reducer(undefined, {})).to.be.false;
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return action.active on init action type', () => {
      expect(reducer(null, {
        type: actionTypes.init,
        active: true,
      })).to.be.true;
      expect(reducer(null, {
        type: actionTypes.init,
        active: false,
      })).to.be.false;
    });
    it('should return action.active on mainTabIdChanged action type', () => {
      expect(reducer(null, {
        type: actionTypes.mainTabIdChanged,
        active: true,
      })).to.be.true;
      expect(reducer(null, {
        type: actionTypes.mainTabIdChanged,
        active: false,
      })).to.be.false;
    });
  });
});

describe('getTabManagerReducer', () => {
  it('should be a function', () => {
    expect(getTabManagerReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getTabManagerReducer(actionTypes)).to.be.a('function');
  });
  it('should return a combined reducer', () => {
    const reducer = getTabManagerReducer(actionTypes);
    const statusReducer = getStatusReducer(actionTypes);
    const activeReducer = getActiveReducer(actionTypes);
    const eventReducer = getEventReducer(actionTypes);
    expect(reducer(undefined, {})).to.deep.equal({
      status: statusReducer(undefined, {}),
      active: activeReducer(undefined, {}),
      event: eventReducer(undefined, {}),
    });
  });
});
