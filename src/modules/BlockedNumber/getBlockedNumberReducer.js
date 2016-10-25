import { combineReducers } from 'redux';
import { prefixEnum } from '../../lib/Enum';
import blockedNumberActionTypes from './blockedNumberActionTypes';
import blockedNumberStatus from './blockedNumberStatus';

export function getStatusReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: blockedNumberActionTypes, prefix });
  return (state = blockedNumberStatus.pending, { type }) => {
    switch (type) {
      case prefixedTypes.fetch:
        return blockedNumberStatus.fetching;

      case prefixedTypes.init:
      case prefixedTypes.fetchSuccess:
      case prefixedTypes.fetchError:
        return blockedNumberStatus.ready;

      case prefixedTypes.reset:
        return blockedNumberStatus.pending;
      default:
        return state;
    }
  };
}

export function getErrorReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: blockedNumberActionTypes, prefix });
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
