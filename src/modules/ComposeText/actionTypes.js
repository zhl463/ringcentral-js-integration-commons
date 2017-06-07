import Enum from '../../lib/Enum';
import moduleActionTypes from '../../enums/moduleActionTypes';

export default new Enum([
  ...Object.keys(moduleActionTypes),
  'updateSenderNumber',
  'updateTypingToNumber',
  'cleanTypingToNumber',
  'addToNumber',
  'removeToNumber',
  'updateMessageText',
], 'composeText');
