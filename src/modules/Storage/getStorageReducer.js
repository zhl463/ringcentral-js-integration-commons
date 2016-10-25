import { combineReducers } from 'redux';
import { prefixEnum } from '../../lib/Enum';
import storageActionTypes from './storageActionTypes';
import storageStatus from './storageStatus';

export function getDataReducer(prefix) {
  const types = prefixEnum({ enumMap: storageActionTypes, prefix });
  return (state = {}, { type, data, key, value }) => {
    let result;
    switch (type) {

      case types.init:
        return data;

      case types.set:
        return {
          ...state,
          [key]: value,
        };

      case types.remove:
        result = { ...state };
        delete result[key];
        return result;

      case types.load:
        return data;

      case types.reset:
        return {};

      default:
        return state;
    }
  };
}

export function getStorageKeyReducer(prefix) {
  const types = prefixEnum({ enumMap: storageActionTypes, prefix });
  return (state = null, { type, storageKey }) => {
    switch (type) {

      case types.init:
        return storageKey;

      case types.reset:
        return null;

      default:
        return state;
    }
  };
}

export function getStatusReducer(prefix) {
  const types = prefixEnum({ enumMap: storageActionTypes, prefix });
  return (state = storageStatus.pending, { type }) => {
    switch (type) {

      case types.init:
        return storageStatus.ready;

      case types.reset:
        return storageStatus.pending;

      default:
        return state;
    }
  };
}

export default function getStorageReducer(prefix) {
  return combineReducers({
    data: getDataReducer(prefix),
    storageKey: getStorageKeyReducer(prefix),
    status: getStatusReducer(prefix),
  });
}
