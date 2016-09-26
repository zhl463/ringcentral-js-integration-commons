import KeyValueMap from 'data-types/key-value-map';
import storageStatus from './storage-status';

const eventDefinition = {
  ...storageStatus,
  statusChange: 'STATUS_CHANGE',
  dataChange: 'DATA_CHANGE',
  ready: 'READY',
};
export default new KeyValueMap(eventDefinition);
