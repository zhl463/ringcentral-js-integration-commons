import 'core-js/fn/array/find';
import {
  isValidNumber,
} from 'phoneformat.js';
import callDirections from '../enums/callDirections';
import telephonyStatuses from '../enums/telephonyStatuses';
import terminationTypes from '../enums/terminationTypes';
import isSameLocalNumber from './isSameLocalNumber';

/* call direction helpers */
export function isInbound(call = {}) {
  return call.direction === callDirections.inbound;
}

export function isOutbound(call = {}) {
  return call.direction === callDirections.outbound;
}

/* status helpers */
export function isRinging(call = {}) {
  return call.telephonyStatus === telephonyStatuses.ringing;
}

export function hasRingingCalls(calls = []) {
  return !!calls.find(isRinging);
}

export function isEnded(call = {}) {
  return call.telephonyStatus === telephonyStatuses.noCall &&
    call.terminationType === terminationTypes.final;
}

export function hasEndedCalls(calls) {
  return !!calls.find(isEnded);
}

export function isOnHold(call = {}) {
  return call.telephonyStatus === telephonyStatuses.onHold;
}

/* sort functions */

export function sortBySessionId(a, b) {
  if (a.sessionId === b.sessionId) return 0;
  return a.sessionId > b.sessionId ?
    1 :
    -1;
}
export function sortByStartTime(a, b) {
  if (a.startTime === b.startTime) return 0;
  return a.startTime > b.startTime ?
    -1 :
    1;
}

export function normalizeStartTime(call) {
  return {
    ...call,
    startTime: (new Date(call.startTime)).getTime(),
  };
}

export function normalizeFromTo(call) {
  return {
    ...call,
    from: typeof call.from === 'object' ?
      call.from :
      { phoneNumber: call.from },
    to: typeof call.to === 'object' ?
      call.to :
      { phoneNumber: call.to },
  };
}

/* ringout leg helpers */
export function areTwoLegs(inbound, outbound) {
  return isInbound(inbound)
    && isOutbound(outbound)
    && [1000, 2000, 3000, 4000].indexOf(Math.abs(inbound.sessionId - outbound.sessionId)) > -1
    && ((inbound.from === outbound.to && outbound.from === inbound.to) ||
      (inbound.from === outbound.to && isSameLocalNumber(inbound.to, outbound.from)) ||
      (inbound.to === outbound.from && isSameLocalNumber(inbound.from, outbound.to)) ||
      (inbound.to.name && inbound.to.name === outbound.from.name));
}

export function removeInboundRingOutLegs(calls) {
  const output = [];
  const outbounds = calls.filter(isOutbound);
  calls.filter(isInbound).forEach((inbound) => {
    const outboundIndex = outbounds.findIndex(call => areTwoLegs(inbound, call));
    if (outboundIndex > -1) {
      const outbound = {
        ...outbounds.splice(outboundIndex, 1)[0],
        inboundLeg: inbound,
      };
      // Handle inboundLeg.from is '+19072028624', but outboundLeg.to is '9072028624'
      // https://jira.ringcentral.com/browse/RCINT-3127
      if (
        isValidNumber(inbound.from && inbound.from.phoneNumber) &&
        isSameLocalNumber(inbound.from.phoneNumber, outbound.to && outbound.to.phonenumber)
      ) {
        outbound.to.phoneNumber = inbound.from.phoneNumber;
      }
      if (isOnHold(inbound)) {
        outbound.telephonyStatus = telephonyStatuses.onHold;
      }
      output.push(outbound);
    } else {
      output.push(inbound);
    }
  });
  return output.concat(outbounds);
}
