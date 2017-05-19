import RcModule from '../../lib/RcModule';
import moduleStatuses from '../../enums/moduleStatuses';
import ensureExist from '../../lib/ensureExist';
import actionTypes from './actionTypes';
import getMessagesReducer from './getMessagesReducer';
import { getNumbersFromMessage, sortSearchResults } from '../../lib/messageHelper';
import cleanNumber from '../../lib/cleanNumber';

export default class Messages extends RcModule {
  constructor({
    messageStore,
    extensionInfo,
    defaultPerPage = 20,
    contactMatcher,
    conversationMatcher,
    conversationLogger,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._contactMatcher = contactMatcher;
    this._conversationLogger = conversationLogger;
    this._messageStore = this::ensureExist(messageStore, 'messageStore');
    this._extensionInfo = this::ensureExist(extensionInfo, 'extensionInfo');
    this._reducer = getMessagesReducer(this.actionTypes, defaultPerPage);

    this.addSelector('uniqueNumbers',
      () => this._messageStore.conversations,
      (messages) => {
        const output = [];
        const numberMap = {};
        function addIfNotExist(number) {
          if (!numberMap[number]) {
            output.push(number);
            numberMap[number] = true;
          }
        }
        messages.forEach((message) => {
          if (message.from && message.from.phoneNumber) {
            addIfNotExist(message.from.phoneNumber);
          } else if (message.from && message.from.extensionNumber) {
            addIfNotExist(message.from.extensionNumber);
          }
          if (message.to && message.to.length > 0) {
            message.to.forEach((toUser) => {
              if (toUser && toUser.phoneNumber) {
                addIfNotExist(toUser.phoneNumber);
              } else if (toUser && toUser.extensionNumber) {
                addIfNotExist(toUser.extensionNumber);
              }
            });
          }
        });
        return output;
      },
    );
    this.addSelector('effectiveSearchString',
      () => this.state.searchInput,
      (input) => {
        if (input.length >= 3) return input;
        return '';
      }
    );
    this.addSelector('allConversations',
      () => this._messageStore.conversations,
      () => this._extensionInfo.extensionNumber,
      () => this._contactMatcher && this._contactMatcher.dataMapping,
      () => this._conversationLogger && this._conversationLogger.loggingMap,
      () => this._conversationLogger && this._conversationLogger.dataMapping,
      (
        conversations,
        extensionNumber,
        contactMapping = {},
        loggingMap = {},
        conversationLogMapping = {},
      ) => (
          conversations.map((message) => {
            const {
              self,
              correspondents,
          } = getNumbersFromMessage({ extensionNumber, message });
            const selfNumber = self && (self.phoneNumber || self.extensionNumber);
            const selfMatches = (selfNumber && contactMapping[selfNumber]) || [];
            const correspondentMatches = correspondents.reduce((matches, contact) => {
              const number = contact && (contact.phoneNumber || contact.extensionNumber);
              return number && contactMapping[number] && contactMapping[number].length ?
                matches.concat(contactMapping[number]) :
                matches;
            }, []);
            const conversationLogId = this._conversationLogger ?
              this._conversationLogger.getConversationLogId(message) :
              null;
            const isLogging = !!(conversationLogId && loggingMap[conversationLogId]);
            const conversationMatches = conversationLogMapping[conversationLogId] || [];
            return {
              ...message,
              self,
              selfMatches,
              correspondents,
              correspondentMatches,
              conversationLogId,
              isLogging,
              conversationMatches,
            };
          })
        ),
    );
    this.addSelector('filteredConversations',
      this._selectors.allConversations,
      () => this._selectors.effectiveSearchString(),
      (allConversations, effectiveSearchString) => {
        if (effectiveSearchString !== '') {
          const searchResults = [];
          allConversations.forEach((message) => {
            const searchNumber = cleanNumber(effectiveSearchString, false);
            if (searchNumber !== '' && message.correspondents.find(contact => (
              cleanNumber(contact.phoneNumber || contact.extensionNumber || '')
                .indexOf(searchNumber) > -1
            ))) {
              // match by phoneNumber or extensionNumber
              searchResults.push({
                ...message,
                matchOrder: 0,
              });
              return;
            }
            if (message.correspondentMatches.length) {
              if (
                message.correspondentMatches.find(entity => (
                  entity.name && entity.name.indexOf(effectiveSearchString) > -1
                ))
              ) {
                // match by entity's name
                searchResults.push({
                  ...message,
                  matchOrder: 0,
                });
                return;
              }
            } else if (message.correspondents.find(contact => (
              (contact.name || '')
                .indexOf(effectiveSearchString) > -1
            ))) {
              searchResults.push({
                ...message,
                matchOrder: 0,
              });
              return;
            }

            // try match messages of the same conversation
            if (message.subject.indexOf(effectiveSearchString) > -1) {
              searchResults.push({
                ...message,
                matchOrder: 1,
              });
              return;
            }
            const matchedMessage = this._messageStore.messages.find(item => (
              item.conversationId === message.conversationId &&
              item.subject.indexOf(effectiveSearchString) > -1
            ));
            if (matchedMessage) {
              searchResults.push({
                ...message,
                matchedMessage,
                matchOrders: 1,
              });
            }
          });
          return searchResults.sort(sortSearchResults);
        }
        return allConversations.sort(sortSearchResults);
      },
    );

    if (this._contactMatcher) {
      this._contactMatcher.addQuerySource({
        getQueriesFn: this._selectors.uniqueNumbers,
        readyCheckFn: () => (
          this._messageStore.ready
        ),
      });
    }

    this._lastProcessedNumbers = null;
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
  }

  async _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
      if (this._contactMatcher) {
        await this._contactMatcher.triggerMatch();
      }
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
    } else if (this._shouldReset()) {
      this.store.dispatch({
        type: this.actionTypes.reset,
      });
      this._lastProcessedNumbers = null;
      this.store.dispatch({
        type: this.actionTypes.resetSuccess,
      });
    } else if (this._lastProcessedNumbers !== this.uniqueNumbers) {
      this._lastProcessedNumbers = this.uniqueNumbers;
      if (this._contactMatcher) {
        this._contactMatcher.triggerMatch();
      }
    }
  }

  _shouldInit() {
    return (
      this._messageStore.ready &&
      this._extensionInfo.ready &&
      (!this._contactMatcher || this._contactMatcher.ready) &&
      (!this._conversationLogger || this._conversationLogger.ready) &&
      this.pending
    );
  }

  _shouldReset() {
    return (
      (
        !this._messageStore.ready ||
        !this._extensionInfo.ready ||
        (this._contactMatcher && !this._contactMatcher.ready) ||
        (this._conversationLogger && !this._conversationLogger.ready)
      ) &&
      this.ready
    );
  }

  _getCurrnetPageMessages(page) {
    this.store.dispatch({
      type: this.actionTypes.setPage,
      page,
    });
  }

  loadNextPageMessages() {
    this.store.dispatch({
      type: this.actionTypes.nextPage,
    });
  }

  updateSearchInput(input) {
    this.store.dispatch({
      type: this.actionTypes.updateSearchInput,
      input,
    });
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.status === moduleStatuses.ready;
  }

  get pending() {
    return this.status === moduleStatuses.pending;
  }

  get searchInput() {
    return this.state.searchInput;
  }

  get allConversations() {
    return this._selectors.allConversations();
  }

  get filteredConversations() {
    return this._selectors.filteredConversations();
  }
}
