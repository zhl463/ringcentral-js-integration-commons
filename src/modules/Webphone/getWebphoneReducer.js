import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

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

export function getSessionStatusReducer(types) {
  return (state = connectionStatus.idle, { type }) => {
    switch (type) {
      case types.updateSession:
        return connectionStatus.active;
      case types.destroySession:
        return connectionStatus.idle;
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
      case types.connect:
        return state + 1;
      case types.disconnect:
        return state - 1;
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
    sessionStatus: getSessionStatusReducer(types),
    connectRetryCounts: getConnectRetryCountsReducer(types),
    webphoneCounts: getWebphoneCountsReducer(types),
  });
}
