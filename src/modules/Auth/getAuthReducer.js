import { combineReducers } from 'redux';
import authStatus from './authStatus';
import moduleStatus from '../../enums/moduleStatus';

export function getStatusReducer(types) {
  return (state = moduleStatus.pending, { type }) => {
    switch (type) {
      case types.init:
        return moduleStatus.initializing;
      case types.initSuccess:
        return moduleStatus.ready;
      default:
        return state;
    }
  };
}

export function getAuthStatusReducer(types) {
  return (state = null, { type, loggedIn, refreshTokenValid }) => {
    switch (type) {
      case types.login:
        return authStatus.loggingIn;

      case types.loginSuccess:
      case types.refreshSuccess:
      case types.cancelLogout:
        return authStatus.loggedIn;

      case types.loginError:
      case types.logoutSuccess:
      case types.logoutError:
        return authStatus.notLoggedIn;

      case types.refreshError:
        return refreshTokenValid ? state : authStatus.notLoggedIn;

      case types.logout:
        return authStatus.loggingOut;

      case types.beforeLogout:
        return authStatus.beforeLogout;

      case types.initSuccess:
        return loggedIn ? authStatus.loggedIn : authStatus.notLoggedIn;

      default:
        return state;
    }
  };
}

export function getOwnerIdReducer(types) {
  return (state = null, { type, token }) => {
    switch (type) {

      case types.loginSuccess:
      case types.refreshSuccess:
        return token.owner_id;

      case types.loginError:
      case types.logoutSuccess:
      case types.logoutError:
      case types.refreshError:
        return null;

      case types.initSuccess:
        return (token && token.owner_id) || null;

      default:
        return state;
    }
  };
}

export function getFreshLoginReducer(types) {
  return (state = null, { type, loggedIn }) => {
    switch (type) {

      case types.initSuccess:
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

export default function getAuthReducer(types) {
  return combineReducers({
    status: getStatusReducer(types),
    authStatus: getAuthStatusReducer(types),
    freshLogin: getFreshLoginReducer(types),
    ownerId: getOwnerIdReducer(types),
  });
}
