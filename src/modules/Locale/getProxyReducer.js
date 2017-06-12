import { combineReducers } from 'redux';
import detectDefaultLocale from '../../lib/detectDefaultLocale';
import getProxyStatusReducer from '../../lib/getProxyStatusReducer';

export function getCurrentLocaleReducer({ defaultLocale, types }) {
  return (state = detectDefaultLocale(defaultLocale), { type, locale }) => {
    if (type === types.syncProxyLocale) return locale;
    return state;
  };
}


export default function getProxyReducer({ defaultLocale, types }) {
  return combineReducers({
    currentLocale: getCurrentLocaleReducer({ defaultLocale, types }),
    status: getProxyStatusReducer(types),
  });
}
