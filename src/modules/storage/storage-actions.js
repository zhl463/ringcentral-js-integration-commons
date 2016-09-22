import { ActionMap } from '../../lib/redux-helper';

export default new ActionMap([
  'init',
  'update',
  'remove',
  'save',
  'saveSuccess',
  'saveError',
  'load',
  'reset',
], 'storage');
