import Enum from '../../lib/Enum';

export default new Enum([
  'init',
  'resetSuccess',
  'initSuccess',
  'connect',
  'connectError',
  'registered',
  'registrationFailed',
  'disconnect',
  'unregistered',
  'reconnect',
  'resetRetryCounts',
  'updateSession',
  'destroySession',
], 'webphone');
