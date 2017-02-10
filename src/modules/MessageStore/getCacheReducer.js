import { combineReducers } from 'redux';

export function getConversationsReducer(types) {
  return (state = {}, { type, data }) => {
    switch (type) {
      case types.saveConversations: {
        return {
          data,
          timestamp: Date.now(),
        };
      }
      case types.cleanUp:
        return {};
      default:
        return state;
    }
  };
}

export function getMessagesReducer(types) {
  return (state = {}, { type, data }) => {
    switch (type) {
      case types.saveMessages: {
        return {
          data,
          timestamp: Date.now(),
        };
      }
      case types.cleanUp:
        return {};
      default:
        return state;
    }
  };
}

export function getSyncTokenReducer(types) {
  return (state = null, { type, syncToken }) => {
    switch (type) {
      case types.saveSyncToken: {
        return syncToken;
      }
      case types.cleanUp:
        return null;
      default:
        return state;
    }
  };
}

export function getUnreadCountsReducer(types) {
  return (state = 0, { type, unreadCounts }) => {
    switch (type) {
      case types.updateUnreadCounts:
        return unreadCounts;
      default:
        return state;
    }
  };
}

export default function getCacheReducer(types) {
  return combineReducers({
    conversations: getConversationsReducer(types),
    messages: getMessagesReducer(types),
    syncToken: getSyncTokenReducer(types),
    unreadCounts: getUnreadCountsReducer(types),
  });
}
