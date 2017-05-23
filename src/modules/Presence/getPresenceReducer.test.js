import { expect } from 'chai';
import getPresenceReducer, {
  getDndStatusReducer,
  getPresenceStatusReducer,
  getUserStatusReducer,
  getMessageReducer,
} from './getPresenceReducer';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

import actionTypes from './actionTypes';

describe('getDndStatusReducer', () => {
  it('should be a function', () => {
    expect(getDndStatusReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getDndStatusReducer({ types: actionTypes })).to.be.a('function');
  });
  describe('dndStatusReducer', () => {
    const reducer = getDndStatusReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return original state if type is not recognized', () => {
      const originalState = [];
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it(`should return action.dndStatus on fetchSuccess, notification,
        update, updateError and updateSuccess`, () => {
      [
        actionTypes.fetchSuccess,
        actionTypes.notification,
        actionTypes.updateSuccess,
        actionTypes.update,
        actionTypes.updateError,
      ].forEach((type) => {
        const dndStatus = {};
        expect(reducer(null, {
          type,
          dndStatus,
        })).to.equal(dndStatus);
      });
    });
    it('should return null on reset', () => {
      const dndStatus = {};
      expect(reducer(null, {
        type: actionTypes.reset,
        dndStatus,
      })).to.be.null;
    });
  });
});

describe('getPresenceStatusReducer', () => {
  it('should be a function', () => {
    expect(getPresenceStatusReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getPresenceStatusReducer({ types: actionTypes })).to.be.a('function');
  });
  describe('presenceStatusReducer', () => {
    const reducer = getPresenceStatusReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return original state if type is not recognized', () => {
      const originalState = [];
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return presenceStatus on fetchSuccess, notification and updateSuccess', () => {
      [
        actionTypes.fetchSuccess,
        actionTypes.notification,
        actionTypes.updateSuccess,
      ].forEach((type) => {
        const presenceStatus = {};
        expect(reducer(null, {
          type,
          presenceStatus,
        })).to.equal(presenceStatus);
      });
    });
    it('should return null on reset', () => {
      const presenceStatus = {};
      expect(reducer(null, {
        type: actionTypes.reset,
        presenceStatus,
      })).to.be.null;
    });
  });
});

describe('getUserStatusReducer', () => {
  it('should be a function', () => {
    expect(getUserStatusReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getUserStatusReducer({ types: actionTypes })).to.be.a('function');
  });
  describe('userStatusReducer', () => {
    const reducer = getUserStatusReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return original state if type is not recognized', () => {
      const originalState = [];
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it(`should return userStatus on fetchSuccess, notification,
        update, updateError and updateSuccess`, () => {
      [
        actionTypes.fetchSuccess,
        actionTypes.notification,
        actionTypes.updateSuccess,
        actionTypes.update,
        actionTypes.updateError,
      ].forEach((type) => {
        const userStatus = {};
        expect(reducer(null, {
          type,
          userStatus,
        })).to.equal(userStatus);
      });
    });
    it('should return null on reset', () => {
      const userStatus = {};
      expect(reducer(null, {
        type: actionTypes.reset,
        userStatus,
      })).to.be.null;
    });
  });
});

describe('getMessageReducer', () => {
  it('should be a function', () => {
    expect(getMessageReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getMessageReducer({ types: actionTypes })).to.be.a('function');
  });
  describe('messageReducer', () => {
    const reducer = getMessageReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return original state if type is not recognized', () => {
      const originalState = [];
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return message on fetchSuccess, notification and updateSuccess', () => {
      [
        actionTypes.fetchSuccess,
        actionTypes.notification,
        actionTypes.updateSuccess,
      ].forEach((type) => {
        const message = {};
        expect(reducer(null, {
          type,
          message,
        })).to.equal(message);
      });
    });
    it('should return null on reset', () => {
      const message = {};
      expect(reducer(null, {
        type: actionTypes.reset,
        message,
      })).to.be.null;
    });
  });
});

describe('getPresenceReducer', () => {
  it('should be a function', () => {
    expect(getPresenceReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getPresenceReducer(actionTypes)).to.be.a('function');
  });
  describe('presenceReducer', () => {
    const reducer = getPresenceReducer(actionTypes);
    const statusReducer = getModuleStatusReducer(actionTypes);
    const dndStatusReducer = getDndStatusReducer(actionTypes);
    const presenceStatusReducer = getPresenceStatusReducer(actionTypes);
    const userStatusReducer = getUserStatusReducer(actionTypes);
    const messageReducer = getMessageReducer(actionTypes);
    it('should return combined state', () => {
      expect(reducer(undefined, {}))
        .to.deep.equal({
          status: statusReducer(undefined, {}),
          dndStatus: dndStatusReducer(undefined, {}),
          presenceStatus: presenceStatusReducer(undefined, {}),
          userStatus: userStatusReducer(undefined, {}),
          message: messageReducer(undefined, {}),
        });
    });
  });
});
