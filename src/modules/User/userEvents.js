import KeyValueMap from 'data-types/key-value-map';
import userStatus from './userStatus';

export default new KeyValueMap({
  ...userStatus,
  statusChange: 'STATUS_CHANGE',
  error: 'ERROR',
});
