import fetchList from '../../lib/fetchList';
import DataFetcher from '../../lib/DataFetcher';
import moduleStatus from '../../enums/moduleStatus';

export default class DialingPlan extends DataFetcher {
  constructor({
    client,
    ...options
  }) {
    super({
      name: 'dialingPlan',
      client,
      polling: true,
      fetchFunction: async () => (await fetchList(params => (
        client.account().dialingPlan().list(params)
      ))).map(p => ({
        id: p.id,
        isoCode: p.isoCode,
        callingCode: p.callingCode,
      })),
      ...options,
    });

    this.addSelector(
      'plans',
      () => this.data,
      data => data || [],
    );
  }

  get plans() {
    return this._selectors.plans();
  }

  get status() {
    return this.state.status;
  }

  get ready() {
    return this.state.status === moduleStatus.ready;
  }
}

