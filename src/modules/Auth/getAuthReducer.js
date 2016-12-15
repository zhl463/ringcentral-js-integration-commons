import { combineReducers } from 'redux';
import loginStatus from './loginStatus';
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
      case types.tabSync:
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

export default function getAuthReducer(types) {
  return combineReducers({
    status: getStatusReducer(types),
    loginStatus: getLoginStatusReducer(types),
    freshLogin: getFreshLoginReducer(types),
    ownerId: getOwnerIdReducer(types),
  });
}
