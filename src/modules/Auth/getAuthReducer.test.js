import { expect } from 'chai';
import getAuthReducer, {
  getFreshLoginReducer,
  getLoginStatusReducer,
  getProxyLoadedReducer,
  getProxyRetryCountReducer,
  getOwnerIdReducer,
  getEndpointIdReducer,
} from './getAuthReducer';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

import actionTypes from './actionTypes';
import loginStatus from './loginStatus';

describe('getLoginStatusReducer', () => {
  it('should be a function', () => {
    expect(getLoginStatusReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getLoginStatusReducer(actionTypes)).to.be.a('function');
  });
  describe('loginStatusReducer', () => {
    const reducer = getLoginStatusReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.equal(null);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    describe('actionTypes => loginStatus', () => {
      it('actionTypes.login => loginStatus.loggingIn', () => {
        expect(reducer(null, {
          type: actionTypes.login,
        })).to.equal(loginStatus.loggingIn);
      });
      it('actionTypes.loginSuccess => loginStatus.loggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.loginSuccess,
        })).to.equal(loginStatus.loggedIn);
      });
      it('actionTypes.refreshSuccess => loginStatus.loggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.refreshSuccess,
        })).to.equal(loginStatus.loggedIn);
      });
      it('actionTypes.cancelLogout => loginStatus.loggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.cancelLogout,
        })).to.equal(loginStatus.loggedIn);
      });
      it('actionTypes.loginError => loginStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.loginError,
        })).to.equal(loginStatus.notLoggedIn);
      });
      it('actionTypes.logoutSuccess => loginStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.logoutSuccess,
        })).to.equal(loginStatus.notLoggedIn);
      });
      it('actionTypes.logoutError => loginStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.logoutError,
        })).to.equal(loginStatus.notLoggedIn);
      });
      it('actionTypes.refreshError => refreshTokenValid ? state : loginStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.refreshError,
          refreshTokenValid: false,
        })).to.equal(loginStatus.notLoggedIn);
        expect(reducer(loginStatus.loggedIn, {
          type: actionTypes.refreshError,
          refreshTokenValid: true,
        })).to.equal(loginStatus.loggedIn);
      });
      it('actionTypes.logout => loginStatus.loggingOut', () => {
        expect(reducer(null, {
          type: actionTypes.logout,
        })).to.equal(loginStatus.loggingOut);
      });
      it('actionTypes.beforeLogout => loginStatus.beforeLogout', () => {
        expect(reducer(null, {
          type: actionTypes.beforeLogout,
        })).to.equal(loginStatus.beforeLogout);
      });
      it('actionTypes.refresh => originalState', () => {
        const originalState = {};
        expect(reducer(originalState, {
          type: actionTypes.refresh,
        })).to.equal(originalState);
      });
      it('actionTypes.init => state', () => {
        expect(reducer('originalState', {
          type: actionTypes.init,
        })).to.equal('originalState');
      });
      it('actionTypes.initSuccess && !loggedIn => loginStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.initSuccess,
          loggedIn: false,
        })).to.equal(loginStatus.notLoggedIn);
      });
      it('actionTypes.initSuccess && loggedIn => loginStatus.loggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.initSuccess,
          loggedIn: true,
        })).to.equal(loginStatus.loggedIn);
      });
      it('actionTypes.tabSync && !loggedIn => loginStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.tabSync,
          loggedIn: false,
        })).to.equal(loginStatus.notLoggedIn);
      });
      it('actionTypes.tabSync && loggedIn => loginStatus.loggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.tabSync,
          loggedIn: true,
        })).to.equal(loginStatus.loggedIn);
      });
    });
  });
});

describe('getOwnerIdReducer', () => {
  it('should be a function', () => {
    expect(getOwnerIdReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getOwnerIdReducer(actionTypes)).to.be.a('function');
  });
  describe('ownerIdReducer', () => {
    const reducer = getOwnerIdReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return ownerId on loginSuccess', () => {
      expect(reducer(null, {
        type: actionTypes.loginSuccess,
        token: {
          owner_id: 'foo',
        },
      })).to.equal('foo');
    });
    it('should return ownerId on refreshSuccess', () => {
      expect(reducer(null, {
        type: actionTypes.refreshSuccess,
        token: {
          owner_id: 'foo',
        },
      })).to.equal('foo');
    });
    it('should return null on following auth action types', () => {
      [
        actionTypes.loginError,
        actionTypes.logoutSuccess,
        actionTypes.logoutError,
        actionTypes.refreshError,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.be.null;
      });
    });
    it('should ignore other auth action types', () => {
      const originalState = {};
      [
        actionTypes.login,
        actionTypes.logout,
        actionTypes.refresh,
        actionTypes.beforeLogout,
        actionTypes.cancelLogout,
      ].forEach(type => {
        expect(reducer(originalState, {
          type,
        })).to.equal(originalState);
      });
    });
    it('should return ownerId on initSuccess with token', () => {
      expect(reducer(null, {
        type: actionTypes.initSuccess,
        token: {
          owner_id: 'foo',
        },
      })).to.equal('foo');
    });
    it('should return null on initSuccess without token', () => {
      expect(reducer('foo', {
        type: actionTypes.initSuccess,
      })).to.be.null;
    });
    it('should return ownerId on tabSync with token', () => {
      expect(reducer(null, {
        type: actionTypes.tabSync,
        token: {
          owner_id: 'foo',
        },
      })).to.equal('foo');
    });
    it('should return null on tabSync without token', () => {
      expect(reducer('foo', {
        type: actionTypes.tabSync,
      })).to.be.null;
    });
  });
});

describe('getEndpointIdReducer', () => {
  it('should be a function', () => {
    expect(getEndpointIdReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getEndpointIdReducer(actionTypes)).to.be.a('function');
  });
  describe('endpointIdReducer', () => {
    const reducer = getEndpointIdReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return endpoint_id on loginSuccess', () => {
      expect(reducer(null, {
        type: actionTypes.loginSuccess,
        token: {
          endpoint_id: 'foo',
        },
      })).to.equal('foo');
    });
    it('should return endpoint_id on refreshSuccess', () => {
      expect(reducer(null, {
        type: actionTypes.refreshSuccess,
        token: {
          endpoint_id: 'foo',
        },
      })).to.equal('foo');
    });
    it('should return null on following auth action types', () => {
      [
        actionTypes.loginError,
        actionTypes.logoutSuccess,
        actionTypes.logoutError,
      ].forEach((type) => {
        expect(reducer('foo', {
          type,
        })).to.be.null;
      });
    });

    it('should return null on refreshError and refreshToken not Valid', () => {
      expect(reducer(null, {
        type: actionTypes.refreshError,
        token: {
          endpoint_id: 'foo',
        },
        refreshTokenValid: false,
      })).to.equal(null);
    });

    it('should return original state on refreshError and refreshToken Valid', () => {
      const originalState = {};
      expect(reducer(originalState, {
        type: actionTypes.refreshError,
        token: {
          endpoint_id: 'foo',
        },
        refreshTokenValid: true,
      })).to.equal(originalState);
    });

    it('should ignore other auth action types', () => {
      const originalState = {};
      [
        actionTypes.login,
        actionTypes.logout,
        actionTypes.refresh,
        actionTypes.beforeLogout,
        actionTypes.cancelLogout,
      ].forEach((type) => {
        expect(reducer(originalState, {
          type,
        })).to.equal(originalState);
      });
    });

    it('should return endpoint_id on initSuccess with token', () => {
      expect(reducer(null, {
        type: actionTypes.initSuccess,
        token: {
          endpoint_id: 'foo',
        },
      })).to.equal('foo');
    });

    it('should return null on initSuccess without token', () => {
      expect(reducer('foo', {
        type: actionTypes.initSuccess,
      })).to.be.null;
    });

    it('should return endpoint_id on tabSync with token', () => {
      expect(reducer(null, {
        type: actionTypes.tabSync,
        token: {
          endpoint_id: 'foo',
        },
      })).to.equal('foo');
    });

    it('should return null on tabSync without token', () => {
      expect(reducer('foo', {
        type: actionTypes.tabSync,
      })).to.be.null;
    });
  });
});

describe('getFreshLoginReducer', () => {
  it('should be a function', () => {
    expect(getFreshLoginReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getFreshLoginReducer(actionTypes)).to.be.a('function');
  });
  describe('freshLoginReducer', () => {
    const reducer = getFreshLoginReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return true on login action type', () => {
      expect(reducer(null, {
        type: actionTypes.login,
      })).to.be.true;
    });
    it('should return null on following auth action types', () => {
      [
        actionTypes.loginError,
        actionTypes.logoutError,
        actionTypes.refreshError,
        actionTypes.logoutSuccess,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(null);
      });
    });
    it('should ignore the following auth action types', () => {
      const originalState = {};
      [
        actionTypes.cancelLogout,
        actionTypes.loginSuccess,
        actionTypes.logout,
        actionTypes.refresh,
        actionTypes.refreshSuccess,
        actionTypes.beforeLogout,
        actionTypes.init,
      ].forEach(type => {
        expect(reducer(originalState, {
          type,
        })).to.equal(originalState);
      });
    });
    it('should return false on authActionType.initSuccess && loggedIn', () => {
      expect(reducer(null, {
        type: actionTypes.initSuccess,
        loggedIn: true,
      })).to.be.false;
    });
    it('should return null on authActionType.initSuccess && !loggedIn', () => {
      expect(reducer(null, {
        type: actionTypes.initSuccess,
        loggedIn: false,
      })).to.be.null;
    });
    it('should return false on authActionType.tabSync && loggedIn', () => {
      expect(reducer(null, {
        type: actionTypes.tabSync,
        loggedIn: true,
      })).to.be.false;
    });
    it('should return null on authActionType.tabSync && !loggedIn', () => {
      expect(reducer(null, {
        type: actionTypes.tabSync,
        loggedIn: false,
      })).to.be.null;
    });
  });
});


describe('getProxyLoadedReducer', () => {
  it('should be a function', () => {
    expect(getProxyLoadedReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getProxyLoadedReducer(actionTypes)).to.be.a('function');
  });
  describe('proxyLoadedReducer', () => {
    const reducer = getProxyLoadedReducer(actionTypes);
    it('should have initial state of false', () => {
      expect(reducer(undefined, {})).to.be.false;
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return true on proxyLoaded', () => {
      expect(reducer('foo', {
        type: actionTypes.proxyLoaded,
      })).to.be.true;
    });
    it('should return false on proxyCleared', () => {
      expect(reducer('foo', {
        type: actionTypes.proxyCleared,
      })).to.be.false;
    });
  });
});

describe('getProxyRetryCountReducer', () => {
  it('should be a function', () => {
    expect(getProxyRetryCountReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getProxyRetryCountReducer(actionTypes)).to.be.a('function');
  });
  describe('proxyTimestampReducer', () => {
    const reducer = getProxyRetryCountReducer(actionTypes);
    it('should have initial state of 0', () => {
      expect(reducer(undefined, {})).to.equal(0);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return 0 on proxySetup, proxyCleared and proxyLoaded', () => {
      expect(reducer('foo', {
        type: actionTypes.proxySetup,
      })).to.equal(0);
      expect(reducer('foo', {
        type: actionTypes.proxyCleared,
      })).to.equal(0);
      expect(reducer('foo', {
        type: actionTypes.proxyLoaded,
      })).to.equal(0);
    });
    it('should return state + 1 on proxyRetry', () => {
      expect(reducer(0, {
        type: actionTypes.proxyRetry,
      })).to.equal(1);
    });
  });
});

describe('getAuthReducer', () => {
  it('should be a function', () => {
    expect(getAuthReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getAuthReducer()).to.be.a('function');
  });
  describe('authReducer', () => {
    const reducer = getAuthReducer(actionTypes);
    const statusReducer = getModuleStatusReducer(actionTypes);
    const loginStatusReducer = getLoginStatusReducer(actionTypes);
    const freshLoginReducer = getFreshLoginReducer(actionTypes);
    const ownerIdReducer = getOwnerIdReducer(actionTypes);
    const proxyLoadedReducer = getProxyLoadedReducer(actionTypes);
    const proxyRetryCountReducer = getProxyRetryCountReducer(actionTypes);
    const endpointIdReducer = getEndpointIdReducer(actionTypes);
    it('should return combined state', () => {
      expect(reducer(undefined, {}))
        .to.deep.equal({
          status: statusReducer(undefined, {}),
          loginStatus: loginStatusReducer(undefined, {}),
          freshLogin: freshLoginReducer(undefined, {}),
          ownerId: ownerIdReducer(undefined, {}),
          proxyLoaded: proxyLoadedReducer(undefined, {}),
          proxyRetryCount: proxyRetryCountReducer(undefined, {}),
          endpointId: endpointIdReducer(undefined, {}),
        });
      const error = new Error('test');
      const token = {
        owner_id: 'foo',
        endpoint_id: 'foo',
      };
      [
        {
          type: actionTypes.login,
        },
        {
          type: actionTypes.loginSuccess,
          token,
        },
        {
          type: actionTypes.loginError,
          error,
        },
        {
          type: actionTypes.logout,
        },
        {
          type: actionTypes.logoutSuccess,
        },
        {
          type: actionTypes.logoutError,
          error,
        },
        {
          type: actionTypes.refresh,
        },
        {
          type: actionTypes.refreshSuccess,
          token,
        },
        {
          type: actionTypes.refreshError,
          error,
        },
        {
          type: actionTypes.beforeLogout,
        },
        {
          type: actionTypes.cancelLogout,
          error,
        },
        {
          type: actionTypes.init,
        },
        {
          type: actionTypes.initSuccess,
          loggedIn: true,
          token,
        },
        {
          type: actionTypes.initSuccess,
          loggedIn: false,
        },
        {
          type: actionTypes.tabSync,
          loggedIn: true,
          token,
        },
        {
          type: actionTypes.tabSync,
          loggedIn: false,
        },
      ].forEach((action) => {
        expect(reducer({
          status: 'status',
          loginStatus: 'loginStatus',
          freshLogin: 'freshLogin',
          ownerId: 'ownerId',
          endpointId: 'endpointId',
          proxyLoaded: false,
        }, action)).to.deep.equal({
          status: statusReducer('status', action),
          loginStatus: loginStatusReducer('loginStatus', action),
          freshLogin: freshLoginReducer('freshLogin', action),
          ownerId: ownerIdReducer('ownerId', action),
          endpointId: endpointIdReducer('endpointId', action),
          proxyLoaded: proxyLoadedReducer(false, action),
          proxyRetryCount: proxyRetryCountReducer(undefined, {}),
        });
      });
    });
  });
});
