import RcModule from '../../lib/RcModule';
import actionTypes from './actionTypes';
import moduleStatus from '../../enums/moduleStatus';
import getConnectivityMonitorReducer from './getConnectivityMonitorReducer';
import connectivityMonitorMessages from './connectivityMonitorMessages';

const DEFAULT_TIME_TO_RETRY = 5000;

export default class ConnectivityMonitor extends RcModule {
  constructor({
    alert,
    client,
    environment,
    timeToRetry = DEFAULT_TIME_TO_RETRY,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._alert = alert;
    this._client = client;
    this._environment = environment;
    this._timeToRetry = timeToRetry;
    this._reducer = getConnectivityMonitorReducer(this.actionTypes);
    this._timeoutId = null;
  }
  initialize() {
    this.store.subscribe(async () => {
      if (
        !this.ready &&
        (!this._environment || this._environment.ready)
      ) {
        this._bindHandlers();
        this.store.dispatch({
          type: this.actionTypes.initSuccess,
        });
      } else if (
        this.ready &&
        this._environment && this._environment.changed
      ) {
        this._bindHandlers();
      }
    });
  }
  _requestSuccessHandler = () => {
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
    this._clearTimeout();
  }
  showAlert() {
    if (!this.connectivity && this._alert) {
      this._alert.danger({
        message: connectivityMonitorMessages.disconnected,
        ttl: 0,
        allowDuplicates: false,
      });
    }
  }
  _requestErrorHandler = (apiResponse) => {
    if (
      apiResponse instanceof Error &&
      apiResponse.message === 'Failed to fetch'
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
      client.off(client.events.requestSuccess, this._requestSuccessHandler);
      client.off(client.events.requestError, this._requestErrorHandler);
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
    if (this._timeoutId) clearTimeout(this._timeoutId);
  }
  _retry(t = this._timeToRetry) {
    this._clearTimeout();
    this._timeoutId = setTimeout(() => {
      this._timeoutId = null;
      this._checkConnection();
    }, t);
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.state.status === moduleStatus.ready;
  }

  get connectivity() {
    return this.state.connectivity;
  }
}
