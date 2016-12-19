import { combineReducers } from 'redux';
import moduleStatus from '../../enums/moduleStatus';

export function getStatusReducer(types) {
  return (state = moduleStatus.pending, { type }) => {
    switch (type) {
      case types.init:
        return moduleStatus.initializing;
      case types.initSuccess:
        return moduleStatus.ready;
      case types.reset:
        return moduleStatus.pending;
      default:
        return state;
    }
  };
}

export function getCountryCodeReducer(types) {
  return (state = null, { type, countryCode = state }) => {
    if (type === types.setData) return countryCode;
    return state;
  };
}

export function getAreaCodeReducer(types) {
  return (state = '', { type, areaCode = state }) => {
    if (type === types.setData) return areaCode;
    return state;
  };
}


export default function getRegionSettingsReducer(types) {
  return combineReducers({
    status: getStatusReducer(types),
  });
}
