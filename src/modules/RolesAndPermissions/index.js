import DataFetcher from '../../lib/DataFetcher';
import moduleStatus from '../../enums/moduleStatus';

const DEFAULT_TTL = 24 * 60 * 60 * 1000;

function extractData(permissions) {
  const output = {};
  permissions.permissions.forEach(item => {
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
      name: 'rolesAndPermissions',
      client,
      ttl,
      fetchFunction: async () => extractData(
        await this._client.account().extension().authzProfile().get()
      ),
      ...options
    });
    this._extensionInfo = extensionInfo;
    this.addSelector(
      'permissions',
      () => this.data,
      data => data || {},
    );
  }
  initialize() {
    this.store.subscribe(async () => {
      if (
        this._auth.loggedIn &&
        this._storage.ready &&
        this._extensionInfo.ready &&
        this.status === moduleStatus.pending
      ) {
        this.store.dispatch({
          type: this.actionTypes.init,
        });
        if (
          (!this._tabManager || this._tabManager.active) &&
          (
            this._auth.isFreshLogin ||
            !this.timestamp ||
            Date.now() - this.timestamp > this._ttl
          )
        ) {
          await this.fetchData();
        } else {
          this._retry();
        }
        this.store.dispatch({
          type: this.actionTypes.initSuccess,
        });
      } else if (
        (!this._auth.loggedIn || !this._storage.ready || !this._extensionInfo.ready) &&
        this.ready
      ) {
        this._clearTimeout();
        this._promise = null;
        this.store.dispatch({
          type: this.actionTypes.resetSuccess,
        });
      }
    });
  }

  get serviceFeatures() {
    return this._extensionInfo.serviceFeatures;
  }

  get permissions() {
    return this._selectors.permissions();
  }

  get ringoutEnabled() {
    return this._extensionInfo.serviceFeatures &&
    this._extensionInfo.serviceFeatures.RingOut &&
    this._extensionInfo.serviceFeatures.RingOut.enabled;
  }

}
