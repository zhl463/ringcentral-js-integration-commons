import { combineReducers } from 'redux';
import moduleStatus from '../../enums/moduleStatus';

export function getEventReducer(types) {
  return (state = null, { type, event, args }) => {
    if (type === types.event) {
      return {
        name: event,
        args,
      };
    }
    return null;
  };
}

export function getStatusReducer(types) {
  return (state = moduleStatus.pending, { type }) => {
    switch (type) {
      case types.init:
        return moduleStatus.ready;
      default:
        return state;
    }
  };
}
export function getActiveReducer(types) {
  return (state = false, { type, active }) => {
    switch (type) {
      case types.init:
      case types.mainTabIdChanged:
        return active;
      default:
        return state;
    }
  };
}

export default function getTabManagerReducer(types) {
  return combineReducers({
    status: getStatusReducer(types),
    active: getActiveReducer(types),
    event: getEventReducer(types),
  });
}
