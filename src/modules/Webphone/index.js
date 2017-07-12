import RingCentralWebphone from 'ringcentral-web-phone';
import incomingAudio from 'ringcentral-web-phone/audio/incoming.ogg';
import outgoingAudio from 'ringcentral-web-phone/audio/outgoing.ogg';

import RcModule from '../../lib/RcModule';
import sleep from '../../lib/sleep';
import moduleStatuses from '../../enums/moduleStatuses';
import connectionStatus from './connectionStatus';
import sessionStatus from './sessionStatus';
import actionTypes from './actionTypes';
import callDirections from '../../enums/callDirections';
import webphoneErrors from './webphoneErrors';
import callErrors from '../Call/callErrors';
import ensureExist from '../../lib/ensureExist';
import proxify from '../../lib/proxy/proxify';
import {
  isBrowerSupport,
  patchUserAgent,
  patchIncomingSession,
  normalizeSession,
} from './webphoneHelper';
import getWebphoneReducer, {
  getWebphoneCountsReducer,
  getUserMediaReducer,
} from './getWebphoneReducer';

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
    globalStorage,
    contactMatcher,
    extensionDevice,
    numberValidate,
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
    this._auth = this::ensureExist(auth, 'auth');
    this._client = this::ensureExist(client, 'client');
    this._rolesAndPermissions = this::ensureExist(rolesAndPermissions, 'rolesAndPermissions');
    this._extensionDevice = this::ensureExist(extensionDevice, 'extensionDevice');
    this._storage = this::ensureExist(storage, 'storage');
    this._globalStorage = this::ensureExist(globalStorage, 'globalStorage');
    this._numberValidate = this::ensureExist(numberValidate, 'numberValidate');
    this._storageWebphoneCountsKey = 'webphoneCounts';
    this._userMediaStorageKey = 'userMadia';
    this._contactMatcher = contactMatcher;
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
    globalStorage.registerReducer({
      key: this._userMediaStorageKey,
      reducer: getUserMediaReducer(this.actionTypes),
    });


    this.addSelector('sessionPhoneNumbers',
      () => this.sessions,
      (sessions) => {
        const outputs = [];
        sessions.forEach((session) => {
          outputs.push(session.to);
          outputs.push(session.from);
        });
        return outputs;
      }
    );

    if (this._contactMatcher) {
      this._contactMatcher.addQuerySource({
        getQueriesFn: this._selectors.sessionPhoneNumbers,
        readyCheckFn: () => (
          this.ready
        ),
      });
    }
  }

  _prepareVideoElement() {
    this._remoteVideo = document.createElement('video');
    this._remoteVideo.setAttribute('hidden', 'hidden');
    this._localVideo = document.createElement('video');
    this._localVideo.setAttribute('hidden', 'hidden');
    this._localVideo.setAttribute('muted', 'muted');
    document.body.appendChild(this._remoteVideo);
    document.body.appendChild(this._localVideo);

    this.store.dispatch({
      type: this.actionTypes.videoElementPrepared,
    });
  }
  initialize() {
    if (
      typeof window !== 'undefined' &&
      typeof document !== 'undefined'
    ) {
      if (document.readyState === 'loading') {
        window.addEventListener('load', () => {
          this._prepareVideoElement();
        });
      } else {
        this._prepareVideoElement();
      }
      window.addEventListener('unload', () => {
        this._disconnect();
      });
    }
    this.store.subscribe(() => this._onStateChange());
  }
  initializeProxy() {
    if (
      !this.userMedia
    ) {
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
        }, (error) => {
          this._onGetUserMediaError(error);
        });
      }
    }
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
      this._extensionDevice.ready &&
      this._storage.ready &&
      this._globalStorage.ready &&
      this._numberValidate.ready &&
      !this.ready
    );
  }

  _shouldReset() {
    return (
      (
        !this._auth.loggedIn ||
        !this._rolesAndPermissions.ready ||
        !this._storage.ready ||
        !this._globalStorage.ready ||
        !this._numberValidate.ready ||
        !this._extensionDevice.ready
      ) &&
      this.ready
    );
  }

  @proxify
  async _sipProvision() {
    const response = await this._client.service.platform()
      .post('/client-info/sip-provision', {
        sipInfo: [{ transport: 'WSS' }]
      });
    return response.json();
  }

  async _fetchDL() {
    const response = await this._client.account().extension().device().list();
    const devices = response.records;
    let phoneLines = [];
    devices.forEach((device) => {
      if (!device.phoneLines || device.phoneLines.length === 0) {
        return;
      }
      phoneLines = phoneLines.concat(device.phoneLines);
    });
    return phoneLines;
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
    };
    const onRegistrationFailed = (error) => {
      let needToReconnect = true;
      let errorCode;
      console.error(error);
      this._webphone.userAgent.removeAllListeners();
      this._webphone = null;
      if (error && error.status_code === 503) {
        errorCode = webphoneErrors.webphoneCountOverLimit;
        this._alert.warning({
          message: errorCode,
        });
        needToReconnect = false;
      }
      this.store.dispatch({
        type: this.actionTypes.registrationFailed,
        errorCode,
      });
      if (needToReconnect) {
        this._connect(needToReconnect);
      }
    };
    this._webphone.userAgent.audioHelper.setVolume(0.3);
    this._webphone.userAgent.on('registered', onRegistered);
    this._webphone.userAgent.on('unregistered', onUnregistered);
    this._webphone.userAgent.once('registrationFailed', onRegistrationFailed);
    this._webphone.userAgent.on('invite', (session) => {
      console.debug('UA invite');
      this._onInvite(session);
    });
    patchUserAgent(this._webphone.userAgent);
  }

  @proxify
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
      if (this.disconnecting) {
        return;
      }
      this._createWebphone(sipProvision);
    } catch (error) {
      console.error(error);
      this._alert.warning({
        message: webphoneErrors.connectFailed,
        ttl: 0,
        allowDuplicates: false,
      });
      let needToReconnect = true;
      let errorCode;
      if (
        error && error.message &&
        (error.message.indexOf('Feature [WebPhone] is not available') > -1)
      ) {
        this._rolesAndPermissions.refreshServiceFeatures();
        needToReconnect = false;
        errorCode = webphoneErrors.notWebphonePermission;
        return;
      }
      this.store.dispatch({
        type: this.actionTypes.connectError,
        errorCode,
        error,
      });
      if (needToReconnect) {
        await this._connect(needToReconnect);
      }
    }
  }
  @proxify
  async connect() {
    if (
      (await this._auth.checkIsLoggedIn()) &&
      this.enabled &&
      this.connectionStatus === connectionStatus.disconnected
    ) {
      if (!isBrowerSupport()) {
        this.store.dispatch({
          type: this.actionTypes.connectError,
          errorCode: webphoneErrors.browserNotSupported,
        });
        this._alert.warning({
          message: webphoneErrors.browserNotSupported,
          ttl: 0,
        });
        return;
      }
      try {
        const phoneLines = await this._fetchDL();
        if (phoneLines.length === 0) {
          this.store.dispatch({
            type: this.actionTypes.connectError,
            errorCode: webphoneErrors.notOutboundCallWithoutDL,
          });
          this._alert.warning({
            message: webphoneErrors.notOutboundCallWithoutDL,
          });
        }
      } catch (error) {
        console.log(error);
        this.store.dispatch({
          type: this.actionTypes.connectError,
          errorCode: webphoneErrors.checkDLError,
        });
        this._alert.warning({
          message: webphoneErrors.checkDLError,
        });
      }
      await this._connect();
    }
  }
  _disconnect() {
    if (
      this.connectionStatus === connectionStatus.connected ||
      this.connectionStatus === connectionStatus.connecting ||
      this.connectionStatus === connectionStatus.connectFailed
    ) {
      this.store.dispatch({
        type: this.actionTypes.disconnect,
      });
      if (this._webphone) {
        this._sessions.forEach((session) => {
          this.hangup(session);
        });
        if (this._webphone.userAgent) {
          this._webphone.userAgent.stop();
          this._webphone.userAgent.unregister();
        }
        this._webphone = null;
        this._activeSession = null;
        this._sessions = new Map();
        this._removeActiveSession();
        this._updateSessions();
      }
      this.store.dispatch({
        type: this.actionTypes.unregistered,
      });
    }
  }
  @proxify
  async disconnect() {
    this._disconnect();
  }

  _onNewCall() {
    if (this._contactMatcher) {
      this._contactMatcher.triggerMatch();
    }
  }

  _onAccepted(session) {
    session.on('accepted', () => {
      console.log('accepted');
      session.callStatus = sessionStatus.connected;
      this._updateCurrentSessionAndSessions(session);
    });
    session.on('progress', () => {
      console.log('progress...');
      session.callStatus = sessionStatus.connecting;
      this._updateCurrentSessionAndSessions(session);
    });
    session.on('rejected', () => {
      console.log('rejected');
      session.callStatus = sessionStatus.finished;
      this._removeSession(session);
    });
    session.on('failed', (response, cause) => {
      console.log('Event: Failed');
      console.log(cause);
      session.callStatus = sessionStatus.finished;
      this._removeSession(session);
    });
    session.on('terminated', () => {
      console.log('Event: Terminated');
      session.callStatus = sessionStatus.finished;
      this._removeSession(session);
    });
    session.on('cancel', () => {
      console.log('Event: Cancel');
      session.callStatus = sessionStatus.finished;
      this._removeSession(session);
    });
    session.on('refer', () => {
      console.log('Event: Refer');
    });
    session.on('replaced', (newSession) => {
      session.callStatus = sessionStatus.replaced;
      newSession.callStatus = sessionStatus.connected;
      newSession.direction = callDirections.inbound;
      this._addSession(newSession);
      this.onAccepted(newSession);
    });
    session.on('muted', () => {
      console.log('Event: Muted');
      session.isOnMute = true;
      session.callStatus = sessionStatus.onMute;
    });
    session.on('unmuted', () => {
      console.log('Event: Unmuted');
      session.isOnMute = false;
      session.callStatus = sessionStatus.connected;
    });
    session.on('hold', () => {
      console.log('Event: hold');
      session.callStatus = sessionStatus.onHold;
    });
    session.on('unhold', () => {
      console.log('Event: unhold');
      session.callStatus = sessionStatus.connected;
    });
  }

  _onInvite(session) {
    session.creationTime = Date.now();
    session.direction = callDirections.inbound;
    session.callStatus = sessionStatus.connecting;
    if (!this._activeSession) {
      this._activeSession = session;
      this._resetMinimized();
      this.store.dispatch({
        type: this.actionTypes.updateCurrentSession,
        session: normalizeSession(session),
      });
    }
    patchIncomingSession(session);
    this._addSession(session);
    session.on('rejected', () => {
      console.log('Event: Rejected');
      this._removeSession(session);
    });
    this._onNewCall();
  }

  @proxify
  async answer(sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session) {
      return;
    }
    try {
      if (
        this._activeSession && !this._activeSession.isOnHold().local &&
        this._activeSession !== session
      ) {
        this._activeSession.hold();
      }
      this._setActiveSession(session);
      this._onAccepted(session, 'inbound');
      await session.accept(this.acceptOptions);
      this._resetMinimized();
    } catch (e) {
      console.log('Accept failed');
      this._removeSession(session);
      this._removeActiveSession();
    }
  }
  @proxify
  async reject(sessionId) {
    this._sessionHandleWithId(sessionId, (session) => {
      session.reject();
    });
  }
  @proxify
  async resume(sessionId) {
    this.unhold(sessionId);
    this._resetMinimized();
  }
  @proxify
  async forward(sessionId, forwardNumber) {
    const session = this._sessions.get(sessionId);
    if (!session) {
      return false;
    }
    try {
      const validatedResult
        = await this._numberValidate.validateNumbers([forwardNumber]);
      if (!validatedResult.result) {
        validatedResult.errors.forEach((error) => {
          this._alert.warning({
            message: callErrors[error.type]
          });
        });
        return false;
      }
      await session.forward(forwardNumber, this.acceptOptions);
      console.log('Forwarded');
      this._removeSession(session);
      return true;
    } catch (e) {
      console.error(e);
      this._alert.warning({
        message: webphoneErrors.forwardError
      });
      return false;
    }
  }

  @proxify
  async increaseVolume(sessionId) {
    this._sessionHandleWithId(sessionId, (session) => {
      session.ua.audioHelper.setVolume(
        (session.ua.audioHelper.volume != null ? session.ua.audioHelper.volume : 0.5) + 0.1
      );
    });
  }
  @proxify
  async decreaseVolume(sessionId) {
    this._sessionHandleWithId(sessionId, (session) => {
      session.ua.audioHelper.setVolume(
        (session.ua.audioHelper.volume != null ? session.ua.audioHelper.volume : 0.5) - 0.1
      );
    });
  }
  @proxify
  async mute(sessionId) {
    this._sessionHandleWithId(sessionId, (session) => {
      session.isOnMute = true;
      session.mute();
      this._updateCurrentSessionAndSessions(session);
    });
  }
  @proxify
  async unmute(sessionId) {
    this._sessionHandleWithId(sessionId, (session) => {
      session.isOnMute = false;
      session.unmute();
      this._updateCurrentSessionAndSessions(session);
    });
  }

  @proxify
  async hold(sessionId) {
    this._sessionHandleWithId(sessionId, (session) => {
      session.hold();
      this._updateCurrentSessionAndSessions(session);
    });
  }

  @proxify
  async unhold(sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session) {
      return;
    }
    if (session.isOnHold().local) {
      session.unhold();
    }
    this._sessions.forEach((sessionItem, sessionItemId) => {
      if (session.id !== sessionItemId) {
        if (!sessionItem.isOnHold().local) {
          sessionItem.hold();
        }
      }
    });
    this._setActiveSession(session);
    this._updateCurrentSessionAndSessions(session);
  }

  @proxify
  async startRecord(sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session) {
      return;
    }
    try {
      await session.startRecord();
      session.isOnRecord = true;
      console.log('Recording Started');
    } catch (e) {
      session.isOnRecord = false;
      console.error(e);
    }
    this._updateCurrentSessionAndSessions(session);
  }

  @proxify
  async stopRecord(sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session) {
      return;
    }
    try {
      await session.stopRecord();
      session.isOnRecord = false;
      console.log('Recording Stopped');
    } catch (e) {
      session.isOnRecord = true;
      console.error(e);
    }
    this._updateCurrentSessionAndSessions(session);
  }

  @proxify
  async park(sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session) {
      return;
    }
    try {
      await session.park();
      console.log('Parked');
    } catch (e) {
      console.error(e);
    }
  }

  @proxify
  async transfer(transferNumber, sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session) {
      return;
    }
    try {
      await session.transfer(transferNumber);
      console.log('Transferred');
    } catch (e) {
      console.error(e);
    }
  }

  @proxify
  async transferWarm(transferNumber, sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session) {
      return;
    }
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

  @proxify
  async flip(flipValue, sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session) {
      return;
    }
    try {
      await session.flip(flipValue);
      console.log('Flipped');
    } catch (e) {
      console.error(e);
    }
  }

  @proxify
  async sendDTMF(dtmfValue, sessionId) {
    this._sessionHandleWithId(sessionId, (session) => {
      try {
        session.dtmf(dtmfValue);
      } catch (e) {
        console.error(e);
      }
    });
  }

  @proxify
  async hangup(sessionId) {
    this._sessionHandleWithId(sessionId, (session) => {
      try {
        session.terminate();
      } catch (e) {
        console.error(e);
        this._removeSession(session);
      }
    });
  }

  @proxify
  async toVoiceMail(sessionId) {
    this._sessionHandleWithId(sessionId, (session) => {
      try {
        session.toVoiceMail();
      } catch (e) {
        console.error(e);
        // this._removeSession(session);
        this._alert.warning({
          message: webphoneErrors.toVoiceMailError
        });
      }
    });
  }

  @proxify
  async replyWithMessage(sessionId, replyOptions) {
    this._sessionHandleWithId(sessionId, (session) => {
      try {
        session.replyWithMessage(replyOptions);
      } catch (e) {
        console.error(e);
        this._removeSession(session);
      }
    });
  }

  _sessionHandleWithId(sessionId, func) {
    const session = this._sessions.get(sessionId);
    if (!session) {
      return null;
    }
    return func(session);
  }

  @proxify
  async makeCall({ toNumber, fromNumber, homeCountryId }) {
    if (!this._webphone) {
      this._alert.warning({
        message: this.errorCode,
      });
      return;
    }
    const phoneLines = await this._fetchDL();
    if (phoneLines.length === 0) {
      this._alert.warning({
        message: webphoneErrors.notOutboundCallWithoutDL,
      });
      return;
    }
    const session = this._webphone.userAgent.invite(toNumber, {
      media: this.acceptOptions.media,
      fromNumber,
      homeCountryId,
    });
    session.direction = callDirections.outbound;
    session.callStatus = sessionStatus.connecting;
    session.creationTime = Date.now();
    this._onAccepted(session);
    if (this._activeSession && !this._activeSession.isOnHold().local) {
      this._activeSession.hold();
    }
    this._addSession(session);
    this._setActiveSession(session);
    this._resetMinimized();
    this._onNewCall();
    return session;
  }

  _addSession(session) {
    this._sessions.set(session.id, session);
    this.store.dispatch({
      type: this.actionTypes.updateSessions,
      sessions: [...this._sessions.values()].map(normalizeSession),
    });
  }

  _removeSession(session) {
    this._cleanActiveSession(session);
    this._sessions.delete(session.id);
    this.store.dispatch({
      type: this.actionTypes.updateSessions,
      sessions: [...this._sessions.values()].map(normalizeSession),
    });
  }

  _setActiveSession(session) {
    this._activeSession = session;
    this.store.dispatch({
      type: this.actionTypes.updateCurrentSession,
      session: normalizeSession(session),
    });
  }

  _removeActiveSession() {
    this._activeSession = null;
    this.store.dispatch({
      type: this.actionTypes.destroyCurrentSession,
    });
  }

  _cleanActiveSession(session) {
    if (session !== this._activeSession) {
      return;
    }
    this._removeActiveSession();
  }

  _updateCurrentSessionAndSessions(session) {
    if (session === this._activeSession) {
      this._updateCurrentSession(session);
    }
    this._updateSessions();
  }

  _updateCurrentSession(session) {
    this.store.dispatch({
      type: this.actionTypes.updateCurrentSession,
      session: normalizeSession(session),
    });
  }

  _updateSessions() {
    this.store.dispatch({
      type: this.actionTypes.updateSessions,
      sessions: [...this._sessions.values()].map(normalizeSession),
    });
  }

  @proxify
  async toggleMinimized() {
    this.store.dispatch({
      type: this.actionTypes.toggleMinimized,
    });
  }

  _resetMinimized() {
    this.store.dispatch({
      type: this.actionTypes.resetMinimized,
    });
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

  get originalSessions() {
    return this._sessions;
  }

  get ready() {
    return this.state.status === moduleStatuses.ready;
  }

  get minimized() {
    return this.state.minimized;
  }

  get currentSession() {
    return this.state.currentSession;
  }

  get sessions() {
    return this.state.sessions;
  }

  get videoElementPrepared() {
    return this.state.videoElementPrepared;
  }

  get enabled() {
    return this._rolesAndPermissions.webphoneEnabled;
  }

  get connectionStatus() {
    return this.state.connectionStatus;
  }

  get webphoneCounts() {
    return this._storage.getItem(this._storageWebphoneCountsKey);
  }

  get userMedia() {
    return this._globalStorage.getItem(this._userMediaStorageKey);
  }

  @proxify
  async _onGetUserMediaSuccess() {
    this.store.dispatch({
      type: this.actionTypes.getUserMediaSuccess,
    });
  }
  @proxify
  async _onGetUserMediaError(error) {
    this.store.dispatch({
      type: this.actionTypes.getUserMediaError,
      error,
    });
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

  get errorCode() {
    return this.state.errorCode;
  }

  get disconnecting() {
    return this.connectionStatus === connectionStatus.disconnecting;
  }

  get connecting() {
    return this.connectionStatus === connectionStatus.connecting;
  }

  get connected() {
    return this.connectionStatus === connectionStatus.connected;
  }

  get connectFailed() {
    return this.connectionStatus === connectionStatus.connectFailed;
  }
}
