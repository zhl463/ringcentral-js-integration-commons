import RingCentralWebphone from 'ringcentral-web-phone';
import incomingAudio from 'ringcentral-web-phone/audio/incoming.ogg';
import outgoingAudio from 'ringcentral-web-phone/audio/outgoing.ogg';

import RcModule from '../../lib/RcModule';
import sleep from '../../lib/sleep';
import moduleStatus from '../../enums/moduleStatus';
import connectionStatus from './connectionStatus';
import actionTypes from './actionTypes';
import webphoneErrors from './webphoneErrors';

import { isBrowerSupport } from './webphoneHelper';
import getWebphoneReducer, { getWebphoneCountsReducer } from './getWebphoneReducer';

const FIRST_THREE_RETRIES_DELAY = 10 * 1000;
const FOURTH_RETRIES_DELAY = 30 * 1000;
const FIFTH_RETRIES_DELAY = 60 * 1000;
const MAX_RETRIES_DELAY = 2 * 60 * 1000;

export default class Webphone extends RcModule {
  constructor({
    appKey,
    appName,
    appVersion,
    alert,
    auth,
    client,
    rolesAndPermissions,
    webphoneLogLevel = 3,
    storage,
    ...options,
  }) {
    super({
      ...options,
      actionTypes,
    });
    this._appKey = appKey;
    this._appName = appName;
    this._appVersion = appVersion;
    this._alert = alert;
    this._webphoneLogLevel = webphoneLogLevel;
    this._auth = auth;
    this._client = client;
    this._rolesAndPermissions = rolesAndPermissions;
    this._storage = storage;
    this._storageWebphoneCountsKey = 'webphoneCounts';
    this._webphone = null;
    this._remoteVideo = null;
    this._localVideo = null;

    this._activeSession = null;
    this._sessions = new Map();

    this._reducer = getWebphoneReducer(this.actionTypes);

    storage.registerReducer({
      key: this._storageWebphoneCountsKey,
      reducer: getWebphoneCountsReducer(this.actionTypes),
    });
  }

  initialize() {
    if (
      typeof window !== 'undefined' &&
      typeof document !== 'undefined'
    ) {
      this._remoteVideo = document.createElement('video');
      this._remoteVideo.setAttribute('hidden', 'hidden');
      this._localVideo = document.createElement('video');
      this._localVideo.setAttribute('hidden', 'hidden');
      this._localVideo.setAttribute('muted', 'muted');
      document.body.appendChild(this._remoteVideo);
      document.body.appendChild(this._localVideo);
      window.onbeforeunload = () => {
        this.disconnect().then(() => {
          console.log('closed webrtc');
        });
      };
      this.store.dispatch({
        type: this.actionTypes.init,
        videoElementPrepared: true,
      });
    } else {
      this.store.dispatch({
        type: this.actionTypes.init,
        videoElementPrepared: false,
      });
    }
    this.store.subscribe(() => this._onStateChange());
  }

  _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
    } else if (this._shouldReset()) {
      this.store.dispatch({
        type: this.actionTypes.resetSuccess,
      });
      this.disconnect();
    }
  }

  _shouldInit() {
    return (
      this._auth.loggedIn &&
      this._rolesAndPermissions.ready &&
      !this.ready
    );
  }

  _shouldReset() {
    return (
      (
        !this._auth.loggedIn ||
        !this._rolesAndPermissions.ready
      ) &&
      this.ready
    );
  }

  async _sipProvision() {
    try {
      const response = await this._client.service.platform()
        .post('/client-info/sip-provision', {
          sipInfo: [{ transport: 'WSS' }]
        });
      return response.json();
    } catch (error) {
      console.error(error);
      throw new Error(webphoneErrors.getSipProvisionError);
    }
  }

  _createWebphone(provisionData) {
    this._webphone = new RingCentralWebphone(provisionData, {
      appKey: this._appKey,
      appName: this._appName,
      appVersion: this._appVersion,
      uuid: this._auth.endpoingId,
      logLevel: this._webphoneLogLevel, // error 0, warn 1, log: 2, debug: 3
      audioHelper: {
        enabled: true, // enables audio feedback when web phone is ringing or making a call
        incoming: incomingAudio, // path to audio file for incoming call
        outgoing: outgoingAudio, // path to aduotfile for outgoing call
      }
    });

    const onRegistered = () => {
      this.store.dispatch({
        type: this.actionTypes.registered,
      });
    };
    const onUnregistered = () => {
      this.store.dispatch({
        type: this.actionTypes.unregistered,
      });
      this._webphone.userAgent.removeAllListeners();
      this._webphone = null;
    };
    const onRegistrationFailed = (error) => {
      this.store.dispatch({
        type: this.actionTypes.registrationFailed,
        error,
      });
      this._webphone.userAgent.removeAllListeners();
      this._connect(true);
    };
    this._webphone.userAgent.audioHelper.setVolume(0.3);
    this._webphone.userAgent.on('registered', onRegistered);
    this._webphone.userAgent.on('unregistered', onUnregistered);
    this._webphone.userAgent.once('registrationFailed', onRegistrationFailed);
    this._webphone.userAgent.on('invite', (session) => {
      console.log('UA invite');
      this._onInvite(session);
    });
  }

  async _connect(reconnect = false) {
    try {
      if (reconnect) {
        await this._retrySleep();
      }

      // do not connect if it is connecting
      if (this.connectionStatus === connectionStatus.connecting) {
        return;
      }

      // when reconnect is break by disconnect
      if (reconnect && this.connectionStatus !== connectionStatus.connectFailed) {
        this.store.dispatch({
          type: this.actionTypes.resetRetryCounts,
        });
        return;
      }

      this.store.dispatch({
        type: (
          reconnect ?
            this.actionTypes.reconnect : this.actionTypes.connect
        )
      });

      const sipProvision = await this._sipProvision();

      // do not continue if it is disconnecting
      if (this.connectionStatus === connectionStatus.disconnecting) {
        return;
      }
      this._createWebphone(sipProvision);
    } catch (error) {
      this.store.dispatch({
        type: this.actionTypes.connectError,
        error,
      });
      this._alert.warning({
        message: webphoneErrors.connectFailed,
        ttl: 0,
        allowDuplicates: false,
      });
      await this._connect(true);
    }
  }

  async connect(hasFromNumber) {
    if (
      (await this._auth.checkIsLoggedIn()) &&
      this.enabled &&
      this.connectionStatus === connectionStatus.disconnected
    ) {
      if (!isBrowerSupport()) {
        this._alert.warning({
          message: webphoneErrors.browserNotSupported,
          ttl: 0,
        });
        return;
      }
      if (this.webphoneCounts >= 5) {
        this._alert.warning({
          message: webphoneErrors.webphoneCountOverLimit,
        });
        return;
      }
      if (!hasFromNumber) {
        this._alert.warning({
          message: webphoneErrors.notOutboundCallWithoutDL,
        });
        return;
      }
      await this._connect();
    }
  }

  async disconnect() {
    if (
      this.connectionStatus === connectionStatus.connected ||
      this.connectionStatus === connectionStatus.connecting ||
      this.connectionStatus === connectionStatus.connectFailed
    ) {
      this.store.dispatch({
        type: this.actionTypes.disconnect,
      });
      if (this._webphone) {
        this._webphone.userAgent.stop();
        this._webphone.userAgent.unregister();
        this._sessions.forEach((session) => {
          this.hangup(session);
        });
      }
    }
  }

  _onAccepted(session) {
    session.on('accepted', () => {
      console.log('accepted');
    });
    session.on('progress', () => {
      console.log('progress...');
    });
    session.on('rejected', () => {
      console.log('rejected');
      this._removeSession(session);
    });
    session.on('failed', (response, cause) => {
      console.log('Event: Failed');
      console.log(cause);
      this._removeSession(session);
    });
    session.on('terminated', () => {
      console.log('Event: Failed');
      this._removeSession(session);
    });
    session.on('cancel', () => {
      console.log('Event: Cancel');
      this._removeSession(session);
    });
    session.on('refer', () => {
      console.log('Event: Refer');
    });
    session.on('replaced', (newSession) => {
      this.onAccepted(newSession);
    });
    session.on('muted', () => {
      console.log('Event: Muted');
    });
    session.on('unmuted', () => {
      console.log('Event: Unmuted');
    });
    session.on('hold', () => {
      console.log('Event: hold');
    });
    session.on('unhold', () => {
      console.log('Event: unhold');
    });
  }

  _onInvite(session) {
    if (!this._activeSession) {
      this._activeSession = session;
      this.store.dispatch({
        type: this.actionTypes.updateSession,
      });
    }

    this._addSession(session);
    session.on('rejected', () => {
      console.log('Event: Rejected');
      this._removeSession(session);
    });
  }

  async answer(session) {
    try {
      if (this._activeSession && !this._activeSession.isOnHold().local) {
        this._activeSession.hold();
      }
      this._setActiveSession(session);
      this._onAccepted(session, 'inbound');
      await session.accept(this.acceptOptions);
    } catch (e) {
      console.log('Accept failed');
      this._removeSession(session);
      this._removeActiveSession();
    }
  }

  reject(session) {
    session.reject();
  }

  async forward(forwardNumber, session) {
    try {
      await session.forward(forwardNumber, this.acceptOptions);
      console.log('Forwarded');
    } catch (e) {
      console.error(e);
    }
  }

  increaseVolume(session) {
    session.ua.audioHelper.setVolume(
      (session.ua.audioHelper.volume != null ? session.ua.audioHelper.volume : 0.5) + 0.1
    );
  }

  decreaseVolume(session) {
    session.ua.audioHelper.setVolume(
      (session.ua.audioHelper.volume != null ? session.ua.audioHelper.volume : 0.5) - 0.1
    );
  }

  mute(session) {
    session.isOnMute = true;
    session.mute();
  }

  unmute(session) {
    session.isOnMute = false;
    session.unmute();
  }

  hold(session) {
    session.hold();
    this._cleanActiveSession(session);
  }

  unhold(session) {
    session.unhold();
    this.sessions.forEach((sessionItem, sessionId) => {
      if (session.id !== sessionId) {
        if (!session.isOnHold().local) {
          sessionItem.hold();
        }
      }
    });
    this._setActiveSession(session);
  }

  async startRecord(session) {
    try {
      await session.startRecord();
      session.isOnRecord = true;
      console.log('Recording Started');
    } catch (e) {
      session.isOnRecord = false;
      console.error(e);
    }
  }

  async stopRecord(session) {
    try {
      await session.stopRecord();
      session.isOnRecord = false;
      console.log('Recording Stopped');
    } catch (e) {
      session.isOnRecord = true;
      console.error(e);
    }
  }

  async park(session) {
    try {
      await session.park();
      console.log('Parked');
    } catch (e) {
      console.error(e);
    }
  }

  async transfer(transferNumber, session) {
    try {
      await session.transfer(transferNumber);
      console.log('Transferred');
    } catch (e) {
      console.error(e);
    }
  }

  async transferWarm(transferNumber, session) {
    try {
      await session.hold();
      const newSession = session.ua.invite(transferNumber, {
        media: this.acceptOptions.media
      });
      newSession.once('accepted', async () => {
        try {
          await session.warmTransfer(newSession);
          console.log('Transferred');
        } catch (e) {
          console.error(e);
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  async flip(flipValue, session) {
    try {
      await session.flip(flipValue);
      console.log('Flipped');
    } catch (e) {
      console.error(e);
    }
  }

  sendDTMF(dtmfValue, session) {
    session.dtmf(dtmfValue);
  }

  hangup(session) {
    try {
      session.terminate();
    } catch (e) {
      console.log(e);
    }
    this._removeSession(session);
  }

  makeCall({ toNumber, fromNumber, homeCountryId }) {
    const session = this._webphone.userAgent.invite(toNumber, {
      media: this.acceptOptions.media,
      fromNumber,
      homeCountryId,
    });
    this._onAccepted(session);
    if (this._activeSession && !this._activeSession.isOnHold().local) {
      this._activeSession.hold();
    }
    this._addSession(session);
    this._setActiveSession(session);
    return session;
  }

  _addSession(session) {
    this._sessions.set(session.id, session);
  }

  _removeSession(session) {
    this._cleanActiveSession(session);
    this._sessions.delete(session.id);
  }

  _setActiveSession(session) {
    this._activeSession = session;
    this.store.dispatch({
      type: this.actionTypes.updateSession,
    });
  }

  _removeActiveSession() {
    this._activeSession = null;
    this.store.dispatch({
      type: this.actionTypes.destroySession,
    });
  }

  _cleanActiveSession(session) {
    if (session !== this._activeSession) {
      return;
    }
    this._removeActiveSession();
  }

  async _retrySleep() {
    if (this.connectRetryCounts < 3) {
      await sleep(FIRST_THREE_RETRIES_DELAY);
    }
    if (this.connectRetryCounts === 3) {
      await sleep(FOURTH_RETRIES_DELAY);
    }
    if (this.connectRetryCounts === 4) {
      await sleep(FIFTH_RETRIES_DELAY); // sleep 30 seconds
    }
    if (this.connectRetryCounts > 4) {
      await sleep(MAX_RETRIES_DELAY); // sleep 30 seconds
    }
  }

  get status() {
    return this.state.status;
  }

  get activeSession() {
    return this._activeSession;
  }

  get ready() {
    return this.state.status === moduleStatus.ready;
  }

  get videoElementPrepared() {
    return this.state.videoElementPrepared;
  }

  get enabled() {
    return this.videoElementPrepared && this._rolesAndPermissions.webphoneEnabled;
  }

  get connectionStatus() {
    return this.state.connectionStatus;
  }

  get webphoneCounts() {
    return this._storage.getItem(this._storageWebphoneCountsKey);
  }

  get connectRetryCounts() {
    return this.state.connectRetryCounts;
  }

  get acceptOptions() {
    return {
      media: {
        render: {
          remote: this._remoteVideo,
          local: this._localVideo,
        }
      }
    };
  }
}
