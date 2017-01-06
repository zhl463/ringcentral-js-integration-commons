import RcModule from '../../lib/RcModule';
import actionTypes from './actionTypes';
import moduleStatus from '../../enums/moduleStatus';
import getConnectivityMonitorReducer from './getConnectivityMonitorReducer';

export default class ConnectivityMonitor extends RcModule {
  constructor({
    client,
    environment,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._client = client;
    this._environment = environment;
    this._reducer = getConnectivityMonitorReducer(this.actionTypes);
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
    }
  }
  _requestErrorHandler = (apiResponse) => {
    if (
      apiResponse instanceof Error &&
      apiResponse.message === 'Failed to fetch' &&
      this.connectivity
    ) {
      this.store.dispatch({
        type: this.actionTypes.connectFail,
      });
    }
  }
  _bindHandlers() {
    const client = this._client.service.platform().client();
    client.on(client.events.requestSuccess, this._requestSuccessHandler);
    client.on(client.events.requestError, this._requestErrorHandler);
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
