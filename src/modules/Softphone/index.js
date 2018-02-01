import RcModule from '../../lib/RcModule';
import { Module } from '../../lib/di';
import moduleStatuses from '../../enums/moduleStatuses';
import sleep from '../../lib/sleep';
import proxify from '../../lib/proxy/proxify';

/**
 * @class
 * @description Softphone module to call softphone
 */
@Module({
  deps: ['Brand', { dep: 'SoftphoneOptions', optional: true }]
})
export default class Softphone extends RcModule {
  /**
   * @constructor
   * @param {Object} params - params object
   * @param {Brnad} params.brand - brand module instance
   * @param {Bool} params.extensionMode - default false
   */
  constructor({
    brand,
    extensionMode = false,
    ...options
  }) {
    super({
      ...options,
    });
    this._brand = brand;
    this._extensionMode = extensionMode;
  }

  get _actionTypes() {
    /* no action types */
    return null;
  }

  _onStateChange() {
    /* do nothing */
  }

  get protocol() {
    switch (this._brand.id) {
      case '3420': // ATT
        return 'attvr20';
      case '7710': // BT
        return 'rcbtmobile';
      case '7310': // TELUS
        return 'rctelus';
      default:
        return 'rcmobile';
    }
  }

  @proxify
  async makeCall(phoneNumber) {
    // TODO use window.open in extension background, this method will crash chrome when
    // executed in background page.
    const uri = `${this.protocol}://call?number=${encodeURIComponent(phoneNumber)}`;
    if (this._extensionMode) {
      window.open(uri);
    } else {
      const frame = document.createElement('iframe');
      frame.style.display = 'none';

      document.body.appendChild(frame);
      await sleep(100);
      frame.contentWindow.location.href = uri;
      await sleep(300);
      document.body.removeChild(frame);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  get status() {
    return moduleStatuses.ready;
  }
}
