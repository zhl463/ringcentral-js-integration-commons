require('es6-promise').polyfill();
require('./pubnub');
const RingCentral = require('ringcentral');
const fetchMock = require('fetch-mock/es5/client');

const dialingPlanBody = require('./data/dialingPlan');
const extensionBody = require('./data/extensionInfo');
const extensionListBody = require('./data/extension');
const accountBody = require('./data/accountInfo');
const subscriptionBody = require('./data/subscription');
const apiInfoBody = require('./data/subscription');
const messageSyncBody = require('./data/messageSync');
const authzProfileBody = require('./data/authzProfile');
const blockedNumberBody = require('./data/blockedNumber');
const forwardingNumberBody = require('./data/forwardingNumber');
const phoneNumberBody = require('./data/phoneNumber');

const mockServer = 'http://whatever';
export function createSDK(options = {}) {
  const opts = {
    ...options,
    appKey: 'test key',
    appSecret: 'test secret',
    server: mockServer,
    Request: fetchMock.constructor.Request,
    Response: fetchMock.constructor.Response,
    Headers: fetchMock.constructor.Headers,
    fetch: fetchMock.fetchMock.bind(fetchMock),
    refreshDelayMs: 1,
    redirectUri: 'http://foo',
    cachePrefix: 'sdkPrefix',
  };
  return new RingCentral(opts);
}

export function mockApi({
  method = 'GET',
  path,
  server = mockServer,
  url,
  body = {},
  status = 200,
  statusText = 'OK',
  headers,
}) {
  let responseHeaders;
  const isJson = typeof body !== 'string';
  if (isJson && !headers) {
    responseHeaders = { 'Content-Type': 'application/json' };
  } else {
    responseHeaders = headers;
  }
  let mockUrl;
  if (url) {
    mockUrl = url;
  } else {
    mockUrl = `${server}${path}`;
  }
  fetchMock.once(mockUrl, {
    body: isJson ? JSON.stringify(body) : body,
    status,
    statusText,
    headers: responseHeaders,
    sendAsJson: false
  }, {
    method,
    times: 1,
  });
}

export function authentication() {
  mockApi({
    method: 'POST',
    path: '/restapi/oauth/token',
    body: {
      access_token: 'ACCESS_TOKEN',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'REFRESH_TOKEN',
      refresh_token_expires_in: 60480,
      scope: 'SMS RCM Foo Boo',
      expireTime: new Date().getTime() + 3600000,
      owner_id: '23231231"',
      endpoint_id: '3213213131',
    }
  });
}

export function logout() {
  mockApi({
    method: 'POST',
    path: '/restapi/oauth/revoke'
  });
}

export function tokenRefresh(failure) {
  if (!failure) {
    mockApi({
      method: 'POST',
      path: '/restapi/oauth/token',
      body: {
        access_token: 'ACCESS_TOKEN_FROM_REFRESH',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'REFRESH_TOKEN_FROM_REFRESH',
        refresh_token_expires_in: 60480,
        scope: 'SMS RCM Foo Boo'
      }
    });
  } else {
    mockApi({
      method: 'POST',
      path: '/restapi/oauth/token',
      body: {
        message: 'Wrong token',
        error_description: 'Wrong token',
        description: 'Wrong token'
      },
      status: 400,
    });
  }
}

export function presence(id) {
  mockApi({
    path: `/restapi/v1.0/account/~/extension/${id}/presence`,
    body: {
      uri: `https://platform.ringcentral.com/restapi/v1.0/account/123/extension/${id}/presence`,
      extension: {
        uri: `https://platform.ringcentral.com/restapi/v1.0/account/123/extension/${id}`,
        extensionNumber: '101',
        id,
      },
      activeCalls: [],
      presenceStatus: 'Available',
      telephonyStatus: 'Ringing',
      userStatus: 'Available',
      dndStatus: 'TakeAllCalls',
      extensionId: id
    }
  });
}

export function dialingPlan() {
  mockApi({
    path: '/restapi/v1.0/account/~/dialing-plan?perPage=MAX&page=1',
    body: dialingPlanBody,
  });
}

export function extensionInfo() {
  mockApi({
    path: '/restapi/v1.0/account/~/extension/~',
    body: extensionBody,
  });
}

export function extensionList() {
  mockApi({
    url: `begin:${mockServer}/restapi/v1.0/account/~/extension?`,
    body: extensionListBody,
  });
}

export function accountInfo() {
  mockApi({
    path: '/restapi/v1.0/account/~',
    body: accountBody,
  });
}

export function apiInfo() {
  mockApi({
    path: '/restapi/v1.0',
    body: apiInfoBody,
  });
}

export function messageSync() {
  mockApi({
    url: `begin:${mockServer}/restapi/v1.0/account/~/extension/~/message-sync`,
    body: messageSyncBody,
  });
}

export function authzProfile() {
  mockApi({
    path: '/restapi/v1.0/account/~/extension/~/authz-profile',
    body: authzProfileBody,
  });
}

export function blockedNumber() {
  mockApi({
    path: '/restapi/v1.0/account/~/extension/~/blocked-number',
    body: blockedNumberBody,
  });
}

export function forwardingNumber() {
  mockApi({
    url: `begin:${mockServer}/restapi/v1.0/account/~/extension/~/forwarding-number`,
    body: forwardingNumberBody,
  });
}

export function phoneNumber() {
  mockApi({
    url: `begin:${mockServer}/restapi/v1.0/account/~/extension/~/phone-number`,
    body: phoneNumberBody,
  });
}

export function subscription() {
  mockApi({
    method: 'POST',
    path: '/restapi/v1.0/subscription',
    body: subscriptionBody,
  });
}

export function mockForLogin() {
  authentication();
  logout();
  tokenRefresh();
  presence('~');
  dialingPlan();
  extensionInfo();
  accountInfo();
  apiInfo();
  authzProfile();
  extensionList();
  blockedNumber();
  forwardingNumber();
  messageSync();
  phoneNumber();
  subscription();
}

export function mockClient(client) {
  client.service = createSDK({});
}
