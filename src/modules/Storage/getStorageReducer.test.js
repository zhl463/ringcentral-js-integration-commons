import { expect } from 'chai';
import getStorageReducer, {
  getDataReducer,
  getStorageKeyReducer,
  getStatusReducer,
} from './getStorageReducer';

import storageActionTypes from './storageActionTypes';
import storageStatus from './storageStatus';

describe('getStatusReducer', () => {
  it('should be a function', () => {
    expect(getStatusReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getStatusReducer()).to.be.a('function');
  });
  describe('statusReducer', () => {
    const reducer = getStatusReducer();
    it('should have initial state of pending', () => {
      expect(reducer(undefined, {})).to.equal(storageStatus.pending);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return ready status on init', () => {
      [
        storageActionTypes.init,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(storageStatus.ready);
      });
    });
    it('should return pending status on reset', () => {
      [
        storageActionTypes.reset,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(storageStatus.pending);
      });
    });
  });
});

describe('getDataReducer', () => {
  it('should be a function', () => {
    expect(getDataReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getDataReducer()).to.be.a('function');
  });
  describe('dataReducer', () => {
    const reducer = getDataReducer();
    it('should have initial state of {}', () => {
      expect(reducer(undefined, {})).to.deep.equal({});
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return action.data on init and load action types', () => {
      const data = {};
      [
        storageActionTypes.init,
        storageActionTypes.load,
      ].forEach(type => {
        expect(reducer(null, {
          type,
          data,
        })).to.equal(data);
      });
    });
    it('should return {} on reset', () => {
      expect(reducer('foo', {
        type: storageActionTypes.reset,
      })).to.deep.equal({});
    });
    it('should add key value pairs on set action type', () => {
      expect(reducer({}, {
        type: storageActionTypes.set,
        key: 'foo',
        value: 'bar',
      })).to.deep.equal({
        foo: 'bar',
      });
    });
    it('should overwrite key value pairs on set action type', () => {
      expect(reducer({ foo: 'baz' }, {
        type: storageActionTypes.set,
        key: 'foo',
        value: 'bar',
      })).to.deep.equal({
        foo: 'bar',
      });
    });
    it('should remove keys on remove action type', () => {
      expect(reducer({ foo: 'bar' }, {
        type: storageActionTypes.remove,
        key: 'foo',
      })).to.deep.equal({});
    });
  });
});

describe('getStorageKeyReducer', () => {
  it('should be a function', () => {
    expect(getStorageKeyReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getStorageKeyReducer()).to.be.a('function');
  });
  describe('storageKeyReducer', () => {
    const reducer = getStorageKeyReducer();
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return action.storageKey on init', () => {
      expect(reducer(null, {
        type: storageActionTypes.init,
        storageKey: 'foo',
      })).to.equal('foo');
    });
    it('should return null on reset', () => {
      expect(reducer('foo', {
        type: storageActionTypes.reset,
      })).to.be.null;
    });
  });
});


describe('getStorageReducer', () => {
  it('should be a function', () => {
    expect(getStorageReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getStorageReducer()).to.be.a('function');
  });
  describe('subscriptionReducer', () => {
    const reducer = getStorageReducer();
    const dataReducer = getDataReducer();
    const statusReducer = getStatusReducer();
    const storageKeyReducer = getStorageKeyReducer();
    it('should return combined state', () => {
      expect(reducer(undefined, {}))
        .to.deep.equal({
          data: dataReducer(undefined, {}),
          status: statusReducer(undefined, {}),
          storageKey: storageKeyReducer(undefined, {}),
        });
    });
  });
});
