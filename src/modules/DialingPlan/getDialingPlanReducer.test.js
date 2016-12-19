import { expect } from 'chai';
import getDialingPlanReducer, {
  getStatusReducer,
  getPlansReducer,
  getTimestampReducer,
} from './getDialingPlanReducer';

import moduleStatus from '../../enums/moduleStatus';
import actionTypes from './actionTypes';

describe('getStatusReducer', () => {
  it('should be a function', () => {
    expect(getStatusReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getStatusReducer(actionTypes)).to.be.a('function');
  });
  describe('statusReducer', () => {
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
    it('should return moduleStatus.pending on reset action type', () => {
      expect(reducer(null, {
        type: actionTypes.reset,
      })).to.equal(moduleStatus.pending);
    });
  });
});

describe('getPlansReducer', () => {
  it('should be a function', () => {
    expect(getPlansReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getPlansReducer(actionTypes)).to.be.a('function');
  });
  describe('plansReducer', () => {
    const reducer = getPlansReducer(actionTypes);
    it('should have initial state of []', () => {
      expect(reducer(undefined, {})).to.deep.equal([]);
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return action.plans on fetchSuccess', () => {
      const plans = [];
      expect(reducer(null, {
        type: actionTypes.fetchSuccess,
        plans,
      })).to.equal(plans);
    });
  });
});

describe('getTimestampReducer', () => {
  it('should be a function', () => {
    expect(getTimestampReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getTimestampReducer(actionTypes)).to.be.a('function');
  });
  describe('timestampReducer', () => {
    const reducer = getTimestampReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return action.timestamp on fetchSuccess', () => {
      const timestamp = Date.now();
      expect(reducer(null, {
        type: actionTypes.fetchSuccess,
        timestamp,
      })).to.equal(timestamp);
    });
  });
});

describe('getDialingPlanReducer', () => {
  it('should be a function', () => {
    expect(getDialingPlanReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getDialingPlanReducer(actionTypes)).to.be.a('function');
  });
  describe('dailingPlanReducer', () => {
    const reducer = getDialingPlanReducer(actionTypes);
    const statusReducer = getStatusReducer(actionTypes);
    it('should be a combined reducer', () => {
      expect(reducer(undefined, {})).to.deep.equal({
        status: statusReducer(undefined, {}),
      });
    });
  });
});

