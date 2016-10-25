import Enum from '../../lib/Enum';

export default new Enum([
  'pending',
  'loggingIn',
  'loggedIn',
  'beforeLogout',
  'loggingOut',
  'notLoggedIn',
], 'auth');
