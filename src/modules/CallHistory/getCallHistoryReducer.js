import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

function getEndedCallsReducer(types) {
  return (state = [], { type, endedCalls, timestamp }) => {
    switch (type) {
      case types.addEndedCalls:
        return state.concat(endedCalls.map(call => ({
          ...call,
          duration: Math.floor((timestamp - call.startTime) / 1000),
        })));
      case types.removeEndedCalls:
        return state.filter(call => (
          !endedCalls.find(shouldRemove => shouldRemove.sessionId === call.sessionId)
        ));
      case types.resetSuccess:
        return [];
      default:
        return state;
    }
  };
}


/* istanbul ignore next: unnecessary to test getModuleStatusReducer */
export default function getCallHistoryReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    endedCalls: getEndedCallsReducer(types),
  });
}
