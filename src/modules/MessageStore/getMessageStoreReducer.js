import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';
import messageStoreStatus from './messageStoreStatus';

export function getMessageStoreStatusReducer(types) {
  return (state = messageStoreStatus.idle, { type }) => {
    switch (type) {
      case types.sync:
        return messageStoreStatus.syncing;
      case types.syncError:
      case types.syncOver:
        return messageStoreStatus.idle;
      default:
        return state;
    }
  };
}

export default function getMessageStoreReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    messageStoreStatus: getMessageStoreStatusReducer(types),
  });
}
