const DEFAULT_LOCALE = 'en-US';

/**
 * @function
 * @description Detects the default locale from browser if applicable and fall back to
 *   the specified defaultLocale.
 * @param {String} defaultLocale - (optional) The default locale for the application,
 *   default is 'en-US'.
 * @return {String}
 */
export default function detectDefaultLocale(defaultLocale = DEFAULT_LOCALE) {
  let browserLocale = defaultLocale;
  if (typeof navigator !== 'undefined') {
    if (navigator.languages && navigator.languages.length) {
      browserLocale = navigator.languages[0];
    } else {
      browserLocale = navigator.language || defaultLocale;
    }
  }
  const tokens = browserLocale.split(/[-_]/);
  return tokens.map((v, idx) => {
    if (idx) {
      return v.toUpperCase();
    }
    return v.toLowerCase();
  }).join('-');
}
