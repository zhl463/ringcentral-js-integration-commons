import { prefixActions } from '../../lib/ActionMap';
import forwardingNumberActions from './forwardingNumberActions';
import forwardingNumberStatus from './forwardingNumberStatus';

export default function getForwardingNumberReducer(prefix) {
  const actions = prefixActions({ actions: forwardingNumberActions, prefix });
  return (state, action) => {
    if (!state) {
      return {
        status: forwardingNumberStatus.pending,
        error: null,
      };
    }
    if (!action) {
      return state;
    }
    switch (action.type) {
      case actions.ready:
        return {
          status: forwardingNumberStatus.ready,
          error: null,
        };
      case actions.fetch:
        return {
          status: forwardingNumberStatus.fetching,
          error: null,
        };
      case actions.fetchSuccess:
        return {
          status: forwardingNumberStatus.ready,
          error: null,
        };
      case actions.fetchError:
        return {
          status: forwardingNumberStatus.ready,
          error: action.error,
        };
      case actions.reset:
        return {
          status: forwardingNumberStatus.pending,
          error: null,
        };
      default:
        return state;
    }
  };
}
