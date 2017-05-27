import 'core-js/fn/array/find';
import DataFetcher from '../../lib/DataFetcher';
import fetchList from '../../lib/fetchList';

import actionTypes from './actionTypes';
import {
  getDataReducer,
  getTimestampReducer,
} from './getAccountExtensionReducer';
import {
  isEssential,
  simplifyExtensionData,
} from './accountExtensionHelper';
import subscriptionFilters from '../../enums/subscriptionFilters';

const extensionRegExp = /.*\/extension$/;
const DEFAULT_TTL = 24 * 60 * 60 * 1000;

export default class AccountExtension extends DataFetcher {
  constructor({
    client,
    ttl = DEFAULT_TTL,
    ...options
  }) {
    super({
      ...options,
      name: 'accountExtension',
      client,
      ttl,
      actionTypes,
      getDataReducer,
      getTimestampReducer,
      subscriptionFilters: [subscriptionFilters.accountExtension],
      subscriptionHandler: async (message) => {
        this._subscriptionHandleFn(message);
      },
      fetchFunction: async () => (await fetchList(params => (
        this._client.account().extension().list(params)
      ))).filter(isEssential).map(simplifyExtensionData),
    });

    this.addSelector(
      'availableExtensions',
      () => this.data,
      data => data || [],
    );
  }

  async _subscriptionHandleFn(message) {
    if (
      message &&
      extensionRegExp.test(message.event) &&
      message.body &&
      message.body.extensions
    ) {
      for (const item of message.body.extensions) {
        await this.processExtension(item);
      }
    }
  }

  async processExtension(item) {
    const { extensionId, eventType } = item;
    const id = parseInt(extensionId, 10);
    if (eventType === 'Delete') {
      this.deleteExtension(id);
    } else if (eventType === 'Create' || eventType === 'Update') {
      try {
        const extensionData = await this.fetchExtensionData(id);
        const essential = isEssential(extensionData);
        const isAvailableExtension = this.isAvailableExtension(extensionData.extensionNumber);

        if (essential && !isAvailableExtension) { // && !isAvailableExtension
          this.addExtension(extensionData);
        } else if (!essential && isAvailableExtension) {
          // if an extension was updated to be not essential anymore
          // eg. not assigned an extension number
          this.deleteExtension(id);
        }
      } catch (error) {
        /* falls through */
      }
    } else {
      // console.warn('unexpect notification eventType:', eventType);
    }
  }

  addExtension(data) {
    this.store.dispatch({
      type: this.actionTypes.add,
      data: simplifyExtensionData(data),
      timestamp: Date.now(),
    });
  }

  deleteExtension(id) {
    this.store.dispatch({
      type: this.actionTypes.delete,
      id,
      timestamp: Date.now(),
    });
  }

  async fetchExtensionData(id) {
    return this._client.account().extension(id).get();
  }

  get availableExtensions() {
    return this._selectors.availableExtensions();
  }

  isAvailableExtension(extensionNumber) {
    return !!this.availableExtensions.find(item => item.ext === extensionNumber);
  }
}
