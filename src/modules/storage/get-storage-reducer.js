import { prefixActions } from '../../lib/redux-helper';
import storageActions from './storage-actions';
import storageStatus from './storage-status';

export default function getStorageReducer(prefix) {
  const actions = prefixActions(storageActions, prefix);
  let tmp = null;
  return (state, action) => {
    if (!state) {
      return {
        data: {},
        key: null,
        status: storageStatus.pending,
        error: null,
      };
    }
    if (!action) {
      return state;
    }
    switch (action.type) {

      case actions.init:
        return {
          data: action.data,
          key: action.key,
          status: action.status,
          error: action.error,
        };

      case actions.update:
        return {
          ...state,
          data: {
            ...state.data,
            ...action.data,
          },
          status: storageStatus.dirty,
        };

      case actions.remove:
        tmp = {
          ...state.data,
        };
        delete tmp[action.key];
        return {
          ...state,
          data: tmp,
          status: storageStatus.dirty,
        };

      case actions.save:
        return {
          ...state,
          status: storageStatus.saving,
        };

      case actions.saveSuccess:
        return {
          ...state,
          status: storageStatus.saved,
        };

      case actions.saveError:
        return {
          ...state,
          status: storageStatus.dirty,
        };

      case actions.reload:
        return {
          ...state,
          status: storageStatus.reloading,
        };

      case actions.reloadSuccess:
        return {
          ...state,
          data: action.data,
          status: storageStatus.saved,
        };

      case actions.reloadError:
        return {
          ...state,
          error: action.error,
          status: storageStatus.dirty,
        };

      case actions.reset:
        return {
          status: storageStatus.pending,
          data: {},
          key: null,
          error: null,
        };

      default:
        return state;
    }
  };
}
