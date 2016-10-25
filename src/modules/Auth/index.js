import RcModule from '../../lib/RcModule';
import getAuthReducer from './getAuthReducer';
import authActionTypes from './authActionTypes';
import authStatus from './authStatus';

/**
 * @class
 * @description Authentication module
 */
export default class Auth extends RcModule {
  /**
   * @constructor
   */
  constructor({ client, ...options } = {}) {
    super({
      ...options,
      actionTypes: authActionTypes,
    });
    this._client = client;
    this._reducer = getAuthReducer(this.prefix);
    this._beforeLogoutHandlers = new Set();
  }

  get ownerId() {
    return this.state.ownerId;
  }

  get status() {
    return this.state.status;
  }

  get error() {
    return this.state.error;
  }

  get isFreshLogin() {
    return this.state.freshLogin;
  }

  get authStatus() {
    return authStatus;
  }

  /**
   * @function
   * @param {String} options.username
   * @param {String} options.password
   * @param {String} options.extension
   * @param {Booleal|Number} options.remember
   * @param {String} params.code,
   * @param {String} params.redirectUri,
   * @return {Promise}
   * @description Login function using username and password
   */
  async login({ username, password, extension, remember, code, redirectUri }) {
    this.store.dispatch({
      type: this.actionTypes.login,
    });
    return await this._client.login({
      username,
      password,
      extension,
      remember,
      code,
      redirectUri,
    });
  }
  initialize() {
    const platform = this._client.service.platform();
    platform.on(platform.events.loginSuccess, () => {
      this.store.dispatch({
        type: this.actionTypes.loginSuccess,
        token: platform.auth().data(),
      });
    });
    platform.on(platform.events.loginError, error => {
      this.store.dispatch({
        type: this.actionTypes.loginError,
        error,
      });
    });
    platform.on(platform.events.logoutSuccess, () => {
      this.store.dispatch({
        type: this.actionTypes.logoutSuccess,
      });
    });
    platform.on(platform.events.logoutError, error => {
      this.store.dispatch({
        type: this.actionTypes.logoutError,
        error,
      });
    });
    platform.on(platform.events.refreshSuccess, () => {
      this.store.dispatch({
        type: this.actionTypes.refreshSuccess,
        token: platform.auth().data(),
      });
    });
    platform.on(platform.events.refreshError, error => {
      this.store.dispatch({
        type: this.actionTypes.refreshError,
        error,
      });
    });
    (async () => {
      const loggedIn = await platform.loggedIn();
      this.store.dispatch({
        type: this.actionTypes.init,
        loggedIn,
        token: loggedIn ? platform.auth().data() : null,
      });
    })();
  }

  /**
   * @function
   * @param {String} options.redirectUri
   * @param {String} options.brandId
   * @param {Boolean} options.force
   * @return {String}
   * @description get OAuth page url
   */
  getLoginUrl({ redirectUri, state, brandId, display, prompt, force }) {
    return `${this._client.loginUrl({
      redirectUri,
      state,
      brandId,
      display,
      prompt,
    })}${force ? '&force' : ''}`;
  }
  /**
   * @function
   * @param {String} callbackUri
   * @return {String} code
   */
  parseCallbackUri(callbackUri) {
    return this._client.getAuthCode(callbackUri);
  }

  async logout() {
    this.store.dispatch({
      type: this.actionTypes.beforeLogout,
    });
    const handlers = [...this._beforeLogoutHandlers];
    try {
      for (const handler of handlers) {
        await (async () => handler())();
      }
    } catch (error) {
      this.store.dispatch({
        type: this.actionTypes.cancelLogout,
        error,
      });
    }
    this.store.dispatch({
      type: this.actionTypes.logout,
    });
    return await this._client.logout();
  }

   /**
   * @function
   * @param {Function} handler
   * @returns {Function}
   */
  addBeforeLogoutHandler(handler) {
    this._beforeLogoutHandlers.add(handler);
    return () => {
      this.removeBeforeLogoutHandler(handler);
    };
  }

   /**
   * @function
   * @param {Function} handler
   */
  removeBeforeLogoutHandler(handler) {
    this._beforeLogoutHandlers.remove(handler);
  }

  async isLoggedIn() {
    return await this._client.service.platform().loggedIn();
  }
}
