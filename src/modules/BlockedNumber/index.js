import DataFetcher from '../../lib/DataFetcher';
import fetchList from '../../lib/fetchList';

export default class BlockedNumber extends DataFetcher {
  constructor({
    client,
    ...options
  }) {
    super({
      ...options,
      name: 'blockedNumber',
      client,
      fetchFunction: async () => (await fetchList(params => (
        this._client.account().extension().blockedNumber().list(params)
      ))),
    });
    this.addSelector(
      'numbers',
      () => this.data,
      data => data || [],
    );
  }

  get numbers() {
    return this._selectors.numbers();
  }
}
