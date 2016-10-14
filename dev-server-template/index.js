import RingCentral from 'ringcentral';
import RingCentralClient from 'ringcentral-client';
import { combineReducers, createStore } from 'redux';
import SymbolMap from 'data-types/symbol-map';
import RcModule, { addModule, initializeModule } from '../src/lib/RcModule';

import Auth from '../src/modules/Auth';
import Storage from '../src/modules/Storage';
import DialingPlan from '../src/modules/DialingPlan';

import config from './config';

const symbols = new SymbolMap([
  'reducer',
]);

class DemoPhone extends RcModule {
  constructor() {
    super();
    this::addModule('sdk', new RingCentral({
      ...config.api,
    }));
    this::addModule('api', new RingCentralClient(this.sdk));
    this::addModule('auth', new Auth({
      getState: () => this.state.auth,
      sdk: this.sdk,
    }));
    this::addModule('storage', new Storage({
      getState: () => this.state.storage,
      auth: this.auth,
    }));
    this::addModule('dialingPlan', new DialingPlan({
      getState: () => this.state.dialingPlan,
      api: this.api,
      auth: this.auth,
      storage: this.storage,
    }));
    this[symbols.reducer] = combineReducers({
      auth: this.auth.reducer,
      storage: this.storage.reducer,
      dialingPlan: this.dialingPlan.reducer,
    });
  }
  get reducer() {
    return this[symbols.reducer];
  }
}

const phone = new DemoPhone();
const store = createStore(phone.reducer);
// store.subscribe(() => {
//   console.log(JSON.stringify(store.getState(), null, 2));
// });
phone::initializeModule(store);

if (typeof window !== 'undefined') {
  window.phone = phone;
}

(async () => {
  phone.auth.on(phone.auth.authEvents.loggedIn, () => {
    console.log('loggedIn');
  });
  phone.dialingPlan.on(
    phone.dialingPlan.dialingPlanEvents.statusChange,
    ({ oldStatus, newStatus }) => {
      console.log(`dialingPlan status change: ${oldStatus} -> ${newStatus}`);
    }
  );
  if (!await phone.auth.isLoggedIn()) {
    await phone.auth.login({
      ...config.user,
    });
  }
  console.log(phone.dialingPlan.data);
  console.log(await phone.dialingPlan.loadDialingPlans());
  console.log(phone.dialingPlan.data);
})();
