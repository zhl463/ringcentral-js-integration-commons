import { combineReducers } from 'redux';
import { prefixEnum } from '../../lib/Enum';
import extensionInfoActionTypes from './extensionInfoActionTypes';
import extensionInfoStatus from './extensionInfoStatus';

export function getStatusReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: extensionInfoActionTypes, prefix });
  return (state = extensionInfoStatus.pending, { type }) => {
    switch (type) {
      case prefixedTypes.fetch:
        return extensionInfoStatus.fetching;

      case prefixedTypes.init:
      case prefixedTypes.fetchSuccess:
      case prefixedTypes.fetchError:
        return extensionInfoStatus.ready;

      case prefixedTypes.reset:
        return extensionInfoStatus.pending;
      default:
        return state;
    }
  };
}

export function getErrorReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: extensionInfoActionTypes, prefix });
  return (state = null, { type, error }) => {
    switch (type) {
      case prefixedTypes.init:
      case prefixedTypes.fetch:
      case prefixedTypes.fetchSuccess:
      case prefixedTypes.reset:
        return null;

      case prefixedTypes.fetchError:
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
