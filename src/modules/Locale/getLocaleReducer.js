import { combineReducers } from 'redux';
import getModuleStatusReducer from '../../lib/getModuleStatusReducer';
import detectDefaultLocale from '../../lib/detectDefaultLocale';
import localeRegExp from '../../lib/localeRegExp';

export function getCurrentLocaleReducer({ defaultLocale, types }) {
  return (state = detectDefaultLocale(defaultLocale), { type, locale }) => {
    if (type === types.setLocale && localeRegExp.test(locale)) return locale;
    return state;
  };
}

export default function getLocaleReducer({ defaultLocale, types }) {
  return combineReducers({
    currentLocale: getCurrentLocaleReducer({ defaultLocale, types }),
    status: getModuleStatusReducer(types),
  });
}
