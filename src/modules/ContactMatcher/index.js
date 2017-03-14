import DataMatcher from '../../lib/DataMatcher';

export default class ContactMatcher extends DataMatcher {
  constructor({
    ...options
  }) {
    super({
      name: 'contactMatcher',
      ...options
    });
  }
}
