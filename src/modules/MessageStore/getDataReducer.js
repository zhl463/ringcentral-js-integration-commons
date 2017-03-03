import { combineReducers } from 'redux';
import {
  pushRecordsToMessageData,
  updateConversationRecipients,
} from './messageStoreHelper';

const initialConversationsDataState = {
  conversations: [],
  conversationMap: {},
  messages: [],
};
export function getMessageDataReducer(types) {
  return (state = initialConversationsDataState, {
    type,
    records,
    syncToken = null,
    syncConversationId = null,
    conversationId = null,
    recipients = null,
  }) => {
    switch (type) {
      case types.syncSuccess:
      case types.updateMessages:
        return pushRecordsToMessageData({
          ...state,
          records,
          syncToken,
        });
      case types.syncConversationSuccess:
        return pushRecordsToMessageData({
          ...state,
          records,
          syncToken,
          syncConversationId,
        });
      case types.updateConversationRecipients:
        return updateConversationRecipients({
          ...state,
          conversationId,
          recipients,
        });
      case types.cleanUp:
        return initialConversationsDataState;
      default:
        return state;
    }
  };
}

export function getUpdatedTimestampReducer(types) {
  return (state = null, { type }) => {
    switch (type) {
      case types.syncSuccess:
      case types.syncConversationSuccess:
      case types.updateConversationRecipients:
      case types.updateMessages:
        return Date.now();
      case types.cleanUp:
        return null;
      default:
        return state;
    }
  };
}

export function getSyncTokenReducer(types) {
  return (state = null, { type, syncToken }) => {
    switch (type) {
      case types.syncSuccess:
        return syncToken;
      case types.cleanUp:
        return null;
      default:
        return state;
    }
  };
}

export function getSyncTimestampReducer(types) {
  return (state = null, { type, syncTimestamp }) => {
    switch (type) {
      case types.syncSuccess:
        return syncTimestamp;
      case types.cleanUp:
        return null;
      default:
        return state;
    }
  };
}

export default function getDataReducer(types) {
  return combineReducers({
    data: getMessageDataReducer(types),
    updatedTimestamp: getUpdatedTimestampReducer(types),
    syncToken: getSyncTokenReducer(types),
    syncTimestamp: getSyncTimestampReducer(types),
  });
}
