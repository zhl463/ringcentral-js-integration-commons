import { combineReducers } from 'redux';
import getModuleStatusReducer from '../getModuleStatusReducer';

export function getLoggingListReducer(types) {
  return (state = [], { type, name, id }) => {
    switch (type) {
      case types.log: {
        if (state.find(item => item.name === name && item.id === id)) {
          return state;
        }
        return state.concat({
          name,
          id,
        });
      }
      case types.logSuccess:
      case types.logError: {
        return state.filter(item => !(item.id === id && item.name === name));
      }
      default:
        return state;
    }
  };
}

export default function getDefaultReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    loggingList: getLoggingListReducer(types),
  });
}
