import DataFetcher from '../../lib/DataFetcher';
import fetchList from '../../lib/fetchList';

/**
 * @class
 * @description Blocked number list managing module
 */
export default class BlockedNumber extends DataFetcher {
  /**
   * @constructor
   * @param {Object} params - params object
   * @param {Client} params.client - client module instance
   */
  constructor({
    client,
    ...options
  }) {
    super({
      ...options,
      name: 'blockedNumber',
      client,
      fetchFunction: async () => fetchList(params => (
        this._client.account().extension().blockedNumber().list(params)
      )),
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
