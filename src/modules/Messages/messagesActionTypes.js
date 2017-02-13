import Enum from '../../lib/Enum';

export default new Enum([
  'init',
  'initSuccess',
  'reset',
  'resetSuccess',
  'updateSyncToken',
  'updateLastUpdatedAt',
  'updateUnreadCounts',
  'updateMessageStoreUpdateAt',
  'updateMessages',
  'pushMessages',
  'search',
  'nextPage',
  'resetPage',
  'updateSearchingString',
  'updateSearchResults',
], 'messages');
