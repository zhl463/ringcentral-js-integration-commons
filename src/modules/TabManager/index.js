import RcModule from '../../lib/RcModule';
import Tabbie from '../../lib/Tabbie';
import moduleStatus from '../../enums/moduleStatus';
import actionTypes from './actionTypes';
import getTabManagerReducer from './getTabManagerReducer';


export default class TabManager extends RcModule {
  constructor({
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._tabbie = new Tabbie({
      prefix: this.prefix,
    });
    this._reducer = getTabManagerReducer(this.actionTypes);
  }
  async initialize() {
    this.store.dispatch({
      type: this.actionTypes.initSuccess,
      active: await this._tabbie.checkIsMain(),
    });
    if (this._tabbie.enabled) {
      this._tabbie.on('mainTabIdChanged', async mainTabId => {
        this.store.dispatch({
          type: this.actionTypes.mainTabIdChanged,
          mainTabId,
          active: await this._tabbie.checkIsMain(),
        });
      });
      this._tabbie.on('event', (event, ...args) => {
        this.store.dispatch({
          type: this.actionTypes.event,
          event,
          args,
        });
      });
    }
  }

  send(event, ...args) {
    this._tabbie.send(event, ...args);
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.state.status === moduleStatus.ready;
  }

  get active() {
    return this.state.active;
  }

  get event() {
    return this.state.event;
  }
}
