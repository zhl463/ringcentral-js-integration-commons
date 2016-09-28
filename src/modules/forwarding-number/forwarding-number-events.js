import KeyValueMap from 'data-types/key-value-map';
import forwardingNumberStatus from './forwarding-number-status';

export default new KeyValueMap({
  ...forwardingNumberStatus,
  statusChange: 'STATUS_CHANGE',
  forwardingNumberChange: 'FORWARDING_NUMBER_CHANGE',
  error: 'ERROR',
});
