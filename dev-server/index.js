import SDK from 'ringcentral';
import RingCentralClient from 'ringcentral-client';
import { combineReducers, createStore } from 'redux';
import React from 'react';
import ReactDOM from 'react-dom';
import { connect, Provider } from 'react-redux';
import JSONTree from 'react-json-tree';

import RcModule from '../src/lib/RcModule';

import AccountInfo from '../src/modules/AccountInfo';
import Alert from '../src/modules/Alert';
import Auth from '../src/modules/Auth';
import Brand from '../src/modules/Brand';
import DialingPlan from '../src/modules/DialingPlan';
import Environment from '../src/modules/Environment';
import GlobalStorage from '../src/modules/GlobalStorage';
import Locale from '../src/modules/Locale';
import Storage from '../src/modules/Storage';
import RegionSettings from '../src/modules/RegionSettings';
import TabManager from '../src/modules/TabManager';

import config from './config';

const DemoView = connect(state => ({
  data: state,
  invertTheme: false,
}), () => ({
  shouldExpandNode: (keyName, data, level) => true,
}))(JSONTree);

class DemoPhone extends RcModule {
  constructor() {
    super();
    this.addModule('client', new RingCentralClient(new SDK({
      ...config.api
    })));
    this.addModule('alert', new Alert({
      getState: () => this.state.alert,
    }));
    this.addModule('brand', new Brand({
      id: 'testBrandId',
      name: 'Test Brand Name',
      fullName: 'Test Brand Full Name',
      getState: () => this.state.brand,
    }));
    this.addModule('locale', new Locale({
      getState: () => this.state.locale,
    }));
    this.addModule('tabManager', new TabManager({
      getState: () => this.state.tabManager,
    }));
    this.addModule('globalStorage', new GlobalStorage({
      getState: () => this.state.globalStorage,
    }));
    this.addModule('environment', new Environment({
      client: this.client,
      globalStorage: this.globalStorage,
      sdkConfig: {
        ...config.api,
      },
      getState: () => this.state.environment,
    }));
    this.addModule('auth', new Auth({
      alert: this.alert,
      brand: this.brand,
      client: this.client,
      environment: this.environment,
      locale: this.locale,
      tabManager: this.tabManager,
      getState: () => this.state.auth,
    }));
    this.addModule('storage', new Storage({
      auth: this.auth,
      getState: () => this.state.storage,
    }));
    this.addModule('accountInfo', new AccountInfo({
      auth: this.auth,
      client: this.client,
      storage: this.storage,
      tabManager: this.tabManager,
      getState: () => this.state.accountInfo,
    }));
    this.addModule('dialingPlan', new DialingPlan({
      auth: this.auth,
      client: this.client,
      storage: this.storage,
      tabManager: this.tabManager,
      getState: () => this.state.dialingPlan,
    }));
    this.addModule('regionSettings', new RegionSettings({
      storage: this.storage,
      accountInfo: this.accountInfo,
      dialingPlan: this.dialingPlan,
      alert: this.alert,
      tabManager: this.tabManager,
      getState: () => this.state.regionSettings,
    }));
    this._reducer = combineReducers({
      accountInfo: this.accountInfo.reducer,
      alert: this.alert.reducer,
      auth: this.auth.reducer,
      environment: this.environment.reducer,
      brand: this.brand.reducer,
      dialingPlan: this.dialingPlan.reducer,
      locale: this.locale.reducer,
      storage: this.storage.reducer,
      globalStorage: this.globalStorage.reducer,
      regionSettings: this.regionSettings.reducer,
      tabManager: this.tabManager.reducer,
      lastAction: (state = null, action) => {
        console.log(action);
        return action;
      },
    });
  }
  initialize() {
    ReactDOM.render((
      <Provider store={this.store}>
        <DemoView />
      </Provider>
    ), document.querySelector('#viewport'));
  }
}

const phone = new DemoPhone();
const store = createStore(phone.reducer);
phone.setStore(store);

if (typeof window !== 'undefined') {
  window.phone = phone;
}
