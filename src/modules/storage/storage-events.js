import KeyValueMap from 'data-types/key-value-map';
import storageStatus from './storage-status';

const eventDefinition = {
  ...storageStatus,
  statusChanged: 'STATUS_CHANGED',
  dataChanged: 'DATA_CHANGED',
  ready: 'READY',
};
export default new KeyValueMap(eventDefinition);
