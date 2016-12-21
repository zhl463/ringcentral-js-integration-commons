import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

export function getChangedReducer(types) {
  return (state = false, { type, environmentChanged }) => {
    if (type === types.setData) return environmentChanged;
    return false;
  };
}

export function getServerReducer({ types, defaultServer }) {
  return (state = defaultServer, { type, server }) => {
    if (type === types.setData) return server;
    return state;
  };
}

export function getEnabledReducer(types) {
  return (state = false, { type, enabled }) => {
    if (type === types.setData) return enabled;
    return state;
  };
}

export default function getEnvironmentReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    changed: getChangedReducer(types),
  });
}
