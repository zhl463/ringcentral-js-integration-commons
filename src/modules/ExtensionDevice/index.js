import 'core-js/fn/array/find';
import fetchList from '../../lib/fetchList';
import DataFetcher from '../../lib/DataFetcher';

export default class ExtensionDevice extends DataFetcher {
  constructor({
    client,
    ...options,
  }) {
    super({
      name: 'extensionDevice',
      client,
      fetchFunction: () => (fetchList(params => (
        client.account().extension().device().list(params)
      ))),
      ...options,
    });

    this.addSelector(
      'devices',
      () => this.data,
      data => data || [],
    );

    this.addSelector(
      'phoneLines',
      () => this.devices,
      (devices) => {
        let phoneLines = [];
        devices.forEach((device) => {
          if (!device.phoneLines || device.phoneLines.length === 0) {
            return;
          }
          phoneLines = phoneLines.concat(device.phoneLines);
        });
        return phoneLines;
      },
    );
  }

  get devices() {
    return this._selectors.devices();
  }

  get phoneLines() {
    return this._selectors.phoneLines();
  }
}
