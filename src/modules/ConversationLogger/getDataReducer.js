import { combineReducers } from 'redux';

export function getAutoLogReducer(types) {
  return (state = true, { type, autoLog }) => {
    if (type === types.setAutoLog) return !!autoLog;
    return state;
  };
}

export default function getDataReducer(types) {
  return combineReducers({
    autoLog: getAutoLogReducer(types),
  });
}
