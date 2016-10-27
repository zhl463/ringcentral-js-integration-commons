import { combineReducers } from 'redux';
import RcModule from '../../lib/RcModule';
import userStatus from './userStatus';

import AccountInfo from '../AccountInfo';
import ExtensionInfo from '../ExtensionInfo';
import DialingPlan from '../DialingPlan';
import ExtensionPhoneNumber from '../ExtensionPhoneNumber';
import ForwardingNumber from '../ForwardingNumber';
import BlockedNumber from '../BlockedNumber';

export default class User extends RcModule {
  constructor({
    ...options,
  }) {
    super(options);
    this.addModule('accountInfo', new AccountInfo({
      ...options,
      getState: () => this.state.accountInfo,
    }));
    this.addModule('extensionInfo', new ExtensionInfo({
      ...options,
      getState: () => this.state.extensionInfo,
    }));
    this.addModule('dialingPlan', new DialingPlan({
      ...options,
      getState: () => this.state.dialingPlan,
    }));
    this.addModule('phoneNumber', new ExtensionPhoneNumber({
      ...options,
      getState: () => this.state.phoneNumber,
    }));
    this.addModule('forwardingNumber', new ForwardingNumber({
      ...options,
      getState: () => this.state.forwardingNumber,
    }));
    this.addModule('blockedNumber', new BlockedNumber({
      ...options,
      getState: () => this.state.blockedNumber,
    }));
    this._reducer = combineReducers({
      accountInfo: this.accountInfo.reducer,
      extensionInfo: this.extensionInfo.reducer,
      dialingPlan: this.dialingPlan.reducer,
      phoneNumber: this.phoneNumber.reducer,
      forwardingNumber: this.forwardingNumber.reducer,
      blockedNumber: this.blockedNumber.reducer,
    });

    this.addSelector(
      'error',
      [
        () => this.accountInfo.error,
        () => this.extensionInfo.error,
        () => this.dialingPlan.error,
        () => this.phoneNumber.error,
        () => this.forwardingNumber.error,
        () => this.blockedNumber.error,
      ],
      (
        accountInfoError,
        extensionInfoError,
        dialingPlanError,
        phoneNumberError,
        forwardingNumberError,
        blockedNumberErrror,
      ) => {
        if (
          accountInfoError ||
          extensionInfoError ||
          dialingPlanError ||
          phoneNumberError ||
          forwardingNumberError ||
          blockedNumberErrror
        ) {
          return {
            accountInfoError,
            extensionInfoError,
            dialingPlanError,
            phoneNumberError,
            forwardingNumberError,
            blockedNumberErrror,
          };
        }
        return null;
      },
    );
  }

  get userState() {
    return userStatus;
  }

  get status() {
    if (
      this.accountInfo.status === this.accountInfo.accountInfoStatus.pending ||
      this.extensionInfo.status === this.extensionInfo.extensionInfoStatus.pending ||
      this.dialingPlan.status === this.dialingPlan.dialingPlanStatus.pending ||
      this.phoneNumber.status === this.phoneNumber.extensionPhoneNumberStatus.pending ||
      this.forwardingNumber.status === this.forwardingNumber.forwardingNumberStatus.pending ||
      this.blockedNumber.status === this.blockedNumber.blockedNumberStatus.pending
    ) {
      return userStatus.pending;
    } else if (
      this.accountInfo.status === this.accountInfo.accountInfoStatus.fetching ||
      this.extensionInfo.status === this.extensionInfo.extensionInfoStatus.fetching ||
      this.dialingPlan.status === this.dialingPlan.dialingPlanStatus.fetching ||
      this.phoneNumber.status === this.phoneNumber.extensionPhoneNumberStatus.fetching ||
      this.forwardingNumber.status === this.forwardingNumber.forwardingNumberStatus.fetching ||
      this.blockedNumber.status === this.blockedNumber.blockedNumberStatus.fetching
    ) {
      return userStatus.fetching;
    } else if (
      this.accountInfo.status === this.accountInfo.accountInfoStatus.error ||
      this.extensionInfo.status === this.extensionInfo.extensionInfoStatus.error ||
      this.dialingPlan.status === this.dialingPlan.dialingPlanStatus.error ||
      this.phoneNumber.status === this.phoneNumber.extensionPhoneNumberStatus.error ||
      this.forwardingNumber.status === this.forwardingNumber.forwardingNumberStatus.error ||
      this.blockedNumber.status === this.blockedNumber.blockedNumberStatus.error
    ) {
      return userStatus.error;
    }
    return userStatus.ready;
  }

  get error() {
    return this.getSelector('error')();
  }
}
