import { expect } from 'chai';
import getAuthReducer, {
  getErrorReducer,
  getFreshLoginReducer,
  getStatusReducer,
  getOwnerIdReducer,
} from './getAuthReducer';

import authActionTypes from './authActionTypes';
import authStatus from './authStatus';

describe('getStatusReducer', () => {
  it('should be a function', () => {
    expect(getStatusReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getStatusReducer()).to.be.a('function');
  });
  describe('statusReducer', () => {
    const reducer = getStatusReducer();
    it('should have initial state of pending', () => {
      expect(reducer(undefined, {})).to.equal(authStatus.pending);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    describe('authActionTypes => authStatus', () => {
      it('authActionTypes.login => authStatus.loggingIn', () => {
        expect(reducer(null, {
          type: authActionTypes.login,
        })).to.equal(authStatus.loggingIn);
      });
      it('authActionTypes.loginSuccess => authStatus.loggedIn', () => {
        expect(reducer(null, {
          type: authActionTypes.loginSuccess,
        })).to.equal(authStatus.loggedIn);
      });
      it('authActionTypes.refreshSuccess => authStatus.loggedIn', () => {
        expect(reducer(null, {
          type: authActionTypes.refreshSuccess,
        })).to.equal(authStatus.loggedIn);
      });
      it('authActionTypes.cancelLogout => authStatus.loggedIn', () => {
        expect(reducer(null, {
          type: authActionTypes.cancelLogout,
        })).to.equal(authStatus.loggedIn);
      });
      it('authActionTypes.loginError => authStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: authActionTypes.loginError,
        })).to.equal(authStatus.notLoggedIn);
      });
      it('authActionTypes.logoutSuccess => authStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: authActionTypes.logoutSuccess,
        })).to.equal(authStatus.notLoggedIn);
      });
      it('authActionTypes.logoutError => authStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: authActionTypes.logoutError,
        })).to.equal(authStatus.notLoggedIn);
      });
      it('authActionTypes.refreshError => authStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: authActionTypes.refreshError,
        })).to.equal(authStatus.notLoggedIn);
      });
      it('authActionTypes.logout => authStatus.loggingOut', () => {
        expect(reducer(null, {
          type: authActionTypes.logout,
        })).to.equal(authStatus.loggingOut);
      });
      it('authActionTypes.beforeLogout => authStatus.beforeLogout', () => {
        expect(reducer(null, {
          type: authActionTypes.beforeLogout,
        })).to.equal(authStatus.beforeLogout);
      });
      it('authActionTypes.refresh => originalState', () => {
        const originalState = {};
        expect(reducer(originalState, {
          type: authActionTypes.refresh,
        })).to.equal(originalState);
      });
      it('authActionTypes.init && loggedIn => authStatus.loggedIn', () => {
        expect(reducer(null, {
          type: authActionTypes.init,
          loggedIn: true,
        })).to.equal(authStatus.loggedIn);
      });
      it('authActionTypes.init && !loggedIn => authStatus.notLoggedIn', () => {
        expect(reducer(null, {
          type: authActionTypes.init,
          loggedIn: false,
        })).to.equal(authStatus.notLoggedIn);
      });
    });
  });
});

describe('getErrorReducer', () => {
  it('should be a function', () => {
    expect(getErrorReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getErrorReducer()).to.be.a('function');
  });
  describe('errorReducer', () => {
    const reducer = getErrorReducer();
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return error on error auth action types', () => {
      const error = new Error('test');
      [
        authActionTypes.loginError,
        authActionTypes.logoutError,
        authActionTypes.refreshError,
        authActionTypes.cancelLogout,
      ].forEach(type => {
        expect(reducer(null, {
          type,
          error,
        })).to.equal(error);
      });
    });
    it('should return null on other auth action types', () => {
      [
        authActionTypes.login,
        authActionTypes.loginSuccess,
        authActionTypes.logout,
        authActionTypes.logoutSuccess,
        authActionTypes.refresh,
        authActionTypes.refreshSuccess,
        authActionTypes.beforeLogout,
        authActionTypes.init,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.be.null;
      });
    });
  });
});


describe('getOwnerIdReducer', () => {
  it('should be a function', () => {
    expect(getOwnerIdReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getOwnerIdReducer()).to.be.a('function');
  });
  describe('ownerIdReducer', () => {
    const reducer = getOwnerIdReducer();
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
        type: authActionTypes.loginSuccess,
        token: {
          owner_id: 'foo',
        },
      })).to.equal('foo');
    });
    it('should return ownerId on refreshSuccess', () => {
      expect(reducer(null, {
        type: authActionTypes.refreshSuccess,
        token: {
          owner_id: 'foo',
        },
      })).to.equal('foo');
    });
    it('should return null on following auth action types', () => {
      [
        authActionTypes.loginError,
        authActionTypes.logoutSuccess,
        authActionTypes.logoutError,
        authActionTypes.refreshError,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.be.null;
      });
    });
    it('should ignore other auth action types', () => {
      const originalState = {};
      [
        authActionTypes.login,
        authActionTypes.logout,
        authActionTypes.refresh,
        authActionTypes.beforeLogout,
        authActionTypes.cancelLogout,
      ].forEach(type => {
        expect(reducer(originalState, {
          type,
        })).to.equal(originalState);
      });
    });
    it('should return ownerId on init type with token', () => {
      expect(reducer(null, {
        type: authActionTypes.init,
        token: {
          owner_id: 'foo',
        },
      })).to.equal('foo');
    });
    it('should return null on init type without token', () => {
      expect(reducer('foo', {
        type: authActionTypes.init,
      })).to.be.null;
    });
  });
});

describe('getFreshLoginReducer', () => {
  it('should be a function', () => {
    expect(getFreshLoginReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getFreshLoginReducer()).to.be.a('function');
  });
  describe('freshLoginReducer', () => {
    const reducer = getFreshLoginReducer();
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
        type: authActionTypes.login,
      })).to.be.true;
    });
    it('should return null on following auth action types', () => {
      [
        authActionTypes.loginError,
        authActionTypes.logoutError,
        authActionTypes.refreshError,
        authActionTypes.logoutSuccess,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(null);
      });
    });
    it('should ignore the following auth action types', () => {
      const originalState = {};
      [
        authActionTypes.cancelLogout,
        authActionTypes.loginSuccess,
        authActionTypes.logout,
        authActionTypes.refresh,
        authActionTypes.refreshSuccess,
        authActionTypes.beforeLogout,
      ].forEach(type => {
        expect(reducer(originalState, {
          type,
        })).to.equal(originalState);
      });
    });
    it('should return false on authActionType.init && loggedIn', () => {
      expect(reducer(null, {
        type: authActionTypes.init,
        loggedIn: true,
      })).to.be.false;
    });
    it('should return null on authActionType.init && !loggedIn', () => {
      expect(reducer(null, {
        type: authActionTypes.init,
        loggedIn: false,
      })).to.be.null;
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
    const reducer = getAuthReducer();
    const errorReducer = getErrorReducer();
    const statusReducer = getStatusReducer();
    const freshLoginReducer = getFreshLoginReducer();
    const ownerIdReducer = getOwnerIdReducer();
    it('should return combined state', () => {
      expect(reducer(undefined, {}))
        .to.deep.equal({
          error: errorReducer(undefined, {}),
          status: statusReducer(undefined, {}),
          freshLogin: freshLoginReducer(undefined, {}),
          ownerId: ownerIdReducer(undefined, {}),
        });
      const error = new Error('test');
      const token = {
        owner_id: 'foo',
      };
      const actions = [
        {
          type: authActionTypes.login,
        },
        {
          type: authActionTypes.loginSuccess,
          token,
        },
        {
          type: authActionTypes.loginError,
          error,
        },
        {
          type: authActionTypes.logout,
        },
        {
          type: authActionTypes.logoutSuccess,
        },
        {
          type: authActionTypes.logoutError,
          error,
        },
        {
          type: authActionTypes.refresh,
        },
        {
          type: authActionTypes.refreshSuccess,
          token,
        },
        {
          type: authActionTypes.refreshError,
          error,
        },
        {
          type: authActionTypes.beforeLogout,
        },
        {
          type: authActionTypes.cancelLogout,
          error,
        },
        {
          type: authActionTypes.init,
          loggedIn: true,
          token,
        },
        {
          type: authActionTypes.init,
          loggedIn: false,
        },
      ].forEach(action => {
        expect(reducer({
          status: 'status',
          error: 'error',
          freshLogin: 'freshLogin',
          ownerId: 'ownerId',
        }, action)).to.deep.equal({
          status: statusReducer('status', action),
          error: errorReducer('error', action),
          freshLogin: freshLoginReducer('freshLogin', action),
          ownerId: ownerIdReducer('ownerId', action),
        });
      });
    });
  });
});
