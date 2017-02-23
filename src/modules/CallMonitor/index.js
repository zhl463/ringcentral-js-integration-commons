import 'core-js/fn/array/find';
import RcModule from '../../lib/RcModule';
import moduleStatus from '../../enums/moduleStatus';
import actionTypes from './actionTypes';
import getCallMonitorReducer from './getCallMonitorReducer';
import normalizeNumber from '../../lib/normalizeNumber';

export default class CallMonitor extends RcModule {
  constructor({
    detailedPresence,
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
    this._detailedPresence = detailedPresence;
    this._activeCalls = activeCalls;
    this._contactMatcher = contactMatcher;
    this._activityMatcher = activityMatcher;
    this._regionSettings = regionSettings;
    this._reducer = getCallMonitorReducer(this.actionTypes);
    this.addSelector('normalizedCalls',
      () => this._detailedPresence.calls,
      () => this._activeCalls.calls,
      () => this._regionSettings.countryCode,
      () => this._regionSettings.areaCode,
      (callsFromPresence, callsFromActiveCalls, countryCode, areaCode) => (
        callsFromPresence.map((call) => {
          const activeCall = callsFromActiveCalls.find(item => item.sessionId === call.sessionId);
          const fromNumber = normalizeNumber({
            phoneNumber: call.from && call.from.phoneNumber,
            countryCode,
            areaCode,
          });
          const toNumber = normalizeNumber({
            phoneNumber: call.to && call.to.phoneNumber,
            countryCode,
            areaCode,
          });
          return {
            ...call,
            from: {
              phoneNumber: fromNumber,
              name: activeCall && activeCall.from && activeCall.from.name,
            },
            to: {
              phoneNumber: toNumber,
              name: activeCall && activeCall.to && activeCall.to.name,
            },
            startTime: (activeCall && activeCall.startTime) || call.startTime,
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
          const fromNumber = call.from && call.from.phoneNumber;
          const toNumber = call.to && call.to.phoneNumber;
          return {
            ...call,
            fromMatches: (fromNumber && contactCache && contactCache.dataMap[fromNumber]) || [],
            toMatches: (toNumber && contactCache && contactCache.dataMap[toNumber]) || [],
            activityMatches: (activityCache && activityCache.dataMap[call.sessionId]) || [],
          };
        })
      )
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
          }
          if (call.to && call.to.phoneNumber) {
            addIfNotExist(call.to.phoneNumber);
          }
        });
        return output;
      }
    );

    if (this._contactMatcher) {
      this._contactMatcher.addQuerySource({
        getQueriesFn: this._selectors.uniqueNumbers,
        readyCheckFn: () => (
          this._activeCalls.ready &&
          this._detailedPresence.ready &&
          this._regionSettings.ready
        ),
      });
    }
    this.addSelector('sessionIds',
      () => this._detailedPresence.calls,
      calls => calls.map(call => call.sessionId)
    );
    if (this._activityMatcher) {
      this._activityMatcher.addQuerySource({
        getQueriesFn: this._selectors.sessionIds,
        readyCheckFn: () => this._detailedPresence.ready,
      });
    }

    this._lastProcessedNumbers = null;
  }

  _onStateChange = async () => {
    if (
      this._detailedPresence.ready &&
      this._activeCalls.ready &&
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
        !this._detailedPresence.ready ||
        !this._activeCalls.ready ||
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
