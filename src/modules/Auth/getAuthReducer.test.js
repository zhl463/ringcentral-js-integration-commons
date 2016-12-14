import { expect } from 'chai';
import getAuthReducer, {
  getFreshLoginReducer,
  getStatusReducer,
  getAuthStatusReducer,
  getOwnerIdReducer,
} from './getAuthReducer';

import actionTypes from './actionTypes';
import authStatus from './authStatus';
import moduleStatus from '../../enums/moduleStatus';

describe('getAuthStatusReducer', () => {
  it('should be a function', () => {
    expect(getAuthStatusReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getAuthStatusReducer(actionTypes)).to.be.a('function');
  });
  describe('authStatusReducer', () => {
    const reducer = getAuthStatusReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.equal(null);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    describe('actionTypes => authStatus', () => {
      it('actionTypes.login => authStatus.loggingIn', () => {
        expect(reducer(null, {
          type: actionTypes.login,
        })).to.equal(authStatus.loggingIn);
      });
      it('actionTypes.loginSuccess => authStatus.loggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.loginSuccess,
        })).to.equal(authStatus.loggedIn);
      });
      it('actionTypes.refreshSuccess => authStatus.loggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.refreshSuccess,
        })).to.equal(authStatus.loggedIn);
      });
      it('actionTypes.cancelLogout => authStatus.loggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.cancelLogout,
        })).to.equal(authStatus.loggedIn);
      });
      it('actionTypes.loginError => authStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.loginError,
        })).to.equal(authStatus.notLoggedIn);
      });
      it('actionTypes.logoutSuccess => authStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.logoutSuccess,
        })).to.equal(authStatus.notLoggedIn);
      });
      it('actionTypes.logoutError => authStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.logoutError,
        })).to.equal(authStatus.notLoggedIn);
      });
      it('actionTypes.refreshError => refreshTokenValid ? state : authStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.refreshError,
          refreshTokenValid: false,
        })).to.equal(authStatus.notLoggedIn);
        expect(reducer(authStatus.loggedIn, {
          type: actionTypes.refreshError,
          refreshTokenValid: true,
        })).to.equal(authStatus.loggedIn);
      });
      it('actionTypes.logout => authStatus.loggingOut', () => {
        expect(reducer(null, {
          type: actionTypes.logout,
        })).to.equal(authStatus.loggingOut);
      });
      it('actionTypes.beforeLogout => authStatus.beforeLogout', () => {
        expect(reducer(null, {
          type: actionTypes.beforeLogout,
        })).to.equal(authStatus.beforeLogout);
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
      it('actionTypes.initSuccess && !loggedIn => authStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.initSuccess,
          loggedIn: false,
        })).to.equal(authStatus.notLoggedIn);
      });
      it('actionTypes.initSuccess && loggedIn => authStatus.loggedIn', () => {
        expect(reducer(null, {
          type: actionTypes.initSuccess,
          loggedIn: true,
        })).to.equal(authStatus.loggedIn);
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
  });
});


describe('getStatusReducer', () => {
  it('should be a function', () => {
    expect(getStatusReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getStatusReducer(actionTypes)).to.be.a('function');
  });
  describe('freshLoginReducer', () => {
    const reducer = getStatusReducer(actionTypes);
    it('should have initial state of moduleStatus.pending', () => {
      expect(reducer(undefined, {})).to.equal(moduleStatus.pending);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return moduleStatus.initializing on init action type', () => {
      expect(reducer(null, {
        type: actionTypes.init,
      })).to.equal(moduleStatus.initializing);
    });
    it('should return moduleStatus.ready on initSuccess action type', () => {
      expect(reducer(null, {
        type: actionTypes.initSuccess,
      })).to.equal(moduleStatus.ready);
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
    const statusReducer = getStatusReducer(actionTypes);
    const authStatusReducer = getAuthStatusReducer(actionTypes);
    const freshLoginReducer = getFreshLoginReducer(actionTypes);
    const ownerIdReducer = getOwnerIdReducer(actionTypes);
    it('should return combined state', () => {
      expect(reducer(undefined, {}))
        .to.deep.equal({
          status: statusReducer(undefined, {}),
          authStatus: authStatusReducer(undefined, {}),
          freshLogin: freshLoginReducer(undefined, {}),
          ownerId: ownerIdReducer(undefined, {}),
        });
      const error = new Error('test');
      const token = {
        owner_id: 'foo',
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
      ].forEach(action => {
        expect(reducer({
          status: 'status',
          authStatus: 'authStatus',
          freshLogin: 'freshLogin',
          ownerId: 'ownerId',
        }, action)).to.deep.equal({
          status: statusReducer('status', action),
          authStatus: authStatusReducer('authStatus', action),
          freshLogin: freshLoginReducer('freshLogin', action),
          ownerId: ownerIdReducer('ownerId', action),
        });
      });
    });
  });
});
