
function popWindow(url, id, w, h) {
  // Fixes dual-screen position                         Most browsers      Firefox
  const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
  const dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

  const width = screen.width || window.outerWidth;
  const height = screen.height || window.innerHeight;

  const left = ((width / 2) - (w / 2)) + dualScreenLeft;
  const top = ((height / 2) - (h / 2)) + dualScreenTop;
  const newWindow = window.open(
    url,
    id,
    `scrollbars=yes, width=${w}, height=${h}, top=${top}, left=${left}`,
  );

  // Puts focus on the newWindow
  if (window.focus) {
    try {
      newWindow.focus();
    } catch (e) {
      /* falls through */
    }
  }
  return newWindow;
}

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
