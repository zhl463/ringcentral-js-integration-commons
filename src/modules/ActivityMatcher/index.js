import DataMatcher from '../../lib/DataMatcher';

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
