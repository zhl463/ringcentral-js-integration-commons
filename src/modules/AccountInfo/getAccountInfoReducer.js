import { combineReducers } from 'redux';
import { prefixEnum } from '../../lib/Enum';
import accountInfoActionTypes from './accountInfoActionTypes';
import accountInfoStatus from './accountInfoStatus';

export function getStatusReducer(prefix) {
  const types = prefixEnum({ enumMap: accountInfoActionTypes, prefix });
  return (state = accountInfoStatus.pending, { type }) => {
    switch (type) {
      case types.fetch:
        return accountInfoStatus.fetching;

      case types.init:
      case types.fetchSuccess:
        return accountInfoStatus.ready;

      case types.fetchError:
        return accountInfoStatus.error;

      case types.reset:
        return accountInfoStatus.pending;
      default:
        return state;
    }
  };
}

export function getErrorReducer(prefix) {
  const types = prefixEnum({ enumMap: accountInfoActionTypes, prefix });
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
