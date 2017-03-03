import { expect } from 'chai';
import { getCacheKey, parseCacheKey } from './helpers';

describe('getCacheKey', () => {
  it('should return cache key with stringify', () => {
    expect(getCacheKey('name', '1234')).to.equal('["name","1234"]');
  });
});

describe('parseCacheKey', () => {
  it('should return result pared', () => {
    expect(parseCacheKey('["name","1234"]')).to.deep.equal(['name', '1234']);
  });
});
