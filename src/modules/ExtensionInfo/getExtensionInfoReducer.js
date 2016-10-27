import { combineReducers } from 'redux';
import { prefixEnum } from '../../lib/Enum';
import extensionInfoActionTypes from './extensionInfoActionTypes';
import extensionInfoStatus from './extensionInfoStatus';

export function getStatusReducer(prefix) {
  const types = prefixEnum({ enumMap: extensionInfoActionTypes, prefix });
  return (state = extensionInfoStatus.pending, { type }) => {
    switch (type) {
      case types.fetch:
        return extensionInfoStatus.fetching;

      case types.init:
      case types.fetchSuccess:
        return extensionInfoStatus.ready;

      case types.fetchError:
        return extensionInfoStatus.error;

      case types.reset:
        return extensionInfoStatus.pending;
      default:
        return state;
    }
  };
}

export function getErrorReducer(prefix) {
  const types = prefixEnum({ enumMap: extensionInfoActionTypes, prefix });
  return (state = null, { type, error }) => {
    switch (type) {
      case types.init:
      case types.fetch:
      case types.fetchSuccess:
      case types.reset:
        return null;

      case types.fetchError:
        return error;

      default:
        return state;
    }
  };
}

export default function getAccountInfoReducer(prefix) {
  return combineReducers({
    status: getStatusReducer(prefix),
    error: getErrorReducer(prefix),
  });
}
