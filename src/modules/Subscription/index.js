import RcModule from '../../lib/RcModule';
import subscriptionActionTypes from './subscriptionActionTypes';
import subscriptionStatus from './subscriptionStatus';
import getSubscriptionReducer from './getSubscriptionReducer';

export default class Subscription extends RcModule {
  constructor({
    auth,
    client,
    storage,
    ...options,
  }) {
    super({
      ...options,
      actionTypes: subscriptionActionTypes,
    });
    this._auth = auth;
    this._client = client;
    this._storage = storage;
    this._subscription = null;
    this._storageKey = 'subscription-cache';
    this._reducer = getSubscriptionReducer(this.prefix);
  }
  initialize() {
    this.store.subscribe(async () => {
      if (
        this._auth.status === this._auth.authStatus.loggedIn &&
        this._storage.status === this._storage.storageStatus.ready &&
        this.status === subscriptionStatus.pending
      ) {
        // init
        if (this._subscription) {
          await this.reset();
        }
        this._subscription = this._client.createSubscription();

        // reuse cached subscription id
        // we're not reusing the filters however
        if (this._storage.hasItem(this._storageKey)) {
          try {
            this._subscription.setSubscription(this._storage.getItem(this._storageKey));
          } catch (error) {
            // cached subscription already expired
          }
        }

        this._subscription.on(this._subscription.events.notification, message => {
          this.store.dispatch({
            type: this.actionTypes.notification,
            message,
          });
        });
        this._subscription.on(this._subscription.events.removeSuccess, () => {
          this._subscription.reset();
          this._storage.removeItem(this._storageKey);
          this.store.dispatch({
            type: this.actionTypes.removeSuccess,
          });
        });
        this._subscription.on(this._subscription.events.removeError, error => {
          this.store.dispatch({
            type: this.actionTypes.removeError,
            error,
          });
        });
        this._subscription.on(this._subscription.events.renewSuccess, () => {
          this._storage.setItem(this._storageKey, this._subscription.subscription());
          this.store.dispatch({
            type: this.actionTypes.renewSuccess,
          });
        });
        this._subscription.on(this._subscription.events.renewError, error => {
          this._storage.removeItem(this._storageKey);
          this.store.dispatch({
            type: this.actionTypes.renewError,
            error,
          });
          // TODO handle 429 error
          // try to re-subscribe
          this._subscription.reset().setEventFilters(this.filters).register().catch(e => {});
        });
        this._subscription.on(this._subscription.events.subscribeSuccess, () => {
          this._storage.setItem(this._storageKey, this._subscription.subscription());
          this.store.dispatch({
            type: this.actionTypes.subscribeSuccess,
          });
        });
        this._subscription.on(this._subscription.events.subscribeError, error => {
          this._storage.removeItem(this._storageKey);
          this.store.dispatch({
            type: this.actionTypes.subscribeError,
            error,
          });
        });
        this.store.dispatch({
          type: this.actionTypes.init,
        });
      } else if (
        this._storage.status === this._storage.storageStatus.pending &&
        this.status !== subscriptionStatus.pending &&
          this.status !== subscriptionStatus.resetting
      ) {
        // reset
        this.reset();
      }
    });
    this._auth.addBeforeLogoutHandler(async () => {
      if (this._resetPromise) {
        await this._resetPromise;
      } else if (
        this.status !== subscriptionStatus.pending &&
        this.status !== subscriptionStatus.resetting
      ) {
        await this.reset();
      }
    });
  }
  get status() {
    return this.state.status;
  }

  get filters() {
    return this.state.filters;
  }

  get message() {
    return this.state.message;
  }

  get error() {
    return this.state.error;
  }

  get subscriptionStatus() {
    return subscriptionStatus;
  }
  async subscribe(events) {
    if (this.status === subscriptionStatus.pending) {
      throw new Error('Subscription module is not ready');
    }
    const oldFilters = this.filters;
    this.store.dispatch({
      type: this.actionTypes.addFilters,
      filters: events,
    });
    if (this.filters.length !== oldFilters.length) {
      this._subscription.setEventFilters([...this.filters]);
      try {
        await this._subscription.register();
      } catch (error) {
        /* falls through */
      }
    }
  }
  async unsubscribe(events) {
    if (this.status === subscriptionStatus.pending) {
      throw new Error('Subscription module is not ready');
    }
    const oldFilters = this.filters;
    this.store.dispatch({
      type: this.actionTypes.removeFilters,
      filters: events,
    });
    if (this.filters.length !== oldFilters) {
      this._subscription.setEventFilters([...this.filters]);
      if (this.filters.length > 0) {
        await this._subscription.register();
      } else {
        await this._subscription.remove();
      }
    }
  }
  async reset() {
    if (!this._resetPromise) {
      this._resetPromise = (async () => {
        this.store.dispatch({
          type: this.actionTypes.reset,
        });
        if (this._subscription) {
          try {
            if (this.status === subscriptionStatus.subscribed) {
              await this._subscription.remove();
            } else {
              this._subscription.reset();
            }
          } catch (e) {
                // TODO
          }
          this._subscription = null;
        }
        this.store.dispatch({
          type: this.actionTypes.resetSuccess,
        });
        this._resetPromise = null;
      })();
    }
    await this._resetPromise;
  }
}
