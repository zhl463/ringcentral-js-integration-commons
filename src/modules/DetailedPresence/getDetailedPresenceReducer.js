import 'core-js/fn/array/find';
import 'core-js/fn/array/find-index';
import { combineReducers } from 'redux';
import { getDndStatusReducer } from '../Presence/getPresenceReducer';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';
import telephonyStatuses from '../../enums/telephonyStatuses';
import terminationTypes from '../../enums/terminationTypes';
import {
  isEnded,
  sortByStartTime,
  removeInboundRingOutLegs,
  normalizeFromTo,
} from '../../lib/callLogHelpers';

export function isIntermediateCall(call = {}) {
  return call.telephonyStatus === telephonyStatuses.noCall
    && call.terminationType === terminationTypes.intermediate;
}
export function samePresenceCallAs(targetCall) {
  return call => (
    call.id === targetCall.id ||
    call.sessionId === targetCall.sessionId
  );
}
export function removeDuplicateIntermediateCalls(calls) {
  const resultCalls = [];
  const indexMap = {};
  calls.forEach((call) => {
    const isIntermediate = isIntermediateCall(call);
    if (!indexMap[call.sessionId]) {
      indexMap[call.sessionid] = {
        index: resultCalls.length,
        isIntermediate,
      };
      resultCalls.push(call);
    } else if (!isIntermediate) {
      indexMap[call.sessionId].isIntermediate = false;
      resultCalls[indexMap[call.sessionId].index] = call;
    }
  });
  return resultCalls;
}

export function removeEndedCalls(activeCalls = []) {
  return activeCalls.filter(call => !isEnded(call));
}

export function processActiveCalls(activeCalls) {
  return removeEndedCalls(
    removeInboundRingOutLegs(
      removeDuplicateIntermediateCalls(activeCalls).map(normalizeFromTo)));
}

export function getCallsReducer(types) {
  return (state = [], { type, activeCalls, timestamp }) => {
    switch (type) {
      case types.fetchSuccess:
      case types.notification: {
        if (activeCalls) {
          return processActiveCalls(activeCalls).map((activeCall) => {
            const currentCall = state.find(samePresenceCallAs(activeCall));
            if (!currentCall) return { ...activeCall, startTime: timestamp };
            if (isIntermediateCall(activeCall)) return currentCall;
            return { ...currentCall, ...activeCall };
          }).sort(sortByStartTime);
        }
        return state;
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
    calls: getCallsReducer(types),
    dndStatus: getDndStatusReducer(types),
    telephonyStatus: getTelephonyStatusReducer(types),
  });
}
