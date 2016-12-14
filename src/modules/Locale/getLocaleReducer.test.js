import { expect } from 'chai';
import getLocaleReducer, {
  getStatusReducer,
  getCurrentLocaleReducer,
} from './getLocaleReducer';

import actionTypes from './actionTypes';
import moduleStatus from '../../enums/moduleStatus';
import detectDefaultLocale from '../../lib/detectDefaultLocale';

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
    it('should return moduleStatus.ready on init action type', () => {
      expect(reducer(null, {
        type: actionTypes.init,
      })).to.equal(moduleStatus.ready);
    });
  });
});

describe('getCurrentLocaleReducer', () => {
  it('should be a function', () => {
    expect(getCurrentLocaleReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getCurrentLocaleReducer({ types: actionTypes })).to.be.a('function');
  });
  it('should support passing defaultLocale', () => {
    const reducer = getCurrentLocaleReducer({ types: actionTypes, defaultLocale: 'te-ST' });
    expect(reducer(undefined, {})).to.equal(detectDefaultLocale('te-ST'));
  });
  describe('currentLocaleReducer', () => {
    const reducer = getCurrentLocaleReducer({
      types: actionTypes,
    });
    it('should have initial state of detectDefaultLocale()', () => {
      expect(reducer(undefined, {})).to.equal(detectDefaultLocale());
    });
    it('should return original state if type is not recognized', () => {
      const originalState = {};
      expect(reducer(originalState, { type: 'foo' }))
        .to.equal(originalState);
    });
    it('should return new locale on setLocale if locale is valid', () => {
      [
        'te-ST',
        'en-US',
        'zh-TW',
        'fr-FR',
        'en',
        'zh',
        'fr',
      ].forEach(locale => {
        expect(reducer('foo', {
          type: actionTypes.setLocale,
          locale,
        })).to.equal(locale);
      });
      const originalState = {};
      [
        'bar',
        'baz',
        'zh_TW',
      ].forEach(locale => {
        expect(reducer(originalState, {
          type: actionTypes.setLocale,
          locale,
        })).to.equal(originalState);
      });
    });
  });
});

describe('getLocaleReducer', () => {
  it('should be a function', () => {
    expect(getLocaleReducer).to.be.a('function');
  });
  it('should return a reducer', () => {
    expect(getLocaleReducer({ types: actionTypes })).to.be.a('function');
  });
  it('should return a combined reducer', () => {
    const reducer = getLocaleReducer({ types: actionTypes });
    const statusReducer = getStatusReducer(actionTypes);
    const currentLocaleReducer = getCurrentLocaleReducer({ types: actionTypes });
    expect(reducer(undefined, {})).to.deep.equal({
      status: statusReducer(undefined, {}),
      currentLocale: currentLocaleReducer(undefined, {}),
    });
  });
});
