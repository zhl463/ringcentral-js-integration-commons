import { combineReducers } from 'redux';
import { prefixEnum } from '../../lib/Enum';
import dialingPlanActionTypes from './dialingPlanActionTypes';
import dialingPlanStatus from './dialingPlanStatus';

export function getStatusReducer(prefix) {
  const types = prefixEnum({ enumMap: dialingPlanActionTypes, prefix });
  return (state = dialingPlanStatus.pending, { type }) => {
    switch (type) {
      case types.fetch:
        return dialingPlanStatus.fetching;

      case types.init:
      case types.fetchSuccess:
        return dialingPlanStatus.ready;

      case types.fetchError:
        return dialingPlanStatus.error;

      case types.reset:
        return dialingPlanStatus.pending;
      default:
        return state;
    }
  };
}

export function getErrorReducer(prefix) {
  const types = prefixEnum({ enumMap: dialingPlanActionTypes, prefix });
  return (state = null, { type, error }) => {
    switch (type) {
      case types.init:
      case types.fetch:
      case types.fetchSuccess:
      case types.reset:
        return null;

      case types.fetchError:
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
