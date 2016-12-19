import { combineReducers } from 'redux';
import moduleStatus from '../../enums/moduleStatus';


export function getStatusReducer(types) {
  return (state = moduleStatus.pending, { type }) => {
    switch (type) {

      case types.init:
        return moduleStatus.initializing;

      case types.initSuccess:
        return moduleStatus.ready;

      case types.reset:
        return moduleStatus.pending;

      default:
        return state;
    }
  };
}

export function getInfoReducer(types) {
  return (state = {}, { type, info }) => {
    if (type === types.fetchSuccess) return info;
    return state;
  };
}

export function getTimestampReducer(types) {
  return (state = null, { type, timestamp }) => {
    if (type === types.fetchSuccess) return timestamp;
    return state;
  };
}

export default function getAccountInfoReducer(types) {
  return combineReducers({
    status: getStatusReducer(types),
  });
}
