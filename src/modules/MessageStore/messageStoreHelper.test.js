import { expect } from 'chai';
import * as messageStoreHelper from './messageStoreHelper';

describe('pushMessageToConversationMessages', () => {
  let messages;
  beforeEach(() => {
    messages = [
      {
        id: '1234567',
        conversation: {
          id: '1234567890'
        },
        type: 'SMS',
        subject: 'test',
        availability: 'Alive',
        readStatus: 'Unread',
        creationTime: '2017-02-03T09:53:49.000Z',
        to: [{
          phoneNumber: '+1234567890',
        }],
        from: { phoneNumber: '+1234567891' },
      },
      {
        id: '1234568',
        conversation: {
          id: '1234567890'
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
    ];
  });

  it('should return messages correctly when get a new message', () => {
    const message = {
      id: '1234569',
      conversation: {
        id: '1234567890'
      },
      type: 'SMS',
      subject: 'test2',
      availability: 'Alive',
      readStatus: 'Unread',
      creationTime: '2017-02-03T09:56:49.000Z',
      to: [{
        phoneNumber: '+1234567890',
      }],
      from: { phoneNumber: '+1234567891' },
    };
    const expectResult = messages.slice();
    expectResult.push(message);
    const result = messageStoreHelper.pushMessageToConversationMessages({ messages, message });
    expect(result).to.deep.equal(expectResult);
  });

  it('should return messages correctly when get a new message with empty messages', () => {
    messages = [];
    const message = {
      id: '1234569',
      conversation: {
        id: '1234567890'
      },
      type: 'SMS',
      subject: 'test2',
      availability: 'Alive',
      readStatus: 'Unread',
      creationTime: '2017-02-03T09:55:49.000Z',
      to: [{
        phoneNumber: '+1234567890',
      }],
      from: { phoneNumber: '+1234567891' },
    };
    const expectResult = [message];
    const result = messageStoreHelper.pushMessageToConversationMessages({ messages, message });
    expect(result).to.deep.equal(expectResult);
  });

  it('should return messages correctly and update message when get message with existing id', () => {
    const message = {
      id: '1234567',
      conversation: {
        id: '1234567890'
      },
      type: 'SMS',
      subject: 'test2',
      availability: 'Alive',
      readStatus: 'Read',
      creationTime: '2017-02-03T09:53:49.000Z',
      to: [{
        phoneNumber: '+1234567890',
      }],
      from: { phoneNumber: '+1234567891' },
    };
    const expectResult = messages.slice();
    expectResult[0] = message;
    const result = messageStoreHelper.pushMessageToConversationMessages({ messages, message });
    expect(result).to.deep.equal(expectResult);
  });

  it('should not add Fax message to messages', () => {
    const message = {
      id: '1234569',
      conversation: {
        id: '1234567890'
      },
      type: 'Fax',
      subject: 'test2',
      availability: 'Alive',
      readStatus: 'Unread',
      creationTime: '2017-02-03T09:53:49.000Z',
      to: [{
        phoneNumber: '+1234567890',
      }],
      from: { phoneNumber: '+1234567891' },
    };
    const expectResult = messages.slice();
    const result = messageStoreHelper.pushMessageToConversationMessages({ messages, message });
    expect(result).to.deep.equal(expectResult);
  });

  it('should return messages correctly and delete message when get message deleted with existing id', () => {
    const message = {
      id: '1234568',
      conversation: {
        id: '1234567890'
      },
      type: 'Fax',
      subject: 'test2',
      availability: 'Deleted',
      readStatus: 'Unread',
      creationTime: '2017-02-03T09:53:49.000Z',
      to: [{
        phoneNumber: '+1234567890',
      }],
      from: { phoneNumber: '+1234567891' },
    };
    const expectResult = [messages[0]];
    const result = messageStoreHelper.pushMessageToConversationMessages({ messages, message });
    expect(result).to.deep.equal(expectResult);
  });
});

describe('pushMessageToMesages', () => {
  let messages;
  beforeEach(() => {
    messages = [
      {
        id: '1234567',
        conversation: {
          id: '1234567890'
        },
        type: 'SMS',
        subject: 'test',
        availability: 'Alive',
        readStatus: 'Unread',
        creationTime: '2017-02-03T09:53:49.000Z',
        to: [{
          phoneNumber: '+1234567890',
        }],
        from: { phoneNumber: '+1234567891' },
      },
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
    ];
  });

  it('should return messages correctly when get a new message', () => {
    const message = {
      id: '1234569',
      conversation: {
        id: '1234567892'
      },
      type: 'SMS',
      subject: 'test2',
      availability: 'Alive',
      readStatus: 'Unread',
      creationTime: '2017-02-03T09:56:49.000Z',
      to: [{
        phoneNumber: '+1234567890',
      }],
      from: { phoneNumber: '+1234567891' },
    };
    const expectResult = messages.slice();
    expectResult.push(message);
    const result = messageStoreHelper.pushMessageToMesages({ messages, message });
    expect(result).to.deep.equal(expectResult);
  });

  it('should return messages correctly when get a new message with empty messages', () => {
    messages = [];
    const message = {
      id: '1234569',
      conversation: {
        id: '1234567890'
      },
      type: 'SMS',
      subject: 'test2',
      availability: 'Alive',
      readStatus: 'Unread',
      creationTime: '2017-02-03T09:56:49.000Z',
      to: [{
        phoneNumber: '+1234567890',
      }],
      from: { phoneNumber: '+1234567891' },
    };
    const expectResult = [message];
    const result = messageStoreHelper.pushMessageToMesages({ messages, message });
    expect(result).to.deep.equal(expectResult);
  });

  it('should return messages correctly and not add message when get a new message that is deleted', () => {
    const message = {
      id: '1234569',
      conversation: {
        id: '1234567892'
      },
      type: 'SMS',
      subject: 'test2',
      availability: 'Deleted',
      readStatus: 'Unread',
      creationTime: '2017-02-03T09:53:49.000Z',
      to: [{
        phoneNumber: '+1234567890',
      }],
      from: { phoneNumber: '+1234567891' },
    };
    const expectResult = messages.slice();
    const result = messageStoreHelper.pushMessageToMesages({ messages, message });
    expect(result).to.deep.equal(expectResult);
  });

  it('should return messages correctly and update message when get message with existing id', () => {
    const message = {
      id: '1234567',
      conversation: {
        id: '1234567890'
      },
      type: 'SMS',
      subject: 'test2',
      availability: 'Alive',
      readStatus: 'Read',
      creationTime: '2017-02-03T09:53:49.000Z',
      to: [{
        phoneNumber: '+1234567890',
      }],
      from: { phoneNumber: '+1234567891' },
    };
    const expectResult = [messages[1]];
    expectResult.push(message);
    const result = messageStoreHelper.pushMessageToMesages({ messages, message });
    expect(result).to.deep.equal(expectResult);
  });

  it('should return messages correctly and update message when get message with same conversation id', () => {
    const message = {
      id: '1234569',
      conversation: {
        id: '1234567890'
      },
      type: 'SMS',
      subject: 'test2',
      availability: 'Alive',
      readStatus: 'Unread',
      creationTime: '2017-02-03T09:53:49.000Z',
      to: [{
        phoneNumber: '+1234567890',
      }],
      from: { phoneNumber: '+1234567891' },
    };
    const expectResult = [messages[1]];
    expectResult.push(message);
    const result = messageStoreHelper.pushMessageToMesages({ messages, message });
    expect(result).to.deep.equal(expectResult);
  });

  it('should return messages correctly and not update message when get message with same conversation id but created early', () => {
    const message = {
      id: '1234569',
      conversation: {
        id: '1234567890'
      },
      type: 'SMS',
      subject: 'test2',
      availability: 'Deleted',
      readStatus: 'Unread',
      creationTime: '2017-02-03T09:50:49.000Z',
      to: [{
        phoneNumber: '+1234567890',
      }],
      from: { phoneNumber: '+1234567891' },
    };
    const expectResult = messages.slice();
    const result = messageStoreHelper.pushMessageToMesages({ messages, message });
    expect(result).to.deep.equal(expectResult);
  });

  it('should return messages correctly and delete message when get message deleted with existing id', () => {
    const message = {
      id: '1234568',
      conversation: {
        id: '1234567890'
      },
      type: 'SMS',
      subject: 'test2',
      availability: 'Deleted',
      readStatus: 'Unread',
      creationTime: '2017-02-03T09:53:49.000Z',
      to: [{
        phoneNumber: '+1234567890',
      }],
      from: { phoneNumber: '+1234567891' },
    };
    const expectResult = [messages[0]];
    const result = messageStoreHelper.pushMessageToMesages({ messages, message });
    expect(result).to.deep.equal(expectResult);
  });
});

describe('getNewConversationsAndMessagesFromRecords', () => {
  let messages;
  let conversations;
  beforeEach(() => {
    messages = [
      {
        id: '1234567',
        conversation: {
          id: '1234567890'
        },
        type: 'SMS',
        subject: 'test',
        availability: 'Alive',
        readStatus: 'Unread',
        creationTime: '2017-02-03T09:53:49.000Z',
        to: [{
          phoneNumber: '+1234567890',
        }],
        from: { phoneNumber: '+1234567891' },
      },
    ];
    conversations = {
      '1234567890': {
        id: '1234567890',
        messages: [
          {
            id: '1234567',
            conversation: {
              id: '1234567890'
            },
            type: 'SMS',
            subject: 'test',
            availability: 'Alive',
            readStatus: 'Unread',
            creationTime: '2017-02-03T09:53:49.000Z',
            to: [{
              phoneNumber: '+1234567890',
            }],
            from: { phoneNumber: '+1234567891' },
          },
        ]
      }
    };
  });

  it('should return messages and conversations success with get new message from records', () => {
    const records = [
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
    ];
    const expectMessages = [messages[0], records[0]];
    const expectConversations = {
      ...conversations,
    };
    expectConversations['1234567891'] = {
      id: '1234567891',
      messages: [
        records[0]
      ]
    };
    const result =
      messageStoreHelper.getNewConversationsAndMessagesFromRecords({
        records,
        conversations,
        messages,
      });
    expect(result).to.deep.equal({
      conversations: expectConversations,
      messages: expectMessages,
    });
  });

  it('should return messages and conversations success with get new message from records', () => {
    messages = [];
    conversations = {};
    const records = [
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
    ];
    const expectMessages = [records[0]];
    const expectConversations = {};
    expectConversations['1234567891'] = {
      id: '1234567891',
      messages: [
        records[0]
      ]
    };
    const result =
      messageStoreHelper.getNewConversationsAndMessagesFromRecords({
        records,
        conversations,
        messages,
      });
    expect(result).to.deep.equal({
      conversations: expectConversations,
      messages: expectMessages,
    });
  });

  it('should return messages and conversations success when has syncToken param', () => {
    messages = [];
    conversations = {};
    const records = [
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
    ];
    const expectMessages = [records[0]];
    const expectConversations = {};
    const syncToken = '1234qqqqqq';
    expectConversations['1234567891'] = {
      id: '1234567891',
      syncToken,
      messages: [
        records[0]
      ]
    };
    const result =
      messageStoreHelper.getNewConversationsAndMessagesFromRecords({
        records,
        conversations,
        messages,
        syncToken,
      });
    expect(result).to.deep.equal({
      conversations: expectConversations,
      messages: expectMessages,
    });
  });

  it('should return messages and conversations success with get new message that has a exist conversation from records', () => {
    const records = [
      {
        id: '1234568',
        conversation: {
          id: '1234567890'
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
    ];
    const expectMessages = [records[0]];
    const expectConversations = {};
    expectConversations['1234567890'] = {
      id: '1234567890',
      messages: [conversations['1234567890'].messages[0], records[0]],
    };
    const result =
      messageStoreHelper.getNewConversationsAndMessagesFromRecords({
        records,
        conversations,
        messages,
      });
    expect(result).to.deep.equal({
      conversations: expectConversations,
      messages: expectMessages,
    });
  });

  it('should return messages and conversations success with get multiple messages from records', () => {
    messages = [];
    conversations = {};
    const records = [
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
      {
        id: '1234569',
        conversation: {
          id: '1234567891'
        },
        type: 'SMS',
        subject: 'test2',
        availability: 'Alive',
        readStatus: 'Unread',
        creationTime: '2017-02-03T09:56:49.000Z',
        to: [{
          phoneNumber: '+1234567890',
        }],
        from: { phoneNumber: '+1234567891' },
      },
    ];
    const expectMessages = [records[1]];
    const expectConversations = {};
    expectConversations['1234567891'] = {
      id: '1234567891',
      messages: [
        records[0], records[1]
      ]
    };
    const result =
      messageStoreHelper.getNewConversationsAndMessagesFromRecords({
        records,
        conversations,
        messages,
      });
    expect(result).to.deep.equal({
      conversations: expectConversations,
      messages: expectMessages,
    });
  });
});

describe('filterConversationUnreadMessages', () => {
  it('should return unread message corectly when have one unread message', () => {
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
    const result =
      messageStoreHelper.filterConversationUnreadMessages(conversation);
    expect(result).to.deep.equal([conversation.messages[0]]);
  });

  it('should return empty array when donot have unread message', () => {
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
          readStatus: 'Read',
          creationTime: '2017-02-03T09:53:49.000Z',
          to: [{
            phoneNumber: '+1234567890',
          }],
          from: { phoneNumber: '+1234567891' },
        },
      ]
    };
    const result =
      messageStoreHelper.filterConversationUnreadMessages(conversation);
    expect(result).to.deep.equal([]);
  });

  it('should return empty array when only have deleted message', () => {
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
          availability: 'Deleted',
          readStatus: 'Unread',
          creationTime: '2017-02-03T09:53:49.000Z',
          to: [{
            phoneNumber: '+1234567890',
          }],
          from: { phoneNumber: '+1234567891' },
        },
      ]
    };
    const result =
      messageStoreHelper.filterConversationUnreadMessages(conversation);
    expect(result).to.deep.equal([]);
  });

  it('should return empty array when only have Outbound message', () => {
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
          direction: 'Outbound',
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
    const result =
      messageStoreHelper.filterConversationUnreadMessages(conversation);
    expect(result).to.deep.equal([]);
  });
});

describe('updateMessagesUnreadCounts', () => {
  it('should return messages with idRead and unreadCounts 1', () => {
    const messages = [
      {
        id: '1234567',
        conversation: {
          id: '1234567890'
        },
        type: 'SMS',
        subject: 'test',
        availability: 'Alive',
        readStatus: 'Unread',
        direction: 'Inbound',
        creationTime: '2017-02-03T09:53:49.000Z',
        to: [{
          phoneNumber: '+1234567890',
        }],
        from: { phoneNumber: '+1234567891' },
      },
    ];
    const conversations = {};
    conversations['1234567890'] = {
      id: '1234567890',
      messages: [
        {
          id: '1234567',
          conversation: {
            id: '1234567890'
          },
          type: 'SMS',
          subject: 'test',
          availability: 'Alive',
          readStatus: 'Unread',
          direction: 'Inbound',
          creationTime: '2017-02-03T09:53:49.000Z',
          to: [{
            phoneNumber: '+1234567890',
          }],
          from: { phoneNumber: '+1234567891' },
        },
      ]
    };
    const expectMessages = [{ ...(messages[0]), isRead: false }];
    const result =
      messageStoreHelper.updateMessagesUnreadCounts(messages, conversations);
    expect(result).to.deep.equal({ messages: expectMessages, unreadCounts: 1 });
  });

  it('should return messages with idRead and unreadCounts 0', () => {
    const messages = [
      {
        id: '1234567',
        conversation: {
          id: '1234567890'
        },
        type: 'SMS',
        subject: 'test',
        availability: 'Alive',
        readStatus: 'Read',
        direction: 'Inbound',
        creationTime: '2017-02-03T09:53:49.000Z',
        to: [{
          phoneNumber: '+1234567890',
        }],
        from: { phoneNumber: '+1234567891' },
      },
    ];
    const conversations = {};
    conversations['1234567890'] = {
      id: '1234567890',
      messages: [
        {
          id: '1234567',
          conversation: {
            id: '1234567890'
          },
          type: 'SMS',
          subject: 'test',
          availability: 'Alive',
          readStatus: 'Read',
          direction: 'Inbound',
          creationTime: '2017-02-03T09:53:49.000Z',
          to: [{
            phoneNumber: '+1234567890',
          }],
          from: { phoneNumber: '+1234567891' },
        },
      ]
    };
    const expectMessages = [{ ...(messages[0]), isRead: true }];
    const result =
      messageStoreHelper.updateMessagesUnreadCounts(messages, conversations);
    expect(result).to.deep.equal({ messages: expectMessages, unreadCounts: 0 });
  });

  it('should return messages with idRead and unreadCounts 2', () => {
    const messages = [
      {
        id: '1234567',
        conversation: {
          id: '1234567890'
        },
        type: 'SMS',
        subject: 'test',
        availability: 'Alive',
        readStatus: 'Read',
        direction: 'Inbound',
        creationTime: '2017-02-03T09:53:50.000Z',
        to: [{
          phoneNumber: '+1234567890',
        }],
        from: { phoneNumber: '+1234567891' },
      },
    ];
    const conversations = {};
    conversations['1234567890'] = {
      id: '1234567890',
      messages: [
        {
          id: '1234567',
          conversation: {
            id: '1234567890'
          },
          type: 'SMS',
          subject: 'test',
          availability: 'Alive',
          readStatus: 'Unread',
          direction: 'Inbound',
          creationTime: '2017-02-03T09:53:50.000Z',
          to: [{
            phoneNumber: '+1234567890',
          }],
          from: { phoneNumber: '+1234567891' },
        },
        {
          id: '12345679',
          conversation: {
            id: '1234567890'
          },
          type: 'SMS',
          subject: 'test',
          availability: 'Alive',
          readStatus: 'Unread',
          direction: 'Inbound',
          creationTime: '2017-02-03T09:53:49.000Z',
          to: [{
            phoneNumber: '+1234567890',
          }],
          from: { phoneNumber: '+1234567891' },
        },
      ]
    };
    const expectMessages = [{ ...(messages[0]), isRead: false }];
    const result =
      messageStoreHelper.updateMessagesUnreadCounts(messages, conversations);
    expect(result).to.deep.equal({ messages: expectMessages, unreadCounts: 2 });
  });
});

describe('getMessageSyncParams', () => {
  it('should return syncToken and syncType is ISync when syncToken exist', () => {
    const syncToken = 'aabbccdd';
    const conversationId = null;
    const result = messageStoreHelper.getMessageSyncParams({
      syncToken,
      conversationId,
    });
    expect(result).to.deep.equal({ syncToken, syncType: 'ISync' });
  });

  it('should return syncToken and syncType is ISync when syncToken exist', () => {
    const result = messageStoreHelper.getMessageSyncParams({});
    expect(result.syncType).to.equal('FSync');
    expect(Object.keys(result)).to.deep.equal(['syncType', 'dateFrom']);
  });

  it('should return params with conversationId when conversationId exist', () => {
    const conversationId = '12345678';
    const result = messageStoreHelper.getMessageSyncParams({ conversationId });
    expect(result.syncType).to.equal('FSync');
    expect(result.conversationId).to.equal('12345678');
    expect(Object.keys(result)).to.deep.equal(['syncType', 'dateFrom', 'conversationId']);
  });
});
