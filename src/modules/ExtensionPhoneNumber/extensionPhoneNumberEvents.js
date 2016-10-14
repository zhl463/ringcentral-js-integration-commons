import KeyValueMap from 'data-types/key-value-map';
import extensionPhoneNumberStatus from './extensionPhoneNumberStatus';

export default new KeyValueMap({
  ...extensionPhoneNumberStatus,
  statusChange: 'STATUS_CHANGE',
  extensionPhoneNumberChange: 'EXTENSION_PHONE_NUMBER_CHANGE',
  error: 'ERROR',
});
