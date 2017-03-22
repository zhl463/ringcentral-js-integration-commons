import RcModule from '../../lib/RcModule';
import moduleStatuses from '../../enums/moduleStatuses';
import {
  sortByStartTime,
} from '../../lib/callLogHelpers';
import actionTypes from './actionTypes';
import getCallHistoryReducer from './getCallHistoryReducer';
import ensureExist from '../../lib/ensureExist';
import normalizeNumber from '../../lib/normalizeNumber';

export default class CallHistory extends RcModule {
  constructor({
    accountInfo,
    callLog,
    callMonitor,
    activityMatcher,
    contactMatcher,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._accountInfo = this::ensureExist(accountInfo, 'accountInfo');
    this._callLog = this::ensureExist(callLog, 'callLog');
    this._activityMatcher = activityMatcher;
    this._contactMatcher = contactMatcher;
    this._callMonitor = callMonitor;
    this._reducer = getCallHistoryReducer(this.actionTypes);

    this.addSelector('normalizedCalls',
      () => this._callLog.calls,
      () => this._accountInfo.countryCode,
      (calls, countryCode) => (
        calls.map((call) => {
          const callFrom = {
            ...call.from,
          };
          if (callFrom.phoneNumber) {
            callFrom.phoneNumber = normalizeNumber({
              phoneNumber: callFrom.phoneNumber,
              countryCode,
            });
          }
          const callTo = {
            ...call.to,
          };
          if (callTo.phoneNumber) {
            callTo.phoneNumber = normalizeNumber({
              phoneNumber: callTo.phoneNumber,
              countryCode,
            });
          }
          return {
            ...call,
            from: callFrom,
            to: callTo,
          };
        })
      ),
    );

    this.addSelector('calls',
      this._selectors.normalizedCalls,
      () => this.state.endedCalls,
      () => (this._contactMatcher && this._contactMatcher.dataMapping),
      () => (this._activityMatcher && this._activityMatcher.dataMapping),
      (normalizedCalls, endedCalls, contactMapping = {}, activityMapping = {}) => {
        const sessionIds = {};
        return normalizedCalls.map((call) => {
          sessionIds[call.sessionId] = true;
          const fromNumber = call.from && (call.from.phoneNumber || call.from.extensionNumber);
          const toNumber = call.to && (call.to.phoneNumber || call.to.extensionNumber);
          return {
            ...call,
            fromMatches: (fromNumber && contactMapping[fromNumber]) || [],
            toMatches: (toNumber && contactMapping[toNumber]) || [],
            activityMatches: (activityMapping[call.sessionId]) || [],
          };
        }).concat(endedCalls.filter(call => !sessionIds[call.sessionId]))
          .sort(sortByStartTime);
      },
    );

    this.addSelector('uniqueNumbers',
      this._selectors.normalizedCalls,
      () => this.state.endedCalls,
      (normalizedCalls, endedCalls) => {
        const output = [];
        const numberMap = {};
        function addIfNotExist(number) {
          if (!numberMap[number]) {
            output.push(number);
            numberMap[number] = true;
          }
        }
        function addNumbersFromCall(call) {
          if (call.from && call.from.phoneNumber) {
            addIfNotExist(call.from.phoneNumber);
          } else if (call.from && call.from.extensionNumber) {
            addIfNotExist(call.from.extensionNumber);
          }
          if (call.to && call.to.phoneNumber) {
            addIfNotExist(call.to.phoneNumber);
          } else if (call.to && call.to.extensionNumber) {
            addIfNotExist(call.to.extensionNumber);
          }
        }
        normalizedCalls.forEach(addNumbersFromCall);
        endedCalls.forEach(addNumbersFromCall);
        return output;
      },
    );

    if (this._contactMatcher) {
      this._contactMatcher.addQuerySource({
        getQueriesFn: this._selectors.uniqueNumbers,
        readyCheckFn: () => (
          (!this._callMonitor || this._callMonitor.ready) &&
          this._callLog.ready &&
          this._accountInfo.ready
        ),
      });
    }

    this.addSelector('sessionIds',
      () => this._callLog.calls,
      () => this.state.endedCalls,
      (calls, endedCalls) => {
        const sessionIds = {};
        return calls.map((call) => {
          sessionIds[call.sessionId] = true;
          return call.sessionId;
        }).concat(
          endedCalls
            .filter(call => !sessionIds[call.sessionId])
            .map(call => call.sessionId)
          );
      },
    );

    if (this._activityMatcher) {
      this._activityMatcher.addQuerySource({
        getQueriesFn: this._selectors.sessionIds,
        readyCheckFn: () => (
          (!this._callMonitor || this._callMonitor.ready) &&
          this._callLog.ready
        ),
      });
    }
  }
  _onStateChange = async () => {
    if (
      this._callLog.ready &&
      (!this._callMonitor || this._callMonitor.ready) &&
      this._accountInfo.ready &&
      (!this._contactMatcher || this._contactMatcher.ready) &&
      (!this._activityMatcher || this._activityMatcher.ready) &&
      this.pending
    ) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
    } else if (
      (
        !this._callLog.ready ||
        (this._callMonitor && !this._callMonitor.ready) ||
        !this._accountInfo.ready ||
        (this._contactMatcher && !this._contactMatcher.ready) ||
        (this._activityMatcher && !this._activityMatcher.ready)
      ) &&
      this.ready
    ) {
      this.store.dispatch({
        type: this.actionTypes.reset,
      });
      this._lastProcessedCalls = null;
      this._lastProcessedIds = null;
      this._lastProcessedMonitorCalls = null;
      this._lastProcessedNumbers = null;
      this.store.dispatch({
        type: this.actionTypes.resetSuccess,
      });
    } else if (
      this.ready
    ) {
      const uniqueNumbers = this._selectors.uniqueNumbers();
      if (this._lastProcessedNumbers !== uniqueNumbers) {
        this._lastProcessedNumbers = uniqueNumbers;
        if (this._contactMatcher && this._contactMatcher.ready) {
          this._contactMatcher.triggerMatch();
        }
      }
      const sessionIds = this._selectors.sessionIds();
      if (this._lastProcessedIds !== sessionIds) {
        this._lastProcessedIds = sessionIds;
        if (this._activityMatcher && this._activityMatcher.ready) {
          this._activityMatcher.triggerMatch();
        }
      }
      if (this._callMonitor) {
        const monitorCalls = this._callMonitor.calls;
        if (this._lastProcessedMonitorCalls !== monitorCalls) {
          const endedCalls = (this._lastProcessedMonitorCalls || [])
            .filter(call => (
              !monitorCalls.find(currentCall => call.sessionId === currentCall.sessionId)
            ));
          this._lastProcessedMonitorCalls = monitorCalls;
          if (endedCalls.length) {
            this.store.dispatch({
              type: this.actionTypes.addEndedCalls,
              endedCalls,
              timestamp: Date.now(),
            });
          }
        }
      }
      const currentCalls = this._callLog.calls;
      if (currentCalls !== this._lastProcessedCalls) {
        this._lastProcessedCalls = currentCalls;
        const ids = {};
        currentCalls.forEach((call) => {
          ids[call.sessionId] = true;
        });
        const shouldRemove = this.state.endedCalls.filter(call => ids[call.sessionId]);
        if (shouldRemove.length) {
          this.store.dispatch({
            type: this.actionTypes.removeEndedCalls,
            endedCalls: shouldRemove,
          });
        }
      }
    }
  }
  initialize() {
    this.store.subscribe(this._onStateChange);
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.state.status === moduleStatuses.ready;
  }

  get pending() {
    return this.state.status === moduleStatuses.pending;
  }

  get calls() {
    return this._selectors.calls();
  }
}
