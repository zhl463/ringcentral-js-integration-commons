import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';
import ringoutStatus from './ringoutStatus';

export function getRingoutStatusReducer(types) {
  return (state = ringoutStatus.idle, { type }) => {
    switch (type) {
      case types.startToConnect:
        return ringoutStatus.connecting;

      case types.completeConnect:
        return ringoutStatus.idle;

      default:
        return state;
    }
  };
}

export default function getRingoutReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    ringoutStatus: getRingoutStatusReducer(types)
  });
}
