import LoggerBase from '../../lib/LoggerBase';
import ensureExist from '../../lib/ensureExist';
import { isRinging, isInbound } from '../../lib/callLogHelpers';
import actionTypes from './actionTypes';
import getDataReducer from './getDataReducer';

/**
 * @function
 * @description Identity function for calls.
 * @param {Object} call - call object
 * @return {String} sessionId
 */
export function callIdentityFunction(call) {
  return call.sessionId;
}

export default class CallLogger extends LoggerBase {
  constructor({
    storage,
    callMonitor,
    callHistory,
    contactMatcher,
    activityMatcher,
    ...options,
  }) {
    super({
      ...options,
      name: 'callLogger',
      actionTypes,
      getDataReducer,
      identityFunction: callIdentityFunction,
    });
    this._storage = this::ensureExist(storage, 'storage');
    this._callMonitor = this::ensureExist(callMonitor, 'callMonitor');
    this._contactMatcher = this::ensureExist(contactMatcher, 'contactMatcher');
    this._activityMatcher = this::ensureExist(activityMatcher, 'activityMatcher');
    this._callHistory = callHistory;
    this._storageKey = `${this._name}Data`;
    this._storage.registerReducer({
      key: this._storageKey,
      reducer: getDataReducer(this.actionTypes),
    });

    this._lastProcessedCalls = null;
    this._lastProcessedEndedCalls = null;
  }

  _onReset() {
    this._lastProcessedCalls = null;
    this._lastProcessedEndedCalls = null;
  }

  _shouldInit() {
    return this.pending &&
      this._callMonitor.ready &&
      (!this._callHistory || this._callHistory.ready) &&
      this._contactMatcher.ready &&
      this._activityMatcher.ready &&
      this._readyCheckFunction() &&
      this._storage.ready;
  }

  _shouldReset() {
    return this.ready &&
      (
        !this._callMonitor.ready ||
        (this._callMonitor && !this._callMonitor.ready) ||
        (this._callHistory && !this._callHistory.ready) ||
        !this._contactMatcher.ready ||
        !this._activityMatcher.ready ||
        !this._readyCheckFunction() ||
        !this._storage.ready
      );
  }

  async log({ call, ...options }) {
    return super.log({ item: call, ...options });
  }

  _shouldLogNewCall(call) {
    return this.autoLog &&
      (this.logOnRinging || !isRinging(call));
  }

  async logCall({
    call,
    contact,
    ...options,
  }) {
    const inbound = isInbound(call);
    const fromEntity = (inbound && contact) ||
      null;
    const toEntity = (!inbound && contact) ||
      null;
    await this.log({
      ...options,
      call: {
        ...call,
        duration: call::Object.prototype.hasOwnProperty('duration') ?
          call.duration :
          Math.round((Date.now() - call.startTime) / 1000),
        result: call.result || call.telephonyStatus,
      },
      fromEntity,
      toEntity,
    });
  }
  async _autoLogCall({ call, fromEntity, toEntity }) {
    await this.log({
      call: {
        ...call,
        duration: call::Object.prototype.hasOwnProperty('duration') ?
          call.duration :
          Math.round((Date.now() - call.startTime) / 1000),
        result: call.result || call.telephonyStatus,
      },
      fromEntity,
      toEntity,
    });
  }
  async _onNewCall(call) {
    if (this._shouldLogNewCall(call)) {
      // RCINT-3857 check activity in case instance was reloaded when call is still active
      await this._activityMatcher.triggerMatch();
      if (
        !this._activityMatcher.dataMapping[call.sessionId] ||
        !this._activityMatcher.dataMapping[call.sessionId].length
      ) {
        // is completely new, need entity information
        await this._contactMatcher.triggerMatch();
        const fromMatches = (call.from && call.from.phoneNumber &&
          this._contactMatcher.dataMapping[call.from.phoneNumber]) || [];

        const toMatches = (call.to && call.to.phoneNumber &&
          this._contactMatcher.dataMapping[call.to.phoneNumber]) || [];

        const fromEntity = (fromMatches &&
          fromMatches.length === 1 &&
          fromMatches[0]) ||
          null;
        const toEntity = (toMatches &&
          toMatches.length === 1 &&
          toMatches[0]) ||
          null;
        await this._autoLogCall({
          call,
          fromEntity,
          toEntity,
        });
      } else {
        // only update call information if call has been logged
        await this._autoLogCall({ call });
      }
    }
  }
  async _shouldLogUpdatedCall(call) {
    if (this.logOnRinging || !isRinging(call)) {
      if (this.autoLog) return true;
      await this._activityMatcher.triggerMatch();
      const activityMatches = this._activityMatcher.dataMapping[call.sessionId] || [];
      return activityMatches.length > 0;
    }
    return false;
  }
  async _onCallUpdated(call) {
    if (await this._shouldLogUpdatedCall(call)) {
      await this._autoLogCall({ call });
    }
  }
  _processCalls() {
    if (this.ready) {
      if (this._lastProcessedCalls !== this._callMonitor.calls) {
        const oldCalls = (
          this._lastProcessedCalls &&
          this._lastProcessedCalls.slice()
        ) || [];
        this._lastProcessedCalls = this._callMonitor.calls;

        this._lastProcessedCalls.forEach((call) => {
          const oldCallIndex = oldCalls.findIndex(item => item.sessionId === call.sessionId);

          if (oldCallIndex === -1) {
            this._onNewCall(call);
          } else {
            const oldCall = oldCalls[oldCallIndex];
            oldCalls.splice(oldCallIndex, 1);
            if (call.telephonyStatus !== oldCall.telephonyStatus) {
              this._onCallUpdated(call);
            }
          }
        });
        oldCalls.forEach((call) => {
          this._onCallUpdated(call);
        });
      }
      if (
        this._callHistory &&
        this._lastProcessedEndedCalls !== this._callHistory.recentlyEndedCalls
      ) {
        const oldCalls = (
          this._lastProcessedEndedCalls &&
          this._lastProcessedEndedCalls.slice()
        ) || [];
        this._lastProcessedEndedCalls = this._callHistory.recentlyEndedCalls;
        const currentSessions = {};
        this._lastProcessedEndedCalls.forEach((call) => {
          currentSessions[call.sessionId] = true;
        });
        oldCalls.forEach((call) => {
          if (!currentSessions[call.sessionId]) {
            // call log updated
            const callInfo = this._callHistory.calls
              .find(item => item.sessionId === call.sessionId);
            if (callInfo) {
              this._onCallUpdated(callInfo);
            }
          }
        });
      }
    }
  }
  async _onStateChange() {
    await super._onStateChange();
    this._processCalls();
  }


  setAutoLog(autoLog) {
    if (this.ready && autoLog !== this.autoLog) {
      this.store.dispatch({
        type: this.actionTypes.setAutoLog,
        autoLog,
      });
    }
  }

  get autoLog() {
    return this._storage.getItem(this._storageKey).autoLog;
  }

  setLogOnRinging(logOnRinging) {
    if (this.ready && logOnRinging !== this.logOnRinging) {
      this.store.dispatch({
        type: this.actionTypes.setLogOnRinging,
        logOnRinging,
      });
    }
  }

  get logOnRinging() {
    return this._storage.getItem(this._storageKey).logOnRinging;
  }
}
