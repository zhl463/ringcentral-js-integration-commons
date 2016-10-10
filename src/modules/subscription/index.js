import RcModule, { initFunction } from '../../lib/rc-module';
import SymbolMap from 'data-types/symbol-map';
import KeyValueMap from 'data-types/key-value-map';
import subscriptionActions from './subscription-actions';
import getSubscriptionReducer from './get-subscription-reducer';
import subscriptionEvents from './subscription-events';
import subscriptionStatus from './subscription-status';
import { proxify } from '../proxy';

const symbols = new SymbolMap([
  'auth',
  'api',
  'storage',
  'subscription',
]);

const keys = new KeyValueMap({
  storage: 'subscription-cache',
});

export default class Subscription extends RcModule {
  constructor({
    auth,
    api,
    storage,
    ...options,
  }) {
    super({
      ...options,
      actions: subscriptionActions,
    });

    this[symbols.auth] = auth;
    this[symbols.api] = api;
    this[symbols.storage] = storage;
    this[symbols.subscription] = null;

    // send events based on state change
    this.on('state-change', ({ oldState, newState }) => {
      if (oldState) {
        if (oldState.status !== newState.status) {
          this.emit(
            subscriptionEvents.statusChange,
            {
              oldStatus: oldState.status,
              newStatus: newState.status,
            },
          );
          this.emit(newState.status);
        }
        if (newState.lastMessage && oldState.lastMessage !== newState.lastMessage) {
          this.emit(subscriptionEvents.notification, newState.lastMessage);
        }
        if (
          oldState.status === subscriptionStatus.pending &&
          oldState.status !== newState.status
        ) {
          this.emit(subscriptionEvents.ready);
        }
      }
    });
  }
  @initFunction
  init() {
    const storage = this[symbols.storage];
    storage.on(storage.storageEvents.ready, async () => {
      if (this.base) {
        await this.reset();
      }
      this[symbols.subscription] = this[symbols.api].createSubscription();
      // cached subscription
      const cachedSubscription = storage.getItem(keys.storage);
      if (cachedSubscription) {
        this.base.setSubscription(cachedSubscription);
      }
      this.base.on(this.base.events.notification, message => {
        this.store.dispatch({
          type: this.actions.notification,
          message,
        });
      });
      this.base.on(this.base.events.removeSuccess, async () => {
        this.base.reset();
        await storage.removeItem(keys.storage);
        this.store.dispatch({
          type: this.actions.removeSuccess,
        });
      });
      this.base.on(this.base.events.removeError, error => {
        this.store.disptach({
          type: this.actions.removeError,
          error,
        });
      });
      this.base.on(this.base.events.renewSuccess, async () => {
        await storage.setItem(keys.storage, this.base.subscription());
        this.store.dispatch({
          type: this.actions.renewSuccess,
        });
      });
      this.base.on(this.base.events.renewError, async error => {
        storage.removeItem(keys.storage);
        this.store.dispatch({
          type: this.actions.renewError,
          error,
        });
        this.base.reset().setEventFilters(this.filters).register().catch(e => { });
      });
      this.base.on(this.base.events.subscribeSuccess, async () => {
        await storage.setItem(keys.storage, this.base.subscription());
        this.store.dispatch({
          type: this.actions.subscribeSuccess,
        });
      });
      this.base.on(this.base.events.subscribeError, async error => {
        await storage.removeItem(keys.storage);
        this.store.dispatch({
          type: this.actions.subscribeError,
          error,
        });
      });
      this.store.dispatch({
        type: this.actions.ready,
      });
    });

    this[symbols.auth].on(this[symbols.auth].authEvents.loggedOut, async () => {
      await this.reset();
    });

    this[symbols.auth].addBeforeLogoutHandler(async () => {
      await this.reset();
    });
  }

  get reducer() {
    return getSubscriptionReducer(this.prefix);
  }

  get status() {
    return this.state.status;
  }

  get filters() {
    return this.state.filters;
  }

  get base() {
    return this[symbols.subscription];
  }

  get subscriptionEvents() {
    return subscriptionEvents;
  }
  static get subscriptionEvents() {
    return subscriptionEvents;
  }
  get subscriptionStatus() {
    return subscriptionStatus;
  }
  static get subscriptionStatus() {
    return subscriptionStatus;
  }

  @proxify
  async subscribe(events) {
    if (this.status === subscriptionStatus.pending) {
      throw new Error('Called before module is ready');
    }
    const newFilters = [...(new Set([...this.filters].concat(events)))];
    if (newFilters.length !== this.filters.length) {
      this.store.dispatch({
        type: this.actions.setFilters,
        filters: newFilters,
      });
      this.base.setEventFilters(newFilters);
      await this.base.register();
    }
  }

  @proxify
  async unsubscribe(events) {
    if (this.status === subscriptionStatus.pending) {
      throw new Error('Called before module is ready');
    }
    const newFilters = [...(new Set([...this.filters]).remove([].concat(events)))];
    if (newFilters.length !== this.filters.length) {
      this.store.dispatch({
        type: this.actions.setFilters,
        filters: newFilters,
      });
      this.base.setEventFilters(newFilters);
      if (newFilters.length > 0) {
        await this.base.register();
      } else {
        await this.base.remove();
      }
    }
  }

  @proxify
  async reset() {
    if (this.base) {
      try {
        if (this.status === subscriptionStatus.subscribed) {
          await this.base.remove();
        } else {
          await this.base.reset();
        }
      } catch (e) {
        // TODO
      }
      this[symbols.subscription] = null;
      this.store.dispatch({
        type: this.actions.reset,
      });
    }
  }
}
