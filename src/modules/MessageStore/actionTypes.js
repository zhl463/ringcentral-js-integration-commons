import Enum from '../../lib/Enum';

export default new Enum([
  'init',
  'initSuccess',
  'reset',
  'resetSuccess',
  'sync',
  'syncError',
  'syncOver',
  'saveConversations',
  'saveMessages',
  'saveSyncToken',
  'cleanUp',
], 'messageStore');
