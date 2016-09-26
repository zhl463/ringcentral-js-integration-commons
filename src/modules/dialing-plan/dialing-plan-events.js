import KeyValueMap from 'data-types/key-value-map';
import dialingPlanStatus from './dialing-plan-status';

export default new KeyValueMap({
  ...dialingPlanStatus,
  statusChange: 'STATUS_CHANGE',
  dialingPlanChange: 'DIALING_PLAN_CHANGE',
});
