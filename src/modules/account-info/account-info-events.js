import KeyValueMap from 'data-types/key-value-map';
import accountInfoStatus from './account-info-status';

export default new KeyValueMap({
  ...accountInfoStatus,
  statusChange: 'STATUS_CHANGE',
  accountInfoChange: 'ACCOUNT_INFO_CHANGE',
  error: 'ERROR',
});
