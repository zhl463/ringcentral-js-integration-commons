import { prefixActions } from '../../lib/redux-helper';
import subscriptionActions from './subscription-actions';
import subscriptionStatus from './subscription-status';

export default function getSubscriptionReducer(prefix) {
  const actions = prefixActions({ actions: subscriptionActions, prefix });
  return (state, action) => {
    if (typeof state === 'undefined') {
      return {
        filters: [],
        status: subscriptionStatus.pending,
        error: null,
        lastMessage: null,
      };
    }
    if (!action) return state;

    switch (action.type) {

      case actions.setFilters:
        return {
          ...state,
          filters: [...action.filters],
        };

      case actions.notification:
        return {
          ...state,
          lastMessage: action.message,
        };

      case actions.ready:
        return {
          ...state,
          status: subscriptionStatus.notSubscribed,
        };

      case actions.subscribeSuccess:
        return {
          ...state,
          status: subscriptionStatus.subscribed,
          error: null,
        };

      case actions.subscribeError:
        return {
          ...state,
          status: subscriptionStatus.notSubscribed,
          error: action.error,
        };

      case actions.renewSuccess:
        return {
          ...state,
          status: subscriptionStatus.subscribed,
          error: null,
        };

      case actions.renewError:
        return {
          ...state,
          status: subscriptionStatus.notSubscribed,
          error: action.error,
        };

      case actions.removeSuccess:
        return {
          ...state,
          status: subscriptionStatus.notSubscribed,
          error: null,
        };

      case actions.removeError:
        return {
          ...state,
          status: subscriptionStatus.subscribed,
          error: action.error,
        };

      case actions.reset:
        return {
          ...state,
          lastMessage: null,
          error: null,
          status: subscriptionStatus.pending,
        };

      default:
        return state;
    }
  };
}
