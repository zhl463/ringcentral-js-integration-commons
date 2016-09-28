import KeyValueMap from 'data-types/key-value-map';
import extensionPhoneNumberStatus from './extension-phone-number-status';

export default new KeyValueMap({
  ...extensionPhoneNumberStatus,
  statusChange: 'STATUS_CHANGE',
  extensionPhoneNumberChange: 'EXTENSION_PHONE_NUMBER_CHANGE',
  error: 'ERROR',
});
