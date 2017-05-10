import DataFetcher from '../../lib/DataFetcher';
import permissionsMessages from './permissionsMessages';
import loginStatus from '../Auth/loginStatus';

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
    isCRM,
    flag,
    client,
    alert,
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
    this._isCRM = !!isCRM;
    this._flag = flag || 'SalesForce';
    this._alert = alert;
    this._extensionInfo = extensionInfo;
    this.addSelector(
      'permissions',
      () => this.data,
      data => data || {},
    );
  }

  async _onStateChange() {
    await super._onStateChange();
    if (this.ready &&
      this._auth.loginStatus === loginStatus.loggedIn &&
      this._isCRM &&
      !this.tierEnabled
      ) {
      await this._auth.logout();
      this._alert.danger({
        message: permissionsMessages.invalidTier,
        ttl: 0,
      });
    }
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

  get tierEnabled() {
    return !!(
      this._extensionInfo.serviceFeatures &&
      this._extensionInfo.serviceFeatures[this._flag] &&
       this._extensionInfo.serviceFeatures[this._flag].enabled
    );
  }
}
