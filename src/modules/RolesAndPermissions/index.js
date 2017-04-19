import DataFetcher from '../../lib/DataFetcher';
import moduleStatuses from '../../enums/moduleStatuses';

const DEFAULT_TTL = 24 * 60 * 60 * 1000;

function extractData(permissions) {
  const output = {};
  permissions.permissions.forEach((item) => {
    output[item.permission.id] = true;
  });
  return output;
}

export default class RolesAndPermissions extends DataFetcher {
  constructor({
    client,
    extensionInfo,
    ttl = DEFAULT_TTL,
    ...options
  }) {
    super({
      ...options,
      name: 'rolesAndPermissions',
      client,
      ttl,
      fetchFunction: async () => extractData(
        await this._client.account().extension().authzProfile().get()
      ),
      readyCheckFn: () => this._extensionInfo.ready,
    });
    this._extensionInfo = extensionInfo;
    this.addSelector(
      'permissions',
      () => this.data,
      data => data || {},
    );
  }

  get serviceFeatures() {
    return this._extensionInfo.serviceFeatures;
  }

  get permissions() {
    return this._selectors.permissions();
  }

  get ringoutEnabled() {
    return !!(
      this._extensionInfo.serviceFeatures &&
      this._extensionInfo.serviceFeatures.RingOut &&
      this._extensionInfo.serviceFeatures.RingOut.enabled
    );
  }

  get webphoneEnabled() {
    return !!(
      this._extensionInfo.serviceFeatures &&
      this._extensionInfo.serviceFeatures.WebPhone &&
      this._extensionInfo.serviceFeatures.WebPhone.enabled
    );
  }
}
