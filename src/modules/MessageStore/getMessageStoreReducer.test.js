import { expect } from 'chai';
import getMessageStoreReducer, {
  getMessageStoreStatusReducer,
} from './getMessageStoreReducer';

import messageStoreActionTypes from './messageStoreActionTypes';
import messageStoreStatus from './messageStoreStatus';

describe('MessageStore :: getMessageStoreStatusReducer', () => {
  it('getMessageStoreStatusReducer should be a function', () => {
    expect(getMessageStoreStatusReducer).to.be.a('function');
  });
  it('getMessageStoreStatusReducer should return a reducer', () => {
    expect(getMessageStoreStatusReducer()).to.be.a('function');
  });
  describe('statusReducer', () => {
    const reducer = getMessageStoreStatusReducer(messageStoreActionTypes);
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
        messageStoreActionTypes.sync
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(messageStoreStatus.syncing);
      });
    });
    it('should return idle status on sync error and sync success', () => {
      [
        messageStoreActionTypes.syncError,
        messageStoreActionTypes.syncOver,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(messageStoreStatus.idle);
      });
    });
  });
});
