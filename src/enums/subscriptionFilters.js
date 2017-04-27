import HashMap from '../lib/HashMap';

export default new HashMap({
  presence: '/account/~/extension/~/presence',
  detailedPresence: '/account/~/extension/~/presence?detailedTelephonyState=true',
  accountExtension: '/account/~/extension',
});
