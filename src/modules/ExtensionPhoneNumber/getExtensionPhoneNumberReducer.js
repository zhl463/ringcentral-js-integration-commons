import { combineReducers } from 'redux';
import { prefixEnum } from '../../lib/Enum';
import extensionPhoneNumberActionTypes from './extensionPhoneNumberActionTypes';
import extensionPhoneNumberStatus from './extensionPhoneNumberStatus';

export function getStatusReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: extensionPhoneNumberActionTypes, prefix });
  return (state = extensionPhoneNumberStatus.pending, { type }) => {
    switch (type) {
      case prefixedTypes.fetch:
        return extensionPhoneNumberStatus.fetching;

      case prefixedTypes.init:
      case prefixedTypes.fetchSuccess:
        return extensionPhoneNumberStatus.ready;

      case prefixedTypes.fetchError:
        return extensionPhoneNumberStatus.error;

      case prefixedTypes.reset:
        return extensionPhoneNumberStatus.pending;
      default:
        return state;
    }
  };
}

export function getErrorReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: extensionPhoneNumberActionTypes, prefix });
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
