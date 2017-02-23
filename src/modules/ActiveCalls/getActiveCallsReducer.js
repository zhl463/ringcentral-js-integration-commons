
import removeUri from '../../lib/removeUri';
import {
  normalizeStartTime,
  removeInboundRingOutLegs,
  sortByStartTime,
} from '../../lib/callLogHelpers';

export function getDataReducer(types) {
  return (state = [], { type, data }) => {
    switch (type) {
      case types.fetchSuccess:
        return removeInboundRingOutLegs(data)
          .map(call => normalizeStartTime(removeUri(call)))
          .sort(sortByStartTime);
      case types.resetSuccess:
        return [];
      default:
        return state;
    }
  };
}
