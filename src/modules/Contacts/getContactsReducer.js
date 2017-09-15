import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

export function getProfileImagesReducer(types) {
  return (state = {}, { type, imageId, imageUrl, ttl }) => {
    switch (type) {
      case types.fetchImageSuccess: {
        const data = {};
        Object.keys(state).forEach((key) => {
          if (Date.now() - state[key].timestamp < ttl) {
            data[key] = state[key];
          }
        });
        data[imageId] = {
          imageUrl,
          timestamp: Date.now(),
        };
        return data;
      }
      default:
        return state;
    }
  };
}

export function getContactPresencesReducer(types) {
  return (state = {}, { type, presenceId, presence, ttl }) => {
    switch (type) {
      case types.fetchPresenceSuccess: {
        const data = {};
        Object.keys(state).forEach((key) => {
          if (Date.now() - state[key].timestamp < ttl) {
            data[key] = state[key];
          }
        });
        data[presenceId] = {
          presence,
          timestamp: Date.now(),
        };
        return data;
      }
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
