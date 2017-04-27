#Creating Modules

All integration modules are based on RcModule base class. Which is deeply tied to redux. Here we'll use the DialingPlan module as an example to walk through the basics of module creation. Please note that the code shown here may not be the latest implementation of DialingPlan module.

Typical Folder Structure
---
```
    dialing-plan/
        - index.js => where the module class is written
        - dialing-plan-actions.js => where the redux actions are defined
        - dialing-plan-status.js => where the status definition of the module is
        - dialing-plan-events.js => where all the events of the module is defined
        - get-dialing-plan-reducer.js => where the reducer of the module is defined
```

Define Actions
---

Here we defined all the redux action types for the module by using the ActionMap helper class.

```javascript
import ActionMap from '../../lib/ActionMap';

export default new ActionMap([
  'ready',
  'fetch',
  'fetchSuccess',
  'fetchError',
  'reset',
], 'dialing-plan'); // prefix the actions with the module name

/* the result is similar to:
{
    ready: 'dialing-plan-ready',
    fetch: 'dialing-plan-fetch',
    fetchSuccess: 'dialing-plan-fetchSuccess',
    fetchError: 'dialing-plan-fetchError',
    reset: 'dialing-plan-reset',
}
*/

```

Define Reducers
---

Reducers are the core of redux. It is what defines an redux application. In the modules design, we are not ruling the possibility of running multiple instances of phones in the same application. Therefore all the reducers needs to support prefixed actions.

```javascript
import { prefixActions } from '../../lib/ActionMap';
import dialingPlanActions from './dialingPlanActions';
import dialingPlanStatus from './dialingPlanStatus';

export default function getDialingPlanReducer(prefix) {
  // get prefixed actions
  const actions = prefixActions({
    actions: dialingPlanActions,
    prefix,
  });

  //return the reducer
  return (state, action) => {
    // return initial state
    if (!state) {
      return {
        status: dialingPlanStatus.pending,
        error: null,
      };
    }

    // return original state if no action is given
    if (!action) {
      return state;
    }

    switch (action.type) {

      /*
       * It is very import that actions do not modify the original state object.
       * Instead, it should always assemble a new state object with new values.
       */
      case actions.ready:
        return {
          status: dialingPlanStatus.ready,
          error: null,
        };
        /*
         * or return {
         *   ...state,
         *   status: dialingPlanStatus.ready,
         *   error: null,
         *  };
         */

      ... more cases ...

      // always return original state for default
      default:
        return state;
    }
  };
}

```

The bottom line is that we should treat the state object as immutable object, even though it is not implemented as an immutable object.


The Module Definition
---

Here we extend the RcModule class to create the DialingPlan module. There are some key points in module creation.

```javascript
import SymbolMap from 'data-types/symbol-map';
import HashMap from '../../lib/HashMap';
import RcModule, { initFunction } from '../../lib/RcModule';
import { proxify } from '../../lib/proxy';
import fetchList from '../../lib/fetchList';
import dialingPlanStatus from './dialingPlanStatus';
import dialingPlanActions from './dialingPlanActions';
import getDialingPlanReducer from './getDialingPlanReducer';
import dialingPlanEvents from './dialingPlanEvents';

const keys = new HashMap({
  storage: 'dialing-plan-data',
});

const DEFAULT_TTL = 30 * 60 * 1000;

// SymbomMap helper class helps to organize all the symbols used.
// This way we can bind properties to modules without fully exposing them.
// They will mostly be visible to depending on actual implmementation of symbols.
// But should behave more like private properties.
const symbols = new SymbolMap([
  'api',
  'auth',
  'storage',
  'ttl',
]);

export default class DialingPlan extends RcModule {
  constructor(options = {}) {
    super({
      ...options,
      actions: dialingPlanActions,
      // remember to pass action definitions into super
      // RcModule will automatically bind the prefixed result as this.actions
    });
    const {
      api,
      auth,
      storage,
      ttl = DEFAULT_TTL,
    } = options;
    this[symbols.api] = api;
    this[symbols.auth] = auth;
    this[symbols.storage] = storage;
    this[symbols.ttl] = ttl;

    // A change in state will trigger a state-change event.
    // Then we can compare old and new states and determine whether
    // we need to fire events or not.
    this.on('state-change', ({ oldState, newState }) => {
      if (oldState) {
        if (oldState.status !== newState.status) {
          this.emit(dialingPlanEvents.statusChange, {
            oldStatus: oldState.status,
            newStatus: newState.status,
          });
        }
        if (newState.error && newState.error !== oldState.error) {
          this.emit(accountInfoEvents.error, newState.error);
        }
      }
    });
    // The dialing plans are actually persisted in storage,
    // and thus not part of the dialingPlan reducer.
    // Here we can listen to data change events of the storage module
    // and determine whether to fire dialingPlanChange event or not.
    this[symbols.storage].on(
      this[symbols.storage].storageEvents.dataChange,
      ({ oldData, newData }) => {
        const oldPlanData = oldData[keys.storage];
        const newPlanData = newData[keys.storage];
        if (!oldPlanData && !newPlanData) return;
        if (
          oldPlanData && !newPlanData ||
          !oldPlanData && newPlanData ||
          oldPlanData.dialingPlans.map(plan => plan.id).sort().join(',') !==
          newPlanData.dialingPlans.map(plan => plan.id).sort().join(',')
        ) {
          this.emit(dialingPlanEvents.dialingPlanChange, newPlanData.dialingPlans);
        }
      },
    );
  }

  // The initFunction decorator tells RcModule that this function should only be
  // called after the module has been initialized with a store.
  // However, a proxied instance will skip this initFunction call.
  // We'll talk about proxy modules in a different guide.
  @initFunction
  init() {
    // The @initFunction will mark a function as the init function,
    // regardless of the actual function name.

    // Any code that can only be run after the store has been created should be here.
    // Later we'll also talk about how any code that should not be run in proxies
    // should be placed here as well.

    // For example, we want to start loading dialing plan data when storage module is ready.
    this[symbols.storage].on(this[symbols.storage].storageEvents.ready, async () => {
      await this.loadDialingPlans();
      this.store.dispatch({
        type: this.actions.ready,
      });
    });

    // Don't forget to do clean up work if your module has to do something
    // before or after the log out events
    this[symbols.storage].on(this[symbols.storage].storageEvents.pending, () => {
      this.store.dispatch({
        type: this.actions.reset,
      });
    });

    // Generally speaking, any handlers that would attempt to dispatch actions
    // must be done after store is created and module is initialized.
  }
  get data() {
    return this[symbols.storage].getItem(keys.storage);
  }
  // The proxify decorator will be explained in the proxy guide.
  @proxify
  async loadDialingPlans(options = {}) {
    const {
      force = false,
    } = options;
    let data = this[symbols.storage].getItem(keys.storage);
    if (force || !data || Date.now() - data.timestamp > this[symbols.ttl]) {
      try {
        this.store.dispatch({
          type: this.actions.fetch,
        });
        data = {
          dialingPlans: await fetchList(params => (
            this[symbols.api].account().dialingPlan().list(params)
          )),
          timestamp: Date.now(),
        };
        this[symbols.storage].setItem(keys.storage, data);
        this.store.dispatch({
          type: this.actions.fetchSuccess,
        });
      } catch (error) {
        this.store.dispatch({
          type: this.actions.fetchError,
          error,
        });
        throw error;
      }
    }
    return data;
  }

  // override the default reducer getter to return the correct reducer for the module
  get reducer() {
    return getDialingPlanReducer(this.prefix);
  }

  // Provide getters to the dialingPlanStatus definition for convenience
  // We can easily do dialingPlan.on(dialingPlan.dialingPlanStatus.ready, fn)
  // rather than to import the status definition into the code.
  get dialingPlanStatus() {
    return dialingPlanStatus;
  }

  // Sometimes is beneficial to bind a getter to status definitions
  // on the constructor function itself.
  static get dialingPlanStatus() {
    return dialingPlanStatus;
  }

  // Similarly we provide getters to the dialingPlanEvents definition.
  get dialingPlanEvents() {
    return dialingPlanEvents;
  }
  static get dialingPlanEvents() {
    return dialingPlanEvents;
  }

  // Simple getters to state looks like this.
  // Getters can also include some business logic such as filtering or sorting results.
  // Getters should not modify the state however.
  get status() {
    return this.state.status;
  }
}
```

Using Modules
---

Let's go through some demo code to see how modules are used.

```javascript
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

// Phone objects are actually RcModules as well. We want to reuse as much code as possible.
class DemoPhone extends RcModule {
  constructor() {
    super();

    // addModule helper function binds the sub module object to the parent.
    // the :: is the bind operator which is similar to
    // addModule.call(this, 'moduleName', subModule).
    this::addModule('api', new RingCentralClient({
      ...config.api,
    }));
    this::addModule('auth', new Auth({
      getState: () => this.state.auth,
      api: this.api,
    }));
    this::addModule('storage', new Storage({
      getState: () => this.state.storage,
      auth: this.auth,
    }));

    // Here we bind the dialingPlan module to the parent. We also pass in
    // the dependencies here.
    // It is import to note that the getState function is mandatory.
    // This function simply returns the part of the state that belongs to the sub module.
    this::addModule('dialingPlan', new DialingPlan({
      getState: () => this.state.dialingPlan,
      api: this.api,
      auth: this.auth,
      storage: this.storage,
    }));

    // Here we create the phone reducer by combining the reducers of sub modules.
    // We also bind it to the phone object with a symbol.
    this[symbols.reducer] = combineReducers({
      auth: this.auth.reducer,
      storage: this.storage.reducer,
      dialingPlan: this.dialingPlan.reducer,
    });
  }

  // Override the reducer getter to return the correct reducer.
  get reducer() {
    return this[symbols.reducer];
  }
}

// To use the phone object, first we initiate an instance
const phone = new DemoPhone();

// We then create a store with the reducers. Note that you may
// further combine the phone reducer with more reducers before creating the store.
// You may have UI states that you want to manage with redux as well, or other kind of
// states.
const store = createStore(phone.reducer);

// Use the initializeModule helper function to set the store into the modules and
// initialize them.
phone::initializeModule(store);

// You can also use store's subscribe function to monitor every state change.
store.subscribe(() => {
  console.log(JSON.stringify(store.getState(), null, 2));
});

if (typeof window !== 'undefined') {
  window.phone = phone;
}

// Here we demo how the phone instance is used
(async () => {
  phone.auth.on(phone.auth.authEvents.loggedIn, () => {
    console.log('hello');
  });
  phone.dialingPlan.on(phone.dialingPlan.dialingPlanEvents.statusChange, status => {
    console.log('check', status);
  });
  if (!await phone.auth.isLoggedIn()) {
    await phone.auth.login({
      ...config.user,
    });
  }
  console.log(await phone.dialingPlan.loadDialingPlans());
})();

```

Further Reading
---

- [Local Development](local-development.md)
