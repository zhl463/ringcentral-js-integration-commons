import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

export function getMinimizedReducer(types) {
  return (state = false, { type }) => {
    switch (type) {
      case types.toggleMinimized:
        return !state;
      case types.newSession:
        return false;
      default:
        return state;
    }
  };
}

export function getSessionIdReducer(types) {
  return (state = null, { type, id }) => {
    switch (type) {
      case types.newSession:
        return id;
      case types.destroySession:
        return null;
      default:
        return state;
    }
  };
}

export default function getWebphoneReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    minimized: getMinimizedReducer(types),
    sessionId: getSessionIdReducer(types),
  });
}
