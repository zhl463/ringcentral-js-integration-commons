import { prefixActions } from '../../lib/redux-helper';
import authActions from './auth-actions';
import loginStatus from './login-status';

const initialState = {
  status: loginStatus.pending,
  token: null,
  error: null,
};

export default function getAuthReducer(prefix) {
  const actions = prefixActions(authActions, prefix);
  return (state, action) => {
    if (typeof state === 'undefined') return Object.assign({}, initialState);
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
          status: loginStatus.loggingIn,
          error: null,
        };

      case actions.logout:
        return {
          ...state,
          status: loginStatus.loggingOut,
          error: null,
        };

      case actions.loginSuccess:
        return {
          status: loginStatus.loggedIn,
          token: action.token,
          error: null,
        };

      case actions.logoutSuccess:
        return {
          status: loginStatus.notLoggedIn,
          token: null,
          error: null,
        };

      case actions.loginError:
        return {
          ...state,
          status: loginStatus.notLoggedIn,
          error: action.error,
        };

      case actions.logoutError:
        return {
          ...state,
          status: loginStatus.loggedIn,
          error: action.error,
        };

      case actions.refreshSuccess:
        return {
          ...state,
          token: action.token,
        };

      case actions.refreshError:
        return {
          status: loginStatus.notLoggedIn,
          token: null,
          error: actions.error,
        };

      default:
        return state;
    }
  };
}
