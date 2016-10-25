import { combineReducers } from 'redux';
import { prefixEnum } from '../../lib/Enum';
import dialingPlanActionTypes from './dialingPlanActionTypes';
import dialingPlanStatus from './dialingPlanStatus';

export function getStatusReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: dialingPlanActionTypes, prefix });
  return (state = dialingPlanStatus.pending, { type }) => {
    switch (type) {
      case prefixedTypes.fetch:
        return dialingPlanStatus.fetching;

      case prefixedTypes.init:
      case prefixedTypes.fetchSuccess:
      case prefixedTypes.fetchError:
        return dialingPlanStatus.ready;

      case prefixedTypes.reset:
        return dialingPlanStatus.pending;
      default:
        return state;
    }
  };
}

export function getErrorReducer(prefix) {
  const prefixedTypes = prefixEnum({ enumMap: dialingPlanActionTypes, prefix });
  return (state = null, { type, error }) => {
    switch (type) {
      case prefixedTypes.init:
      case prefixedTypes.fetch:
      case prefixedTypes.fetchSuccess:
      case prefixedTypes.reset:
        return null;

      case prefixedTypes.fetchError:
        return error;

      default:
        return state;
    }
  };
}

export default function getAccountInfoReducer(prefix) {
  return combineReducers({
    status: getStatusReducer(prefix),
    error: getErrorReducer(prefix),
  });
}
