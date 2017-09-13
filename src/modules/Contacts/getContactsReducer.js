import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

export function getProfileImagesReducer(types) {
  return (state = {}, { type, imageId, imageUrl }) => {
    switch (type) {
      case types.fetchImageSuccess:
        return {
          ...state,
          [imageId]: { imageUrl, timestamp: Date.now() },
        };
      default:
        return state;
    }
  };
}

export function getContactPresencesReducer(types) {
  return (state = {}, { type, presenceId, presence }) => {
    switch (type) {
      case types.fetchPresenceSuccess:
        return {
          ...state,
          [presenceId]: { presence, timestamp: Date.now() },
        };
      default:
        return state;
    }
  };
}

export default function getContactsReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    profileImages: getProfileImagesReducer(types),
    contactPresences: getContactPresencesReducer(types),
  });
}
