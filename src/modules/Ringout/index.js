import RcModule from '../../lib/RcModule';
import moduleStatus from '../../enums/moduleStatus';
import actionTypes from './actionTypes';
import getRingoutReducer from './getRingoutReducer' ;
import ringoutErrors from './ringoutErrors';
import sleep from '../../lib/sleep';

const DEFAULT_MONITOR_INTERVAL = 2500;
const DEFAULT_TIME_BETWEEN_CALLS = 10000;

export default class Ringout extends RcModule {
  constructor({
    auth,
    client,
    monitorInterval = DEFAULT_MONITOR_INTERVAL,
    timeBetweenCalls = DEFAULT_TIME_BETWEEN_CALLS,
    ...options
  }) {
    super({
      ...options,
      actionTypes
    });
    this._auth = auth;
    this._client = client;
    this._reducer = getRingoutReducer(this.actionTypes);
    this._monitorInterval = monitorInterval;
    this._timeBetweenCalls = timeBetweenCalls;
  }

  initialize() {
    this.store.subscribe(() => {
      if (this._auth.loggedIn && !this.ready) {
        this.store.dispatch({
          type: this.actionTypes.initSuccess
        });
      } else if (!this._auth.loggedIn && this.ready) {
        this.store.dispatch({
          type: this.actionTypes.resetSuccess
        });
      }
    });
  }

  async makeCall({ fromNumber, toNumber, prompt }) {
    if (this.status === moduleStatus.ready) {
      this.store.dispatch({
        type: this.actionTypes.startToConnect
      });
      try {
        const resp = await this._client.account().extension().ringout().post({
          from: { phoneNumber: fromNumber },
          to: { phoneNumber: toNumber },
          playPrompt: prompt
        });
        const startTime = Date.now();
        await this._monitorRingout(resp.id, startTime);
        this.store.dispatch({
          type: this.actionTypes.connectSuccess
        });
      } catch (e) {
        this.store.dispatch({
          type: this.actionTypes.connectError
        });
        if (e.message !== ringoutErrors.pollingCancelled) {
          throw e;
        }
      }
    } else {
      // TODO: Need to dispatch a generic error action
    }
  }

  async _monitorRingout(ringoutId, startTime) {
    let callerStatus = await this._fetchRingoutStatus(ringoutId);
    while (callerStatus === 'InProgress') {
      if (Date.now() - startTime > this._timeBetweenCalls) {
        throw new Error(ringoutErrors.pollingCancelled);
      }
      await sleep(this._monitorInterval);
      callerStatus = await this._fetchRingoutStatus(ringoutId);
    }
    if (callerStatus !== 'Success' && callerStatus !== 'NoAnswer') {
      throw new Error(ringoutErrors.firstLegConnectFailed);
    }
  }

  async _fetchRingoutStatus(ringoutId) {
    try {
      const resp = await this._client.account().extension().ringout(ringoutId).get();
      return resp.status.callerStatus;
    } catch (e) {
      const exception = new Error(ringoutErrors.pollingFailed);
      exception.error = e;
      throw exception;
    }
  }

  get status() {
    return this.state.status;
  }

  get ringoutStatus() {
    return this.state.ringoutStatus;
  }

  get ready() {
    return this.state.status === moduleStatus.ready;
  }

}
