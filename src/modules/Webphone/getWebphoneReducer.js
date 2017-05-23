import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

import { normalizeSession } from './webphoneHelper';
import connectionStatus from './connectionStatus';

export function getVideoElementPreparedReducer(types) {
  return (state = false, { type, videoElementPrepared = state }) => {
    if (type === types.init) return videoElementPrepared;
    return state;
  };
}

export function getConnectionStatusReducer(types) {
  return (state = connectionStatus.disconnected, { type }) => {
    switch (type) {
      case types.connect:
      case types.reconnect:
        return connectionStatus.connecting;
      case types.registered:
        return connectionStatus.connected;
      case types.unregistered:
        return connectionStatus.disconnected;
      case types.disconnect:
        return connectionStatus.disconnecting;
      case types.connectError:
      case types.registrationFailed:
        return connectionStatus.connectFailed;
      default:
        return state;
    }
  };
}

export function getConnectRetryCountsReducer(types) {
  return (state = 0, { type }) => {
    switch (type) {
      case types.reconnect:
        return state + 1;
      case types.resetRetryCounts:
      case types.registered:
        return 0;
      default:
        return state;
    }
  };
}

export function getWebphoneCountsReducer(types) {
  return (state = 0, { type }) => {
    switch (type) {
      case types.reconnect:
      case types.connect:
        return state + 1;
      case types.connectError:
      case types.disconnect:
      case types.registrationFailed:
        return state - 1;
      default:
        return state;
    }
  };
}

export function getCurrentSessionReducer(types) {
  return (state = null, { type, session }) => {
    switch (type) {
      case types.updateCurrentSession:
        return normalizeSession(session);
      case types.destroyCurrentSession:
        return null;
      default:
        return state;
    }
  };
}

export function getSessionsReducer(types) {
  return (state = [], { type, sessions }) => {
    const newSessions = [];
    switch (type) {
      case types.updateSessions:
        sessions.forEach((session) => {
          newSessions.push(normalizeSession(session));
        });
        return newSessions;
      case types.destroySessions:
        return [];
      default:
        return state;
    }
  };
}

export function getMinimizedReducer(types) {
  return (state = false, { type }) => {
    switch (type) {
      case types.toggleMinimized:
        return !state;
      case types.resetMinimized:
        return false;
      default:
        return state;
    }
  };
}

export default function getWebphoneReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    videoElementPrepared: getVideoElementPreparedReducer(types),
    connectionStatus: getConnectionStatusReducer(types),
    connectRetryCounts: getConnectRetryCountsReducer(types),
    webphoneCounts: getWebphoneCountsReducer(types),
    currentSession: getCurrentSessionReducer(types),
    sessions: getSessionsReducer(types),
    minimized: getMinimizedReducer(types),
  });
}
