import { combineReducers } from 'redux';
import { prefixEnum } from '../../lib/Enum';
import authActionTypes from './authActionTypes';
import authStatus from './authStatus';

export function getStatusReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: authActionTypes, prefix });
  return (state = authStatus.pending, { type, loggedIn }) => {
    switch (type) {
      case prefixedTypes.login:
        return authStatus.loggingIn;

      case prefixedTypes.loginSuccess:
      case prefixedTypes.refreshSuccess:
      case prefixedTypes.cancelLogout:
        return authStatus.loggedIn;

      case prefixedTypes.loginError:
      case prefixedTypes.logoutSuccess:
      case prefixedTypes.logoutError:
      case prefixedTypes.refreshError:
        return authStatus.notLoggedIn;

      case prefixedTypes.logout:
        return authStatus.loggingOut;

      case prefixedTypes.beforeLogout:
        return authStatus.beforeLogout;

      case prefixedTypes.init:
        return loggedIn ? authStatus.loggedIn : authStatus.notLoggedIn;

      case prefixedTypes.refresh:
      default:
        return state;
    }
  };
}

export function getErrorReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: authActionTypes, prefix });
  return (state = null, { type, error = null }) => {
    switch (type) {
      case prefixedTypes.loginError:
      case prefixedTypes.logoutError:
      case prefixedTypes.refreshError:
      case prefixedTypes.cancelLogout:
        return error;
      case prefixedTypes.login:
      case prefixedTypes.loginSuccess:
      case prefixedTypes.logout:
      case prefixedTypes.logoutSuccess:
      case prefixedTypes.refresh:
      case prefixedTypes.refreshSuccess:
      case prefixedTypes.beforeLogout:
      case prefixedTypes.init:
        return null;
      default:
        return state;
    }
  };
}

export function getOwnerIdReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: authActionTypes, prefix });
  return (state = null, { type, token }) => {
    switch (type) {

      case prefixedTypes.loginSuccess:
      case prefixedTypes.refreshSuccess:
        return token.owner_id;

      case authActionTypes.loginError:
      case authActionTypes.logoutSuccess:
      case authActionTypes.logoutError:
      case authActionTypes.refreshError:
        return null;

      case prefixedTypes.init:
        return token && token.owner_id || null;

      default:
        return state;
    }
  };
}

export function getFreshLoginReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: authActionTypes, prefix });
  return (state = null, { type, loggedIn }) => {
    switch (type) {

      case prefixedTypes.init:
        return loggedIn ? false : null;

      case prefixedTypes.login:
        return true;

      case prefixedTypes.loginError:
      case prefixedTypes.refreshError:
      case prefixedTypes.logoutSuccess:
      case prefixedTypes.logoutError:
        return null;

      case prefixedTypes.cancelLogout:
      case prefixedTypes.loginSuccess:
      case prefixedTypes.logout:
      case prefixedTypes.refresh:
      case prefixedTypes.refreshSuccess:
      case prefixedTypes.beforeLogout:
      default:
        return state;
    }
  };
}

export default function getAuthReducer(prefix) {
  return combineReducers({
    status: getStatusReducer(prefix),
    freshLogin: getFreshLoginReducer(prefix),
    error: getErrorReducer(prefix),
    ownerId: getOwnerIdReducer(prefix),
  });
}
