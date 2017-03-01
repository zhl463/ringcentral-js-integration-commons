import 'core-js/fn/array/find';
import RcModule from '../../lib/RcModule';
import moduleStatus from '../../enums/moduleStatus';
import actionTypes from './actionTypes';
import getCallMonitorReducer from './getCallMonitorReducer';
import normalizeNumber from '../../lib/normalizeNumber';
import {
  sortByStartTime,
} from '../../lib/callLogHelpers';
import ensureExist from '../../lib/ensureExist';


export default class CallMonitor extends RcModule {
  constructor({
    accountInfo,
    detailedPresence,
    activeCalls,
    activityMatcher,
    contactMatcher,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._accountInfo = this::ensureExist(accountInfo, 'accountInfo');
    this._detailedPresence = this::ensureExist(detailedPresence, 'detailedPresence');
    this._activeCalls = this::ensureExist(activeCalls, 'activeCalls');
    this._contactMatcher = contactMatcher;
    this._activityMatcher = activityMatcher;
    this._reducer = getCallMonitorReducer(this.actionTypes);
    this.addSelector('normalizedCalls',
      () => this._detailedPresence.calls,
      () => this._activeCalls.calls,
      () => this._accountInfo.country.isoCode,
      (callsFromPresence, callsFromActiveCalls, countryCode) => (
        callsFromPresence.map((call) => {
          const activeCall = call.inboundLeg && callsFromActiveCalls.find(item => item.sessionId === call.inboundLeg.sessionId);

          // use account countryCode to normalize number due to API issues [RCINT-3419]
          const fromNumber = normalizeNumber({
            phoneNumber: call.from && call.from.phoneNumber,
            countryCode,
          });
          const toNumber = normalizeNumber({
            phoneNumber: call.to && call.to.phoneNumber,
            countryCode,
          });

          return {
            ...call,
            from: {
              ...((activeCall && activeCall.to) || {}),
              phoneNumber: fromNumber,
            },
            to: {
              ...((activeCall && activeCall.from) || {}),
              phoneNumber: toNumber,
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
        }).sort(sortByStartTime)
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
          this._accountInfo.ready &&
          this._activeCalls.ready &&
          this._detailedPresence.ready
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
      this._accountInfo.ready &&
      this._detailedPresence.ready &&
      this._activeCalls.ready &&
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
        !this._accountInfo.ready ||
        !this._detailedPresence.ready ||
        !this._activeCalls.ready ||
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
