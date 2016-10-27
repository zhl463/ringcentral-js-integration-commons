import { combineReducers } from 'redux';
import { prefixEnum } from '../../lib/Enum';
import blockedNumberActionTypes from './blockedNumberActionTypes';
import blockedNumberStatus from './blockedNumberStatus';

export function getStatusReducer(prefix) {
  const types = prefixEnum({ enumMap: blockedNumberActionTypes, prefix });
  return (state = blockedNumberStatus.pending, { type }) => {
    switch (type) {
      case types.fetch:
        return blockedNumberStatus.fetching;

      case types.init:
      case types.fetchSuccess:
        return blockedNumberStatus.ready;

      case types.fetchError:
        return blockedNumberStatus.error;

      case types.reset:
        return blockedNumberStatus.pending;
      default:
        return state;
    }
  };
}

export function getErrorReducer(prefix) {
  const types = prefixEnum({ enumMap: blockedNumberActionTypes, prefix });
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
