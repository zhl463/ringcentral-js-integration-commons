import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';
import callStatus from './callStatus';

export function getCallStatusReducer(types) {
  return (state = callStatus.idle, { type }) => {
    switch (type) {
      case types.connect:
        return callStatus.connecting;

      case types.connectSuccess:
      case types.connectError:
        return callStatus.idle;

      default:
        return state;
    }
  };
}

export function getToNumberReducer(types) {
  return (state = '', { type, data }) => {
    switch (type) {
      case types.toNumberChanged:
        return data;
      case types.connectError:
        return state;
      case types.connectSuccess:
        return '';
      default:
        return state;
    }
  };
}

export function getLastCallNumberReducer(types) {
  return (state = null, { type, number }) => {
    switch (type) {
      case types.connect:
        return number;
      default:
        return state;
    }
  };
}

export default function getCallReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    callStatus: getCallStatusReducer(types),
    toNumber: getToNumberReducer(types),
  });
}
