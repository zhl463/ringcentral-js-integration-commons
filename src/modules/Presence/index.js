import RcModule from '../../lib/RcModule';
import getPresenceReducer from './getPresenceReducer';
import actionTypes from './actionTypes';
import loginStatus from '../Auth/loginStatus';
import moduleStatus from '../../enums/moduleStatus';

const presenceEndPoint = /.*\/presence(\?.*)?/;

export default class Presence extends RcModule {
  constructor({
    auth,
    client,
    subscription,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._auth = auth;
    this._client = client;
    this._subscription = subscription;

    this._reducer = getPresenceReducer(this.actionTypes);
  }
  initialize() {
    this.store.subscribe(async () => {
      if (
        this._auth.loginStatus === loginStatus.loggedIn &&
        this._subscription.ready &&
        this.status === moduleStatus.pending
      ) {
        this.store.dispatch({
          type: this.actionTypes.init,
        });
        await this.fetch();
        this._subscription.subscribe('/account/~/extension/~/presence');
        this.store.dispatch({
          type: this.actionTypes.initSuccess,
        });
      } else if (
        (this._auth.loginStatus !== loginStatus.loggedIn ||
        !this._subscription.ready) &&
        this.ready
      ) {
        this.store.dispatch({
          type: this.actionTypes.resetSuccess,
        });
      } else if (
        this.ready &&
        this._subscription.message &&
        presenceEndPoint.test(this._subscription.message.event)
      ) {
        this.store.dispatch({
          type: this.actionTypes.notification,
          dndStatus: this._subscription.message.body && this._subscription.message.body.dndStatus,
        });
      }
    });
  }
  async _fetch() {
    this.store.dispatch({
      type: this.actionTypes.fetch,
    });
    try {
      const ownerId = this._auth.ownerId;
      const data = await this._client.account().extension().presence().get();
      if (ownerId === this._auth.ownerId) {
        this.store.dispatch({
          type: this.actionTypes.fetchSuccess,
          dndStatus: data.dndStatus,
        });
      }
      this._promise = null;
    } catch (error) {
      this._promise = null;
      this.store.dispatch({
        type: this.actionTypes.fetchError,
        error,
      });
      throw error;
    }
  }
  fetch() {
    if (!this._promise) {
      this._promise = this._fetch();
    }
    return this._promise;
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.state.status === moduleStatus.ready;
  }

  get dndStatus() {
    return this.state.dndStatus;
  }
}
