import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

export function getDataReducer(types) {
  return (state = null, { type, data, isoCode }) => {
    switch (type) {
      case types.fetchSuccess: {
        return data;
      }
      case types.regionChange: {
        if (data === undefined || data.phoneNumbers === undefined) {
          return data;
        }
        const info = data.phoneNumbers.find(value => value.country.isoCode === isoCode);
        if (typeof info === 'undefined') {
          return data;
        }
        return {
          ...data,
          phoneNumber: info.phoneNumber
        };
      }
      case types.resetSuccess:
        return null;
      default:
        return state;
    }
  };
}


export default function getConferenceReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    data: getDataReducer(types),
  });
}
