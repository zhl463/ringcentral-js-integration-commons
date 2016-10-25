import Enum from '../../lib/Enum';

export default new Enum([
  'login',
  'loginSuccess',
  'loginError',
  'logout',
  'logoutSuccess',
  'logoutError',
  'refresh',
  'refreshSuccess',
  'refreshError',
  'beforeLogout',
  'cancelLogout',
  'init',
], 'auth');
