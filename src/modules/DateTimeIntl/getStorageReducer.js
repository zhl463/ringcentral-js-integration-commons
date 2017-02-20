import { combineReducers } from 'redux';

export function getSettingsReducer(actionTypes) {
  return (state = {}, { type, provider, providerSettings }) => {
    const newState = { ...state };
    switch (type) {
      case actionTypes.fetchSuccess:
        newState[provider.providerName] = providerSettings;
        return newState;

      case actionTypes.fetchError:
        delete newState[provider.providerName];
        return newState;

      case actionTypes.reset:
        return {};

      default:
        return state;
    }
  };
}

export function getValidityReducer(actionTypes) {
  return (state = {}, { type, provider }) => {
    const newState = { ...state };
    switch (type) {

      case actionTypes.fetch:
        delete newState[provider.providerName];
        return newState;

      case actionTypes.fetchSuccess:
        newState[provider.providerName] = true;
        return newState;

      case actionTypes.fetchError:
        newState[provider.providerName] = false;
        return newState;

      case actionTypes.reset:
        return {};

      default:
        return state;
    }
  };
}

export function getTimestampReducer(actionTypes) {
  return (state = 0, { type, timestamp }) => {
    switch (type) {

      case actionTypes.fetchSuccess:
      case actionTypes.fetchError:
        return timestamp;

      case actionTypes.reset:
        return 0;

      default:
        return state;
    }
  };
}

export default function getStorageReducer(actionTypes) {
  return combineReducers({
    settings: getSettingsReducer(actionTypes),
    validity: getValidityReducer(actionTypes),
    timestamp: getTimestampReducer(actionTypes),
  });
}
