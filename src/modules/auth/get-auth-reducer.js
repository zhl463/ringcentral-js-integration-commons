import { prefixActions } from '../../lib/redux-helper';
import authActions from './auth-actions';
import authStatus from './auth-status';

export default function getAuthReducer(prefix) {
  const actions = prefixActions(authActions, prefix);
  return (state, action) => {
    if (typeof state === 'undefined') {
      return {
        status: authStatus.pending,
        token: null,
        error: null,
      };
    }
    if (!action) return state;
    switch (action.type) {

      case actions.init:
        return {
          ...state,
          status: action.status,
          token: action.token,
        };

      case actions.login:
        return {
          ...state,
          status: authStatus.loggingIn,
          error: null,
        };

      case actions.logout:
        return {
          ...state,
          status: authStatus.loggingOut,
          error: null,
        };

      case actions.loginSuccess:
        return {
          status: authStatus.loggedIn,
          token: action.token,
          error: null,
        };

      case actions.logoutSuccess:
        return {
          status: authStatus.notLoggedIn,
          token: null,
          error: null,
        };

      case actions.loginError:
        return {
          ...state,
          status: authStatus.notLoggedIn,
          error: action.error,
        };

      case actions.logoutError:
        return {
          ...state,
          status: authStatus.loggedIn,
          error: action.error,
        };

      case actions.refreshSuccess:
        return {
          ...state,
          token: action.token,
        };

      case actions.refreshError:
        return {
          status: authStatus.notLoggedIn,
          token: null,
          error: actions.error,
        };

      default:
        return state;
    }
  };
}
