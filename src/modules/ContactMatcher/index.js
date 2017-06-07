import DataMatcher from '../../lib/DataMatcher';
import proxify from '../../lib/proxy/proxify';

export default class ContactMatcher extends DataMatcher {
  constructor({
    ...options
  }) {
    super({
      name: 'contactMatcher',
      ...options
    });
  }

  @proxify
  async hasMatchNumber({ phoneNumber, ignoreCache = false }) {
    await this.match({
      queries: [phoneNumber],
      ignoreCache
    });
    return !!this.dataMapping[phoneNumber] && this.dataMapping[phoneNumber].length > 0;
  }

  @proxify
  async forceMatchNumber({ phoneNumber }) {
    await this.match({
      queries: [phoneNumber],
      ignoreCache: true
    });
  }
}
