import { expect } from 'chai';
import getRegionSettingsReducer, {
  getStatusReducer,
  getCountryCodeReducer,
  getAreaCodeReducer,
} from './getRegionSettingsReducer';

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

describe('getCountryCodeReducer', () => {
  it('should be a function', () => {
    expect(getCountryCodeReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getCountryCodeReducer(actionTypes)).to.be.a('function');
  });
  describe('countryCodeReducer', () => {
    const reducer = getCountryCodeReducer(actionTypes);
    it('should have initial state of null', () => {
      expect(reducer(undefined, {})).to.be.null;
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return action.countryCode on setData', () => {
      const countryCode = 'foo';
      expect(reducer(null, {
        type: actionTypes.setData,
        countryCode,
      })).to.equal(countryCode);
    });
    it('should return originalState on setData if action.countryCode is undefined', () => {
      expect(reducer('foo', {
        type: actionTypes.setData,
      })).to.equal('foo');
    });
  });
});

describe('getAreaCodeReducer', () => {
  it('should be a function', () => {
    expect(getAreaCodeReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getAreaCodeReducer(actionTypes)).to.be.a('function');
  });
  describe('areaCodeReducer', () => {
    const reducer = getAreaCodeReducer(actionTypes);
    it('should have initial state of ""', () => {
      expect(reducer(undefined, {})).to.equal('');
    });
    it('should return original state of actionTypes is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return action.areaCode on setData', () => {
      const areaCode = 'foo';
      expect(reducer(null, {
        type: actionTypes.setData,
        areaCode,
      })).to.equal(areaCode);
    });
    it('should return originalState on setData if action.areaCode is undefined', () => {
      expect(reducer('foo', {
        type: actionTypes.setData,
      })).to.equal('foo');
    });
  });
});

describe('getRegionSettingsReducer', () => {
  it('should be a function', () => {
    expect(getRegionSettingsReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getRegionSettingsReducer(actionTypes)).to.be.a('function');
  });
  describe('dailingPlanReducer', () => {
    const reducer = getRegionSettingsReducer(actionTypes);
    const statusReducer = getStatusReducer(actionTypes);
    it('should be a combined reducer', () => {
      expect(reducer(undefined, {})).to.deep.equal({
        status: statusReducer(undefined, {}),
      });
    });
  });
});

