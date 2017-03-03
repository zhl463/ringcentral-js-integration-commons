import { expect } from 'chai';
import getCacheReducer, {
  getMatchRecordReducer,
  getDataMapReducer,
} from './getCacheReducer';

import actionTypes from './actionTypesBase';

import { matchResult } from './helpers';

describe('getMatchRecordReducer', () => {
  it('should be a function', () => {
    expect(getMatchRecordReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getMatchRecordReducer()).to.be.a('function');
  });

  describe('matchRecordReducer', () => {
    const reducer = getMatchRecordReducer(actionTypes);

    it('should have initial state of empty object', () => {
      expect(reducer(undefined, {})).to.be.deep.equal({});
    });

    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });

    it(`should return matchRecord with cache key and result is found
        when type is matchSuccess and data is found`, () => {
      const originalState = {};
      const data = {
        test: [1],
      };
      const sourceName = 'name';
      const result = reducer(originalState, {
        type: actionTypes.matchSuccess,
        data,
        sourceName,
      });
      expect(result).to.include.keys('["name","test"]');
      expect(result['["name","test"]'].result).to.equal(matchResult.found);
    });

    it(`should return matchRecord with cache key and result is unfound
        when type is matchSuccess and data is unfound`, () => {
      const originalState = {};
      const data = {
        test: [],
      };
      const sourceName = 'name';
      const result = reducer(originalState, {
        type: actionTypes.matchSuccess,
        data,
        sourceName,
      });
      expect(result).to.include.keys('["name","test"]');
      expect(result['["name","test"]'].result).to.equal(matchResult.notFound);
    });

    it(`should return state without key that included in expiredKeys
        when type is cleanUp or initSuccess`, () => {
      [
        actionTypes.cleanUp,
        actionTypes.initSuccess,
      ].forEach((type) => {
        const originalState = {
          key1: 'test',
          key2: 'test2',
        };
        const expiredKeys = ['key2'];
        expect(reducer(originalState, {
          type,
          expiredKeys,
        })).to.deep.equal({ key1: 'test' });
      });
    });

    it(`should return originalState if expiredKeys length is zero
        when type is cleanUp or initSuccess`, () => {
      [
        actionTypes.cleanUp,
        actionTypes.initSuccess,
      ].forEach((type) => {
        const originalState = {
          key1: 'test',
          key2: 'test2',
        };
        const expiredKeys = [];
        expect(reducer(originalState, {
          type,
          expiredKeys,
        })).to.deep.equal(originalState);
      });
    });
  });
});

describe('getDataMapReducer', () => {
  it('should be a function', () => {
    expect(getDataMapReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getDataMapReducer()).to.be.a('function');
  });

  describe('dataMapReducer', () => {
    const reducer = getDataMapReducer(actionTypes);

    it('should have initial state of empty object', () => {
      expect(reducer(undefined, {})).to.be.deep.equal({});
    });

    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });

    it('should return new state with query data when type is matchSuccess', () => {
      const originalState = {};
      const data = {
        test: [{ key: 1 }],
      };
      const sourceName = 'name';
      const expectState = {
        test: [{
          key: 1,
          source: 'name',
        }]
      };
      const result = reducer(originalState, {
        type: actionTypes.matchSuccess,
        data,
        sourceName,
      });
      expect(result).to.deep.equal(expectState);
    });

    it('should return state with query data concated old data when type is matchSuccess', () => {
      const originalState = {
        test: [{
          key: 2,
          source: 'name1',
        }]
      };
      const data = {
        test: [{ key: 1 }],
      };
      const sourceName = 'name';
      const expectState = {
        test: [{
          key: 2,
          source: 'name1',
        }, {
          key: 1,
          source: 'name',
        }]
      };
      const result = reducer(originalState, {
        type: actionTypes.matchSuccess,
        data,
        sourceName,
      });
      expect(result).to.deep.equal(expectState);
    });

    it(`should return originalState
        if expiredKeys length is zero when type is cleanUp or initSuccess`, () => {
      [
        actionTypes.cleanUp,
        actionTypes.initSuccess,
      ].forEach((type) => {
        const originalState = {
          key1: 'test',
          key2: 'test2',
        };
        const expiredKeys = [];
        expect(reducer(originalState, {
          type,
          expiredKeys,
        })).to.deep.equal(originalState);
      });
    });

    it(`should return state without key that included in expiredKeys
        when type is cleanUp or initSuccess`, () => {
      [
        actionTypes.cleanUp,
        actionTypes.initSuccess,
      ].forEach((type) => {
        const originalState = {
          test: [{
            key: 2,
            source: 'name1',
          }],
          test2: [{
            key: 2,
            source: 'name',
          }],
        };
        const expiredKeys = ['["name","test2"]'];
        expect(reducer(originalState, {
          type,
          expiredKeys,
        })).to.deep.equal({
          test: [{
            key: 2,
            source: 'name1',
          }]
        });
      });
    });
  });
});

describe('getCacheReducer', () => {
  it('should be a function', () => {
    expect(getCacheReducer).to.be.a('function');
  });

  it('should return a reducer', () => {
    expect(getCacheReducer(actionTypes)).to.be.a('function');
  });

  it('should return a combined reducer', () => {
    const reducer = getCacheReducer(actionTypes);
    const dataMapReducer = getDataMapReducer(actionTypes);
    const matchRecordReducer = getMatchRecordReducer(actionTypes);
    expect(reducer(undefined, {})).to.deep.equal({
      dataMap: dataMapReducer(undefined, {}),
      matchRecord: matchRecordReducer(undefined, {}),
    });
  });
});
