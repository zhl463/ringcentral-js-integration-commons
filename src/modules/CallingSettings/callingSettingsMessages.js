import Enum from '../../lib/Enum';

export default new Enum([
  'saveSuccess',
  'saveSuccessWithSoftphone',
  'firstLogin',
  'firstLoginOther',
  'permissionChanged',
  'phoneNumberChanged',
  'webphonePermissionRemoved',
  'emergencyCallingNotAvailable',
], 'callingSettingsMessages');
