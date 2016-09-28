import KeyValueMap from 'data-types/key-value-map';
import extensionInfoStatus from './extension-info-status';

export default new KeyValueMap({
  ...extensionInfoStatus,
  statusChange: 'STATUS_CHANGE',
  extensionInfoChange: 'EXTENSION_INFO_CHANGE',
});
