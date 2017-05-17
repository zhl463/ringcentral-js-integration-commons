import { expect } from 'chai';
import getLocaleReducer, {
  getCurrentLocaleReducer,
} from './getLocaleReducer';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

import actionTypes from './actionTypes';
import detectDefaultLocale from '../../lib/detectDefaultLocale';

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
      ].forEach((locale) => {
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
      ].forEach((locale) => {
        expect(reducer(originalState, {
          type: actionTypes.setLocale,
          locale,
        })).to.equal(locale);
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
    const statusReducer = getModuleStatusReducer(actionTypes);
    const currentLocaleReducer = getCurrentLocaleReducer({ types: actionTypes });
    expect(reducer(undefined, {})).to.deep.equal({
      status: statusReducer(undefined, {}),
      currentLocale: currentLocaleReducer(undefined, {}),
    });
  });
});
