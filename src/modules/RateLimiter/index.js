import RcModule from '../../lib/RcModule';
import actionTypes from './actionTypes';
import moduleStatus from '../../enums/moduleStatus';
import getRateLimiterReducer, {
  getTimestampReducer,
} from './getRateLimiterReducer';
import errorMessages from './errorMessages';

const DEFAULT_THROTTLE_DURATION = 61 * 1000;

export default class RateLimiter extends RcModule {
  constructor({
    client,
    environment,
    globalStorage,
    throttleDuration = DEFAULT_THROTTLE_DURATION,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._client = client;
    this._environment = environment;
    this._storage = globalStorage;
    this._throttleDuration = throttleDuration;
    this._storageKey = 'rateLimiterTimestamp';
    this._reducer = getRateLimiterReducer(this.actionTypes);
    this._storage.registerReducer({
      key: this._storageKey,
      reducer: getTimestampReducer(this.actionTypes),
    });
    this._timeoutId = null;
  }
  initialize() {
    this.store.subscribe(async () => {
      if (
        !this.ready &&
        this._storage.ready &&
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
  _beforeRequestHandler = () => {
    if (this.throttling) {
      throw new Error(errorMessages.rateLimitReached);
    }
  }
  _checkTimestamp = () => {
    if (!this.throttling) {
      this.store.dispatch({
        type: this.actionTypes.stopThrottle,
      });
    }
  }
  _requestErrorHandler = (apiResponse) => {
    if (
      apiResponse instanceof Error &&
      apiResponse.message === 'Request rate exceeded'
    ) {
      this.store.dispatch({
        type: this.actionTypes.startThrottle,
        timestamp: Date.now(),
      });
      setTimeout(this._checkTimestamp, this._throttleDuration);
    }
  }
  _bindHandlers() {
    if (this._unbindHandlers) {
      this._unbindHandlers();
    }
    const client = this._client.service.platform().client();
    client.on(client.events.requestError, this._requestErrorHandler);
    client.on(client.events.beforeRequest, this._beforeRequestHandler);
    this._unbindHandlers = () => {
      client.removeListener(client.events.requestError, this._requestErrorHandler);
      client.removeListener(client.events.beforeRequest, this._beforeRequestHandler);
      this._unbindHandlers = null;
    };
  }

  get status() {
    return this.state.status;
  }

  get timestamp() {
    return this._storage.getItem(this._storageKey);
  }

  get throttling() {
    return Date.now() - this._storage.getItem(this._storageKey) <= this._throttleDuration;
  }

  get ready() {
    return this.state.status === moduleStatus.ready;
  }
}
