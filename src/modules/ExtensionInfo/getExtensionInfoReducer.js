import { prefixActions } from '../../lib/ActionMap';
import extensionInfoActions from './extensionInfoActions';
import extensionInfoStatus from './extensionInfoStatus';

export default function getExtensionInfoReducer(prefix) {
  const actions = prefixActions({ actions: extensionInfoActions, prefix });
  return (state, action) => {
    if (!state) {
      return {
        status: extensionInfoStatus.pending,
        error: null,
      };
    }
    if (!action) {
      return state;
    }
    switch (action.type) {
      case actions.ready:
        return {
          status: extensionInfoStatus.ready,
          error: null,
        };
      case actions.fetch:
        return {
          status: extensionInfoStatus.fetching,
          error: null,
        };
      case actions.fetchSuccess:
        return {
          status: extensionInfoStatus.ready,
          error: null,
        };
      case actions.fetchError:
        return {
          status: extensionInfoStatus.ready,
          error: action.error,
        };
      case actions.reset:
        return {
          status: extensionInfoStatus.pending,
          error: null,
        };
      default:
        return state;
    }
  };
}
