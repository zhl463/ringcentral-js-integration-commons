import KeyValueMap from 'data-types/key-value-map';
import authStatus from './auth-status';

const eventDefinitions = {
  ...authStatus,
  authStatusChange: 'AUTH_STATUS_CHANGE',
  error: 'ERROR',
};

export default new KeyValueMap(eventDefinitions);
