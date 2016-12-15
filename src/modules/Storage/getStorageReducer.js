import { combineReducers } from 'redux';
import moduleStatus from '../../enums/moduleStatus';

export function getStatusReducer(types) {
  return (state = moduleStatus.pending, { type }) => {
    switch (type) {
      case types.init:
        return moduleStatus.ready;
      case types.reset:
        return moduleStatus.resetting;
      case types.resetSuccess:
        return moduleStatus.pending;
      default:
        return state;
    }
  };
}

export function getDataReducer({ types, reducers }) {
  return (state = {}, action) => {
    switch (action.type) {
      case types.init:
        return action.data;
      case types.sync:
        return {
          ...state,
          [action.key]: action.value,
        };
      case types.resetSuccess:
        return {};
      default: {
        const newState = {};
        let hasChange = false;
        // compute new substates and check for changes
        /* eslint-disable guard-for-in */
        for (const key in reducers) {
          newState[key] = reducers[key](state[key], action);
          if (newState[key] !== state[key]) hasChange = true;
        }
        return hasChange ? newState : state;
      }
    }
  };
}

export function getStorageKeyReducer(types) {
  return (state = null, { type, storageKey }) => {
    switch (type) {

      case types.init:
        return storageKey;

      case types.resetSuccess:
        return null;

      default:
        return state;
    }
  };
}

export default function getStorageReducer({ types, reducers }) {
  return combineReducers({
    status: getStatusReducer(types),
    data: getDataReducer({ types, reducers }),
    storageKey: getStorageKeyReducer(types),
  });
}
