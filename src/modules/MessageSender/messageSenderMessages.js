import Enum from '../../lib/Enum';

export default new Enum([
  'sendSuccess',
  'sendError',
  'numberValidateError',
  'textEmpty',
  'textTooLong',
  'noPermission',
  'senderEmpty',
  'noToNumber',
  'recipientsEmpty',
  'recipientNumberInvalids',
  'senderNumberInvalids',
  'noAreaCode',
  'specialNumber',
  'internalError',
  'notAnExtension',
  'networkError',
  'notSmsToExtension',
], 'message-sender-msg');
