import { combineReducers } from 'redux';
import loginStatus from './loginStatus';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

export function getLoginStatusReducer(types) {
  return (state = null, { type, loggedIn, refreshTokenValid }) => {
    switch (type) {
      case types.login:
        return loginStatus.loggingIn;

      case types.loginSuccess:
      case types.refreshSuccess:
      case types.cancelLogout:
        return loginStatus.loggedIn;

      case types.loginError:
      case types.logoutSuccess:
      case types.logoutError:
        return loginStatus.notLoggedIn;

      case types.refreshError:
        return refreshTokenValid ? state : loginStatus.notLoggedIn;

      case types.logout:
        return loginStatus.loggingOut;

      case types.beforeLogout:
        return loginStatus.beforeLogout;

      case types.initSuccess:
      case types.tabSync:
        return loggedIn ? loginStatus.loggedIn : loginStatus.notLoggedIn;

      default:
        return state;
    }
  };
}

export function getOwnerIdReducer(types) {
  return (state = null, { type, token, refreshTokenValid }) => {
    switch (type) {

      case types.loginSuccess:
      case types.refreshSuccess:
        return token.owner_id;

      case types.loginError:
      case types.logoutSuccess:
      case types.logoutError:
        return null;

      case types.refreshError:
        return refreshTokenValid ? state : null;

      case types.initSuccess:
      case types.tabSync:
        return (token && token.owner_id) || null;

      default:
        return state;
    }
  };
}

export function getEndpointIdReducer(types) {
  return (state = null, { type, token, refreshTokenValid }) => {
    switch (type) {

      case types.loginSuccess:
      case types.refreshSuccess:
        return token.endpoint_id;

      case types.loginError:
      case types.logoutSuccess:
      case types.logoutError:
        return null;

      case types.refreshError:
        return refreshTokenValid ? state : null;

      case types.initSuccess:
      case types.tabSync:
        return (token && token.endpoint_id) || null;

      default:
        return state;
    }
  };
}

export function getFreshLoginReducer(types) {
  return (state = null, { type, loggedIn }) => {
    switch (type) {

      case types.initSuccess:
      case types.tabSync:
        return loggedIn ? false : null;

      case types.login:
        return true;

      case types.loginError:
      case types.refreshError:
      case types.logoutSuccess:
      case types.logoutError:
        return null;

      default:
        return state;
    }
  };
}

export function getProxyLoadedReducer(types) {
  return (state = false, { type }) => {
    switch (type) {
      case types.proxyLoaded:
        return true;
      case types.proxyCleared:
        return false;
      default:
        return state;
    }
  };
}

export function getProxyRetryCountReducer(types) {
  return (state = 0, { type }) => {
    switch (type) {
      case types.proxySetup:
      case types.proxyCleared:
      case types.proxyLoaded:
        return 0;
      case types.proxyRetry:
        return state + 1;
      default:
        return state;
    }
  };
}

export default function getAuthReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    loginStatus: getLoginStatusReducer(types),
    freshLogin: getFreshLoginReducer(types),
    ownerId: getOwnerIdReducer(types),
    endpointId: getEndpointIdReducer(types),
    proxyLoaded: getProxyLoadedReducer(types),
    proxyRetryCount: getProxyRetryCountReducer(types),
  });
}
