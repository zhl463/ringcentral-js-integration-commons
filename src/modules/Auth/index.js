import SymbolMap from 'data-types/symbol-map';
import Loganberry from 'loganberry';
import RcModule, { initFunction } from '../../lib/RcModule';
import { proxify, throwOnProxy } from '../../lib/proxy';
import authStatus from './authStatus';
import authActions from './authActions';
import getAuthReducer from './getAuthReducer';
import authEvents from './authEvents';

const logger = new Loganberry({
  prefix: 'auth',
});

const symbols = new SymbolMap([
  'api',
  'emitter',
  'beforeLogoutHandlers',
  'init',
]);

/**
 * @class
 * @description Authentication module
 */
export default class Auth extends RcModule {
  /**
   * @function
   */
  constructor(options) {
    super({
      ...options,
      actions: authActions,
    });

    const {
      api,
    } = options;
    this.on('state-change', ({ oldState, newState }) => {
      if (!oldState || oldState.status !== newState.status) {
        this.emit(
          authEvents.authStatusChange,
          {
            oldStatus: oldState && oldState.status,
            newStatus: newState.status,
          }
        );
        if (!newState.error) {
          this.emit(newState.status);
        }
      }
      if (newState.error && (!oldState || oldState.error !== newState.error)) {
        this.emit(authEvents.error, newState.error);
      }
    });
    this[symbols.api] = api;
  }
  @initFunction
  init() {
    const platform = this[symbols.api].service.platform();
    this[symbols.beforeLogoutHandlers] = new Set();

    // load info on login
    platform.on(platform.events.loginSuccess, () => {
      this.store.dispatch({
        type: this.actions.loginSuccess,
        token: platform.auth().data(),
      });
    });
    // loginError
    platform.on(platform.events.loginError, error => {
      this.store.dispatch({
        type: this.actions.loginError,
        error,
      });
    });
    // unload info on logout
    platform.on(platform.events.logoutSuccess, () => {
      this.store.dispatch({
        type: this.actions.logoutSuccess,
      });
    });

    platform.on(platform.events.logoutError, error => {
      this.store.dispatch({
        type: this.actions.logoutError,
        error,
      });
    });
    platform.on(platform.events.refreshSuccess, () => {
      this.store.dispatch({
        type: this.actions.refreshSuccess,
        token: platform.auth().data(),
      });
    });
    platform.on(platform.events.refreshError, error => {
      this.store.dispatch({
        type: this.actions.refreshError,
        error,
      });
    });

    // load info if already logged in
    (async () => {
      const loggedIn = await platform.loggedIn();
      this.store.dispatch({
        type: this.actions.init,
        status: loggedIn ? authStatus.loggedIn : authStatus.notLoggedIn,
        token: loggedIn ? platform.auth().data() : null,
      });
    })();
  }

  get reducer() {
    return getAuthReducer(this.prefix);
  }
  /**
   * @function
   * @async
   * @description Login function using username and password
   */
  @proxify
  async login({ username, password, extension, remember }) {
    this.store.dispatch({
      type: this.actions.login,
      payload: {
        username,
        password,
        extension,
        remember,
      },
    });
    return await this[symbols.api].login({
      username,
      password,
      extension,
      remember,
    });
  }

  /**
   * @function
   * @description get OAuth page url
   */
  loginUrl({ redirectUri, state, brandId, display, prompt }) {
    return this[symbols.api].loginUrl({
      redirectUri,
      state,
      brandId,
      display,
      prompt,
    });
  }

  /**
   * @function
   * @param {string} url
   * @return {Object}
   */
  parseCallbackUri({ callbackUri }) {
    return this[symbols.api].getAuthCode(callbackUri);
  }

  /**
   * @function
   * @async
   * @description Authorize using OAauth code
   */
  @proxify
  async authorize({ code, redirectUri }) {
    this.store.dispatch({
      type: this.actions.login,
      payload: {
        code,
        redirectUri,
      },
    });
    return await this[symbols.api].login({
      code,
      redirectUri,
    });
  }

  /**
   * @function
   * @async
   * @description Log the user out
   */
  @proxify
  async logout() {
    // deal with removing subscriptions
    this.store.dispatch({
      type: this.actions.logout,
    });
    const handlers = [...this[symbols.beforeLogoutHandlers]];
    for (const handler of handlers) {
      try {
        // wraps with async so even normal functions can be awaited
        // TODO cancel logout if handler resolves to false
        await (async () => handler())();
      } catch (e) {
        // TODO: should emit error
      }
    }
    return await this[symbols.api].logout();
  }
  /**
   * @function
   * @param {Function} handler
   * @returns {Function}
   */
  @throwOnProxy
  addBeforeLogoutHandler(handler) {
    this[symbols.beforeLogoutHandlers].add(handler);
    return () => {
      this[symbols.beforeLogoutHandlers].remove(handler);
    };
  }
  /**
   * @function
   * @param {Function} handler
   */
  @throwOnProxy
  removeBeforeLogoutHandler(handler) {
    this[symbols.beforeLogoutHandlers].remove(handler);
  }

  get status() {
    return this.state.status;
  }

  get authEvents() {
    return authEvents;
  }

  get authStatus() {
    return authStatus;
  }

  get ownerId() {
    return this.state.token.owner_id;
  }

  @proxify
  async isLoggedIn() {
    return await this[symbols.api].service.platform().loggedIn();
  }
}

