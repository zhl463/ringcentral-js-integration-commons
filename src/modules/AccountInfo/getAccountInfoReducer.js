import { prefixActions } from '../../lib/ActionMap';
import accountInfoActions from './accountInfoActions';
import accountInfoStatus from './accountInfoStatus';

export default function getAccountInfoReducer(prefix) {
  const actions = prefixActions({ actions: accountInfoActions, prefix });
  return (state, action) => {
    if (!state) {
      return {
        status: accountInfoStatus.pending,
        error: null,
      };
    }
    if (!action) {
      return state;
    }
    switch (action.type) {
      case actions.ready:
        return {
          status: accountInfoStatus.ready,
          error: null,
        };
      case actions.fetch:
        return {
          status: accountInfoStatus.fetching,
          error: null,
        };
      case actions.fetchSuccess:
        return {
          status: accountInfoStatus.ready,
          error: null,
        };
      case actions.fetchError:
        return {
          status: accountInfoStatus.ready,
          error: action.error,
        };
      case actions.reset:
        return {
          status: accountInfoStatus.pending,
          error: null,
        };
      default:
        return state;
    }
  };
}
