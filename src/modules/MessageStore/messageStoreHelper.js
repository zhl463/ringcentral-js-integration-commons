import * as messageHelper from '../../lib/messageHelper';

function pushOrReplaceOrDeleteMessage({
  messages,
  message,
  isFind,
  replaceMessage,
  pushMessage,
  deleteMessage
}) {
  const messageLength = messages.length;
  let messageExistIndex = null;
  if (messageLength > 0) {
    for (let index = (messageLength - 1); index >= 0; index -= 1) {
      if (isFind({
        oldMessage: messages[index],
        newMessage: message,
      })) {
        messageExistIndex = index;
        break;
      }
    }
  }
  if (messageExistIndex === null) {
    if (messageHelper.messageIsAcceptable(message)) {
      pushMessage(message);
    }
    return;
  }
  if (messageHelper.messageIsDeleted(message)) {
    if (messages[messageExistIndex].id === message.id) {
      deleteMessage(messageExistIndex);
    }
    return;
  }
  replaceMessage({ index: messageExistIndex, newMessage: message });
}

export function pushMessageToConversationMessages({ messages, message }) {
  const isFind = ({ oldMessage, newMessage }) => (
    oldMessage.id === newMessage.id
  );
  const replaceMessage = ({ index, newMessage }) => {
    messages[index] = newMessage;
  };
  const pushMessage = (newMessage) => {
    messages.push(newMessage);
  };
  const deleteMessage = (index) => {
    messages.splice(index, 1);
  };
  pushOrReplaceOrDeleteMessage({
    messages,
    message,
    isFind,
    replaceMessage,
    pushMessage,
    deleteMessage
  });
  return messages;
}

export function pushMessageToMesages({ messages, message }) {
  const isFind = ({ oldMessage, newMessage }) => (
    oldMessage.id === newMessage.id ||
      oldMessage.conversation.id === newMessage.conversation.id
  );
  const replaceMessage = ({ index, newMessage }) => {
    const oldCreated = new Date(messages[index].creationTime);
    const newCreated = new Date(message.creationTime);
    if (newCreated >= oldCreated) {
      messages.splice(index, 1);
      messages.push(newMessage);
    }
  };
  const pushMessage = (newMessage) => {
    messages.push(newMessage);
  };
  const deleteMessage = (index) => {
    messages.splice(index, 1);
  };

  pushOrReplaceOrDeleteMessage({
    messages,
    message,
    isFind,
    replaceMessage,
    pushMessage,
    deleteMessage
  });
  return messages;
}

export function getNewConversationsAndMessagesFromRecords({
  records,
  syncToken,
  conversations,
  messages,
}) {
  records.forEach((record) => {
    if (!messageHelper.messaageIsTextMessage(record)) {
      return;
    }
    const conversationId = record.conversation.id;
    let conversation = conversations[conversationId];
    if (!conversation) {
      conversation = { messages: [] };
    }
    const oldMessages = conversation.messages;
    conversation.messages = pushMessageToConversationMessages({
      messages: oldMessages,
      message: record,
    });
    if (syncToken) {
      conversation.syncToken = syncToken;
    }
    conversation.id = conversationId;
    conversations[conversationId] = conversation;
    messages = pushMessageToMesages({
      messages,
      message: record
    });
  });
  return { conversations, messages };
}

export function filterConversationUnreadMessages(conversation) {
  const unReadMessages = conversation.messages.filter(record => (
    record.direction === 'Inbound' &&
    !(messageHelper.messageIsDeleted(record)) &&
    record.readStatus !== 'Read'
  ));
  return unReadMessages;
}

export function updateMessagesUnreadCounts(messages, conversations) {
  let totalUnreadCounts = 0;
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    const conversation = conversations[message.conversation.id];
    const unReadMessages = filterConversationUnreadMessages(conversation);
    totalUnreadCounts += unReadMessages.length;
    message.isRead = (unReadMessages.length === 0);
  }
  return {
    messages,
    unreadCounts: totalUnreadCounts
  };
}

export function getMessageSyncParams({ syncToken, conversationId }) {
  if (syncToken) {
    return {
      syncToken,
      syncType: 'ISync',
    };
  }
  const lastSevenDate = new Date();
  lastSevenDate.setDate(lastSevenDate.getDate() - 7);
  const params = {
    syncType: 'FSync',
    dateFrom: lastSevenDate.toISOString(),
  };
  if (conversationId) {
    params.conversationId = conversationId;
  }
  return params;
}
