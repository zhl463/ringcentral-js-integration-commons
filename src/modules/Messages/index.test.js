import { expect } from 'chai';
import sinon from 'sinon';
import { createStore } from 'redux';
import Messages from './index';
import getMessagesReducer from './getMessagesReducer';
import actionTypes from './messagesActionTypes';

describe('Messages Unit Test', () => {
  let messages;
  let store;

  beforeEach(() => {
    messages = sinon.createStubInstance(Messages);
    store = createStore(getMessagesReducer(actionTypes));
    messages._store = store;
    messages._actionTypes = actionTypes;
    [
      '_onStateChange',
      '_shouldInit',
      '_shouldReset',
      '_shouldReload',
      '_initMessages',
      '_resetModuleStatus',
      '_reloadMessages',
      '_updateMessages',
      '_getCurrnetPageMessages',
      'loadNextPageMessages',
      'updateSearchingString',
      'updateSearchResults',
    ].forEach((key) => {
      messages[key].restore();
    });
  });

  describe('_onStateChange', () => {
    it('_initMessages should be called once when _shouldInit is true', () => {
      sinon.stub(messages, '_shouldInit').callsFake(() => true);
      sinon.stub(messages, '_shouldReset').callsFake(() => false);
      sinon.stub(messages, '_shouldReload').callsFake(() => false);
      sinon.stub(messages, '_initMessages');
      sinon.stub(messages, '_resetModuleStatus');
      sinon.stub(messages, '_reloadMessages');
      messages._onStateChange();
      sinon.assert.calledOnce(messages._initMessages);
      sinon.assert.notCalled(messages._resetModuleStatus);
      sinon.assert.notCalled(messages._reloadMessages);
    });

    it('_resetModuleStatus should be called once when _shouldReset is true', () => {
      sinon.stub(messages, '_shouldInit').callsFake(() => false);
      sinon.stub(messages, '_shouldReset').callsFake(() => true);
      sinon.stub(messages, '_shouldReload').callsFake(() => false);
      sinon.stub(messages, '_initMessages');
      sinon.stub(messages, '_resetModuleStatus');
      sinon.stub(messages, '_reloadMessages');
      messages._onStateChange();
      sinon.assert.notCalled(messages._initMessages);
      sinon.assert.calledOnce(messages._resetModuleStatus);
      sinon.assert.notCalled(messages._reloadMessages);
    });

    it('_reloadMessages should be called once when _shouldReload is true', () => {
      sinon.stub(messages, '_shouldInit').callsFake(() => false);
      sinon.stub(messages, '_shouldReset').callsFake(() => false);
      sinon.stub(messages, '_shouldReload').callsFake(() => true);
      sinon.stub(messages, '_initMessages');
      sinon.stub(messages, '_resetModuleStatus');
      sinon.stub(messages, '_reloadMessages');
      messages._onStateChange();
      sinon.assert.notCalled(messages._initMessages);
      sinon.assert.notCalled(messages._resetModuleStatus);
      sinon.assert.calledOnce(messages._reloadMessages);
    });
  });

  describe('_shouldInit', () => {
    it('should return true when messages is pending and messageStore is ready', () => {
      messages._messageStore = {
        ready: true
      };
      sinon.stub(messages, 'pending', { get: () => true });
      expect(messages._shouldInit()).to.equal(true);
    });

    it('should return false when messages is pending and messageStore is not ready', () => {
      messages._messageStore = {
        ready: false
      };
      sinon.stub(messages, 'pending', { get: () => true });
      expect(messages._shouldInit()).to.equal(false);
    });

    it('should return false when messages is not pending and messageStore is not ready', () => {
      messages._messageStore = {
        ready: false
      };
      sinon.stub(messages, 'pending', { get: () => false });
      expect(messages._shouldInit()).to.equal(false);
    });

    it('should return false when messages is not pending and messageStore is ready', () => {
      messages._messageStore = {
        ready: true
      };
      sinon.stub(messages, 'pending', { get: () => false });
      expect(messages._shouldInit()).to.equal(false);
    });
  });

  describe('_shouldReset', () => {
    it('should return true when messages is ready and messageStore is not ready', () => {
      messages._messageStore = {
        ready: false
      };
      sinon.stub(messages, 'ready', { get: () => true });
      expect(messages._shouldReset()).to.equal(true);
    });

    it('should return false when messages is ready and messageStore is ready', () => {
      messages._messageStore = {
        ready: true
      };
      sinon.stub(messages, 'ready', { get: () => true });
      expect(messages._shouldReset()).to.equal(false);
    });

    it('should return false when messages is not ready and messageStore is not ready', () => {
      messages._messageStore = {
        ready: false
      };
      sinon.stub(messages, 'ready', { get: () => false });
      expect(messages._shouldReset()).to.equal(false);
    });

    it('should return false when messages is not ready and messageStore is ready', () => {
      messages._messageStore = {
        ready: true
      };
      sinon.stub(messages, 'ready', { get: () => false });
      expect(messages._shouldReset()).to.equal(false);
    });
  });

  describe('_shouldReload', () => {
    it('should return true when messages is ready and messages\'s messageStoreUpdatedAt is not same as messageStore', () => {
      messages._messageStore = {
        messagesTimestamp: 1486954544921
      };
      sinon.stub(messages, 'ready', { get: () => true });
      sinon.stub(messages, 'messageStoreUpdatedAt', { get: () => 1234 });
      expect(messages._shouldReload()).to.equal(true);
    });

    it('should return false when messages is not ready and messages\'s messageStoreUpdatedAt is not same as messageStore', () => {
      messages._messageStore = {
        messagesTimestamp: 1486954544921
      };
      sinon.stub(messages, 'ready', { get: () => false });
      sinon.stub(messages, 'messageStoreUpdatedAt', { get: () => 1234 });
      expect(messages._shouldReload()).to.equal(false);
    });

    it('should return false when messages is ready and messages\'s messageStoreUpdatedAt is same as messageStore', () => {
      messages._messageStore = {
        messagesTimestamp: 1486954544921
      };
      sinon.stub(messages, 'ready', { get: () => true });
      sinon.stub(messages, 'messageStoreUpdatedAt', { get: () => 1486954544921 });
      expect(messages._shouldReload()).to.equal(false);
    });

    it('should return false when messages is not ready and messages\'s messageStoreUpdatedAt is same as messageStore', () => {
      messages._messageStore = {
        messagesTimestamp: 1486954544921
      };
      sinon.stub(messages, 'ready', { get: () => false });
      sinon.stub(messages, 'messageStoreUpdatedAt', { get: () => 1486954544921 });
      expect(messages._shouldReload()).to.equal(false);
    });
  });

  describe('_initMessages', () => {
    it('should call _updateMessages and update state', () => {
      messages._messageStore = {
        messagesTimestamp: 1486954544921
      };
      sinon.stub(messages, '_updateMessages');
      sinon.stub(messages, '_getCurrnetPageMessages').callsFake(() => [1]);
      messages._initMessages();
      sinon.assert.calledWith(messages._updateMessages, [1]);
      expect(store.getState().currentPage).to.equal(1);
      expect(store.getState().messageStoreUpdatedAt).to.equal(1486954544921);
    });
  });

  describe('_reloadMessages', () => {
    it('should call _updateMessages and update state when current page is one', () => {
      messages._messageStore = {
        messagesTimestamp: 1486954544922,
        messages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      };
      messages._perPage = 10;
      sinon.stub(messages, 'currentPage', { get: () => 1 });
      sinon.stub(messages, '_updateMessages');
      messages._reloadMessages();
      sinon.assert.calledWith(messages._updateMessages, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
      expect(store.getState().messageStoreUpdatedAt).to.equal(1486954544922);
    });

    it('should call _updateMessages and update state when current page is two', () => {
      messages._messageStore = {
        messagesTimestamp: 1486954544923,
        messages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      };
      messages._perPage = 10;
      sinon.stub(messages, 'currentPage', { get: () => 2 });
      sinon.stub(messages, '_updateMessages');
      messages._reloadMessages();
      sinon.assert.calledWith(messages._updateMessages, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
      expect(store.getState().messageStoreUpdatedAt).to.equal(1486954544923);
    });

    it('should call _updateMessages and update state when messageStore.message is empty', () => {
      messages._messageStore = {
        messagesTimestamp: 1486954544923,
        messages: [],
      };
      messages._perPage = 10;
      sinon.stub(messages, 'currentPage', { get: () => 1 });
      sinon.stub(messages, '_updateMessages');
      messages._reloadMessages();
      sinon.assert.calledWith(messages._updateMessages, []);
      expect(store.getState().messageStoreUpdatedAt).to.equal(1486954544923);
    });
  });

  describe('_getCurrnetPageMessages', () => {
    it('should get empty when messageStore.messages is empty and page is one', () => {
      messages._messageStore = {
        messages: [],
      };
      messages._perPage = 10;
      const result = messages._getCurrnetPageMessages(1);
      expect(result).to.deep.equal([]);
    });

    it('should get empty when messageStore.messages is empty and page is two', () => {
      messages._messageStore = {
        messages: [],
      };
      messages._perPage = 10;
      const result = messages._getCurrnetPageMessages(2);
      expect(result).to.deep.equal([]);
    });

    it('should get all messages when page is one and messageStore.message length is less then perPage', () => {
      messages._messageStore = {
        messagesTimestamp: 1486954544923,
        messages: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      };
      messages._perPage = 10;
      const result = messages._getCurrnetPageMessages(1);
      expect(result).to.deep.equal([9, 8, 7, 6, 5, 4, 3, 2, 1]);
    });

    it('should get messages with perPage length when page is one and messageStore.message length is more then perPage', () => {
      messages._messageStore = {
        messagesTimestamp: 1486954544923,
        messages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      };
      messages._perPage = 10;
      const result = messages._getCurrnetPageMessages(1);
      expect(result).to.deep.equal([11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
    });

    it('should get messages in currentPage when page is two and messageStore.message length is less then twice perPage', () => {
      messages._messageStore = {
        messagesTimestamp: 1486954544923,
        messages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      };
      messages._perPage = 10;
      const result = messages._getCurrnetPageMessages(2);
      expect(result).to.deep.equal([1]);
    });

    it('should get messages in currentPage when page is two and messageStore.message length is less then twice perPage', () => {
      messages._messageStore = {
        messagesTimestamp: 1486954544923,
        messages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      };
      messages._perPage = 10;
      const result = messages._getCurrnetPageMessages(2);
      expect(result).to.deep.equal([11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
    });
  });

  describe('loadNextPageMessages', () => {
    it('should not change currentPage when _getCurrnetPageMessages return empty array', () => {
      sinon.stub(messages, 'currentPage', { get: () => 1 });
      sinon.stub(messages, '_getCurrnetPageMessages').callsFake(() => []);
      messages.loadNextPageMessages();
      expect(store.getState().currentPage).to.equal(1);
    });

    it('should add currentPage when _getCurrnetPageMessages return array with number', () => {
      sinon.stub(messages, 'currentPage', { get: () => 1 });
      sinon.stub(messages, '_getCurrnetPageMessages').callsFake(() => [1]);
      messages.loadNextPageMessages();
      expect(store.getState().currentPage).to.equal(2);
    });
  });
});
