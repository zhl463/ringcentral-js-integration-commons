import RcModule from '../../lib/RcModule';
import moduleStatus from '../../enums/moduleStatus';

import { batchPutApi } from '../../lib/batchApiHelper';

import * as messageStoreHelper from './messageStoreHelper';

import actionTypes from './actionTypes';
import getMessageStoreReducer from './getMessageStoreReducer';
import getDataReducer from './getDataReducer';

export function processResponseData(data) {
  const records = data.records.slice();
  return {
    records: records.reverse(),
    syncTimestamp: (new Date(data.syncInfo.syncTime)).getTime(),
    syncToken: data.syncInfo.syncToken,
  };
}

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
    this._subscription = subscription;
    this._reducer = getMessageStoreReducer(this.actionTypes);
    this._ttl = ttl;
    this._auth = auth;
    this._promise = null;
    this._lastSubscriptionMessage = null;
    this._storageKey = 'messageStore';

    this._storage.registerReducer({
      key: this._storageKey,
      reducer: getDataReducer(this.actionTypes),
    });

    this.addSelector(
      'unreadCounts',
      () => this.conversations,
      conversations =>
        conversations.reduce((pre, cur) => (pre + cur.unreadCounts), 0),
    );

    this.syncConversation = this.syncConversation.bind(this);
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
      (Date.now() - this.updatedTimestamp) > this._ttl
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

  findConversationById(id) {
    return this.conversationMap[id.toString()];
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

  async _messageSyncApi(params) {
    const response = await this._client.account()
                             .extension()
                             .messageSync()
                             .list(params);
    return response;
  }

  async _updateMessagesFromSync() {
    this.store.dispatch({
      type: this.actionTypes.sync,
    });
    const oldSyncToken = this.syncToken;
    const params = messageStoreHelper.getMessageSyncParams({ syncToken: oldSyncToken });
    const response = await this._messageSyncApi(params);
    const {
      records,
      syncTimestamp,
      syncToken,
    } = processResponseData(response);
    this.store.dispatch({
      type: this.actionTypes.syncSuccess,
      records,
      syncTimestamp,
      syncToken,
    });
  }

  async _updateConversationFromSync(conversationId) {
    const conversation = this.conversationMap[conversationId.toString()];
    if (!conversation) {
      return;
    }
    this.store.dispatch({
      type: this.actionTypes.sync,
    });
    const oldSyncToken = conversation.syncToken;
    const params = messageStoreHelper.getMessageSyncParams({
      syncToken: oldSyncToken,
      conversationId: conversation.id,
    });
    const response = await this._messageSyncApi(params);
    const {
      records,
      syncTimestamp,
      syncToken,
    } = processResponseData(response);
    this.store.dispatch({
      type: this.actionTypes.syncConversationSuccess,
      records,
      syncTimestamp,
      syncToken,
      syncConversationId: conversation.id,
    });
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

  async _sync(syncFunction) {
    if (!this._promise) {
      this._promise = (async () => {
        try {
          await syncFunction();
          this._promise = null;
        } catch (error) {
          this._onSyncError();
          this._promise = null;
          throw error;
        }
      })();
    }
    await this._promise;
  }

  _onSyncError() {
    this.store.dispatch({
      type: this.actionTypes.syncError,
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

  async readMessages(conversationId) {
    const conversation = this.conversationMap[conversationId];
    if (!conversation) {
      return null;
    }
    const unreadMessageIds = Object.keys(conversation.unreadMessages);
    if (unreadMessageIds.length === 0) {
      return null;
    }
    try {
      const updatedMessages = await this._updateMessagesApi(unreadMessageIds, 'Read');
      this.store.dispatch({
        type: this.actionTypes.updateMessages,
        records: updatedMessages,
      });
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  searchMessagesText(searchText) {
    return this.messages.filter((message) => {
      if (
        message.subject &&
        message.subject.toLowerCase().indexOf(searchText) >= 0
      ) {
        return true;
      }
      return false;
    });
  }

  updateConversationRecipientList(conversationId, recipients) {
    this.store.dispatch({
      type: this.actionTypes.updateConversationRecipients,
      conversationId,
      recipients,
    });
  }

  pushMessage(record) {
    this.store.dispatch({
      type: this.actionTypes.updateMessages,
      records: [record],
    });
  }

  get cache() {
    return this._storage.getItem(this._storageKey);
  }

  get messages() {
    return this.cache.data.messages;
  }

  get conversations() {
    return this.cache.data.conversations;
  }

  get conversationMap() {
    return this.cache.data.conversationMap;
  }

  get updatedTimestamp() {
    return this.cache.updatedTimestamp;
  }

  get syncTimestamp() {
    return this.cache.data.syncTimestamp;
  }

  get syncToken() {
    return this.cache.syncToken;
  }

  get status() {
    return this.state.status;
  }

  get unreadCounts() {
    return this._selectors.unreadCounts();
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
