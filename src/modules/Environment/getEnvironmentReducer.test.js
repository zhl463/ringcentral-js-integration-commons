import { expect } from 'chai';
import moduleStatus from '../../enums/moduleStatus';
import actionTypes from './actionTypes';
import getEnvironmentReducer, {
  getStatusReducer,
  getChangedReducer,
  getServerReducer,
  getEnabledReducer,
} from './getEnvironmentReducer';

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

describe('getChangedReducer', () => {
  it('should be a function', () => {
    expect(getChangedReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getChangedReducer(actionTypes)).to.be.a('function');
  });
  describe('changedReducer', () => {
    const reducer = getChangedReducer(actionTypes);
    it('should have initial state of false', () => {
      expect(reducer(undefined, {})).to.be.false;
    });
    it('should return false if type is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.be.false;
    });
    it('should return action.environmentChanged on setData', () => {
      expect(reducer(null, {
        type: actionTypes.setData,
        environmentChanged: true,
      })).to.true;
      expect(reducer(null, {
        type: actionTypes.setData,
        environmentChanged: false,
      })).to.false;
    });
  });
});

describe('getServerReducer', () => {
  it('should be a function', () => {
    expect(getServerReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getServerReducer({ types: actionTypes, defaultServer: 'foo' })).to.be.a('function');
  });
  describe('serverReducer', () => {
    const reducer = getServerReducer({ types: actionTypes, defaultServer: 'foo' });
    it('should have initial state of defaultServer', () => {
      expect(reducer(undefined, {})).to.equal('foo');
    });
    it('should return originalState if type is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return action.server on setData', () => {
      expect(reducer(null, {
        type: actionTypes.setData,
        server: 'bar',
      })).to.equal('bar');
    });
  });
});

describe('getEnabledReducer', () => {
  it('should be a function', () => {
    expect(getEnabledReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getEnabledReducer(actionTypes)).to.be.a('function');
  });
  describe('serverReducer', () => {
    const reducer = getEnabledReducer(actionTypes);
    it('should have initial state of false', () => {
      expect(reducer(undefined, {})).to.be.false;
    });
    it('should return originalState if type is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return action.enabled on setData', () => {
      expect(reducer(null, {
        type: actionTypes.setData,
        enabled: true,
      })).to.be.true;
      expect(reducer(null, {
        type: actionTypes.setData,
        enabled: false,
      })).to.be.false;
    });
  });
});

describe('getEnvironmentReducer', () => {
  it('should be a function', () => {
    expect(getEnvironmentReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getEnvironmentReducer(actionTypes)).to.be.a('function');
  });
  describe('serverReducer', () => {
    const reducer = getEnvironmentReducer(actionTypes);
    const statusReducer = getStatusReducer(actionTypes);
    const changedReducer = getChangedReducer(actionTypes);
    it('should return the combined initialState', () => {
      expect(reducer(undefined, {})).to.deep.equal({
        status: statusReducer(undefined, {}),
        changed: changedReducer(undefined, {}),
      });
    });
  });
});
