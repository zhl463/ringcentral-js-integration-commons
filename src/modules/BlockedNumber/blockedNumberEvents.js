import KeyValueMap from 'data-types/key-value-map';
import blockedNumberStatus from './blockedNumberStatus';

export default new KeyValueMap({
  ...blockedNumberStatus,
  statusChange: 'STATUS_CHANGE',
  blockedNumberChange: 'BLOCKED_NUMBER_CHANGE',
  error: 'ERROR',
});
