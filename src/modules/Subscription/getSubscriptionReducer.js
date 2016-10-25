import { combineReducers } from 'redux';
import { prefixEnum } from '../../lib/Enum';
import subscriptionStatus from './subscriptionStatus';
import subscriptionActionTypes from './subscriptionActionTypes';

export function getMessageReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: subscriptionActionTypes, prefix });
  return (state = null, { type, message }) => {
    if (type === prefixedTypes.notification) return message;

    return null;
  };
}

export function getStatusReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: subscriptionActionTypes, prefix });
  return (state = subscriptionStatus.pending, { type }) => {
    switch (type) {
      case prefixedTypes.init:
      case prefixedTypes.renewError:
      case prefixedTypes.subscribeError:
      case prefixedTypes.removeSuccess:
        return subscriptionStatus.notSubscribed;

      case prefixedTypes.subscribeSuccess:
      case prefixedTypes.renewSuccess:
        return subscriptionStatus.subscribed;

      case prefixedTypes.reset:
        return subscriptionStatus.resetting;

      case prefixedTypes.resetSuccess:
        return subscriptionStatus.pending;

      default:
        return state;
    }
  };
}

export function getFiltersReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: subscriptionActionTypes, prefix });
  return (state = [], { type, filters }) => {
    const coercedFilters = [].concat(filters);
    switch (type) {
      case prefixedTypes.setFilters:
        return filters;

      case prefixedTypes.addFilters:
        return [...(new Set([...state].concat(coercedFilters)))];

      case prefixedTypes.removeFilters:
        return state.filter(f => coercedFilters.indexOf(f) === -1);

      case prefixedTypes.resetSuccess:
        return [];

      default:
        return state;
    }
  };
}

export function getErrorReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: subscriptionActionTypes, prefix });
  return (state = null, { type, error }) => {
    switch (type) {
      case prefixedTypes.subscribeError:
      case prefixedTypes.removeError:
      case prefixedTypes.renewError:
        return error;

      case prefixedTypes.subscribeSuccess:
      case prefixedTypes.renewSuccess:
      case prefixedTypes.removeSuccess:
      case prefixedTypes.reset:
      case prefixedTypes.resetSuccess:
      case prefixedTypes.init:
        return null;

      default:
        return state;
    }
  };
}

export default function getSubscriptionReducer(prefix) {
  return combineReducers({
    filters: getFiltersReducer(prefix),
    status: getStatusReducer(prefix),
    error: getErrorReducer(prefix),
    message: getMessageReducer(prefix),
  });
}
