import Enum from '../../lib/Enum';

export default new Enum([
  'init',
  'initSuccess',
  'reset',
  'resetSuccess',
  'sync',
  'syncError',
  'syncSuccess',
  'syncConversationSuccess',
  'updateMessages',
  'updateConversationRecipients',
  'cleanUp',
], 'messageStore');
