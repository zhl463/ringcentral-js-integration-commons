import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

export function getCurrentMessagesReducer(types) {
  return (state = [], { type, messages }) => {
    switch (type) {
      case types.updateMessages:
        return messages;
      case types.pushMessages:
        return state.concat(messages);
      default:
        return state;
    }
  };
}

export function getCurrentPageReducer(types) {
  return (state = 1, { type }) => {
    switch (type) {
      case types.nextPage:
        return state + 1;
      case types.resetPage:
        return 1;
      default:
        return state;
    }
  };
}

export function getLastUpdatedAtReducer(types) {
  return (state = null, { type }) => {
    switch (type) {
      case types.pushMessages:
      case types.updateMessages:
        return Date.now();
      default:
        return state;
    }
  };
}

export function getMessageStoreUpdatedAt(types) {
  return (state = null, { type, messagesTimestamp }) => {
    switch (type) {
      case types.pushMessages:
      case types.updateMessages:
        return messagesTimestamp;
      default:
        return state;
    }
  };
}

export function getSearingStringReducer(types) {
  return (state = '', { type, searchingString }) => {
    switch (type) {
      case types.updateSearchingString:
        return searchingString;
      case types.cleanSearchingString:
        return '';
      default:
        return state;
    }
  };
}

export function getSearchingResultsReducer(types) {
  return (state = [], { type, searchResults }) => {
    switch (type) {
      case types.updateSearchResults:
        return searchResults;
      default:
        return state;
    }
  };
}

export default function getMessagesReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    messages: getCurrentMessagesReducer(types),
    currentPage: getCurrentPageReducer(types),
    lastUpdatedAt: getLastUpdatedAtReducer(types),
    messageStoreUpdatedAt: getMessageStoreUpdatedAt(types),
    searchingString: getSearingStringReducer(types),
    searchingResults: getSearchingResultsReducer(types),
  });
}
