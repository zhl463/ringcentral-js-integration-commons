import { createStore } from 'redux';
import React from 'react';
import ReactDOM from 'react-dom';
import { connect, Provider } from 'react-redux';
import JSONTree from 'react-json-tree';

import Phone from './Phone';

const DemoView = connect(state => ({
  data: state,
  invertTheme: false,
}), () => ({
  shouldExpandNode: (keyName, data, level) => level < 2,
}))(JSONTree);


const phone = new Phone();
const store = createStore(phone.reducer);
store.subscribe(() => {
  console.log(store.getState());
});
phone.setStore(store);
global.phone = phone;

ReactDOM.render((
  <Provider store={store}>
    <DemoView />
  </Provider>
), document.querySelector('#viewport'));
