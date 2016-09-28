import { prefixActions } from '../../lib/redux-helper';
import forwardingNumberActions from './forwarding-number-actions';
import forwardingNumberStatus from './forwarding-number-status';

export default function getForwardingNumberReducer(prefix) {
  const actions = prefixActions(forwardingNumberActions, prefix);
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
