import popWindow from './popWindow';

export default class ProxyFrameController {
  constructor({
    prefix,
  } = {}) {
    window.oAuthCallback = (callbackUri) => {
      window.parent.postMessage({
        callbackUri,
      }, '*');
    };

    window.addEventListener('message', ({ data }) => {
      if (data) {
        const {
          oAuthUri,
        } = data;
        if (oAuthUri != null) {
          popWindow(oAuthUri, 'rc-oauth', 600, 600);
        }
      }
    });

    const key = `${prefix}-redirect-callbackUri`;
    window.addEventListener('storage', (e) => {
      if (e.key === key && e.newValue && e.newValue !== '') {
        const callbackUri = e.newValue;
        window.parent.postMessage({
          callbackUri,
          fromLocalStorage: true,
        }, '*');
        localStorage.removeItem(key);
      }
    });
    // loaded
    window.parent.postMessage({
      proxyLoaded: true,
    }, '*');
  }
}
