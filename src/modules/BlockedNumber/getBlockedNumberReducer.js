import { prefixActions } from '../../lib/ActionMap';
import blockedNumberActions from './blockedNumberActions';
import blockedNumberStatus from './blockedNumberStatus';

export default function getBlockedNumberReducer(prefix) {
  const actions = prefixActions({ actions: blockedNumberActions, prefix });
  return (state, action) => {
    if (!state) {
      return {
        status: blockedNumberStatus.pending,
        error: null,
      };
    }
    if (!action) {
      return state;
    }
    switch (action.type) {
      case actions.ready:
        return {
          status: blockedNumberStatus.ready,
          error: null,
        };
      case actions.fetch:
        return {
          status: blockedNumberStatus.fetching,
          error: null,
        };
      case actions.fetchSuccess:
        return {
          status: blockedNumberStatus.ready,
          error: null,
        };
      case actions.fetchError:
        return {
          status: blockedNumberStatus.ready,
          error: action.error,
        };
      case actions.reset:
        return {
          status: blockedNumberStatus.pending,
          error: null,
        };
      default:
        return state;
    }
  };
}
