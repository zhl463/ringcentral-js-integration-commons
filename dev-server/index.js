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
import CallingSettings from '../src/modules/CallingSettings';
import ConnectivityMonitor from '../src/modules/ConnectivityMonitor';
import DialingPlan from '../src/modules/DialingPlan';
import Environment from '../src/modules/Environment';
import ExtensionInfo from '../src/modules/ExtensionInfo';
import ExtensionPhoneNumber from '../src/modules/ExtensionPhoneNumber';
import ForwardingNumber from '../src/modules/ForwardingNumber';
import GlobalStorage from '../src/modules/GlobalStorage';
import Locale from '../src/modules/Locale';
import Presence from '../src/modules/Presence';
import RateLimiter from '../src/modules/RateLimiter';
import RegionSettings from '../src/modules/RegionSettings';
import RolesAndPermissions from '../src/modules/RolesAndPermissions';
import Storage from '../src/modules/Storage';
import Subscription from '../src/modules/Subscription';
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
      id: '1210',
      name: 'RingCentral',
      fullName: 'RingCentral',
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
    this.addModule('connectivityMonitor', new ConnectivityMonitor({
      client: this.client,
      environment: this.environment,
      getState: () => this.state.connectivityMonitor,
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
    this.addModule('rateLimiter', new RateLimiter({
      client: this.client,
      environment: this.environment,
      globalStorage: this.globalStorage,
      getState: () => this.state.rateLimiter,
    }));
    // this.addModule('accountInfo', new AccountInfo({
    //   auth: this.auth,
    //   client: this.client,
    //   storage: this.storage,
    //   tabManager: this.tabManager,
    //   getState: () => this.state.accountInfo,
    // }));
    // this.addModule('extensionInfo', new ExtensionInfo({
    //   auth: this.auth,
    //   client: this.client,
    //   storage: this.storage,
    //   tabManager: this.tabManager,
    //   getState: () => this.state.extensionInfo,
    // }));
    // this.addModule('rolesAndPermissions', new RolesAndPermissions({
    //   auth: this.auth,
    //   client: this.client,
    //   storage: this.storage,
    //   extensionInfo: this.extensionInfo,
    //   tabManager: this.tabManager,
    //   getState: () => this.state.rolesAndPermissions,
    // }));
    // this.addModule('dialingPlan', new DialingPlan({
    //   auth: this.auth,
    //   client: this.client,
    //   storage: this.storage,
    //   tabManager: this.tabManager,
    //   getState: () => this.state.dialingPlan,
    // }));
    // this.addModule('extensionPhoneNumber', new ExtensionPhoneNumber({
    //   auth: this.auth,
    //   client: this.client,
    //   storage: this.storage,
    //   tabManager: this.tabManager,
    //   getState: () => this.state.extensionPhoneNumber,
    // }));
    this.addModule('forwardingNumber', new ForwardingNumber({
      auth: this.auth,
      client: this.client,
      storage: this.storage,
      tabManager: this.tabManager,
      getState: () => this.state.forwardingNumber,
    }));
    // this.addModule('regionSettings', new RegionSettings({
    //   storage: this.storage,
    //   extensionInfo: this.extensionInfo,
    //   dialingPlan: this.dialingPlan,
    //   alert: this.alert,
    //   tabManager: this.tabManager,
    //   getState: () => this.state.regionSettings,
    // }));
    // this.addModule('callingSettings', new CallingSettings({
    //   alert: this.alert,
    //   brand: this.brand,
    //   extensionInfo: this.extensionInfo,
    //   extensionPhoneNumber: this.extensionPhoneNumber,
    //   forwardingNumber: this.forwardingNumber,
    //   storage: this.storage,
    //   rolesAndPermissions: this.rolesAndPermissions,
    //   tabManager: this._tabManager,
    //   getState: () => this.state.callingSettings,
    // }));
    this.addModule('subscription', new Subscription({
      auth: this.auth,
      client: this.client,
      storage: this.storage,
      tabManager: this.tabManager,
      getState: () => this.state.subscription,
    }));
    this.addModule('presence', new Presence({
      auth: this.auth,
      client: this.client,
      subscription: this.subscription,
      getState: () => this.state.presence,
    }));
    this._reducer = combineReducers({
      // accountInfo: this.accountInfo.reducer,
      alert: this.alert.reducer,
      auth: this.auth.reducer,
      // callingSettings: this.callingSettings.reducer,
      connectivityMonitor: this.connectivityMonitor.reducer,
      environment: this.environment.reducer,
      // extensionInfo: this.extensionInfo.reducer,
      // extensionPhoneNumber: this.extensionPhoneNumber.reducer,
      forwardingNumber: this.forwardingNumber.reducer,
      brand: this.brand.reducer,
      // dialingPlan: this.dialingPlan.reducer,
      locale: this.locale.reducer,
      storage: this.storage.reducer,
      globalStorage: this.globalStorage.reducer,
      presence: this.presence.reducer,
      rateLimiter: this.rateLimiter.reducer,
      // rolesAndPermissions: this.rolesAndPermissions.reducer,
      // regionSettings: this.regionSettings.reducer,
      subscription: this.subscription.reducer,
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
    // let subscribed = false;
    // this.store.subscribe(() => {
    //   if (!subscribed && this.subscription.ready) {
    //     subscribed = true;
    //     this.subscription.subscribe('/account/~/extension/~/presence');
    //   }
    // });
  }
}

const phone = new DemoPhone();
const store = createStore(phone.reducer);
phone.setStore(store);

if (typeof window !== 'undefined') {
  window.phone = phone;
}
