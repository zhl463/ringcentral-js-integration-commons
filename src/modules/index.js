import RcModule from 'ringcentral-integration/lib/RcModule';
import Enum from 'ringcentral-integration/lib/Enum';
import { combineReducers } from 'redux';
import Tabbie from '../../lib/Tabbie';
import moduleStatus from '../../enums/moduleStatus';

const actionTypes = new Enum([
  'init',
  'mainTabIdChanged',
  'event',
], 'active-tab');

function getEventReducer(types) {
  return (state = null, { type, event, args }) => {
    if (type === types.event) {
      return {
        event,
        args,
      };
    }
    return null;
  };
}

function getStatusReducer(types) {
  return (state = moduleStatus.pending, { type }) => {
    switch (type) {
      case types.init:
        return moduleStatus.ready;
      default:
        return state;
    }
  };
}
function getActiveReducer(types) {
  return (state = false, { type, active }) => {
    switch (type) {
      case types.init:
      case types.mainTabIdChanged:
        return active;
      default:
        return state;
    }
  };
}

function getTabManagerReducer(types) {
  return combineReducers({
    status: getStatusReducer(types),
    active: getActiveReducer(types),
    event: getEventReducer(types),
  });
}

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
      type: this.actionTypes.init,
      active: await this._tabbie.getIsMain(),
    });
    if (this._tabbie.enabled) {
      this._tabbie.on('mainTabIdChanged', async mainTabId => {
        this.store.dispatch({
          type: this.actionTypes.mainTabIdChanged,
          mainTabId,
          active: await this._tabbie.getIsMain(),
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

  get pending() {
    return this.state.status === moduleStatus.pending;
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
