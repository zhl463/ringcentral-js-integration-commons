import { createStore } from 'redux';
import Phone from './Phone';
import apiConfig from './config/apiConfig';
import brandConfig from './config/brandConfig';

export default function getTestPhone() {
  const testPhone = new Phone({
    ...apiConfig,
    ...brandConfig,
    prefix: Date.now().toString()
  });
  const store = createStore(testPhone.reducer);
  testPhone.setStore(store);
  return testPhone;
}
