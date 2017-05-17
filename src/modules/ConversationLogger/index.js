import LoggerBase from '../../lib/LoggerBase';
import ensureExist from '../../lib/ensureExist';
import actionTypes from './actionTypes';
import getDataReducer from './getDataReducer';
import messageTypes from '../../enums/messageTypes';
import { getNumbersFromMessage, sortByDate } from '../../lib/messageHelper';

export function getLogId({ conversationId, date }) {
  return `${conversationId}/${date}`;
}

export function conversationLogIdentityFunction(conversation) {
  return conversation.conversationLogId;
}

export default class ConversationLogger extends LoggerBase {
  constructor({
    contactMatcher,
    conversationMatcher,
    dateTimeFormat,
    extensionInfo,
    messageStore,
    rolesAndPermissions,
    storage,
    tabManager,
    isLoggedContact = () => false,
    formatDateTime = (...args) => dateTimeFormat.formatDateTime(...args),
    ...options,
  }) {
    super({
      ...options,
      name: 'conversationLogger',
      actionTypes,
      identityFunction: conversationLogIdentityFunction,
    });
    this._contactMatcher = this::ensureExist(contactMatcher, 'contactMatcher');
    this._conversationMatcher = this::ensureExist(conversationMatcher, 'conversationMatcher');
    this._dateTimeFormat = this::ensureExist(dateTimeFormat, 'dateTimeFormat');
    this._extensionInfo = this::ensureExist(extensionInfo, 'extensionInfo');
    this._messageStore = this::ensureExist(messageStore, 'messageStore');
    this._rolesAndPermissions = this::ensureExist(rolesAndPermissions, 'rolesAndPermissions');
    this._storage = this::ensureExist(storage, 'storage');
    this._tabManager = this::ensureExist(tabManager, 'tabManager');
    this._isLoggedContact = isLoggedContact;
    this._formatDateTime = formatDateTime;
    this._storageKey = `${this._name}Data`;
    this._storage.registerReducer({
      key: this._storageKey,
      reducer: getDataReducer(this.actionTypes),
    });

    this.addSelector('conversationLogMap',
      () => this._messageStore.messages,
      () => this._extensionInfo.extensionNumber,
      (messages, extensionNumber) => {
        const mapping = {};
        messages.slice().sort(sortByDate)
          .forEach((message) => {
            const conversationId = message.conversationId;
            const date = this._formatDateTime({
              type: 'date',
              utcTimestamp: message.creationTime,
            });
            if (!mapping[conversationId]) {
              mapping[conversationId] = {};
            }
            if (!mapping[conversationId][date]) {
              mapping[conversationId][date] = {
                conversationLogId: getLogId({ conversationId, date }),
                conversationId,
                creationTime: message.createTime, // for sorting
                date,
                type: message.type,
                messages: [],
                ...getNumbersFromMessage({ extensionNumber, message }),
              };
            }
            mapping[conversationId][date].messages.push(message);
          });
        return mapping;
      },
    );

    this.addSelector('conversationLogIds',
      this._selectors.conversationLogMap,
      (conversationLogMap) => {
        const logIds = [];
        Object.keys(conversationLogMap).forEach((conversationId) => {
          Object.keys(conversationLogMap[conversationId]).forEach((date) => {
            logIds.push(conversationLogMap[conversationId][date].conversationLogId);
          });
        });
        return logIds;
      },
    );
    this.addSelector('uniqueNumbers',
      this._selectors.conversationLogMap,
      (conversationLogMap) => {
        const output = [];
        const numberMap = {};
        function addIfNotExist(contact) {
          const number = contact.phoneNumber || contact.extensionNumber;
          if (number && !numberMap[number]) {
            output.push(number);
            numberMap[number] = true;
          }
        }
        Object.keys(conversationLogMap).forEach((conversationId) => {
          Object.keys(conversationLogMap[conversationId]).forEach((date) => {
            const conversation = conversationLogMap[conversationId][date];
            addIfNotExist(conversation.self);
            conversation.correspondents.forEach(addIfNotExist);
          });
        });
        return output;
      },
    );

    this._contactMatcher.addQuerySource({
      getQueriesFn: this._selectors.uniqueNumbers,
      readyCheckFn: () => (
        this._messageStore.ready &&
        this._extensionInfo.ready
      ),
    });
    this._conversationMatcher.addQuerySource({
      getQueriesFn: this._selectors.conversationLogIds,
      readyCheckFn: () => (
        this._messageStore.ready &&
        this._extensionInfo.ready
      ),
    });

    this._lastProcessedConversationLogMap = null;
  }

  _shouldInit() {
    return this.pending &&
      this._contactMatcher.ready &&
      this._conversationMatcher.ready &&
      this._dateTimeFormat.ready &&
      this._extensionInfo.ready &&
      this._messageStore.ready &&
      this._rolesAndPermissions.ready &&
      this._storage.ready &&
      this._tabManager.ready &&
      this._readyCheckFunction();
  }
  _shouldReset() {
    return this.ready &&
      (
        !this._contactMatcher.ready ||
        !this._conversationMatcher.ready ||
        !this._dateTimeFormat.ready ||
        !this._extensionInfo.ready ||
        !this._messageStore.ready ||
        !this._rolesAndPermissions.ready ||
        !this._storage.ready ||
        !this._tabManager.ready ||
        !this._readyCheckFunction()
      );
  }
  _onReset() {
    this._lastProcessedConversations = null;
    this._lastAutoLog = null;
  }

  async _processConversationLog({
    conversation,
  }) {
    await this._conversationMatcher.triggerMatch();
    if (
      this._conversationMatcher.dataMapping[conversation.conversationLogId] &&
      this._conversationMatcher.dataMapping[conversation.conversationLogId].length
    ) {
      // update conversation
      this._autoLogConversation({
        conversation,
      });
    } else if (this.autoLog && conversation.type === messageTypes.sms) {
      // new entry
      await this._contactMatcher.triggerMatch();
      const selfNumber = conversation.self &&
        (conversation.self.phoneNumber || conversation.self.extensionNumber);
      const selfMatches = (selfNumber &&
        this._contactMatcher.dataMapping[conversation.self]) || [];
      const correspondentMatches = (conversation.correspondents &&
        conversation.correspondents.reduce((result, contact) => {
          const number = contact.phoneNumber || contact.extensionNumber;
          return number && this._contactMatcher.dataMapping[number] ?
            result.concat(this._contactMatcher.dataMapping[number]) :
            result;
        }, [])) || [];

      const selfEntity = (selfMatches &&
        selfMatches.length === 1 &&
        selfMatches[0]) ||
        null;

      // check older dates for existing selected entity match
      const lastRecord = Object.keys(this.conversationLogMap[conversation.conversationId])
        .map(date => (
          this.conversationLogMap[conversation.conversationId][date]
        )).sort(sortByDate)[1];
      let correspondentEntity;
      if (
        lastRecord &&
        this._conversationMatcher.dataMapping[lastRecord.conversationLogId] &&
        this._conversationMatcher.dataMapping[lastRecord.conversationLogId].length
      ) {
        const lastActivity = this._conversationMatcher.dataMapping[lastRecord.conversationLogId][0];
        correspondentEntity = correspondentMatches.find(item => (
          this._isLoggedContact(conversation, lastActivity, item)
        ));
      }
      correspondentEntity = correspondentEntity ||
        (correspondentMatches &&
          correspondentMatches.length === 1 &&
          correspondentMatches[0]) ||
        null;
      await this._autoLogConversation({
        conversation,
        selfEntity,
        correspondentEntity,
      });
    }
  }

  _processConversationLogMap() {
    if (this.ready && this._lastAutoLog !== this.autoLog) {
      this._lastAutoLog = this.autoLog;
      if (this.autoLog) {
        // force conversation log checking when switch auto log to on
        this._lastProcessedConversationLogMap = null;
      }
    }
    if (this.ready && this._lastProcessedConversations !== this.conversationLogMap) {
      this._conversationMatcher.triggerMatch();
      this._contactMatcher.triggerMatch();
      const oldMap = this._lastProcessedConversations || {};
      this._lastProcessedConversations = this.conversationLogMap;
      if (this._tabManager.active) {
        Object.keys(this._lastProcessedConversations).forEach((conversationId) => {
          Object.keys(this._lastProcessedConversations[conversationId]).forEach((date) => {
            const conversation = this._lastProcessedConversations[conversationId][date];
            if (
              !oldMap[conversationId] ||
              !oldMap[conversationId][date] ||
              conversation.messages[0].id !== oldMap[conversationId][date].messages[0].id
            ) {
              this._processConversationLog({
                conversation,
              });
            }
          });
        });
      }
    }
  }

  async _onStateChange() {
    await super._onStateChange();
    this._processConversationLogMap();
  }

  async _autoLogConversation({ conversation, selfEntity, correspondentEntity }) {
    await this.log({
      conversation,
      selfEntity,
      correspondentEntity,
    });
  }
  async log({ conversation, ...options }) {
    super.log({ item: conversation, ...options });
  }

  async logConversation({ conversationId, correspondentEntity, redirect, ...options }) {
    if (this.conversationLogMap[conversationId]) {
      await Promise.all(Object.keys(this.conversationLogMap[conversationId])
        .map(date => this.conversationLogMap[conversationId][date])
        .sort(sortByDate)
        .map((conversation, idx) => this.log({
          ...options,
          conversation,
          correspondentEntity,
          redirect: redirect && idx === 0, // on issue one with redirect
        })));
    }
  }

  get available() {
    const {
      SMSReceiving,
      PagerReceiving,
    } = this._rolesAndPermissions.serviceFeatures;
    return !!(
      (SMSReceiving && SMSReceiving.enabled) ||
      (PagerReceiving && PagerReceiving.enabled)
    );
  }

  get autoLog() {
    return this._storage.getItem(this._storageKey).autoLog;
  }

  setAutoLog(autoLog) {
    if (this.ready && autoLog !== this.autoLog) {
      this.store.dispatch({
        type: this.actionTypes.setAutoLog,
        autoLog,
      });
    }
  }

  get conversationLogMap() {
    return this._selectors.conversationLogMap();
  }

  get conversationLogIds() {
    return this._selectors.conversationLogIds();
  }
  getConversationLogId(message) {
    const conversationId = message.conversationId;
    const date = this._formatDateTime({
      type: 'date',
      utcTimestamp: message.creationTime,
    });
    return getLogId({
      conversationId,
      date,
    });
  }

  get dataMapping() {
    return this._conversationMatcher.dataMapping;
  }
}
