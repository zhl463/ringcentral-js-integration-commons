import Enum from '../../lib/Enum';

export default new Enum([
  'connectFailed',
  'browserNotSupported',
  'webphoneCountOverLimit',
  'notOutboundCallWithoutDL',
  'notWebphonePermission',
  'getSipProvisionError',
], 'webphone');
