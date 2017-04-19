import RcModule from '../../lib/RcModule';
import moduleStatus from '../../enums/moduleStatus';
import actionTypes from './actionTypes';

import getActiveCallReducer from './getActiveCallReducer';

export default class ActiveCall extends RcModule {
  constructor({
    webphone,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });

    this._webphone = webphone;
    this._reducer = getActiveCallReducer(this.actionTypes);

    this._session = null;

    this.toggleMinimized = this.toggleMinimized.bind(this);
    this.hangup = this.hangup.bind(this);
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
  }

  _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
    } else if (this._shouldReset()) {
      this.store.dispatch({
        type: this.actionTypes.resetSuccess,
      });
    } else if (this.ready) {
      if (this._session !== this._webphone.activeSession) {
        this._session = this._webphone.activeSession;
        if (this._session === null) {
          this.store.dispatch({
            type: this.actionTypes.destroySession,
          });
        } else {
          this.store.dispatch({
            type: this.actionTypes.newSession,
            id: this._session.id,
          });
        }
      }
    }
  }

  _shouldInit() {
    return (
      !this.ready &&
      this._webphone.ready
    );
  }

  _shouldReset() {
    return (
      this.ready &&
      !this._webphone.ready
    );
  }

  toggleMinimized() {
    this.store.dispatch({
      type: this.actionTypes.toggleMinimized,
    });
  }

  hangup() {
    if (!this._session || !this._webphone) {
      return;
    }
    this._webphone.hangup(this._webphone.activeSession);
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.state.status === moduleStatus.ready;
  }

  get minimized() {
    return this.state.minimized;
  }

  get active() {
    return !!this.state.sessionId;
  }
}
