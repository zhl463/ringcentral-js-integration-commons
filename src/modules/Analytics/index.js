import RcModule from '../../lib/RcModule';
import { Module } from '../../lib/di';
import sleep from '../../lib/sleep';
import moduleStatuses from '../../enums/moduleStatuses';
import actionTypes from './actionTypes';
import getAnalyticsReducer from './getAnalyticsReducer';

import { Segment } from '../../lib/Analytics';
import callingModes from '../CallingSettings/callingModes';

/**
 * @class
 * @description Analytics module.
 */
@Module({
  deps: [
    'Auth',
    'Call',
    'Webphone',
    'Contacts',
    'MessageSender',
    'MessageStore',
    'ContactDetails',
    'CallHistory',
    'Conference',
    { dep: 'RouterInteraction', optional: true },
    { dep: 'AnalyticsAdapter', optional: true },
    { dep: 'AnalyticsOptions', optional: true },
  ]
})
export default class Analytics extends RcModule {
  constructor({
    auth,
    call,
    webphone,
    contacts,
    messageSender,
    adapter,
    routerInteraction,
    analyticsKey,
    appName,
    appVersion,
    brandCode,
    messageStore,
    contactDetails,
    callHistory,
    conference,
    ...options
  }) {
    super({
      ...options,
      actionTypes
    });
    this._auth = auth;
    this._call = call;
    this._webphone = webphone;
    this._contacts = contacts;
    this._messageSender = messageSender;
    this._adapter = adapter;
    this._router = routerInteraction;
    this._analyticsKey = analyticsKey;
    this._appName = appName;
    this._appVersion = appVersion;
    this._brandCode = brandCode;
    this._messageStore = messageStore;
    this._contactDetails = contactDetails;
    this._callHistory = callHistory;
    this._conference = conference;
    this._reducer = getAnalyticsReducer(this.actionTypes);
    this._segment = Segment();
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
    this._segment.load(this._analyticsKey);
  }

  identify({
    userId,
    name,
  }) {
    global.analytics.identify(userId, {
      name
    });
  }

  track(event, {
    ...properties
  }) {
    const trackProps = {
      appName: this._appName,
      appVersion: this._appVersion,
      brand: this._brandCode,
      ...properties,
    };
    global.analytics.track(event, trackProps);
  }

  trackNavigation({ router, eventPostfix }) {
    const trackProps = {
      router,
      appName: this._appName,
      appVersion: this._appVersion,
      brand: this._brandCode,
    };
    this.track(`Navigator Clicked (${eventPostfix})`, trackProps);
  }

  async _onStateChange() {
    if (this.ready && this.lastActions.length && !this._promise) {
      this._promise = this._processActions();
    }
  }
  async _processActions() {
    if (this.lastActions.length) {
      await sleep(300);
      this.lastActions.forEach((action) => {
        [
          '_authentication',
          '_logout',
          '_callAttempt',
          '_callConnected',
          '_webRTCRegistration',
          '_smsAttempt',
          '_smsSent',
          '_logCall',
          '_logSMS',
          '_clickToDial',
          '_clickToSMS',
          '_viewEntity',
          '_createEntity',
          '_editCallLog',
          '_editSMSLog',
          '_navigate',
          '_inboundCall',
          '_coldTransfer',
          '_textClickToDial',
          '_voicemailClickToDial',
          '_voicemailClickToSMS',
          '_voicemailDelete',
          '_voicemailFlag',
          '_contactDetailClickToDial',
          '_contactDetailClickToSMS',
          '_callHistoryClickToDial',
          '_callHistoryClickToSMS',
          '_conferenceInviteWithText',
          '_conferenceAddDialInNumber',
          '_conferenceJoinAsHost',
        ].forEach((key) => {
          this[key](action);
        });
      });
      this._promise = null;
      this.store.dispatch({
        type: this.actionTypes.clear,
      });
    }
  }


  _authentication(action) {
    if (this._auth && this._auth.actionTypes.loginSuccess === action.type) {
      this.identify({
        userId: this._auth.ownerId,
      });
      this.track('Authentication');
    }
  }

  _logout(action) {
    if (this._auth && this._auth.actionTypes.logout === action.type) {
      this.track('Logout');
    }
  }

  _callAttempt(action) {
    if (this._call && this._call.actionTypes.connect === action.type) {
      if (action.callSettingMode === callingModes.webphone) {
        this.track('Call Attempt WebRTC');
      } else {
        this.track('Call Attempt', {
          callSettingMode: action.callSettingMode
        });
      }
    }
  }

  _callConnected(action) {
    if (this._call && this._call.actionTypes.connectSuccess === action.type) {
      if (action.callSettingMode === callingModes.webphone) {
        this.track('Outbound WebRTC Call Connected');
      } else {
        this.track('Outbound Call Connected', {
          callSettingMode: action.callSettingMode
        });
      }
    }
  }

  _webRTCRegistration(action) {
    if (this._webphone && this._webphone.actionTypes.registered === action.type) {
      this.track('WebRTC registration');
    }
  }

  _smsAttempt(action) {
    if (this._messageSender && this._messageSender.actionTypes.send === action.type) {
      this.track('SMS Attempt');
    }
  }

  _smsSent(action) {
    if (this._messageSender && this._messageSender.actionTypes.sendOver === action.type) {
      this.track('SMS Sent');
    }
  }

  _logCall(action) {
    if (this._adapter && this._adapter.actionTypes.createCallLog === action.type) {
      this.track('Log Call');
    }
  }

  _logSMS(action) {
    if (this._adapter && this._adapter.actionTypes.createSMSLog === action.type) {
      this.track('Log SMS');
    }
  }

  _clickToDial(action) {
    if (this._adapter && this._adapter.actionTypes.clickToDial === action.type) {
      this.track('Click To Dial');
    }
  }

  _clickToSMS(action) {
    if (this._adapter && this._adapter.actionTypes.clickToSMS === action.type) {
      this.track('Click To SMS');
    }
  }

  _viewEntity(action) {
    if (this._adapter && this._adapter.actionTypes.viewEntity === action.type) {
      this.track('View Entity Details');
    }
  }

  _createEntity(action) {
    if (this._adapter && this._adapter.actionTypes.createEntity === action.type) {
      this.track('Add Entity');
    }
  }

  _editCallLog(action) {
    if (this._adapter && this._adapter.actionTypes.editCallLog === action.type) {
      this.track('Edit Call Log');
    }
  }

  _editSMSLog(action) {
    if (this._adapter && this._adapter.actionTypes.editSMSLog === action.type) {
      this.track('Edit SMS Log');
    }
  }

  _navigate(action) {
    if (this._router && this._router.actionTypes.locationChange === action.type) {
      const path = action.payload && action.payload.pathname;
      const target = this._getTrackTarget(path);
      if (target) {
        this.trackNavigation({
          ...target
        });
      }
    }
  }

  _inboundCall(action) {
    if (this._webphone && this._webphone.actionTypes.callAnswer === action.type) {
      this.track('Inbound WebRTC Call Connected');
    }
  }

  _coldTransfer(action) {
    if (this._webphone
      && this._webphone.isOnTransfer === true
      && this._webphone.actionTypes.updateSessions === action.type
    ) {
      this.track('Cold Transfer Call');
    }
  }

  _textClickToDial(action) {
    if (this._messageStore
      && this._messageStore.actionTypes.clickToCall === action.type
      && (action.fromType === 'Pager' || action.fromType === 'SMS')) {
      this.track('Click To Dial (Text List)');
    }
  }

  _voicemailClickToDial(action) {
    if (this._messageStore
      && this._messageStore.actionTypes.clickToCall === action.type
      && action.fromType === 'VoiceMail') {
      this.track('Click To Dial (Voicemail List)');
    }
  }

  _voicemailClickToSMS(action) {
    if (this._messageStore && this._messageStore.actionTypes.clickToSMS === action.type) {
      this.track('Click to SMS (Voicemail List)');
    }
  }

  _voicemailDelete(action) {
    if (this._messageStore && this._messageStore.actionTypes.removeMessage === action.type) {
      this.track('Delete Voicemail');
    }
  }

  _voicemailFlag(action) {
    if (this._messageStore
      && this._messageStore.actionTypes.markMessages === action.type) {
      this.track('Flag Voicemail');
    }
  }

  _contactDetailClickToDial(action) {
    if (this._contactDetails
      && this._contactDetails.actionTypes.clickToCall === action.type) {
      this.track('Click To Dial (Contact Details)');
    }
  }

  _contactDetailClickToSMS(action) {
    if (this._contactDetails
     && this._contactDetails.actionTypes.clickToSMS === action.type) {
      this.track('Click To SMS (Contact Details)');
    }
  }

  _callHistoryClickToDial(action) {
    if (this._callHistory
     && this._callHistory.actionTypes.clickToCall === action.type) {
      this.track('Click To dial (Call History)');
    }
  }

  _callHistoryClickToSMS(action) {
    if (this._callHistory
     && this._callHistory.actionTypes.clickToSMS === action.type) {
      this.track('Click To SMS (Call History)');
    }
  }


  _conferenceInviteWithText(action) {
    if (this._conference
      && this._conference.actionTypes.inviteWithText === action.type) {
      this.track('Invite With Text (Conference)');
    }
  }

  _conferenceAddDialInNumber(action) {
    if (this._conference
      && this._conference.actionTypes.updateAdditionalNumbers === action.type) {
      this.track('Select Additional Dial-in Number (Conference)');
    }
  }

  _conferenceJoinAsHost(action) {
    if (this._conference
      && this._conference.actionTypes.joinAsHost === action.type) {
      this.track('Join As Host (Conference)');
    }
  }


  _getTrackTarget(path) {
    if (path) {
      const routes = path.split('/');
      const firstRoute = routes.length > 1 ? `/${routes[1]}` : '';

      const targets = [{
        eventPostfix: 'Dialer',
        router: '/dialer',
      }, {
        eventPostfix: 'Compose SMS',
        router: '/composeText',
      }, {
        eventPostfix: 'Messages',
        router: '/messages',
      }, {
        eventPostfix: 'Conversation',
        router: '/conversations',
      }, {
        eventPostfix: 'Call History',
        router: '/history',
      }, {
        eventPostfix: 'Settings',
        router: '/settings',
      }, {
        eventPostfix: 'Conference',
        router: '/conference',
      }, {
        eventPostfix: 'Meeting',
        router: '/meeting',
      }, {
        eventPostfix: 'Contacts',
        router: '/contacts',
      }];
      return targets.find(target => firstRoute === target.router);
    }
    return undefined;
  }

  get analytics() {
    return global.analytics;
  }

  get lastActions() {
    return this.state.lastAction;
  }

  get status() {
    return moduleStatuses.ready;
  }

  get ready() {
    return true;
  }

  get pending() {
    return false;
  }
}
