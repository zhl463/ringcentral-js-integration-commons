import KeyValueMap from 'data-types/key-value-map';

export default new KeyValueMap({
  pending: 'PENDING',
  dirty: 'DIRTY',
  saving: 'SAVING',
  saved: 'SAVED',
  reloading: 'RELOADING',
});
