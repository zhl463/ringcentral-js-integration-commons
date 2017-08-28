import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';
import connectionStatus from './connectionStatus';
import { isRing, isOnHold } from './webphoneHelper';

export function getVideoElementPreparedReducer(types) {
  return (state = false, { type }) => {
    if (type === types.videoElementPrepared) return true;
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

export function getErrorCodeReducer(types) {
  return (state = null, { type, errorCode = state }) => {
    switch (type) {
      case types.connectError:
      case types.registrationFailed:
        return errorCode;
      case types.registered:
        return null;
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

export function getActiveSessionIdReducer(types) {
  return (state = null, { type, sessionId, sessions = [] }) => {
    let onHoldSessions;
    switch (type) {
      case types.callStart:
        return sessionId;
      case types.callEnd:
        if (sessionId !== state) {
          return state;
        }
        onHoldSessions =
          sessions.filter(session => isOnHold(session));
        if (onHoldSessions && onHoldSessions[0]) {
          return onHoldSessions[0].id;
        }
        return null;
      case types.disconnect:
        return null;
      default:
        return state;
    }
  };
}

export function getRingSessionIdReducer(types) {
  return (state = null, { type, sessionId, sessions = [] }) => {
    let ringSessions;
    switch (type) {
      case types.callRing:
        return sessionId;
      case types.callStart:
      case types.callEnd:
        if (sessionId !== state) {
          return state;
        }
        ringSessions =
          sessions.filter(session => isRing(session));
        if (ringSessions && ringSessions[0]) {
          return ringSessions[0].id;
        }
        return null;
      case types.disconnect:
        return null;
      default:
        return state;
    }
  };
}

export function getSessionsReducer(types) {
  return (state = [], { type, sessions }) => {
    switch (type) {
      case types.updateSessions:
        return sessions;
      case types.destroySessions:
        return [];
      default:
        return state;
    }
  };
}

export function getUserMediaReducer(types) {
  return (state = false, { type }) => {
    switch (type) {
      case types.getUserMediaSuccess:
        return true;
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
    errorCode: getErrorCodeReducer(types),
    activeSessionId: getActiveSessionIdReducer(types),
    ringSessionId: getRingSessionIdReducer(types),
    sessions: getSessionsReducer(types),
  });
}
