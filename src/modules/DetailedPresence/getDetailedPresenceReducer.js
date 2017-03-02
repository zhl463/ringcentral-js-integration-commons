import 'core-js/fn/array/find';
import 'core-js/fn/array/find-index';
import { combineReducers } from 'redux';
import { getDndStatusReducer } from '../Presence/getPresenceReducer';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';
import {
  normalizeFromTo,
  isIntermediateCall,
} from '../../lib/callLogHelpers';

export function getDataReducer(types) {
  return (state = [], { type, activeCalls = [], timestamp }) => {
    switch (type) {
      case types.fetchSuccess:
      case types.notification: {
        return activeCalls
          .map((activeCall) => {
            const existingCall = state.find(call => (
              call.sessionId === activeCall.sessionId
            ));
            if (!existingCall) return { ...normalizeFromTo(activeCall), startTime: timestamp };
            if (isIntermediateCall(activeCall)) return existingCall;
            return { ...existingCall, ...normalizeFromTo(activeCall) };
          })
          // [RCINT-3558] should ignore intermediate call states
          .filter(activeCall => !isIntermediateCall(activeCall));
      }
      case types.resetSuccess:
        return [];
      default:
        return state;
    }
  };
}


function getTelephonyStatusReducer(types) {
  return (state = null, { type, telephonyStatus = state }) => {
    switch (type) {
      case types.fetchSuccess:
      case types.notification:
        return telephonyStatus;
      case types.resetSuccess:
        return null;
      default:
        return state;
    }
  };
}

/* istanbul ignore next: unnecessary to test combineReducers */
export default function getDetailedPresenceReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    data: getDataReducer(types),
    dndStatus: getDndStatusReducer(types),
    telephonyStatus: getTelephonyStatusReducer(types),
  });
}
