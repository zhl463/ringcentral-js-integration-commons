import { expect } from 'chai';
import getSubscriptionReducer, {
  getErrorReducer,
  getFiltersReducer,
  getStatusReducer,
  getMessageReducer,
} from './getSubscriptionReducer';

import subscriptionActionTypes from './subscriptionActionTypes';
import subscriptionStatus from './subscriptionStatus';

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
      expect(reducer(undefined, {})).to.equal(subscriptionStatus.pending);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return notSubscribed status for the following subscription action types', () => {
      [
        subscriptionActionTypes.init,
        subscriptionActionTypes.renewError,
        subscriptionActionTypes.subscribeError,
        subscriptionActionTypes.removeSuccess,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(subscriptionStatus.notSubscribed);
      });
    });
    it('should return subscribed status for the following subscription action types', () => {
      [
        subscriptionActionTypes.subscribeSuccess,
        subscriptionActionTypes.renewSuccess,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(subscriptionStatus.subscribed);
      });
    });
    it('should return resetting status for the following subscription action types', () => {
      [
        subscriptionActionTypes.reset,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(subscriptionStatus.resetting);
      });
    });
    it('should return pending status for the following subscription action types', () => {
      [
        subscriptionActionTypes.resetSuccess,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.equal(subscriptionStatus.pending);
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
    it('should return error on error subscription action types', () => {
      const error = new Error('test');
      [
        subscriptionActionTypes.subscribeError,
        subscriptionActionTypes.removeError,
        subscriptionActionTypes.renewError,
      ].forEach(type => {
        expect(reducer(null, {
          type,
          error,
        })).to.equal(error);
      });
    });
    it('should return null on other auth action types', () => {
      [
        subscriptionActionTypes.subscribeSuccess,
        subscriptionActionTypes.renewSuccess,
        subscriptionActionTypes.removeSuccess,
        subscriptionActionTypes.reset,
        subscriptionActionTypes.resetSuccess,
        subscriptionActionTypes.init,
      ].forEach(type => {
        expect(reducer('foo', {
          type,
        })).to.be.null;
      });
    });
  });
});


describe('getMessageReducer', () => {
  it('should be a function', () => {
    expect(getMessageReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getMessageReducer()).to.be.a('function');
  });
  describe('messageReducer', () => {
    const reducer = getMessageReducer();
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return message on notification', () => {
      const message = {};
      expect(reducer(null, {
        type: subscriptionActionTypes.notification,
        message,
      })).to.equal(message);
    });
    it('should return null for all other actions', () => {
      expect(reducer('foo', {
        type: 'foo',
      })).to.be.null;
    });
  });
});

describe('getFiltersReducer', () => {
  it('should be a function', () => {
    expect(getFiltersReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getFiltersReducer()).to.be.a('function');
  });
  describe('filtersReducer', () => {
    const reducer = getFiltersReducer();
    it('should have initial state of []', () => {
      expect(reducer(undefined, {})).to.deep.equal([]);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return filters on setFilters', () => {
      const filters = [];
      expect(reducer(null, {
        type: subscriptionActionTypes.setFilters,
        filters,
      })).to.equal(filters);
    });
    it('should add new filters on addFilters without duplicates', () => {
      expect(reducer([1, 2, 3], {
        type: subscriptionActionTypes.addFilters,
        filters: [2, 3, 5],
      })).to.deep.equal([1, 2, 3, 5]);
      expect(reducer([1, 2, 3], {
        type: subscriptionActionTypes.addFilters,
        filters: 5,
      })).to.deep.equal([1, 2, 3, 5]);
    });
    it('should remove filters on removeFilters', () => {
      expect(reducer([1, 2, 3], {
        type: subscriptionActionTypes.removeFilters,
        filters: [1, 2],
      })).to.deep.equal([3]);
      expect(reducer([1, 2, 3], {
        type: subscriptionActionTypes.removeFilters,
        filters: 2,
      })).to.deep.equal([1, 3]);
    });
    it('should return [] on reset', () => {
      expect(reducer(null, {
        type: subscriptionActionTypes.resetSuccess,
      })).to.deep.equal([]);
    });
  });
});


describe('getSubscriptionReducer', () => {
  it('should be a function', () => {
    expect(getSubscriptionReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getSubscriptionReducer()).to.be.a('function');
  });
  describe('subscriptionReducer', () => {
    const reducer = getSubscriptionReducer();
    const errorReducer = getErrorReducer();
    const statusReducer = getStatusReducer();
    const filtersReducer = getFiltersReducer();
    const messageReducer = getMessageReducer();
    it('should return combined state', () => {
      expect(reducer(undefined, {}))
        .to.deep.equal({
          error: errorReducer(undefined, {}),
          status: statusReducer(undefined, {}),
          filters: filtersReducer(undefined, {}),
          message: messageReducer(undefined, {}),
        });
    });
  });
});
