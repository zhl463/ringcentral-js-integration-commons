import { combineReducers } from 'redux';
import { prefixEnum } from '../../lib/Enum';
import accountInfoActionTypes from './accountInfoActionTypes';
import accountInfoStatus from './accountInfoStatus';

export function getStatusReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: accountInfoActionTypes, prefix });
  return (state = accountInfoStatus.pending, { type }) => {
    switch (type) {
      case prefixedTypes.fetch:
        return accountInfoStatus.fetching;

      case prefixedTypes.init:
      case prefixedTypes.fetchSuccess:
      case prefixedTypes.fetchError:
        return accountInfoStatus.ready;

      case prefixedTypes.reset:
        return accountInfoStatus.pending;
      default:
        return state;
    }
  };
}

export function getErrorReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: accountInfoActionTypes, prefix });
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
