import RcModule from '../../lib/RcModule';
import moduleStatus from '../../enums/moduleStatus';
import sleep from '../../lib/sleep';

export default class Softphone extends RcModule {
  constructor({
    brand,
    ...options
  }) {
    super({
      ...options,
    });
    this._brand = brand;
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
  async makeCall(phoneNumber) {
    const frame = document.createElement('iframe');
    frame.style.display = 'none';

    const uri = `${this.protocol}://call?number=${encodeURIComponent(phoneNumber)}`;

    document.body.appendChild(frame);
    await sleep(100);
    frame.contentWindow.location.href = uri;
    await sleep(300);
    document.body.removeChild(frame);
  }

  // eslint-disable-next-line class-methods-use-this
  get status() {
    return moduleStatus.ready;
  }

  // eslint-disable-next-line class-methods-use-this
  get ready() {
    return true;
  }

}
