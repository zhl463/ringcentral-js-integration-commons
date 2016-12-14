import { combineReducers } from 'redux';
import moduleStatus from '../../enums/moduleStatus';
import detectDefaultLocale from '../../lib/detectDefaultLocale';
import localeRegExp from '../../lib/localeRegExp';

export function getStatusReducer(types) {
  return (state = moduleStatus.pending, { type }) => {
    if (type === types.init) return moduleStatus.ready;
    return state;
  };
}

export function getCurrentLocaleReducer({ defaultLocale, types }) {
  return (state = detectDefaultLocale(defaultLocale), { type, locale }) => {
    if (type === types.setLocale && localeRegExp.test(locale)) return locale;
    return state;
  };
}

export default function getLocaleReducer({ defaultLocale, types }) {
  return combineReducers({
    currentLocale: getCurrentLocaleReducer({ defaultLocale, types }),
    status: getStatusReducer(types),
  });
}
