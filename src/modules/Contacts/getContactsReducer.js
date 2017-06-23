import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';

export function getProfileImages(types) {
  return (state = {}, { type, image }) => {
    let newState;
    switch (type) {
      case types.fetchImageSuccess:
        newState = {
          ...state,
        };
        newState[image.id] = { timestamp: Date.now(), url: image.url };
        return newState;
      default:
        return state;
    }
  };
}

export default function getContactsReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    profileImages: getProfileImages(types),
  });
}
