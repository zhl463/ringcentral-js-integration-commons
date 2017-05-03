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

  async hasMatchNumber({ phoneNumber, ignoreCache = false }) {
    await this.match({
      queries: [phoneNumber],
      ignoreCache
    });
    return !!this.dataMapping[phoneNumber] && this.dataMapping[phoneNumber].length > 0;
  }

  async forceMatchNumber({ phoneNumber }) {
    await this.match({
      queries: [phoneNumber],
      ignoreCache: true
    });
  }
}
