import Enum from '../../lib/Enum';
import moduleActionTypes from '../../enums/moduleActionTypes';

export default new Enum([
  ...Object.keys(moduleActionTypes),
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
  'videoElementPrepared',
  'getUserMediaSuccess',
  'getUserMediaError',
], 'webphone');
