import KeyValueMap from 'data-types/key-value-map';

const hasOwnProperty = Object.prototype.hasOwnProperty;
/**
 * @class
 * @description helper class for creating redux action definition maps
 */
export default class Enum extends KeyValueMap {
  /**
   * @constructor
   * @param {String[]} actions - list of action strings
   * @extends KeyValueMap
   */
  constructor(values = [], prefix = '') {
    const definition = {};
    values.forEach((value) => {
      definition[value] = prefix !== '' ? `${prefix}-${value}` : value;
    });
    super(definition);
  }
}

const prefixCache = new Map();

/**
 * @function
 * @description helper function to return a prefixed action definition maps
 */
export function prefixEnum({ enumMap, prefix }) {
  if (!prefix || prefix === '') return enumMap;

  if (!prefixCache.has(prefix)) {
    prefixCache.set(prefix, new Map());
  }

  const cache = prefixCache.get(prefix);

  if (!cache.has(enumMap)) {
    const definition = {};
    for (const type in enumMap) {
      /* istanbul ignore else */
      if (enumMap::hasOwnProperty(type)) {
        definition[type] = `${prefix}-${enumMap[type]}`;
      }
    }
    cache.set(enumMap, new KeyValueMap(definition));
  }
  return cache.get(enumMap);
}
