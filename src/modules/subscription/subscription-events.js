import KeyValueMap from 'data-types/key-value-map';
import subscriptionStatus from './subscription-status';


const eventDefinition = {
  ...subscriptionStatus,
  notification: 'NOTIFICATION',
  statusChange: 'STATUS_CHANGE',
};

export default new KeyValueMap(eventDefinition);
