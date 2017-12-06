import mask from 'json-mask';
import { Module } from '../../lib/di';
import DataFetcher from '../../lib/DataFetcher';
import createSimpleReducer from '../../lib/createSimpleReducer';
import actionTypes from './actionTypes';
import proxify from '../../lib/proxy/proxify';

const DEFAULT_MASK = 'phoneNumber,hostCode,participantCode,phoneNumbers(country,phoneNumber),allowJoinBeforeHost';

/**
 * @class
 * @description Conference managing module
 */
@Module({
  deps: [
    'Client', 'Storage', 'RegionSettings', { dep: 'ConferenceOptions', optional: true }
  ]
})
export default class Conference extends DataFetcher {
  /**
   * @constructor
   * @param {Object} params - params object
   * @param {RegionSettings} params.regionSettings - regionSettings module instance
   * @param {Client} params.client - client module instance
   */
  constructor({
    client,
    regionSettings,
    storage,
    ...options
  }) {
    super({
      name: 'conference',
      client,
      fetchFunction: async () => mask(
        await client.account().extension().conferencing().get(),
        DEFAULT_MASK,
      ),
      actionTypes,
      storage,
      ...options,
    });
    this._dialInNumberStorageKey = 'conferenceDialInNumber';
    this._additionalNumbersStorageKey = 'conferenceAdditionalNumbers';
    this._storage.registerReducer({
      key: this._dialInNumberStorageKey,
      reducer: createSimpleReducer(this.actionTypes.updateDialInNumber, 'dialInNumber'),
    });
    this._storage.registerReducer({
      key: this._additionalNumbersStorageKey,
      reducer: createSimpleReducer(this.actionTypes.updateAdditionalNumbers, 'additionalNumbers'),
    });
  }

  @proxify
  async updateEnableJoinBeforeHost(allowJoinBeforeHost) {
    const data = await this._client.account().extension().conferencing()
      .put({ allowJoinBeforeHost });
    this._store.dispatch({ type: this.actionTypes.fetchSuccess, data });
  }

  @proxify
  updateDialInNumber(dialInNumber) {
    this._store.dispatch({ type: this.actionTypes.updateDialInNumber, dialInNumber });
  }

  @proxify
  updateAdditionalNumbers(additionalNumbers) {
    this._store.dispatch({ type: this.actionTypes.updateAdditionalNumbers, additionalNumbers });
  }

  get additionalNumbers() {
    return this._storage.getItem(this._additionalNumbersStorageKey) || [];
  }

  get dialInNumber() {
    return this._storage.getItem(this._dialInNumberStorageKey) || this.data.phoneNumber;
  }

  _shouldFetch() {
    return !this._tabManager || this._tabManager.active;
  }
}
