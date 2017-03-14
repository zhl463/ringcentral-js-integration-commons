export const getCacheKey = (sourceName, query) => JSON.stringify([sourceName, query]);
export const parseCacheKey = cacheKey => JSON.parse(cacheKey);

export const matchResult = {
  notFound: 'n',
  found: 'y',
};
