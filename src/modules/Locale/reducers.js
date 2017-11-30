
export function getCurrentLocaleReducer(types) {
  return (state = null, { type, locale }) => {
    if (type === types.setLocaleSuccess) return locale;
    return state;
  };
}

export function getProxyLocaleReducer(types) {
  return (state = null, { type, locale }) => {
    if (type === types.syncProxyLocale) return locale;
    return state;
  };
}
