import { combineReducers } from 'redux';
import getModuleStatusReducer from '../getModuleStatusReducer';
import { getCacheKey } from './helpers';

export function getMatchingReducer(actionTypes) {
  return (state = [], { type, sourceName, queries }) => {
    let deleteKeys;
    switch (type) {
      case actionTypes.match:
        return state.concat(queries.map(query => getCacheKey(sourceName, query)));

      case actionTypes.matchSuccess:
      case actionTypes.matchError:
        deleteKeys = queries.map(query => getCacheKey(sourceName, query));
        return state.filter(key => deleteKeys.indexOf(key) === -1);

      case actionTypes.resetSuccess:
        return [];
      default:
        return state;
    }
  };
}

export default function getMatcherReducer(actionTypes, reducers = {}) {
  return combineReducers({
    ...reducers,
    status: getModuleStatusReducer(actionTypes),
    matching: getMatchingReducer(actionTypes),
  });
}
