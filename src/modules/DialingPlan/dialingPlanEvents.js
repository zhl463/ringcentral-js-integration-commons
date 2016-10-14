import KeyValueMap from 'data-types/key-value-map';
import dialingPlanStatus from './dialingPlanStatus';

export default new KeyValueMap({
  ...dialingPlanStatus,
  statusChange: 'STATUS_CHANGE',
  dialingPlanChange: 'DIALING_PLAN_CHANGE',
  error: 'ERROR',
});
