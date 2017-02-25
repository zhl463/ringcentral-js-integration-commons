import RcModule from '../../lib/RcModule';
import moduleStatus from '../../enums/moduleStatus';

import { batchPutApi } from '../../lib/batchApiHelper';

import * as messageStoreHelper from './messageStoreHelper';
import actionTypes from './actionTypes';
import getMessageStoreReducer from './getMessageStoreReducer';
import getCacheReducer from './getCacheReducer';

export default class MessageStore extends RcModule {
  constructor({
    alert,
    client,
    auth,
    ttl = 30 * 60 * 1000,
    storage,
    subscription,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._alert = alert;
    this._client = client;
    this._storage = storage;
    this._storageKey = 'messageStore';
    this._subscription = subscription;
    this._reducer = getMessageStoreReducer(this.actionTypes);
    this._cacheReducer = getCacheReducer(this.actionTypes);
    this._ttl = ttl;
    this._auth = auth;
    this._promise = null;
    this._lastSubscriptionMessage = null;
    this.syncConversation = this.syncConversation.bind(this);
    storage.registerReducer({ key: this._storageKey, reducer: this._cacheReducer });
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
  }

  _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
      if (this._shouleCleanCache()) {
        this._cleanUpCache();
      }
      this._initMessageStore();
    } else if (this._shouldReset()) {
      this._resetModuleStatus();
    } else if (
      this.ready
    ) {
      this._subscriptionHandler();
    }
  }

  _shouldInit() {
    return (
      this._storage.ready &&
      this._subscription.ready &&
      this.pending
    );
  }

  _shouldReset() {
    return (
      (
        !this._storage.ready ||
        !this._subscription.ready
      ) &&
      this.ready
    );
  }

  _shouleCleanCache() {
    return (
      this._auth.isFreshLogin ||
      (Date.now() - this.conversationsTimestamp) > this._ttl ||
      (Date.now() - this.messagesTimestamp) > this._ttl
    );
  }

  _resetModuleStatus() {
    this.store.dispatch({
      type: this.actionTypes.resetSuccess,
    });
  }

  _cleanUpCache() {
    this.store.dispatch({
      type: this.actionTypes.cleanUp,
    });
  }

  async _initMessageStore() {
    await this._syncMessages();
    this._subscription.subscribe('/account/~/extension/~/message-store');
    this.store.dispatch({
      type: this.actionTypes.initSuccess,
    });
  }

  _subscriptionHandler() {
    const accountExtesionEndPoint = /\/message-store$/;
    const message = this._subscription.message;
    if (
      message &&
      message !== this._lastSubscriptionMessage &&
      accountExtesionEndPoint.test(message.event) &&
      message.body &&
      message.body.changes
    ) {
      this._lastSubscriptionMessage = this._subscription.message;
      this._syncMessages();
    }
  }

  findConversationById(id) {
    return this.conversations[id.toString()];
  }

  async _messageSyncApi(params) {
    const response = await this._client.account()
                             .extension()
                             .messageSync()
                             .list(params);
    return response;
  }

  async _updateConversationFromSync(id) {
    const oldConversation = this.findConversationById(id);
    const syncToken = oldConversation && oldConversation.syncToken;
    const params = messageStoreHelper.getMessageSyncParams({
      syncToken,
      conversationId: id,
    });
    const newConversationRequest = await this._messageSyncApi(params);
    const { conversations, messages }
      = this._getConversationsAndMessagesFromSyncResponse(newConversationRequest);
    this._saveConversationsAndMessages(conversations, messages, null);
  }

  async _updateMessagesFromSync() {
    const syncToken = this.syncToken;
    const params = messageStoreHelper.getMessageSyncParams({ syncToken });
    const newConversationRequest = await this._messageSyncApi(params);
    const { conversations, messages } =
      this._getConversationsAndMessagesFromSyncResponse(newConversationRequest);
    this._saveConversationsAndMessages(
      conversations,
      messages,
      newConversationRequest.syncInfo.syncToken
    );
  }

  _getConversationsAndMessagesFromSyncResponse(conversationResponse) {
    const records = conversationResponse.records.reverse();
    const syncToken = conversationResponse.syncInfo.syncToken;
    return messageStoreHelper.getNewConversationsAndMessagesFromRecords({
      records,
      syncToken,
      conversations: this.conversations,
      messages: this.messages,
    });
  }

  async _sync(syncFunction) {
    if (!this._promise) {
      this._promise = (async () => {
        try {
          this.store.dispatch({
            type: this.actionTypes.sync,
          });
          await syncFunction();
          this.store.dispatch({
            type: this.actionTypes.syncOver,
          });
          this._promise = null;
        } catch (error) {
          this.store.dispatch({
            type: this.actionTypes.syncError,
          });
          this._promise = null;
          throw error;
        }
      })();
    }
    await this._promise;
  }

  async _syncMessages() {
    await this._sync(async () => {
      await this._updateMessagesFromSync();
    });
  }

  async syncConversation(id) {
    await this._sync(async () => {
      await this._updateConversationFromSync(id);
    });
  }

  async _updateMessageApi(messageId, status) {
    const body = {
      readStatus: status,
    };
    const updateRequest = await this._client.account()
                                            .extension()
                                            .messageStore(messageId)
                                            .put(body);
    return updateRequest;
  }

  async _batchUpdateMessagesApi(messageIds, body) {
    const ids = decodeURIComponent(messageIds.join(','));
    const platform = this._client.service.platform();
    const responses = await batchPutApi({
      platform,
      url: `/account/~/extension/~/message-store/${ids}`,
      body,
    });
    return responses;
  }

  async _updateMessagesApi(messageIds, status) {
    if (messageIds.length === 1) {
      const result = await this._updateMessageApi(messageIds[0], status);
      return [result];
    }
    const UPDATE_MESSAGE_ONCE_COUNT = 20;
    const leftIds = messageIds.slice(0, UPDATE_MESSAGE_ONCE_COUNT);
    const rightIds = messageIds.slice(UPDATE_MESSAGE_ONCE_COUNT);
    const body = leftIds.map(() => (
      { body: { readStatus: status } }
    ));
    const responses = await this._batchUpdateMessagesApi(leftIds, body);
    const results = [];
    responses.forEach((res) => {
      if (res.response().status === 200) {
        results.push(res.json());
      }
    });
    if (rightIds.length > 0) {
      const rightResults = await this._updateMessagesApi(rightIds, status);
      if (rightResults.length > 0) {
        results.concat(rightResults);
      }
    }
    return results;
  }

  async readMessages(conversation) {
    const unReadMessages = messageStoreHelper.filterConversationUnreadMessages(conversation);
    if (unReadMessages.length === 0) {
      return null;
    }
    const unreadMessageIds = unReadMessages.map(message => message.id);
    try {
      const updatedMessages = await this._updateMessagesApi(unreadMessageIds, 'Read');
      this._updateConversationsMessagesFromRecords(updatedMessages);
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  matchMessageText(message, searchText) {
    if (
      message.subject &&
      message.subject.toLowerCase().indexOf(searchText) >= 0
    ) {
      return message;
    }
    const conversation = this.conversations[message.conversation.id];
    if (!conversation) {
      return null;
    }
    for (const subMessage of conversation.messages) {
      if (
        subMessage.subject &&
        subMessage.subject.toLowerCase().indexOf(searchText) >= 0
      ) {
        return message;
      }
    }
    return null;
  }

  updateConversationRecipientList(conversationId, recipients) {
    const conversation = this.findConversationById(conversationId);
    if (!conversation) {
      return;
    }
    conversation.recipients = recipients;
    this._saveConversation(conversation);
    const messages = this.messages;
    const messageIndex = messages.findIndex(message =>
      message.conversation && message.conversation.id === conversationId
    );
    if (messageIndex > -1) {
      const message = messages[messageIndex];
      message.recipients = recipients;
      this._saveMessages(messages);
    }
  }

  pushMessage(conversationId, message) {
    const oldConversation = this.findConversationById(conversationId);
    let newConversation = { messages: [] };
    if (oldConversation) {
      newConversation = oldConversation;
    }
    newConversation.id = conversationId;
    newConversation.messages = messageStoreHelper.pushMessageToConversationMessages({
      messages: newConversation.messages,
      message,
    });
    const messages = messageStoreHelper.pushMessageToMesages({
      messages: this.messages,
      message
    });
    this._saveConversationAndMessages(newConversation, messages);
  }

  _updateConversationsMessagesFromRecords(records) {
    const { conversations, messages } =
      messageStoreHelper.getNewConversationsAndMessagesFromRecords({
        records,
        conversations: this.conversations,
        messages: this.messages,
      });
    this._saveConversationsAndMessages(conversations, messages, null);
  }

  _saveConversationAndMessages(conversation, messages) {
    this._saveConversation(conversation);
    this._saveMessages(messages);
  }

  _saveConversationsAndMessages(conversations, messages, syncToken) {
    this._saveConversations(conversations);
    this._saveMessages(messages);
    if (syncToken) {
      this._saveSyncToken(syncToken);
    }
  }

  _saveConversation(conversation) {
    const conversations = this.conversations;
    const id = conversation.id;
    conversations[id] = conversation;
    this._saveConversations(conversations);
  }

  _saveConversations(conversations) {
    this.store.dispatch({
      type: this.actionTypes.saveConversations,
      data: conversations,
    });
  }

  _saveMessages(newMessages) {
    const { messages, unreadCounts } =
      messageStoreHelper.updateMessagesUnreadCounts(newMessages, this.conversations);
    this.store.dispatch({
      type: this.actionTypes.saveMessages,
      messages,
      unreadCounts
    });
  }

  _saveSyncToken(syncToken) {
    this.store.dispatch({
      type: this.actionTypes.saveSyncToken,
      syncToken,
    });
  }

  get cache() {
    return this._storage.getItem(this._storageKey);
  }

  get conversations() {
    const conversations = this.cache.conversations.data;
    if (!conversations) {
      return {};
    }
    return conversations;
  }

  get conversationsTimestamp() {
    return this.cache.conversations.timestamp;
  }

  get messages() {
    const messages = this.cache.messages.data;
    if (!messages) {
      return [];
    }
    return messages;
  }

  get messagesTimestamp() {
    return this.cache.messages.timestamp;
  }

  get syncToken() {
    return this.cache.syncToken;
  }

  get unreadCounts() {
    return this.cache.unreadCounts;
  }

  get status() {
    return this.state.status;
  }

  get messageStoreStatus() {
    return this.state.messageStoreStatus;
  }

  get ready() {
    return this.status === moduleStatus.ready;
  }

  get pending() {
    return this.status === moduleStatus.pending;
  }
}
