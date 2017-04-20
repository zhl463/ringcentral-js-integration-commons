import RcModule from '../../lib/RcModule';
import actionTypes from './actionTypes';
import moduleStatuses from '../../enums/moduleStatuses';
import getConnectivityMonitorReducer from './getConnectivityMonitorReducer';
import connectivityMonitorMessages from './connectivityMonitorMessages';
import ensureExist from '../../lib/ensureExist';

export const DEFAULT_TIME_TO_RETRY = 5 * 1000;
export const DEFAULT_HEART_BEAT_INTERVAL = 60 * 1000;

export default class ConnectivityMonitor extends RcModule {
  constructor({
    alert,
    client,
    environment,
    timeToRetry = DEFAULT_TIME_TO_RETRY,
    heartBeatInterval = DEFAULT_HEART_BEAT_INTERVAL,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._alert = alert;
    this._client = this::ensureExist(client, 'client');
    this._environment = environment;
    this._timeToRetry = timeToRetry;
    this._heartBeatInterval = heartBeatInterval;
    this._reducer = getConnectivityMonitorReducer(this.actionTypes);
    this._retryTimeoutId = null;
    this._lastEnvironmentCounter = 0;

    // auto bind this
    this._beforeRequestHandler = this::this._beforeRequestHandler;
    this._requestSuccessHandler = this::this._requestSuccessHandler;
    this._requestErrorHandler = this::this._requestErrorHandler;
  }
  _shouldInit() {
    return !!(this.pending &&
      (!this._environment || this._environment.ready));
  }
  _shouldRebindHandlers() {
    return !!(this.ready &&
      this._environment &&
      this._environment.ready &&
      this._environment.changeCounter !== this._lastEnvironmentCounter);
  }
  _onStateChange() {
    if (this._shouldInit()) {
      this._bindHandlers();
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
      this._retry();
    } else if (this._shouldRebindHandlers()) {
      this._lastEnvironmentCounter = this._environment.changeCounter;
      this._bindHandlers();
    }
  }
  initialize() {
    this.store.subscribe(() => this._onStateChange());
  }
  _beforeRequestHandler() {
    this._clearTimeout();
  }
  _requestSuccessHandler() {
    if (!this.connectivity) {
      this.store.dispatch({
        type: this.actionTypes.connectSuccess,
      });
      if (this._alert) {
        // dismiss disconnected alerts if found
        const alertIds = this._alert.messages.filter(m => (
          m.message === connectivityMonitorMessages.disconnected
        )).map(m => m.id);
        if (alertIds.length) {
          this._alert.dismiss(alertIds);
        }
      }
    }
    this._retry();
  }
  showAlert() {
    if (!this.connectivity && this._alert) {
      this._alert.danger({
        message: connectivityMonitorMessages.disconnected,
        allowDuplicates: false,
      });
    }
  }
  _requestErrorHandler(error) {
    if (
      !error.apiResponse ||
      !error.apiResponse._response
    ) {
      if (this.connectivity) {
        this.store.dispatch({
          type: this.actionTypes.connectFail,
        });
        this.showAlert();
      }
      this._retry();
    }
  }
  _bindHandlers() {
    if (this._unbindHandlers) {
      this._unbindHandlers();
    }
    const client = this._client.service.platform().client();
    client.on(client.events.requestSuccess, this._requestSuccessHandler);
    client.on(client.events.requestError, this._requestErrorHandler);
    this._unbindHandlers = () => {
      client.removeListener(client.events.requestSuccess, this._requestSuccessHandler);
      client.removeListener(client.events.requestError, this._requestErrorHandler);
      this._unbindHandlers = null;
    };
  }

  async _checkConnection() {
    try {
      // query api info as a test of connectivity
      await this._client.service.platform().get('', null, { skipAuthCheck: true });
    } catch (error) {
      /* falls through */
    }
  }
  _clearTimeout() {
    if (this._retryTimeoutId) {
      clearTimeout(this._retryTimeoutId);
      this._retryTimeoutId = null;
    }
  }
  _retry(t = (this.connectivity ? this._heartBeatInterval : this._timeToRetry)) {
    this._clearTimeout();
    this._retryTimeoutId = setTimeout(() => {
      this._retryTimeoutId = null;
      this._checkConnection();
    }, t);
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

  get connectivity() {
    return this.state.connectivity;
  }
}

