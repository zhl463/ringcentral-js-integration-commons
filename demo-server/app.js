import RcPhone from '../src/rc-phone';
import { initializeModule } from '../src/lib/rc-module';
import config from '../config';
import { createStore } from 'redux';

let store = null;
const phone = new RcPhone({
  sdkSettings: {
    ...config.sdk,
  },
  defaultBrand: {
    ...config.brand,
  },
  getState: () => store.getState(),
});
store = createStore(phone.reducer);
phone::initializeModule(store);

(async () => {
  if (! await phone.auth.isLoggedIn()) {
    phone.auth.login({
      ...config.user,
    });
  }
})();

// store.subscribe(() => {
//   console.log(phone.store.getState());
// });

window.phone = phone;
