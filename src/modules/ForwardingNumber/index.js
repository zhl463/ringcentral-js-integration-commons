import DataFetcher from '../../lib/DataFetcher';
import fetchList from '../..//lib/fetchList';

export default class ForwardingNumber extends DataFetcher {
  constructor({
    client,
    ...options,
  }) {
    super({
      name: 'forwardingNumber',
      client,
      fetchFunction: async () => (await fetchList(params => (
        this._client.account().extension().forwardingNumber().list(params)
      ))),
      ...options,
    });

    this.addSelector(
      'flipNumbers',
      () => this.numbers,
      phoneNumbers =>
        phoneNumbers.filter(p => p.features.indexOf('CallFlip') !== -1 && p.phoneNumber)
    );
    this.addSelector(
      'numbers',
      () => this.data,
      data => data || [],
    );
  }

  get numbers() {
    return this._selectors.numbers();
  }

  get flipNumbers() {
    return this._selectors.flipNumbers();
  }
}
