import { prefixActions } from '../../lib/redux-helper';
import subscriptionActions from './subscription-actions';
import subscriptionStatus from './subscription-status';

const initialState = {
  cacheKey: null,
  filters: [],
  status: subscriptionStatus.pending,
  lastMessage: null,
};

export default function getSubscriptionReducer(prefix) {
  const actions = prefixActions(subscriptionActions, prefix);
  return (state, action) => {
    if (typeof state === 'undefined') return Object.assign({}, initialState);
    if (!action) return state;
    switch (action.type) {
      case actions.updateStatus:
        return Object.assign(
          {},
          state,
          {
            status: action.status,
            subscription: actions.subscription,
          },
        );

      case actions.updateFilters:
        return Object.assign(
          {},
          state,
          {
            filters: action.filters.slice(),
          },
        );

      case actions.notification:
        return Object.assign(
          {},
          state,
          {
            lastMessage: action.message,
          },
        );

      case actions.reset:
        return Object.assign(
          {},
          state,
          {
            lastMessage: null,
            notification: null,
            status: subscriptionStatus.notSubscribed,
          },
        );

      default:
        return state;
    }
  };
}
