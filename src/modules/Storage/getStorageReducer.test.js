import { expect } from 'chai';
import getStorageReducer, {
  getStatusReducer,
  getDataReducer,
  getStorageKeyReducer,
} from './getStorageReducer';

import actionTypes from './actionTypes';
import moduleStatus from '../../enums/moduleStatus';

describe('getStatusReducer', () => {
  it('should be a function', () => {
    expect(getStatusReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getStatusReducer(actionTypes)).to.be.a('function');
  });
  describe('getStatusReducer', () => {
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
    it('should return moduleStatus.resetting on reset action type', () => {
      expect(reducer(null, {
        type: actionTypes.reset,
      })).to.equal(moduleStatus.resetting);
    });
    it('should return moduleStatus.pending on resetSuccess action type', () => {
      expect(reducer(null, {
        type: actionTypes.resetSuccess,
      })).to.equal(moduleStatus.pending);
    });
  });
});

describe('getStorageKeyReducer', () => {
  it('should be a function', () => {
    expect(getStorageKeyReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getStorageKeyReducer(actionTypes)).to.be.a('function');
  });
  describe('storageKeyReducer', () => {
    const reducer = getStorageKeyReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return action.storageKey on init action type', () => {
      expect(reducer('foo', {
        type: actionTypes.init,
        storageKey: 'foo',
      })).to.equal('foo');
    });
    it('should return null on resetSuccess action type', () => {
      expect(reducer('foo', {
        type: actionTypes.resetSuccess,
      })).to.be.null;
    });
  });
});

describe('getDataReducer', () => {
  it('should be a function', () => {
    expect(getDataReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getDataReducer({ types: actionTypes, reducers: [] })).to.be.a('function');
  });
  describe('dataReducer', () => {
    const foo = (state = 0, { type }) => {
      if (type === 'counter') return state + 1;
      return state;
    };
    const bar = (state = null, { type, value }) => {
      if (type === 'memorize') return value;
      return state;
    }
    const reducer = getDataReducer({
      types: actionTypes,
      reducers: {
        foo,
        bar,
      },
    });
    it('should have combined initial state of its reducers', () => {
      expect(reducer(undefined, {})).to.deep.equal({
        foo: foo(undefined, {}),
        bar: bar(undefined, {}),
      });
    });
    it('should ignore unrecognized actions', () => {
      expect(reducer({
        foo: 1,
        bar: true,
      }, {
        type: 'rogue',
      })).to.deep.equal({
        foo: 1,
        bar: true,
      });
    });
    it('should return action.data on init', () => {
      const data = {};
      expect(reducer({}, {
        type: actionTypes.init,
        data,
      })).to.equal(data);
    });
    it('should sync the values from sync action to state', () => {
      expect(reducer({
        foo: 0,
        bar: null,
      }, {
        type: actionTypes.sync,
        key: 'foo',
        value: 30,
      })).to.deep.equal({
        foo: 30,
        bar: null,
      });
    });
    it('should return {} on resetSuccess', () => {
      expect(reducer({
        foo: 32,
        bar: 'test',
      }, {
        type: actionTypes.resetSuccess,
      })).to.deep.equal({});
    });
    it('should computer new state from reducers', () => {
      expect(reducer({
        foo: 32,
        bar: 'test',
      }, {
        type: 'counter',
      })).to.deep.equal({
        foo: 33,
        bar: 'test',
      });
      expect(reducer({
        foo: 32,
        bar: 'test',
      }, {
        type: 'memorize',
        value: 'hello world',
      })).to.deep.equal({
        foo: 32,
        bar: 'hello world',
      });
    });
  });
});

describe('getStorageReducer', () => {
  it('should be a function', () => {
    expect(getStorageReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getStorageReducer({ types: actionTypes, reducers: [] })).to.be.a('function');
  });
  describe('storageReducer', () => {
    const foo = (state = 0, { type }) => {
      if (type === 'counter') return state + 1;
      return state;
    };
    const bar = (state = null, { type, value }) => {
      if (type === 'memorize') return value;
      return state;
    }
    const storageKeyReducer = getStorageKeyReducer(actionTypes);
    const statusReducer = getStatusReducer(actionTypes);
    const dataReducer = getDataReducer({
      types: actionTypes,
      reducers: {
        foo,
        bar,
      },
    });
    const reducer = getStorageReducer({
      types: actionTypes,
      reducers: {
        foo,
        bar,
      },
    });
    it('should have combined initial state of its reducers', () => {
      expect(reducer(undefined, {})).to.deep.equal({
        status: statusReducer(undefined, {}),
        data: dataReducer(undefined, {}),
        storageKey: storageKeyReducer(undefined, {}),
      });
    });
  });
});
