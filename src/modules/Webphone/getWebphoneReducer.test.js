import { expect } from 'chai';
import getWebphoneReducer, {
  getVideoElementPreparedReducer,
  getConnectionStatusReducer,
  getConnectRetryCountsReducer,
  getWebphoneCountsReducer,
  getCurrentSessionReducer,
  getSessionsReducer,
  getMinimizedReducer,
  getErrorCodeReducer,
} from './getWebphoneReducer';

import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

import actionTypes from './actionTypes';
import connectionStatus from './connectionStatus';

describe('Webphone :: getVideoElementPreparedReducer', () => {
  it('getVideoElementPreparedReducer should be a function', () => {
    expect(getVideoElementPreparedReducer).to.be.a('function');
  });
  it('getVideoElementPreparedReducer should return a reducer', () => {
    expect(getVideoElementPreparedReducer()).to.be.a('function');
  });
  describe('videoElementPreparedReducer', () => {
    const reducer = getVideoElementPreparedReducer(actionTypes);
    it('should have initial state of false', () => {
      expect(reducer(undefined, {})).to.equal(false);
    });
    it('should return original state when actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
      .to.equal(originalState);
    });
    it('should return true when action.type is videoElementPrepared', () => {
      expect(reducer({}, { type: actionTypes.videoElementPrepared })).to.equal(true);
    });
  });
});

describe('Webphone :: getConnectionStatusReducer', () => {
  it('getConnectionStatusReducer should be a function', () => {
    expect(getConnectionStatusReducer).to.be.a('function');
  });
  it('getConnectionStatusReducer should return a reducer', () => {
    expect(getConnectionStatusReducer()).to.be.a('function');
  });
  describe('connectionStatusReducer', () => {
    const reducer = getConnectionStatusReducer(actionTypes);
    it('should have initial state of disconnected', () => {
      expect(reducer(undefined, {})).to.equal(connectionStatus.disconnected);
    });
    it('should return original state when actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
      .to.equal(originalState);
    });

    it('should return connecting when actionTypes is connect or reconnect', () => {
      [
        actionTypes.connect,
        actionTypes.reconnect,
      ].forEach((type) => {
        expect(reducer('foo', {
          type,
        })).to.equal(connectionStatus.connecting);
      });
    });

    it('should return connected when actionTypes is registered', () => {
      expect(reducer('foo', { type: actionTypes.registered, }))
        .to.equal(connectionStatus.connected);
    });

    it('should return disconnected when actionTypes is unregistered', () => {
      expect(reducer('foo', { type: actionTypes.unregistered, }))
        .to.equal(connectionStatus.disconnected);
    });

    it('should return disconnecting when actionTypes is disconnect', () => {
      expect(reducer('foo', { type: actionTypes.disconnect, }))
        .to.equal(connectionStatus.disconnecting);
    });

    it('should return connectFailed when actionTypes is connectError or registrationFailed', () => {
      [
        actionTypes.connectError,
        actionTypes.registrationFailed,
      ].forEach((type) => {
        expect(reducer('foo', {
          type,
        })).to.equal(connectionStatus.connectFailed);
      });
    });
  });
});


describe('Webphone :: getConnectRetryCountsReducer', () => {
  it('getConnectRetryCountsReducer should be a function', () => {
    expect(getConnectRetryCountsReducer).to.be.a('function');
  });
  it('getConnectRetryCountsReducer should return a reducer', () => {
    expect(getConnectRetryCountsReducer()).to.be.a('function');
  });
  describe('connectRetryCountsReducer', () => {
    const reducer = getConnectRetryCountsReducer(actionTypes);
    it('should have initial state of zero', () => {
      expect(reducer(undefined, {})).to.equal(0);
    });

    it('should return original state when actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
      .to.equal(originalState);
    });

    it('should return original state + 1 when actionTypes is reconnect', () => {
      const originalState = 1;
      expect(reducer(originalState, { type: actionTypes.reconnect }))
        .to.equal(2);
    });

    it('should return zero when actionTypes is registered or resetRetryCounts', () => {
      [
        actionTypes.registered,
        actionTypes.resetRetryCounts,
      ].forEach((type) => {
        expect(reducer('foo', {
          type,
        })).to.equal(0);
      });
    });
  });
});

describe('Webphone :: getWebphoneCountsReducer', () => {
  it('getWebphoneCountsReducer should be a function', () => {
    expect(getWebphoneCountsReducer).to.be.a('function');
  });
  it('getWebphoneCountsReducer should return a reducer', () => {
    expect(getWebphoneCountsReducer()).to.be.a('function');
  });
  describe('webphoneCountsReducer', () => {
    const reducer = getWebphoneCountsReducer(actionTypes);
    it('should have initial state of zero', () => {
      expect(reducer(undefined, {})).to.equal(0);
    });

    it('should return original state when actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
      .to.equal(originalState);
    });

    it('should return original state + 1 when actionTypes is reconnect or connect', () => {
      [
        actionTypes.reconnect,
        actionTypes.connect,
      ].forEach((type) => {
        const originalState = 1;
        expect(reducer(originalState, {
          type,
        })).to.equal(2);
      });
    });

    it('should return original state - 1 when actionTypes is connectError, disconnect or registrationFailed', () => {
      [
        actionTypes.connectError,
        actionTypes.disconnect,
        actionTypes.registrationFailed,
      ].forEach((type) => {
        const originalState = 3;
        expect(reducer(originalState, {
          type,
        })).to.equal(2);
      });
    });
  });
});

describe('Webphone :: getCurrentSessionReducer', () => {
  it('getCurrentSessionReducer should be a function', () => {
    expect(getCurrentSessionReducer).to.be.a('function');
  });
  it('getCurrentSessionReducer should return a reducer', () => {
    expect(getCurrentSessionReducer()).to.be.a('function');
  });
  describe('currentSessionReducer', () => {
    const reducer = getCurrentSessionReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.equal(null);
    });
    it('should return original state when actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return null when actionTypes is destroyCurrentSession', () => {
      const originalState = {};
      expect(reducer(originalState, { type: actionTypes.destroyCurrentSession }))
        .to.equal(null);
    });
    it('should return new session object when actionTypes is updateCurrentSession', () => {
      const originalState = {};
      const session = {
        id: '123',
        direction: 'inbound',
        callStatus: 'test',
        to: 'test',
        toUserName: 'haha',
        from: 'test',
        fromUserName: 'ha',
        startTime: (new Date('Fri Apr 21 2017 13:39:34 GMT+0800')).getTime(),
        creationTime: 1492753174000,
        isOnHold: false,
        isOnMute: false,
        isOnRecord: false,
        contactMatch: {},
      };
      expect(reducer(originalState, { type: actionTypes.updateCurrentSession, session }))
        .to.deep.equal(session);
    });
  });
});

describe('Webphone :: getSessionsReducer', () => {
  it('getSessionsReducer should be a function', () => {
    expect(getSessionsReducer).to.be.a('function');
  });
  it('getSessionsReducer should return a reducer', () => {
    expect(getSessionsReducer()).to.be.a('function');
  });
  describe('sessionsReducer', () => {
    const reducer = getSessionsReducer(actionTypes);
    it('should have initial state of empty array', () => {
      expect(reducer(undefined, {})).to.deep.equal([]);
    });
    it('should return original state when actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return empty array when actionTypes is destroySessions', () => {
      const originalState = {};
      expect(reducer(originalState, { type: actionTypes.destroySessions }))
        .to.deep.equal([]);
    });
    it('should return session array when actionTypes is updateSessions', () => {
      const originalState = [];
      const sessions = [{
        id: '123',
        direction: 'inbound',
        callStatus: 'test',
        request: {
          to: {
            uri: {
              user: 'test',
            },
            displayName: 'haha',
          },
          from: {
            uri: {
              user: 'test',
            },
            displayName: 'ha',
          },
        },
        startTime: 'Fri Apr 21 2017 13:39:34 GMT+0800',
        creationTime: 1492753174000,
        isOnHold: () => ({
          local: false,
        }),
        isOnMute: false,
        isOnRecord: false,
      }];
      expect(reducer(originalState, { type: actionTypes.updateSessions, sessions }))
        .to.equal(sessions);
    });
  });
});

describe('Webphone :: getMinimizedReducer', () => {
  it('getMinimizedReducer should be a function', () => {
    expect(getMinimizedReducer).to.be.a('function');
  });
  it('getMinimizedReducer should return a reducer', () => {
    expect(getMinimizedReducer()).to.be.a('function');
  });
  describe('minimizedReducer', () => {
    const reducer = getMinimizedReducer(actionTypes);
    it('should have initial state of false', () => {
      expect(reducer(undefined, {})).to.deep.equal(false);
    });
    it('should return original state when actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return opposite state when actionTypes is toggleMinimized', () => {
      const originalState = false;
      expect(reducer(originalState, { type: actionTypes.toggleMinimized }))
        .to.equal(true);
    });
    it('should return false when actionTypes is resetMinimized', () => {
      const originalState = true;
      expect(reducer(originalState, { type: actionTypes.resetMinimized }))
        .to.equal(false);
    });
  });
});

describe('getWebphoneReducer', () => {
  it('should be a function', () => {
    expect(getWebphoneReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getWebphoneReducer(actionTypes)).to.be.a('function');
  });
  it('should return a combined reducer', () => {
    const reducer = getWebphoneReducer(actionTypes);
    const statusReducer = getModuleStatusReducer(actionTypes);
    const videoElementPreparedReducer = getVideoElementPreparedReducer(actionTypes);
    const connectionStatusReducer = getConnectionStatusReducer(actionTypes);
    const connectRetryCountsReducer = getConnectRetryCountsReducer(actionTypes);
    const webphoneCountsReducer = getWebphoneCountsReducer(actionTypes);
    const currentSessionReducer = getCurrentSessionReducer(actionTypes);
    const sessionsReducer = getSessionsReducer(actionTypes);
    const minimizedReducer = getMinimizedReducer(actionTypes);
    const errorCodeReducer = getErrorCodeReducer(actionTypes);
    expect(reducer(undefined, {})).to.deep.equal({
      status: statusReducer(undefined, {}),
      videoElementPrepared: videoElementPreparedReducer(undefined, {}),
      connectionStatus: connectionStatusReducer(undefined, {}),
      connectRetryCounts: connectRetryCountsReducer(undefined, {}),
      webphoneCounts: webphoneCountsReducer(undefined, {}),
      currentSession: currentSessionReducer(undefined, {}),
      sessions: sessionsReducer(undefined, {}),
      minimized: minimizedReducer(undefined, {}),
      errorCode: errorCodeReducer(undefined, {}),
    });
  });
});
