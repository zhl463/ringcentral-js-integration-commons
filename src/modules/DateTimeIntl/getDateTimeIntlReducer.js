import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';
import dateTimeIntlStatus from './dateTimeIntlStatus';

export function getDateTimeIntlStatusReducer(actionTypes) {
  return (state = dateTimeIntlStatus.idle, { type }) => {
    switch (type) {
      case actionTypes.fetch:
        return dateTimeIntlStatus.fetching;
      case actionTypes.fetchSuccess:
      case actionTypes.fetchError:
        return dateTimeIntlStatus.idle;
      default:
        return state;
    }
  };
}

export function getLastErrorReducer(actionTypes) {
  return (state = null, { type, error }) => {
    switch (type) {

      case actionTypes.fetchError:
        return error;

      case actionTypes.reset:
        return null;

      default:
        return state;
    }
  };
}

export default function getDateTimeIntlReducer(actionTypes) {
  return combineReducers({
    status: getModuleStatusReducer(actionTypes),
    dateTimeIntlstatus: getDateTimeIntlStatusReducer(actionTypes),
    lastError: getLastErrorReducer(actionTypes),
  });
}
