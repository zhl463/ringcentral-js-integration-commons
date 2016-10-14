import { prefixActions } from '../../lib/ActionMap';
import dialingPlanActions from './dialingPlanActions';
import dialingPlanStatus from './dialingPlanStatus';

export default function getDialingPlanReducer(prefix) {
  const actions = prefixActions({ actions: dialingPlanActions, prefix });
  return (state, action) => {
    if (!state) {
      return {
        status: dialingPlanStatus.pending,
        error: null,
      };
    }
    if (!action) {
      return state;
    }
    switch (action.type) {
      case actions.ready:
        return {
          status: dialingPlanStatus.ready,
          error: null,
        };
      case actions.fetch:
        return {
          status: dialingPlanStatus.fetching,
          error: null,
        };
      case actions.fetchSuccess:
        return {
          status: dialingPlanStatus.ready,
          error: null,
        };
      case actions.fetchError:
        return {
          status: dialingPlanStatus.ready,
          error: action.error,
        };
      case actions.reset:
        return {
          status: dialingPlanStatus.pending,
          error: null,
        };
      default:
        return state;
    }
  };
}
