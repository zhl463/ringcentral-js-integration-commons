import { expect } from 'chai';
import sinon from 'sinon';
import { createStore } from 'redux';
import MessageStore from './index';
import getMessageStoreReducer from './getMessageStoreReducer';
import actionTypes from './actionTypes';
import moduleStatus from '../../enums/moduleStatus';

describe('MessageStore Unit Test', () => {
  let messageStore;
  let store;

  beforeEach(() => {
    messageStore = sinon.createStubInstance(MessageStore);
    store = createStore(getMessageStoreReducer(actionTypes));
    messageStore._store = store;
    messageStore._actionTypes = actionTypes;
    [
      '_onStateChange',
      '_shouldInit',
      '_shouldReset',
      '_shouleCleanCache',
      '_initMessageStore',
      '_subscriptionHandler',
      '_resetModuleStatus',
      '_cleanUpCache',
      'findConversationById',
      '_messageSyncApi',
      '_updateConversationFromSync',
      '_updateMessagesFromSync',
      '_getConversationsAndMessagesFromSyncResponse',
      '_sync',
      '_syncMessages',
      'syncConversation',
      '_updateMessageApi',
      '_batchUpdateMessagesApi',
      '_updateMessagesApi',
      'readMessages',
      'matchMessageText',
      'updateConversationRecipientList',
      'pushMessage',
      '_updateConversationsMessagesFromRecords',
      '_saveConversationAndMessages',
      '_saveConversationsAndMessages',
      '_saveConversation',
      '_saveConversations',
      '_saveMessages',
      '_saveSyncToken',
    ].forEach((key) => {
      messageStore[key].restore();
    });
  });

  describe('_onStateChange', () => {
    it('_initMessageStore should be called once when _shouldInit is true', () => {
      sinon.stub(messageStore, '_shouldInit').callsFake(() => true);
      sinon.stub(messageStore, '_shouldReset').callsFake(() => false);
      sinon.stub(messageStore, '_shouleCleanCache').callsFake(() => false);
      sinon.stub(messageStore, 'ready', { get: () => false });
      sinon.stub(messageStore, '_initMessageStore');
      sinon.stub(messageStore, '_subscriptionHandler');
      sinon.stub(messageStore, '_resetModuleStatus');
      sinon.stub(messageStore, '_cleanUpCache');
      messageStore._onStateChange();
      sinon.assert.calledOnce(messageStore._initMessageStore);
      sinon.assert.notCalled(messageStore._resetModuleStatus);
      sinon.assert.notCalled(messageStore._subscriptionHandler);
      sinon.assert.notCalled(messageStore._cleanUpCache);
    });

    it('_cleanUpCache should be called once when _shouldInit and _shouleCleanCache is true', () => {
      sinon.stub(messageStore, '_shouldInit').callsFake(() => true);
      sinon.stub(messageStore, '_shouldReset').callsFake(() => false);
      sinon.stub(messageStore, '_shouleCleanCache').callsFake(() => true);
      sinon.stub(messageStore, 'ready', { get: () => false });
      sinon.stub(messageStore, '_initMessageStore');
      sinon.stub(messageStore, '_subscriptionHandler');
      sinon.stub(messageStore, '_resetModuleStatus');
      sinon.stub(messageStore, '_cleanUpCache');
      messageStore._onStateChange();
      sinon.assert.calledOnce(messageStore._initMessageStore);
      sinon.assert.calledOnce(messageStore._cleanUpCache);
      sinon.assert.notCalled(messageStore._resetModuleStatus);
      sinon.assert.notCalled(messageStore._subscriptionHandler);
    });

    it('_resetModuleStatus should be called once when _shouldReset is true', () => {
      sinon.stub(messageStore, '_shouldInit').callsFake(() => false);
      sinon.stub(messageStore, '_shouldReset').callsFake(() => true);
      sinon.stub(messageStore, '_shouleCleanCache').callsFake(() => false);
      sinon.stub(messageStore, 'ready', { get: () => false });
      sinon.stub(messageStore, '_initMessageStore');
      sinon.stub(messageStore, '_subscriptionHandler');
      sinon.stub(messageStore, '_resetModuleStatus');
      sinon.stub(messageStore, '_cleanUpCache');
      messageStore._onStateChange();
      sinon.assert.notCalled(messageStore._initMessageStore);
      sinon.assert.calledOnce(messageStore._resetModuleStatus);
      sinon.assert.notCalled(messageStore._subscriptionHandler);
      sinon.assert.notCalled(messageStore._cleanUpCache);
    });

    it('_subscriptionHandler should be called once when messageStore is ready', () => {
      sinon.stub(messageStore, '_shouldInit').callsFake(() => false);
      sinon.stub(messageStore, '_shouldReset').callsFake(() => false);
      sinon.stub(messageStore, '_shouleCleanCache').callsFake(() => false);
      sinon.stub(messageStore, 'ready', { get: () => true });
      sinon.stub(messageStore, '_initMessageStore');
      sinon.stub(messageStore, '_subscriptionHandler');
      sinon.stub(messageStore, '_resetModuleStatus');
      sinon.stub(messageStore, '_cleanUpCache');
      messageStore._lastSubscriptionMessage = null;
      messageStore._subscription = {
        message: '123',
      };
      messageStore._onStateChange();
      sinon.assert.notCalled(messageStore._initMessageStore);
      sinon.assert.notCalled(messageStore._resetModuleStatus);
      sinon.assert.notCalled(messageStore._cleanUpCache);
      sinon.assert.calledOnce(messageStore._subscriptionHandler);
    });
  });

  describe('_shouldInit', () => {
    it('Should return true when messageStore is pending with _storage and _subscription all ready', () => {
      messageStore._storage = {
        ready: true
      };
      messageStore._subscription = {
        ready: true
      };
      sinon.stub(messageStore, 'pending', { get: () => true });
      expect(messageStore._shouldInit()).to.equal(true);
    });

    it('Should return false when messageStore is pending with _storage and _subscription all not ready', () => {
      messageStore._storage = {
        ready: false
      };
      messageStore._subscription = {
        ready: false
      };
      sinon.stub(messageStore, 'pending', { get: () => true });
      expect(messageStore._shouldInit()).to.equal(false);
    });

    it('Should return false when messageStore is pending and _storage is not ready', () => {
      messageStore._storage = {
        ready: false
      };
      messageStore._subscription = {
        ready: true
      };
      sinon.stub(messageStore, 'pending', { get: () => true });
      expect(messageStore._shouldInit()).to.equal(false);
    });

    it('Should return false when messageStore is pending and _subscription is not ready', () => {
      messageStore._storage = {
        ready: true
      };
      messageStore._subscription = {
        ready: false
      };
      sinon.stub(messageStore, 'pending', { get: () => true });
      expect(messageStore._shouldInit()).to.equal(false);
    });

    it('Should return false when messageStore is ready with _storage and _subscription all ready', () => {
      messageStore._storage = {
        ready: true
      };
      messageStore._subscription = {
        ready: true
      };
      sinon.stub(messageStore, 'pending', { get: () => false });
      expect(messageStore._shouldInit()).to.equal(false);
    });
  });

  describe('_shouldReset', () => {
    it('should return true when messageStore is ready with _storage and _subscription is all not ready', () => {
      messageStore._storage = {
        ready: false
      };
      messageStore._subscription = {
        ready: false
      };
      sinon.stub(messageStore, 'ready', { get: () => true });
      expect(messageStore._shouldReset()).to.equal(true);
    });

    it('should return true when messageStore and _storage is ready with _subscription is all not ready', () => {
      messageStore._storage = {
        ready: true
      };
      messageStore._subscription = {
        ready: false
      };
      sinon.stub(messageStore, 'ready', { get: () => true });
      expect(messageStore._shouldReset()).to.equal(true);
    });

    it('should return true when messageStore and _subscription is ready with _storage is all not ready', () => {
      messageStore._storage = {
        ready: false
      };
      messageStore._subscription = {
        ready: true
      };
      sinon.stub(messageStore, 'ready', { get: () => true });
      expect(messageStore._shouldReset()).to.equal(true);
    });

    it('should return false when messageStore, _subscription and _storage is all ready', () => {
      messageStore._storage = {
        ready: true
      };
      messageStore._subscription = {
        ready: true
      };
      sinon.stub(messageStore, 'ready', { get: () => true });
      expect(messageStore._shouldReset()).to.equal(false);
    });

    it('should return false when messageStore, _subscription and _storage is all not ready', () => {
      messageStore._storage = {
        ready: false
      };
      messageStore._subscription = {
        ready: false
      };
      sinon.stub(messageStore, 'ready', { get: () => false });
      expect(messageStore._shouldReset()).to.equal(false);
    });

    it('should return false when messageStore is not ready with _subscription and _storage all ready', () => {
      messageStore._storage = {
        ready: true
      };
      messageStore._subscription = {
        ready: true
      };
      sinon.stub(messageStore, 'ready', { get: () => false });
      expect(messageStore._shouldReset()).to.equal(false);
    });

    it('should return false when messageStore and _storage is not ready with _subscription ready', () => {
      messageStore._storage = {
        ready: false
      };
      messageStore._subscription = {
        ready: true
      };
      sinon.stub(messageStore, 'ready', { get: () => false });
      expect(messageStore._shouldReset()).to.equal(false);
    });

    it('should return false when messageStore and _subscription is not ready with _storage all ready', () => {
      messageStore._storage = {
        ready: true
      };
      messageStore._subscription = {
        ready: false
      };
      sinon.stub(messageStore, 'ready', { get: () => false });
      expect(messageStore._shouldReset()).to.equal(false);
    });
  });

  describe('_shouleCleanCache', () => {
    it('should return true when auth is freshLogin with conversationsTimestamp and messagesTimestamp Date.now()', () => {
      messageStore._auth = {
        isFreshLogin: true
      };
      sinon.stub(messageStore, 'conversationsTimestamp', { get: () => Date.now() });
      sinon.stub(messageStore, 'messagesTimestamp', { get: () => Date.now() });
      messageStore._ttl = 30 * 60 * 1000;
      expect(messageStore._shouleCleanCache()).to.equal(true);
    });

    it('should return true when auth is freshLogin with conversationsTimestamp and messagesTimestamp is expired', () => {
      messageStore._auth = {
        isFreshLogin: true
      };
      sinon.stub(messageStore, 'conversationsTimestamp', { get: () => 0 });
      sinon.stub(messageStore, 'messagesTimestamp', { get: () => 0 });
      messageStore._ttl = 30 * 60 * 1000;
      expect(messageStore._shouleCleanCache()).to.equal(true);
    });

    it('should return true when auth is not freshLogin with conversationsTimestamp expired and messagesTimestamp not expired', () => {
      messageStore._auth = {
        isFreshLogin: false
      };
      sinon.stub(messageStore, 'conversationsTimestamp', { get: () => 0 });
      sinon.stub(messageStore, 'messagesTimestamp', { get: () => Date.now() });
      messageStore._ttl = 30 * 60 * 1000;
      expect(messageStore._shouleCleanCache()).to.equal(true);
    });

    it('should return true when auth is not freshLogin with messagesTimestamp expired and conversationsTimestamp not expired', () => {
      messageStore._auth = {
        isFreshLogin: false
      };
      sinon.stub(messageStore, 'conversationsTimestamp', { get: () => Date.now() });
      sinon.stub(messageStore, 'messagesTimestamp', { get: () => 0 });
      messageStore._ttl = 30 * 60 * 1000;
      expect(messageStore._shouleCleanCache()).to.equal(true);
    });

    it('should return false when auth is not freshLogin with messagesTimestamp and conversationsTimestamp not expired', () => {
      messageStore._auth = {
        isFreshLogin: false
      };
      sinon.stub(messageStore, 'conversationsTimestamp', { get: () => Date.now() });
      sinon.stub(messageStore, 'messagesTimestamp', { get: () => Date.now() });
      messageStore._ttl = 30 * 60 * 1000;
      expect(messageStore._shouleCleanCache()).to.equal(false);
    });
  });

  describe('_initMessageStore', () => {
    it('should set status to be ready and call _syncMessages after call _initMessageStore', async () => {
      sinon.stub(messageStore, '_syncMessages');
      messageStore._subscription = {
        subscribe: () => null,
      };
      await messageStore._initMessageStore();
      sinon.assert.calledOnce(messageStore._syncMessages);
      expect(store.getState().status).to.equal(moduleStatus.ready);
    });
  });

  describe('_subscriptionHandler', () => {
    it('should call _syncMessages when subscription message is message store event and _lastSubscriptionMessage is null', () => {
      sinon.stub(messageStore, '_syncMessages');
      messageStore._subscription = {
        message: {
          event: '/restapi/v1.0/account/~/extension/~/message-store',
          body: {
            changes: []
          }
        },
      };
      messageStore._lastSubscriptionMessage = null;
      messageStore._subscriptionHandler();
      sinon.assert.calledOnce(messageStore._syncMessages);
      expect(messageStore._lastSubscriptionMessage).to.equal(messageStore._subscription.message);
    });

    it('should not call _syncMessages when subscription message is null', () => {
      sinon.stub(messageStore, '_syncMessages');
      messageStore._subscription = {
        message: null,
      };
      messageStore._lastSubscriptionMessage = null;
      messageStore._subscriptionHandler();
      sinon.assert.notCalled(messageStore._syncMessages);
    });

    it('should not call _syncMessages when subscription message is null', () => {
      sinon.stub(messageStore, '_syncMessages');
      messageStore._subscription = {
        message: {
          event: '/restapi/v1.0/account/~/extension/~/message-store',
          body: {
            changes: []
          }
        },
      };
      messageStore._lastSubscriptionMessage = messageStore._subscription.message;
      messageStore._subscriptionHandler();
      sinon.assert.notCalled(messageStore._syncMessages);
    });

    it('should not call _syncMessages when subscription message is not message store event', () => {
      sinon.stub(messageStore, '_syncMessages');
      messageStore._subscription = {
        message: {
          event: '/restapi/v1.0/account/~/presence',
          body: {
            changes: []
          }
        },
      };
      messageStore._lastSubscriptionMessage = null;
      messageStore._subscriptionHandler();
      sinon.assert.notCalled(messageStore._syncMessages);
    });

    it('should not call _syncMessages when subscription message is message store event but empty body', () => {
      sinon.stub(messageStore, '_syncMessages');
      messageStore._subscription = {
        message: {
          event: '/restapi/v1.0/account/~/extension/~/message-store',
          body: null,
        },
      };
      messageStore._lastSubscriptionMessage = null;
      messageStore._subscriptionHandler();
      sinon.assert.notCalled(messageStore._syncMessages);
    });

    it('should not call _syncMessages when subscription message is message store event but empty changes', () => {
      sinon.stub(messageStore, '_syncMessages');
      messageStore._subscription = {
        message: {
          event: '/restapi/v1.0/account/~/extension/~/message-store',
          body: {
            changes: null,
          },
        },
      };
      messageStore._lastSubscriptionMessage = null;
      messageStore._subscriptionHandler();
      sinon.assert.notCalled(messageStore._syncMessages);
    });
  });

  describe('findConversationById', () => {
    it('should return conversation successfully when integer id is exist', () => {
      sinon.stub(messageStore, 'conversations', {
        get: () => ({
          '123456': { id: '123456' }
        }),
      });
      const result = messageStore.findConversationById(123456);
      expect(result).to.deep.equal({ id: '123456' });
    });

    it('should return conversation successfully when string id is exist', () => {
      sinon.stub(messageStore, 'conversations', {
        get: () => ({
          '123456': { id: '123456' }
        }),
      });
      const result = messageStore.findConversationById('123456');
      expect(result).to.deep.equal({ id: '123456' });
    });

    it('should return undefined when string id is not exist', () => {
      sinon.stub(messageStore, 'conversations', {
        get: () => ({
          '123456': { id: '123456' }
        }),
      });
      const result = messageStore.findConversationById('1234567');
      expect(result).to.equal(undefined);
    });
  });

  describe('_updateConversationFromSync', () => {
    it('should return call _saveConversationsAndMessages successfully', async () => {
      sinon.stub(messageStore, 'findConversationById').callsFake(
        id => ({ id, syncToken: 'abcd' })
      );
      sinon.stub(messageStore, '_messageSyncApi').callsFake(
        () => ({ syncInfo: { syncToken: 'abcd' } })
      );
      sinon.stub(messageStore, '_getConversationsAndMessagesFromSyncResponse').callsFake(
        () => ({ conversations: { a: 1 }, messages: [1] })
      );
      sinon.stub(messageStore, '_saveConversationsAndMessages');
      await messageStore._updateConversationFromSync('123456');
      sinon.assert.calledWith(messageStore._saveConversationsAndMessages, { a: 1 }, [1], null);
    });
  });

  describe('_updateMessagesFromSync', () => {
    it('should return call _saveConversationsAndMessages successfully', async () => {
      sinon.stub(messageStore, 'syncToken', {
        get: () => 'aabbccdd',
      });
      sinon.stub(messageStore, '_messageSyncApi').callsFake(
        () => ({ syncInfo: { syncToken: 'abcd' } })
      );
      sinon.stub(messageStore, '_getConversationsAndMessagesFromSyncResponse').callsFake(
        () => ({ conversations: { a: 1 }, messages: [1] })
      );
      sinon.stub(messageStore, '_saveConversationsAndMessages');
      await messageStore._updateMessagesFromSync('123456');
      sinon.assert.calledWith(messageStore._saveConversationsAndMessages, { a: 1 }, [1], 'abcd');
    });
  });

  describe('_getConversationsAndMessagesFromSyncResponse', () => {
    it('should return result correctly', () => {
      const conversationResponse = {
        records: [
          {
            id: '1234568',
            conversation: {
              id: '1234567891'
            },
            type: 'SMS',
            subject: 'test1',
            availability: 'Alive',
            readStatus: 'Unread',
            creationTime: '2017-02-03T09:55:49.000Z',
            to: [{
              phoneNumber: '+1234567890',
            }],
            from: { phoneNumber: '+1234567891' },
          },
        ],
        syncInfo: { syncToken: 'abcd' }
      };
      sinon.stub(messageStore, 'conversations', {
        get: () => ({}),
      });
      sinon.stub(messageStore, 'messages', {
        get: () => [],
      });
      const expectMessage = { ...(conversationResponse.records[0]) };
      const expectMessages = [expectMessage];
      const expectConversations = {};
      expectConversations['1234567891'] = {
        id: '1234567891',
        messages: [
          { ...expectMessage }
        ],
        syncToken: 'abcd'
      };
      const result =
        messageStore._getConversationsAndMessagesFromSyncResponse(conversationResponse);
      expect(result).to.deep.equal({
        conversations: expectConversations,
        messages: expectMessages,
      });
    });
  });

  describe('_sync', () => {
    it('should call syncFunction once when _promise is null', async () => {
      messageStore._promise = null;
      sinon.stub(messageStore, '_updateMessagesFromSync');
      await messageStore._sync(async () => {
        await messageStore._updateMessagesFromSync();
      });
      sinon.assert.calledOnce(messageStore._updateMessagesFromSync);
      expect(messageStore._promise).to.equal(null);
    });

    it('should not call syncFunction when _promise exist', async () => {
      messageStore._promise = () => null;
      sinon.stub(messageStore, '_updateMessagesFromSync');
      await messageStore._sync(async () => {
        await messageStore._updateMessagesFromSync();
      });
      sinon.assert.notCalled(messageStore._updateMessagesFromSync);
    });

    it('_promise should be null when throw error', async () => {
      messageStore._promise = null;
      sinon.stub(messageStore, '_updateMessagesFromSync').throws(new Error('error'));
      try {
        await messageStore._sync(async () => {
          await messageStore._updateMessagesFromSync();
        });
      } catch (e) {}
      expect(messageStore._promise).to.equal(null);
    });
  });

  describe('_syncMessages', () => {
    it('should call _updateMessagesFromSync once', async () => {
      messageStore._promise = null;
      sinon.stub(messageStore, '_updateMessagesFromSync');
      await messageStore._syncMessages();
      sinon.assert.calledOnce(messageStore._updateMessagesFromSync);
      expect(messageStore._promise).to.equal(null);
    });
  });

  describe('syncConversation', () => {
    it('should call _updateConversationFromSync with id', async () => {
      messageStore._promise = null;
      sinon.stub(messageStore, '_updateConversationFromSync');
      await messageStore.syncConversation(123);
      sinon.assert.calledWith(messageStore._updateConversationFromSync, 123);
      expect(messageStore._promise).to.equal(null);
    });
  });

  describe('_updateMessagesApi', () => {
    it('should call _updateMessageApi and not call _batchUpdateMessagesApi when ids length is one', async () => {
      sinon.stub(messageStore, '_updateMessageApi');
      sinon.stub(messageStore, '_batchUpdateMessagesApi');
      await messageStore._updateMessagesApi(['11111'], 'Read');
      sinon.assert.calledOnce(messageStore._updateMessageApi);
      sinon.assert.notCalled(messageStore._batchUpdateMessagesApi);
    });

    it('should not call _updateMessageApi and call _batchUpdateMessagesApi when ids length is more one', async () => {
      sinon.stub(messageStore, '_updateMessageApi');
      sinon.stub(messageStore, '_batchUpdateMessagesApi').callsFake(
        () => [
          {
            response: () => ({ status: 200 }),
            json: () => ({ data: 'test1' }),
          }, {
            response: () => ({ status: 200 }),
            json: () => ({ data: 'test2' }),
          }
        ]
      );
      const result = await messageStore._updateMessagesApi(['11111', '222222'], 'Read');
      sinon.assert.calledOnce(messageStore._batchUpdateMessagesApi);
      sinon.assert.notCalled(messageStore._updateMessageApi);
      expect(result).to.deep.equal([{ data: 'test1' }, { data: 'test2' }]);
    });

    it('should not call _updateMessageApi and call _batchUpdateMessagesApi twice when length is more 20', async () => {
      const ids = Array(22);
      ids.fill('121212121')
      sinon.stub(messageStore, '_updateMessageApi');
      sinon.stub(messageStore, '_batchUpdateMessagesApi').callsFake(
        () => [
          {
            response: () => ({ status: 200 }),
            json: () => ({ data: 'test1' }),
          }, {
            response: () => ({ status: 200 }),
            json: () => ({ data: 'test2' }),
          }
        ]
      );
      const result = await messageStore._updateMessagesApi(ids, 'Read');
      sinon.assert.callCount(messageStore._batchUpdateMessagesApi, 2);
      sinon.assert.notCalled(messageStore._updateMessageApi);
    });
  });

  describe('readMessages', () => {
    it('should call _updateMessagesApi and _updateConversationsMessagesFromRecords', async () => {
      const conversation = {
        id: '1234567890',
        messages: [
          {
            id: '1234567',
            conversation: {
              id: '1234567890'
            },
            type: 'SMS',
            subject: 'test',
            direction: 'Inbound',
            availability: 'Alive',
            readStatus: 'Unread',
            creationTime: '2017-02-03T09:53:49.000Z',
            to: [{
              phoneNumber: '+1234567890',
            }],
            from: { phoneNumber: '+1234567891' },
          },
        ]
      };
      sinon.stub(messageStore, '_updateMessagesApi');
      sinon.stub(messageStore, '_updateConversationsMessagesFromRecords');
      await messageStore.readMessages(conversation);
      sinon.assert.calledWith(messageStore._updateMessagesApi, ['1234567'], 'Read');
      sinon.assert.calledOnce(messageStore._updateConversationsMessagesFromRecords);
    });
  });

  describe('matchMessageText', () => {
    const message = {
      id: '1234567',
      conversation: {
        id: '1234567890'
      },
      type: 'SMS',
      subject: 'test',
      direction: 'Inbound',
      availability: 'Alive',
      readStatus: 'Unread',
      creationTime: '2017-02-03T09:53:49.000Z',
      to: [{
        phoneNumber: '+1234567890',
      }],
      from: { phoneNumber: '+1234567891' },
    };
    it('should return message when match suject', () => {
      const result = messageStore.matchMessageText(message, 'est');
      expect(result).to.deep.equal(message);
    });

    it('should return message when match suject on conversation messages', async () => {
      const conversation = {
        id: '1234567890',
        messages: [
          message,
          {
            id: '1234567',
            conversation: {
              id: '1234567890'
            },
            type: 'SMS',
            subject: 'aaaa',
            direction: 'Inbound',
            availability: 'Alive',
            readStatus: 'Unread',
            creationTime: '2017-02-03T09:53:49.000Z',
            to: [{
              phoneNumber: '+1234567890',
            }],
            from: { phoneNumber: '+1234567891' },
          }
        ]
      };
      sinon.stub(messageStore, 'conversations', {
        get: () => ({
          '1234567890': conversation,
        }),
      });
      const result = messageStore.matchMessageText(message, 'aaa');
      expect(result).to.deep.equal(message);
    });

    it('should return null when not match suject', async () => {
      const conversation = {
        id: '1234567890',
        messages: [
          message,
        ]
      };
      sinon.stub(messageStore, 'conversations', {
        get: () => ({
          '1234567890': conversation,
        }),
      });
      const result = messageStore.matchMessageText(message, 'aaa');
      expect(result).to.equal(null);
    });

    it('should return null when message subject is undefined', async () => {
      const conversation = {
        id: '1234567890',
        messages: [
          { ...message },
        ]
      };
      conversation.messages[0].subject = undefined;
      sinon.stub(messageStore, 'conversations', {
        get: () => ({
          '1234567890': conversation,
        }),
      });
      const result = messageStore.matchMessageText(message, 'aaa');
      expect(result).to.equal(null);
    });
  });

  describe('updateConversationRecipientList', () => {
    it('should return call _saveConversation and _saveMessages', async () => {
      const message = {
        id: '1234567',
        conversation: {
          id: '1234567890'
        },
        type: 'SMS',
        subject: 'test',
        direction: 'Inbound',
        availability: 'Alive',
        readStatus: 'Unread',
        creationTime: '2017-02-03T09:53:49.000Z',
        to: [{
          phoneNumber: '+1234567890',
        }],
        from: { phoneNumber: '+1234567891' },
      };
      const conversation = {
        id: '1234567890',
        messages: [
          message,
        ]
      };
      sinon.stub(messageStore, 'conversations', {
        get: () => ({
          '1234567890': conversation,
        }),
      });
      sinon.stub(messageStore, 'messages', {
        get: () => [message],
      });
      sinon.stub(messageStore, 'findConversationById').callsFake(() => conversation);
      sinon.stub(messageStore, '_saveConversation');
      sinon.stub(messageStore, '_saveMessages');
      messageStore.updateConversationRecipientList(conversation.id, [1]);
      sinon.assert.calledOnce(messageStore._saveConversation);
      sinon.assert.calledOnce(messageStore._saveMessages);
      expect(conversation.recipients).to.deep.equal([1]);
    });
  });

  describe('pushMessage', () => {
    it('should call _saveConversationAndMessages successfully when conversation is new', () => {
      const message = {
        id: '1234567',
        conversation: {
          id: '1234567890'
        },
        type: 'SMS',
        subject: 'test',
        direction: 'Inbound',
        availability: 'Alive',
        readStatus: 'Unread',
        creationTime: '2017-02-03T09:53:49.000Z',
        to: [{
          phoneNumber: '+1234567890',
        }],
        from: { phoneNumber: '+1234567891' },
      };
      sinon.stub(messageStore, 'conversations', {
        get: () => ({}),
      });
      sinon.stub(messageStore, 'messages', {
        get: () => [],
      });
      const expectConversation = {
        id: '1234567890',
        messages: [
          message,
        ]
      };
      sinon.stub(messageStore, 'findConversationById').callsFake(() => undefined);
      sinon.stub(messageStore, '_saveConversationAndMessages');
      messageStore.pushMessage(message.conversation.id, message);
      sinon.assert.calledWith(messageStore._saveConversationAndMessages, expectConversation, [message]);
    });

    it('should call _saveConversationAndMessages successfully when conversation exist', () => {
      const message = {
        id: '1234567',
        conversation: {
          id: '1234567890'
        },
        type: 'SMS',
        subject: 'test',
        direction: 'Inbound',
        availability: 'Alive',
        readStatus: 'Unread',
        creationTime: '2017-02-03T09:53:49.000Z',
        to: [{
          phoneNumber: '+1234567890',
        }],
        from: { phoneNumber: '+1234567891' },
      };
      const conversation = {
        id: '1234567890',
        messages: [
          { ...message, id: '1234568' },
        ]
      };
      sinon.stub(messageStore, 'conversations', {
        get: () => ({
          '1234567890': conversation,
        }),
      });
      sinon.stub(messageStore, 'messages', {
        get: () => [],
      });
      sinon.stub(messageStore, 'findConversationById').callsFake(() => conversation);
      sinon.stub(messageStore, '_saveConversationAndMessages');
      messageStore.pushMessage(message.conversation.id, message);
      sinon.assert.calledOnce(messageStore._saveConversationAndMessages);
    });
  });

  describe('_updateConversationsMessagesFromRecords', () => {
    it('should call _saveConversationsAndMessages successfully', () => {
      const message = {
        id: '1234567',
        conversation: {
          id: '1234567890'
        },
        type: 'SMS',
        subject: 'test',
        direction: 'Inbound',
        availability: 'Alive',
        readStatus: 'Unread',
        creationTime: '2017-02-03T09:53:49.000Z',
        to: [{
          phoneNumber: '+1234567890',
        }],
        from: { phoneNumber: '+1234567891' },
      };
      sinon.stub(messageStore, 'conversations', {
        get: () => ({}),
      });
      sinon.stub(messageStore, 'messages', {
        get: () => [],
      });
      sinon.stub(messageStore, '_saveConversationsAndMessages');
      messageStore._updateConversationsMessagesFromRecords([message]);
      sinon.assert.calledOnce(messageStore._saveConversationsAndMessages);
    });
  });

  describe('_saveConversationAndMessages', () => {
    it('should call _saveConversation and _saveMessages successfully', () => {
      const message = {
        id: '1234567',
        conversation: {
          id: '1234567890'
        },
        type: 'SMS',
        subject: 'test',
        direction: 'Inbound',
        availability: 'Alive',
        readStatus: 'Unread',
        creationTime: '2017-02-03T09:53:49.000Z',
        to: [{
          phoneNumber: '+1234567890',
        }],
        from: { phoneNumber: '+1234567891' },
      };
      const conversation = {
        id: '1234567890',
        messages: [
          message,
        ]
      };
      sinon.stub(messageStore, 'conversations', {
        get: () => ({
          '1234567890': conversation,
        }),
      });
      sinon.stub(messageStore, 'messages', {
        get: () => [message],
      });
      sinon.stub(messageStore, '_saveConversation');
      sinon.stub(messageStore, '_saveMessages');
      messageStore._saveConversationAndMessages(conversation, [message]);
      sinon.assert.calledOnce(messageStore._saveConversation);
      sinon.assert.calledOnce(messageStore._saveMessages);
    });
  });

  describe('_saveConversationsAndMessages', () => {
    const message = {
      id: '1234567',
      conversation: {
        id: '1234567890'
      },
      type: 'SMS',
      subject: 'test',
      direction: 'Inbound',
      availability: 'Alive',
      readStatus: 'Unread',
      creationTime: '2017-02-03T09:53:49.000Z',
      to: [{
        phoneNumber: '+1234567890',
      }],
      from: { phoneNumber: '+1234567891' },
    };
    const conversation = {
      id: '1234567890',
      messages: [
        message,
      ]
    };
    const conversations = {
      '1234567890': conversation,
    };

    it('should call _saveConversations and _saveMessages successfully without syncToken', () => {
      sinon.stub(messageStore, 'conversations', {
        get: () => conversations,
      });
      sinon.stub(messageStore, 'messages', {
        get: () => [message],
      });
      sinon.stub(messageStore, '_saveConversations');
      sinon.stub(messageStore, '_saveMessages');
      messageStore._saveConversationsAndMessages(conversations, [message]);
      sinon.assert.calledOnce(messageStore._saveConversations);
      sinon.assert.calledOnce(messageStore._saveMessages);
    });

    it('should call _saveConversations, _saveMessages and _saveSyncToken successfully with syncToken', () => {
      sinon.stub(messageStore, 'conversations', {
        get: () => conversations,
      });
      sinon.stub(messageStore, 'messages', {
        get: () => [message],
      });
      sinon.stub(messageStore, '_saveConversations');
      sinon.stub(messageStore, '_saveMessages');
      sinon.stub(messageStore, '_saveSyncToken');
      messageStore._saveConversationsAndMessages(conversations, [message], '121212');
      sinon.assert.calledOnce(messageStore._saveConversations);
      sinon.assert.calledOnce(messageStore._saveMessages);
      sinon.assert.calledOnce(messageStore._saveSyncToken);
    });
  });

  describe('_saveConversation', () => {
    it('should call _saveConversations', () => {
      const message = {
        id: '1234567',
        conversation: {
          id: '1234567890'
        },
        type: 'SMS',
        subject: 'test',
        direction: 'Inbound',
        availability: 'Alive',
        readStatus: 'Unread',
        creationTime: '2017-02-03T09:53:49.000Z',
        to: [{
          phoneNumber: '+1234567890',
        }],
        from: { phoneNumber: '+1234567891' },
      };
      const conversation = {
        id: '1234567890',
        messages: [
          message,
        ]
      };
      const conversations = {
        '1234567890': conversation,
      };
      sinon.stub(messageStore, 'conversations', {
        get: () => ({}),
      });
      sinon.stub(messageStore, '_saveConversations');
      messageStore._saveConversation(conversation);
      sinon.assert.calledWith(messageStore._saveConversations, conversations);
    });
  });
});
