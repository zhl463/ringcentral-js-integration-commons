import RcModule from '../../lib/RcModule';
import moduleStatus from '../../enums/moduleStatus';

import actionTypes from './actionTypes';
import getMessagesReducer from './getMessagesReducer';

export default class Messages extends RcModule {
  constructor({
    messageStore,
    perPage = 10,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._messageStore = messageStore;
    this._perPage = perPage;
    this._reducer = getMessagesReducer(this.actionTypes);
    this.loadNextPageMessages = this.loadNextPageMessages.bind(this);
    this.updateSearchingString = this.updateSearchingString.bind(this);
    this.updateSearchResults = this.updateSearchResults.bind(this);
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
  }

  _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
      this._initMessages();
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
    } else if (this._shouldReset()) {
      this._resetModuleStatus();
    } else if (this._shouldReload()) {
      this._reloadMessages();
    }
  }

  _shouldInit() {
    return (
      this._messageStore.ready &&
      this.pending
    );
  }

  _shouldReset() {
    return (
      (!this._messageStore.ready) &&
      this.ready
    );
  }

  _shouldReload() {
    return (
      this.ready &&
      this.messageStoreUpdatedAt !== this._messageStore.updatedTimestamp
    );
  }

  _initMessages() {
    const messages = this._getCurrnetPageMessages(1);
    this.store.dispatch({
      type: this.actionTypes.resetPage,
    });
    this._updateMessages(messages);
  }

  _resetModuleStatus() {
    this.store.dispatch({
      type: this.actionTypes.resetSuccess,
    });
  }

  _reloadMessages() {
    const page = this.currentPage;
    const allMessages = this._messageStore.conversations;
    let bottomIndex = allMessages.length - (this._perPage * page);
    if (bottomIndex < 0) {
      bottomIndex = 0;
    }
    const newMessages = allMessages.slice(bottomIndex, allMessages.length).reverse();
    this._updateMessages(newMessages);
  }

  _updateMessages(messages) {
    this.store.dispatch({
      type: this.actionTypes.updateMessages,
      messagesTimestamp: this._messageStore.updatedTimestamp,
      messages,
    });
  }

  _getCurrnetPageMessages(page) {
    const allMessages = this._messageStore.conversations;
    const maxIndex = allMessages.length - 1;
    if (maxIndex < 0) {
      return [];
    }
    if (page < 1) {
      page = 1;
    }
    const topIndex = maxIndex - (this._perPage * (page - 1));
    if (topIndex < 0) {
      return [];
    }
    let bottomIndex = (topIndex - this._perPage) + 1;
    if (bottomIndex < 0) {
      bottomIndex = 0;
    }
    return allMessages.slice(bottomIndex, topIndex + 1).reverse();
  }

  loadNextPageMessages() {
    const page = this.currentPage + 1;
    const messages = this._getCurrnetPageMessages(page);
    if (messages.length === 0) {
      return;
    }
    this.store.dispatch({
      type: this.actionTypes.pushMessages,
      messagesTimestamp: this._messageStore.updatedTimestamp,
      messages,
    });
    this.store.dispatch({
      type: this.actionTypes.nextPage,
    });
  }

  updateSearchingString(searchingString) {
    this.store.dispatch({
      type: this.actionTypes.updateSearchingString,
      searchingString,
    });
  }

  updateSearchResults(searchResults) {
    this.store.dispatch({
      type: this.actionTypes.updateSearchResults,
      searchResults,
    });
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.status === moduleStatus.ready;
  }

  get pending() {
    return this.status === moduleStatus.pending;
  }

  get messages() {
    return this.state.messages;
  }

  get currentPage() {
    return this.state.currentPage;
  }

  get loading() {
    const allMessages = this._messageStore.conversations;
    return this.messages.length < allMessages.length;
  }

  get lastUpdatedAt() {
    return this.state.lastUpdatedAt;
  }

  get messageStoreUpdatedAt() {
    return this.state.messageStoreUpdatedAt;
  }

  get searchingString() {
    return this.state.searchingString;
  }

  get searchingResults() {
    return this.state.searchingResults;
  }
}
