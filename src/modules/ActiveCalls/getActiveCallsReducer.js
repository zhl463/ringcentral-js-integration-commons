
import removeUri from '../../lib/removeUri';
import {
  normalizeStartTime,
  sortByStartTime,
} from '../../lib/callLogHelpers';

export function getDataReducer(types) {
  return (state = [], { type, data }) => {
    switch (type) {
      case types.fetchSuccess:
        return data
          .map(call => normalizeStartTime(removeUri(call)))
          .sort(sortByStartTime);
      case types.resetSuccess:
        return [];
      default:
        return state;
    }
  };
}
