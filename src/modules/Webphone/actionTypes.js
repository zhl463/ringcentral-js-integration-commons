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
  'updateCurrentSession',
  'destroyCurrentSession',
  'updateSessions',
  'destroySessions',
  'toggleMinimized',
  'resetMinimized',
], 'webphone');
