import DataMatcher from '../../lib/DataMatcher';

/**
 * @class
 * @description Active matcher manaing module
 */
export default class ActivityMatcher extends DataMatcher {
  constructor({
    ...options
  }) {
    super({
      name: 'activityMatcher',
      ...options
    });
  }
}
