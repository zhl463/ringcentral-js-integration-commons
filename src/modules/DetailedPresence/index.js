import Presence from '../Presence';
import moduleStatus from '../../enums/moduleStatus';
import actionTypes from './actionTypes';
import getDetailedPresenceReducer from './getDetailedPresenceReducer';
import telephonyStatuses from '../../enums/telephonyStatuses';
import subscriptionFilters from '../../enums/subscriptionFilters';

const presenceRegExp = /\/presence(\?.*)?/;

export default class DetailedPresence extends Presence {
  constructor({
    auth,
    client,
    subscription,
    connectivityMonitor,
    onRinging,
    onNewCall,
    onCallUpdated,
    onCallEnded,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._auth = auth;
    this._client = client;
    this._subscription = subscription;
    this._connectivityMonitor = connectivityMonitor;
    this._onRinging = onRinging;
    this._onNewCall = onNewCall;
    this._onCallUpdated = onCallUpdated;
    this._onCallEnded = onCallEnded;

    this._reducer = getDetailedPresenceReducer(this.actionTypes);
    this._lastMessage = null;
    this.addSelector('sessionIdList',
      () => this.state.calls,
      calls => calls.map(call => call.sessionId),
    );
    this._lastProcessedCalls = [];
    this._lastTelephonyStatus = null;
  }

  _subscriptionHandler = (message) => {
    if (presenceRegExp.test(message.event) && message.body) {
      const {
        activeCalls,
        dndStatus,
        telephonyStatus,
      } = message.body;
      this.store.dispatch({
        type: this.actionTypes.notification,
        activeCalls,
        dndStatus,
        telephonyStatus,
        timestamp: Date.now(),
      });
    }
  }
  _onStateChange = async () => {
    if (
      this._auth.loggedIn &&
      this._subscription.ready &&
      (!this._connectivityMonitor || this._connectivityMonitor.ready) &&
      this.status === moduleStatus.pending
    ) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
      if (this._connectivityMonitor) {
        this._connectivity = this._connectivityMonitor.connectivity;
      }
      await this.fetch();
      this._subscription.subscribe(subscriptionFilters.detailedPresence);
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
    } else if (
      (
        !this._auth.loggedIn ||
        !this._subscription.ready ||
        (this._connectivityMonitor && !this._connectivityMonitor.ready)
      ) &&
      this.ready
    ) {
      this._lastProcessedCalls = [];
      this.store.dispatch({
        type: this.actionTypes.resetSuccess,
      });
    } else if (
      this.ready &&
      this._subscription.ready &&
      this._subscription.message &&
      this._subscription.message !== this._lastMessage
    ) {
      this._lastMessage = this._subscription.message;
      this._subscriptionHandler(this._lastMessage);
    } else if (
      this.ready &&
      this._connectivityMonitor &&
      this._connectivityMonitor.ready &&
      this._connectivity !== this._connectivityMonitor.connectivity
    ) {
      this._connectivity = this._connectivityMonitor.connectivity;
      // fetch data on regain connectivity
      if (this._connectivity) {
        this._fetch();
      }
    }
    if (
      this.ready &&
      this._lastProcessedCalls !== this.calls
    ) {
      const oldCalls = [...this._lastProcessedCalls];
      this._lastProcessedCalls = this.calls;

      this.calls.forEach((call) => {
        const oldCallIndex = oldCalls.findIndex(item => item.sessionId === call.sessionId);
        if (oldCallIndex === -1) {
          if (typeof this._onNewCall === 'function') {
            this._onNewCall(call);
          }
        } else {
          const oldCall = oldCalls[oldCallIndex];
          oldCalls.splice(oldCallIndex, 1);
          if (
            call.telephonyStatus !== oldCall.telephonyStatus &&
            typeof this._onCallUpdated === 'function'
          ) {
            this._onCallUpdated(call);
          }
        }
      });
      oldCalls.forEach((call) => {
        if (typeof this._onCallEnded === 'function') {
          this._onCallEnded(call);
        }
      });
    }
    if (
      this.ready &&
      this._lastTelephonyStatus !== this.telephonyStatus
    ) {
      this._lastTelephonyStatus = this.telephonyStatus;
      if (
        this._lastTelephonyStatus === telephonyStatuses.ringing &&
        typeof this._onRinging === 'function'
      ) {
        this._onRinging();
      }
    }
  }

  initialize() {
    this.store.subscribe(this._onStateChange);
  }

  get calls() {
    return this.state.calls;
  }

  get telephonyStatus() {
    return this.state.telephonyStatus;
  }

  get sessionIdList() {
    return this._selectors.sessionIdList();
  }

  async _fetch() {
    this.store.dispatch({
      type: this.actionTypes.fetch,
    });
    const ownerId = this._auth.ownerId;
    try {
      const {
        activeCalls,
        dndStatus,
        telephonyStatus,
      } = (await this._client.service.platform()
        .get(subscriptionFilters.detailedPresence)).json();
      if (this._auth.ownerId === ownerId) {
        this.store.dispatch({
          type: this.actionTypes.fetchSuccess,
          activeCalls,
          dndStatus,
          telephonyStatus,
          timestamp: Date.now(),
        });
        this._promise = null;
      }
    } catch (error) {
      if (this._auth.ownerId === ownerId) {
        this.store.dispatch({
          type: this.actionTypes.fetchError,
          error,
        });
        this._promise = null;
      }
    }
  }
}
