import { expect } from 'chai';
import getMessageStoreReducer, {
  getMessageStoreStatusReducer,
} from './getMessageStoreReducer';

import actionTypes from './actionTypes';
import messageStoreStatus from './messageStoreStatus';

describe('MessageStore :: getMessageStoreStatusReducer', () => {
  it('getMessageStoreStatusReducer should be a function', () => {
    expect(getMessageStoreStatusReducer).to.be.a('function');
  });
  it('getMessageStoreStatusReducer should return a reducer', () => {
    expect(getMessageStoreStatusReducer()).to.be.a('function');
  });
  describe('statusReducer', () => {
    const reducer = getMessageStoreStatusReducer(actionTypes);
    it('should have initial state of idle', () => {
      expect(reducer(undefined, {})).to.equal(messageStoreStatus.idle);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
      .to.equal(originalState);
    });

    it('should return syncing status on sync', () => {
      [
        actionTypes.sync
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(messageStoreStatus.syncing);
      });
    });
    it('should return idle status on sync error and sync success', () => {
      [
        actionTypes.syncError,
        actionTypes.syncOver,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(messageStoreStatus.idle);
      });
    });
  });
});
