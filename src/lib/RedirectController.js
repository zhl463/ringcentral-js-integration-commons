
export default class RedirectController {
  constructor({
    prefix,
  } = {}) {
    window.addEventListener('load', () => {
      const callbackUri = window.location.href;
      if (window.opener && window.opener.oAuthCallback) {
        window.opener.oAuthCallback(callbackUri);
        window.close();
      } else {
        // fall back to use localStorage as a vessel to avoid opener is null bug
        const key = `${prefix}-redirect-callbackUri`;
        localStorage.removeItem(key);
        window.addEventListener('storage', e => {
          if (e.key === key && (!e.newValue || e.newValue === '')) {
            window.close();
          }
        });
        localStorage.setItem(key, callbackUri);
      }
    });
  }
}
