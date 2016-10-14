import { prefixActions } from '../../lib/ActionMap';
import extensionPhoneNumberActions from './extensionPhoneNumberActions';
import extensionPhoneNumberStatus from './extensionPhoneNumberStatus';

export default function getExtensionPhoneNumberReducer(prefix) {
  const actions = prefixActions({ actions: extensionPhoneNumberActions, prefix });
  return (state, action) => {
    if (!state) {
      return {
        status: extensionPhoneNumberStatus.pending,
        error: null,
      };
    }
    if (!action) {
      return state;
    }
    switch (action.type) {
      case actions.ready:
        return {
          status: extensionPhoneNumberStatus.ready,
          error: null,
        };
      case actions.fetch:
        return {
          status: extensionPhoneNumberStatus.fetching,
          error: null,
        };
      case actions.fetchSuccess:
        return {
          status: extensionPhoneNumberStatus.ready,
          error: null,
        };
      case actions.fetchError:
        return {
          status: extensionPhoneNumberStatus.ready,
          error: action.error,
        };
      case actions.reset:
        return {
          status: extensionPhoneNumberStatus.pending,
          error: null,
        };
      default:
        return state;
    }
  };
}
