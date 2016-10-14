import SymbolMap from 'data-types/symbol-map';
import { combineReducers } from 'redux';
import RcModule, { addModule } from '../../lib/RcModule';
import userStatus from './userStatus';
import userEvents from './userEvents';

import AccountInfo from '../AccountInfo';
import ExtensionInfo from '../ExtensionInfo';
import DialingPlan from '../DialingPlan';
import ExtensionPhoneNumber from '../ExtensionPhoneNumber';
import ForwardingNumber from '../ForwardingNumber';
import BlockedNumber from '../BlockedNumber';

const symbols = new SymbolMap([
  'api',
  'auth',
  'storage',
  'reducer',
]);

function calculateStatus(state) {
  if (
    state.accountInfo.status === AccountInfo.accountInfoStatus.fetching ||
    state.extensionInfo.status === ExtensionInfo.extensionInfoStatus.fetching ||
    state.dialingPlan.status === DialingPlan.dialingPlanStatus.fetching ||
    state.phoneNumber.status === ExtensionPhoneNumber.extensionPhoneNumberStatus.fetching ||
    state.forwardingNumber.status === ForwardingNumber.forwardingNumberStatus.fetching ||
    state.blockedNumber.status === BlockedNumber.blockedNumberStatus.fetching
  ) {
    return userStatus.fetching;
  } else if (
    state.accountInfo.status === AccountInfo.accountInfoStatus.pending ||
    state.extensionInfo.status === ExtensionInfo.extensionInfoStatus.pending ||
    state.dialingPlan.status === DialingPlan.dialingPlanStatus.pending ||
    state.phoneNumber.status === ExtensionPhoneNumber.extensionPhoneNumberStatus.pending ||
    state.forwardingNumber.status === ForwardingNumber.forwardingNumberStatus.pending ||
    state.blockedNumber.status === BlockedNumber.blockedNumberStatus.pending
  ) {
    return userStatus.pending;
  }
  return userStatus.ready;
}

export default class User extends RcModule {
  constructor(options = {}) {
    super({
      ...options,
    });

    const {
      api,
      auth,
      storage,
    } = options;
    this[symbols.api] = api;
    this[symbols.auth] = auth;
    this[symbols.storage] = storage;

    this::addModule('accountInfo', new AccountInfo({
      ...options,
      getState: () => this.state.accountInfo,
    }));
    this::addModule('extensionInfo', new ExtensionInfo({
      ...options,
      getState: () => this.state.extensionInfo,
    }));
    this::addModule('dialingPlan', new DialingPlan({
      ...options,
      getState: () => this.state.dialingPlan,
    }));
    this::addModule('phoneNumber', new ExtensionPhoneNumber({
      ...options,
      getState: () => this.state.phoneNumber,
    }));
    this::addModule('forwardingNumber', new ForwardingNumber({
      ...options,
      getState: () => this.state.forwardingNumber,
    }));
    this::addModule('blockedNumber', new BlockedNumber({
      ...options,
      getState: () => this.state.blockedNumber,
    }));

    this[symbols.reducer] = combineReducers({
      accountInfo: this.accountInfo.reducer,
      extensionInfo: this.extensionInfo.reducer,
      dialingPlan: this.dialingPlan.reducer,
      phoneNumber: this.phoneNumber.reducer,
      forwardingNumber: this.forwardingNumber.reducer,
      blockedNumber: this.blockedNumber.reducer,
    });

    this.on('state-change', ({ oldState, newState }) => {
      const oldStatus = oldState && calculateStatus(oldState);
      const newStatus = calculateStatus(newState);
      if (oldStatus !== newStatus) {
        this.emit(userEvents.statusChange, {
          oldStatus,
          newStatus,
        });
        this.emit(newStatus);
      }
    });
    this.accountInfo.on(this.accountInfo.accountInfoEvents.error, error => {
      this.emit(userEvents.error, error);
    });
    this.extensionInfo.on(this.extensionInfo.extensionInfoEvents.error, error => {
      this.emit(userEvents.error, error);
    });
    this.dialingPlan.on(this.dialingPlan.dialingPlanEvents.error, error => {
      this.emit(userEvents.error, error);
    });
    this.phoneNumber.on(this.phoneNumber.extensionPhoneNumberEvents.error, error => {
      this.emit(userEvents.error, error);
    });
    this.forwardingNumber.on(this.forwardingNumber.forwardingNumberEvents.error, error => {
      this.emit(userEvents.error, error);
    });
    this.blockedNumber.on(this.blockedNumber.blockedNumberEvents.error, error => {
      this.emit(userEvents.error, error);
    });
  }

  get userStatus() {
    return userStatus;
  }
  static get userStatus() {
    return userStatus;
  }

  get userEvents() {
    return userEvents;
  }
  static get userEvents() {
    return userEvents;
  }

  get reducer() {
    return this[symbols.reducer];
  }

  get status() {
    return calculateStatus(this.state);
  }
}
