import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';
import contactSearchStatus from './contactSearchStatus';

export function getContactSearchStatusReducer(types) {
  return (state = contactSearchStatus.idle, { type }) => {
    switch (type) {
      case types.search:
        return contactSearchStatus.searching;

      case types.prepareSearch:
      case types.searchSuccess:
      case types.searchError:
        return contactSearchStatus.idle;

      default:
        return state;
    }
  };
}

export function getSearchingReducer(types) {
  const initialState = {
    searchOnSources: [],
    searchString: '',
    result: [],
  };
  return (state = initialState, {
    type,
    searchOnSources,
    searchString,
    entities,
  }) => {
    switch (type) {
      case types.searchSuccess:
        if (
          state.searchString === searchString &&
          state.searchOnSources.join(',') === searchOnSources.join(',')
        ) {
          return {
            ...state,
            result: state.result.concat(entities)
          };
        }
        return {
          searchOnSources,
          searchString,
          result: entities
        };
      case types.prepareSearch:
      case types.reset:
      case types.searchError:
        return initialState;
      case types.search:
      default:
        return state;
    }
  };
}

export function getSearchCriteriaReducer(types) {
  const initialState = {
    sourceName: '',
    searchText: '',
    pageNumber: 1
  };
  return (state = initialState, { type, sourceName, searchText, pageNumber }) => {
    switch (type) {
      case types.updateSearchCriteria:
        if (
          state.sourceName !== sourceName ||
          state.searchText !== searchText ||
          state.pageNumber !== pageNumber
        ) {
          return {
            sourceName,
            searchText,
            pageNumber,
          };
        }
        return state;
      default:
        return state;
    }
  };
}

export default function getContactSearchReducer(types, reducers = {}) {
  return combineReducers({
    ...reducers,
    status: getModuleStatusReducer(types),
    searchStatus: getContactSearchStatusReducer(types),
    searching: getSearchingReducer(types),
    searchCriteria: getSearchCriteriaReducer(types),
  });
}
