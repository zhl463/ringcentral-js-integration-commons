import { combineReducers } from 'redux';
import { prefixEnum } from '../../lib/Enum';
import forwardingNumberActionTypes from './forwardingNumberActionTypes';
import forwardingNumberStatus from './forwardingNumberStatus';

export function getStatusReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: forwardingNumberActionTypes, prefix });
  return (state = forwardingNumberStatus.pending, { type }) => {
    switch (type) {
      case prefixedTypes.fetch:
        return forwardingNumberStatus.fetching;

      case prefixedTypes.init:
      case prefixedTypes.fetchSuccess:
      case prefixedTypes.fetchError:
        return forwardingNumberStatus.ready;

      case prefixedTypes.reset:
        return forwardingNumberStatus.pending;
      default:
        return state;
    }
  };
}

export function getErrorReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: forwardingNumberActionTypes, prefix });
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
