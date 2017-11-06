import r from 'ramda';
import RcModule from '../../lib/RcModule';
import proxify from '../../lib/proxy/proxify';
import { Module } from '../../lib/di';
import ensureExist from '../../lib/ensureExist';
import actionTypes from './actionTypes';
import getAudioSettingsReducer from './getAudioSettingsReducer';
import getStorageReducer from './getStorageReducer';
import audioSettingsErrors from './audioSettingsErrors';

/**
 * @class
 * @description AudioSettings module.
 */
@Module({
  deps: [
    'Alert',
    'Storage',
  ],
})
export default class AudioSettings extends RcModule {
  constructor({
    storage,
    alert,
    ...options
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._storage = this::ensureExist(storage, 'storage');
    this._alert = this::ensureExist(alert, 'alert');
    this._storageKey = 'audioSettings';
    this._storage.registerReducer({
      key: this._storageKey,
      reducer: getStorageReducer(this.actionTypes),
    });
    this._reducer = getAudioSettingsReducer(this.actionTypes);

    this.addSelector('availableOutputDevices',
      () => this.state.availableDevices,
      devices => r.filter(device => device.kind === 'audiooutput', devices),
    );
    this.addSelector('availableInputDevices',
      () => this.state.availableDevices,
      devices => r.filter(device => device.kind === 'audioinput', devices),
    );
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
    if (
      navigator &&
      navigator.mediaDevices &&
      navigator.mediaDevices.addEventListener
    ) {
      navigator.mediaDevices.addEventListener('devicechange', () => {
        this._checkDevices();
      });
    }
  }
  _shouldInit() {
    return !!(
      this.pending &&
      this._storage.ready
    );
  }
  _shouldReset() {
    return !!(
      this.ready &&
      !this._storage.ready
    );
  }
  async _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
      if (this.supportDevices) {
        await this._checkDevices();
      }
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
    } else if (this._shouldReset()) {
      this.store.dispatch({
        type: this.actionTypes.reset,
      });
      this.store.dispatch({
        type: this.actionTypes.resetSuccess,
      });
    }
  }

  async _checkDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.store.dispatch({
      type: this.actionTypes.setAvailableDevices,
      devices,
    });
  }

  getUserMedia() {
    return new Promise((resolve) => {
      navigator.getUserMedia = navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia;
      if (navigator.getUserMedia) {
        navigator.getUserMedia({
          audio: true,
        }, (stream) => {
          this._onGetUserMediaSuccess();
          if (typeof stream.stop === 'function') {
            stream.stop();
          } else {
            stream.getTracks().forEach((track) => {
              track.stop();
            });
          }
          resolve();
        }, (error) => {
          this._onGetUserMediaError(error);
          resolve();
        });
      }
    });
  }

  @proxify
  async _onGetUserMediaSuccess() {
    const userMediaAlert = r.find(
      item => item.message === audioSettingsErrors.userMediaPermission,
      this._alert.messages,
    );
    if (userMediaAlert) {
      this._alert.dismiss(userMediaAlert.id);
    }
    this.store.dispatch({
      type: this.actionTypes.getUserMediaSuccess,
    });
    this._checkDevices();
  }

  @proxify
  async _onGetUserMediaError(error) {
    this.store.dispatch({
      type: this.actionTypes.getUserMediaError,
      error,
    });
    this._alert.danger({
      message: audioSettingsErrors.userMediaPermission,
      ttl: 0,
      allowDuplicates: false,
    });
  }

  @proxify
  async showAlert() {
    if (!this.userMedia) {
      this._alert.danger({
        message: audioSettingsErrors.userMediaPermission,
        ttl: 0,
        allowDuplicates: false,
      });
    }
  }

  @proxify
  async setData({
    dialButtonVolume = this.dialButtonVolume,
    dialButtonMuted = this.dialButtonMuted,
    ringtoneVolume = this.ringtoneVolume,
    ringtoneMuted = this.ringtoneMuted,
    callVolume = this.callVolume,
    outputDeviceId = this.outputDeviceId,
    inputDeviceId = this.inputDeviceId,
  }) {
    this.store.dispatch({
      type: this.actionTypes.setData,
      dialButtonVolume,
      dialButtonMuted,
      ringtoneVolume,
      ringtoneMuted,
      callVolume,
      outputDeviceId,
      inputDeviceId,
    });
  }

  get outputDeviceId() {
    return this._storage.getItem(this._storageKey).outputDeviceId;
  }
  get outputDevice() {
    return r.find(device => (
      device.kind === 'audiooutput' &&
      device.deviceId === this.outputDeviceId
    ), this.availableDevices);
  }
  get inputDeviceId() {
    return this._storage.getItem(this._storageKey).inputDeviceId;
  }
  get inputDevice() {
    return r.find(device => (
      device.kind === 'audioinput' &&
      device.deviceId === this.inputDeviceId
    ), this.availableDevices);
  }
  get supportDevices() {
    return !!(
      HTMLMediaElement.prototype.setSinkId &&
      navigator.mediaDevices &&
      navigator.mediaDevices.enumerateDevices
    );
  }
  get availableDevices() {
    return this.state.availableDevices;
  }
  get availableOutputDevices() {
    return this._selectors.availableOutputDevices();
  }
  get availableInputDevices() {
    return this._selectors.availableInputDevices();
  }
  get dialButtonVolume() {
    return this._storage.getItem(this._storageKey).dialButtonVolume;
  }
  get dialButtonMuted() {
    return this._storage.getItem(this._storageKey).dialButtonMuted;
  }
  get ringtoneVolume() {
    return this._storage.getItem(this._storageKey).ringtoneVolume;
  }
  get ringtoneMuted() {
    return this._storage.getItem(this._storageKey).ringtoneMuted;
  }
  get callVolume() {
    return this._storage.getItem(this._storageKey).callVolume;
  }

  get userMedia() {
    // this detection method may not work in the future
    // currently there is no good way to detect this
    return !!(
      this.availableDevices.length &&
      this.availableDevices[0].label !== ''
    );
  }

  get status() {
    return this.state.status;
  }
}
