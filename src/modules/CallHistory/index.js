import RcModule from '../../lib/RcModule';
import moduleStatus from '../../enums/moduleStatus';
import { sortByStartTime } from '../../lib/callLogHelpers';
import actionTypes from './actionTypes';
import getCallHistoryReducer from './getCallHistoryReducer';
import ensureExist from '../../lib/ensureExist';
import normalizeNumber from '../../lib/normalizeNumber';

export default class CallHistory extends RcModule {
  constructor({
    detailedPresence,
    callLog,
    activeCalls,
    activityMatcher,
    contactMatcher,
    regionSettings,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._activeCalls = this::ensureExist(activeCalls, 'activeCalls');
    this._callLog = this::ensureExist(callLog, 'callLog');
    this._detailedPresence = this::ensureExist(detailedPresence, 'detailedPresence');
    // this._activityMatcher = this::ensureExist(activityMatcher, 'activityMatcher');
    // this._contactMatcher = this::ensureExist(contactMatcher, 'contactMatcher');
    this._regionSettings = this::ensureExist(regionSettings, 'regionSettings');
    this._activityMatcher = activityMatcher;
    this._contactMatcher = contactMatcher;
    this._reducer = getCallHistoryReducer(this.actionTypes);

    this.addSelector('filteredCalls',
      () => this._callLog.calls,
      () => this._activeCalls.calls,
      () => this._detailedPresence.calls,
      (callsFromCallLog, callsFromActiveCalls, callsFromPresence) => {
        const indexMap = {};
        callsFromCallLog.forEach((call) => {
          indexMap[call.sessionId] = true;
        });
        const presentInPresenceCalls = {};
        callsFromPresence.forEach((call) => {
          presentInPresenceCalls[call.sessionId] = true;
        });
        return callsFromActiveCalls
          .filter(call => !indexMap[call.sessionId] && !presentInPresenceCalls[call.sessionId])
          .concat(callsFromCallLog);
      }
    );
    this.addSelector('normalizedCalls',
      this._selectors.filteredCalls,
      () => this._regionSettings.countryCode,
      () => this._regionSettings.areaCode,
      (filteredCalls, countryCode, areaCode) => (
        filteredCalls.map((call) => {
          const callFrom = {
            ...call.from,
          };
          if (callFrom.phoneNumber) {
            callFrom.phoneNumber = normalizeNumber({
              phoneNumber: callFrom.phoneNumber,
              countryCode,
              areaCode,
            });
          }
          const callTo = {
            ...call.to,
          };
          if (callTo.phoneNumber) {
            callTo.phoneNumber = normalizeNumber({
              phoneNumber: callTo.phoneNumber,
              countryCode,
              areaCode,
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
      () => (this._contactMatcher && this._contactMatcher.ready ?
        this._contactMatcher.cache :
        null),
      () => (this._activityMatcher && this._activityMatcher.ready ?
        this._activityMatcher.cache :
        null),
      (normalizedCalls, contactCache, activityCache) => (
        normalizedCalls.map((call) => {
          const fromNumber = call.from && (call.from.phoneNumber || call.from.extensionNumber);
          const toNumber = call.to && (call.to.phoneNumber || call.to.extensionNumber);
          return {
            ...call,
            fromMatches: (fromNumber && contactCache && contactCache.dataMap[fromNumber]) || [],
            toMatches: (toNumber && contactCache && contactCache.dataMap[toNumber]) || [],
            activityMatches: (activityCache && activityCache.dataMap[call.sessionId]) || [],
          };
        }).sort(sortByStartTime)
      ),
    );

    this.addSelector('uniqueNumbers',
      this._selectors.normalizedCalls,
      (normalizedCalls) => {
        const output = [];
        const numberMap = {};
        function addIfNotExist(number) {
          if (!numberMap[number]) {
            output.push(number);
            numberMap[number] = true;
          }
        }
        normalizedCalls.forEach((call) => {
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
        });
        return output;
      },
    );

    if (this._contactMatcher) {
      this._contactMatcher.addQuerySource({
        getQueriesFn: this._selectors.uniqueNumbers,
        readyCheckFn: () => (
          this._activeCalls.ready &&
          this._detailedPresence.ready &&
          this._callLog.ready &&
          this._regionSettings.ready
        ),
      });
    }

    this.addSelector('sessionIds',
      this._selectors.filteredCalls,
      filteredCalls => filteredCalls.map(call => call.sessionId),
    );

    if (this._activityMatcher) {
      this._activityMatcher.addQuerySource({
        getQueriesFn: this._selectors.sessionIds,
        readyCheckFn: () => (
          this._activeCalls.ready &&
          this._detailedPresence.ready &&
          this._callLog.ready
        ),
      });
    }
  }
  _onStateChange = async () => {
    if (
      this._callLog.ready &&
      this._activeCalls.ready &&
      this._detailedPresence.ready &&
      this._regionSettings.ready &&
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
        !this._activeCalls.ready ||
        !this._detailedPresence.ready ||
        !this._regionSettings.ready ||
        (this._contactMatcher && !this._contactMatcher.ready) ||
        (this._activityMatcher && !this._activityMatcher.ready)
      ) &&
      this.ready
    ) {
      this.store.dispatch({
        type: this.actionTypes.reset,
      });
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
    }
  }
  initialize() {
    this.store.subscribe(this._onStateChange);
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.state.status === moduleStatus.ready;
  }

  get pending() {
    return this.state.status === moduleStatus.pending;
  }

  get calls() {
    return this._selectors.calls();
  }
}
