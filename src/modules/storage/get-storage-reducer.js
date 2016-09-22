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
        version: 0,
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
          version: state.version + 1,
        };

      case actions.update:
        return {
          ...state,
          data: {
            ...state.data,
            ...action.data,
          },
          version: state.version + 1,
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
          version: state.version + 1,
          status: storageStatus.dirty,
        };

      case actions.save:
        return {
          ...state,
          status: storageStatus.saving,
        };

      case actions.saveSuccess:
        return action.version === state.version ?
          {
            ...state,
            status: storageStatus.saved,
          } :
          state;

      case actions.saveError:
        return action.version === state.version ?
          {
            ...state,
            status: storageStatus.dirty,
            error: action.error,
          } :
          state;

      case actions.load:
        return {
          ...state,
          data: action.data,
          status: storageStatus.saved,
          version: state.version + 1,
          error: null,
        };

      case actions.reset:
        return {
          status: storageStatus.pending,
          data: {},
          key: null,
          version: state.version + 1,
          error: null,
        };

      default:
        return state;
    }
  };
}
