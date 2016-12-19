import { combineReducers } from 'redux';
import moduleStatus from '../../enums/moduleStatus';

export function getStatusReducer(types) {
  return (state = moduleStatus.pending, { type }) => {
    if (type === types.init) return moduleStatus.ready;
    return state;
  };
}

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
    status: getStatusReducer(types),
    changed: getChangedReducer(types),
  });
}
