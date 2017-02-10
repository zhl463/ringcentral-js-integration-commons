import { expect } from 'chai';
import getCacheReducer, {
  getConversationsReducer,
  getMessagesReducer,
  getSyncTokenReducer,
  getUnreadCountsReducer,
} from './getCacheReducer';

import messageStoreActionTypes from './messageStoreActionTypes';

describe('MessageStore :: Cache :: getConversationsReducer', () => {
  it('should be a function', () => {
    expect(getConversationsReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getConversationsReducer()).to.be.a('function');
  });
  describe('conversationsReducer', () => {
    const reducer = getConversationsReducer(messageStoreActionTypes);
    it('should have empty object for initial state ', () => {
      expect(reducer(undefined, {})).to.deep.equal({});
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });

    it('should return data with \'data\' and \'timestamp\' as key on saveConversations', () => {
      const originalData = [{ id: 1 }, { id: 2 }];
      const originalState = {};
      expect(reducer(originalState, {
        type: messageStoreActionTypes.saveConversations,
        data: originalData
      })).to.include.keys('data', 'timestamp');
    });
    it('should return data on saveConversations', () => {
      const originalData = [{ id: 1 }, { id: 2 }];
      const originalState = {};
      const expectData = originalData;
      expect(reducer(originalState, {
        type: messageStoreActionTypes.saveConversations,
        data: originalData
      }).data).to.deep.equal(expectData);
    });

    it('should return empty object on cleanUp', () => {
      const originalState = {
        data: ['test'],
        timestamp: Date.now(),
      };
      expect(reducer(originalState, {
        type: messageStoreActionTypes.cleanUp,
      })).to.deep.equal({});
    });
  });
});

describe('MessageStore :: Cache :: getMessagesReducer', () => {
  it('should be a function', () => {
    expect(getMessagesReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getMessagesReducer()).to.be.a('function');
  });
  describe('messagesReducer', () => {
    const reducer = getMessagesReducer(messageStoreActionTypes);
    it('should have empty object for initial state ', () => {
      expect(reducer(undefined, {})).to.deep.equal({});
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });

    it('should return data with \'data\' and \'timestamp\' as key on saveMessages', () => {
      const originalData = [{ id: 1 }, { id: 2 }];
      const originalState = {};
      expect(reducer(originalState, {
        type: messageStoreActionTypes.saveMessages,
        data: originalData
      })).to.include.keys('data', 'timestamp');
    });
    it('should return data on saveMessages', () => {
      const originalData = [{ id: 1 }, { id: 2 }];
      const originalState = {};
      const expectData = originalData;
      expect(reducer(originalState, {
        type: messageStoreActionTypes.saveMessages,
        data: originalData
      }).data).to.deep.equal(expectData);
    });

    it('should return empty object on cleanUp', () => {
      const originalState = {
        data: ['test'],
        timestamp: Date.now(),
      };
      expect(reducer(originalState, {
        type: messageStoreActionTypes.cleanUp,
      })).to.deep.equal({});
    });
  });
});

describe('MessageStore :: Cache :: getSyncTokenReducer', () => {
  it('should be a function', () => {
    expect(getSyncTokenReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getSyncTokenReducer()).to.be.a('function');
  });
  describe('syncTokenReducer', () => {
    const reducer = getSyncTokenReducer(messageStoreActionTypes);
    it('should have null for initial state ', () => {
      expect(reducer(undefined, {})).to.equal(null);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = 'test';
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });

    it('should return data on saveSyncToken', () => {
      const originalState = '12345678';
      expect(reducer(originalState, {
        type: messageStoreActionTypes.saveSyncToken,
        syncToken: '123',
      })).to.equal('123');
    });

    it('should return empty object on cleanUp', () => {
      const originalState = 'test';
      expect(reducer(originalState, {
        type: messageStoreActionTypes.cleanUp,
      })).to.equal(null);
    });
  });
});

describe('MessageStore :: Cache :: getUnreadCountsReducer', () => {
  it('should be a function', () => {
    expect(getUnreadCountsReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getUnreadCountsReducer()).to.be.a('function');
  });
  describe('unreadCountsReducer', () => {
    const reducer = getUnreadCountsReducer(messageStoreActionTypes);
    it('should have zero for initial state ', () => {
      expect(reducer(undefined, {})).to.equal(0);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = 3;
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });

    it('should return data on updateUnreadCounts', () => {
      const originalState = 12;
      expect(reducer(originalState, {
        type: messageStoreActionTypes.updateUnreadCounts,
        unreadCounts: 123,
      })).to.equal(123);
    });
  });
});

describe('getCacheReducer', () => {
  it('should be a function', () => {
    expect(getCacheReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getCacheReducer(messageStoreActionTypes)).to.be.a('function');
  });
  describe('conversationsReducer', () => {
    const reducer = getCacheReducer(messageStoreActionTypes);
    const conversationReducer = getConversationsReducer(messageStoreActionTypes);
    const messagesReducer = getMessagesReducer(messageStoreActionTypes);
    const syncTokenReducer = getSyncTokenReducer(messageStoreActionTypes);
    const unreadCountsReducer = getUnreadCountsReducer(messageStoreActionTypes);
    it('should return combined state', () => {
      expect(reducer(undefined, {}))
        .to.deep.equal({
          conversations: conversationReducer(undefined, {}),
          messages: messagesReducer(undefined, {}),
          syncToken: syncTokenReducer(undefined, {}),
          unreadCounts: unreadCountsReducer(undefined, {}),
        });
    });
  });
});
