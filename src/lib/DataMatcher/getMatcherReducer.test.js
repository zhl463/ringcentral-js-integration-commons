import { expect } from 'chai';
import getMatcherReducer, {
  getMatchingReducer,
} from './getMatcherReducer';
import getModuleStatusReducer from '../getModuleStatusReducer';

import actionTypes from './actionTypesBase';

describe('getMatchingReducer', () => {
  it('should be a function', () => {
    expect(getMatchingReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getMatchingReducer()).to.be.a('function');
  });

  describe('matchingReducer', () => {
    const reducer = getMatchingReducer(actionTypes);

    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.deep.equal([]);
    });

    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
      .to.equal(originalState);
    });

    it('should return state that concat with cachekey array when type is match', () => {
      [
        actionTypes.match,
      ].forEach((type) => {
        const originalState = ['123'];
        const sourceName = 'name';
        const queries = ['1234', '123'];
        expect(reducer(originalState, {
          type,
          sourceName,
          queries,
        })).to.deep.equal(['123', '["name","1234"]', '["name","123"]']);
      });
    });

    it(`should return state that do not include queries
        when type is matchError or matchSuccess`, () => {
      [
        actionTypes.matchSuccess,
        actionTypes.matchError,
      ].forEach((type) => {
        const originalState = ['["name","1234"]', '["name","123"]'];
        const sourceName = 'name';
        const queries = ['1234'];
        expect(reducer(originalState, {
          type,
          sourceName,
          queries,
        })).to.deep.equal(['["name","123"]']);
      });
    });

    it('should return empty array when type is resetSuccess', () => {
      const originalState = [123];
      expect(reducer(originalState, { type: actionTypes.resetSuccess }))
        .to.deep.equal([]);
    });
  });
});

describe('getMatcherReducer', () => {
  it('should be a function', () => {
    expect(getMatcherReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getMatcherReducer(actionTypes)).to.be.a('function');
  });
  it('should return a combined reducer', () => {
    const reducer = getMatcherReducer(actionTypes);
    const statusReducer = getModuleStatusReducer(actionTypes);
    const matchingReducer = getMatchingReducer(actionTypes);
    expect(reducer(undefined, {})).to.deep.equal({
      status: statusReducer(undefined, {}),
      matching: matchingReducer(undefined, {}),
    });
  });
});
