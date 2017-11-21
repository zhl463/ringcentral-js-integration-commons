import { expect } from 'chai';
import sinon from 'sinon';
import { createStore } from 'redux';
import Call from './index';
import getCallReducer from './getCallReducer';
import actionTypes from './actionTypes';
import callingModes from '../CallingSettings/callingModes';
import callErrors from './callErrors';
import ringoutErrors from '../Ringout/ringoutErrors';

describe('Call Unit Test', () => {
  let call;
  let store;

  beforeEach(() => {
    call = sinon.createStubInstance(Call);
    store = createStore(getCallReducer(actionTypes));
    call._store = store;
    call._prefixedActionTypes = actionTypes;
    [
      '_onStateChange',
      '_shouldInit',
      '_shouldReset',
      '_initCallModule',
      '_resetCallModule',
      '_processCall',
      'onToNumberChange',
      'onCall',
      '_getValidatedNumbers',
      '_makeCall'
    ].forEach((key) => {
      call[key].restore();
    });
  });
  describe('_onStateChange', () => {
    it('_initCallModule should be called once when _shouldInit is true', async () => {
      sinon.stub(call, '_shouldInit').callsFake(() => true);
      sinon.stub(call, '_shouldReset').callsFake(() => false);
      sinon.stub(call, 'ready', { get: () => false });
      sinon.stub(call, '_initCallModule');
      sinon.stub(call, '_resetCallModule');
      sinon.stub(call, '_processCall');
      await call._onStateChange();
      sinon.assert.calledOnce(call._initCallModule);
      sinon.assert.notCalled(call._resetCallModule);
      sinon.assert.notCalled(call._processCall);
    });
    it('_resetCallModule should be called once when _shouldReset is true', async () => {
      sinon.stub(call, '_shouldInit').callsFake(() => false);
      sinon.stub(call, '_shouldReset').callsFake(() => true);
      sinon.stub(call, 'ready', { get: () => false });
      sinon.stub(call, '_initCallModule');
      sinon.stub(call, '_resetCallModule');
      sinon.stub(call, '_processCall');
      await call._onStateChange();
      sinon.assert.notCalled(call._initCallModule);
      sinon.assert.calledOnce(call._resetCallModule);
      sinon.assert.notCalled(call._processCall);
    });
    it('_processCall should be called once when ready is true', async () => {
      sinon.stub(call, '_shouldInit').callsFake(() => false);
      sinon.stub(call, '_shouldReset').callsFake(() => false);
      sinon.stub(call, 'ready', { get: () => true });
      sinon.stub(call, '_initCallModule');
      sinon.stub(call, '_resetCallModule');
      sinon.stub(call, '_processCall');
      await call._onStateChange();
      sinon.assert.notCalled(call._initCallModule);
      sinon.assert.notCalled(call._resetCallModule);
      sinon.assert.calledOnce(call._processCall);
    });
    it('_initCallModule,  _resetCallModule and _processCall should not be called', async () => {
      sinon.stub(call, '_shouldInit').callsFake(() => false);
      sinon.stub(call, '_shouldReset').callsFake(() => false);
      sinon.stub(call, 'ready', { get: () => false });
      sinon.stub(call, '_initCallModule');
      sinon.stub(call, '_resetCallModule');
      sinon.stub(call, '_processCall');
      await call._onStateChange();
      sinon.assert.notCalled(call._initCallModule);
      sinon.assert.notCalled(call._resetCallModule);
      sinon.assert.notCalled(call._processCall);
    });
  });
  function runBooleanTest(fn, variables = 1, args = []) {
    [true, false].forEach((value) => {
      if (variables <= 1) {
        fn(...[...args, value]);
      } else {
        runBooleanTest(fn, variables - 1, [...args, value]);
      }
    });
  }

  describe('_shouldInit', () => {
    runBooleanTest(
      (
        numberValidateReady,
        callingSettingsReady,
        storageReady,
        regionSettingsReady,
        hasWebphone,
        webphoneReady,
        ringoutReady,
        softphoneReady,
        pending
       ) => {
        const result = (
          numberValidateReady &&
          callingSettingsReady &&
          storageReady &&
          regionSettingsReady &&
          (!hasWebphone || webphoneReady) &&
          ringoutReady &&
          softphoneReady &&
          pending
        );
        it(
          `should return ${result} when:
          numberValidate.ready is ${numberValidateReady} and
          callingSettings.ready is ${callingSettingsReady} and
          storage.ready is ${storageReady} and
          regionSettings.ready is ${regionSettingsReady}
          webphone is ${hasWebphone ? '' : 'not'} used and
          ${
            hasWebphone ?
            `webphone.ready is ${webphoneReady} and \n     ` :
            ''
          }
          ringout.ready is ${ringoutReady} and
          softphone.ready is ${softphoneReady} and
          call.pending is ${pending}
          `,
          () => {
            call._numberValidate = {
              ready: numberValidateReady
            };
            call._callingSettings = {
              ready: callingSettingsReady
            };
            call._storage = {
              ready: storageReady
            };
            call._regionSettings = {
              ready: regionSettingsReady
            };
            if (hasWebphone) {
              call._webphone = {
                ready: webphoneReady
              };
            }
            call._ringout = {
              ready: ringoutReady
            };
            call._softphone = {
              ready: softphoneReady
            };
            sinon.stub(call, 'pending', { get: () => pending });
            expect(call._shouldInit()).to.equal(result);
          }
        );
      },
      9
      );
  });
  describe('_shouldReset', () => {
    runBooleanTest(
      (
        numberValidateReady,
        callingSettingsReady,
        storageReady,
        regionSettingsReady,
        hasWebphone,
        webphoneReady,
        ringoutReady,
        softphoneReady,
        ready
       ) => {
        const result = (
          (!numberValidateReady ||
          !callingSettingsReady ||
          !storageReady ||
          !regionSettingsReady ||
          (!!hasWebphone && !webphoneReady) ||
          !ringoutReady ||
          !softphoneReady) &&
          ready
        );
        it(
          `should return ${result} when:
          numberValidate.ready is ${numberValidateReady} and
          callingSettings.ready is ${callingSettingsReady} and
          storage.ready is ${storageReady} and
          regionSettings.ready is ${regionSettingsReady}
          webphone is ${hasWebphone ? '' : 'not'} used and
          ${
            hasWebphone ?
            `webphone.ready is ${webphoneReady} and \n     ` :
            ''
          }
          ringout.ready is ${ringoutReady} and
          softphone.ready is ${softphoneReady} and
          call.ready is ${ready}
          `,
          () => {
            call._numberValidate = {
              ready: numberValidateReady
            };
            call._callingSettings = {
              ready: callingSettingsReady
            };
            call._storage = {
              ready: storageReady
            };
            call._regionSettings = {
              ready: regionSettingsReady
            };
            if (hasWebphone) {
              call._webphone = {
                ready: webphoneReady
              };
            }
            call._ringout = {
              ready: ringoutReady
            };
            call._softphone = {
              ready: softphoneReady
            };
            sinon.stub(call, 'ready', { get: () => ready });
            expect(call._shouldReset()).to.equal(result);
          }
        );
      },
      9
      );
  });
  describe('_initCallModule', async () => {
    it(`_connect should be called once
     when call._callingSettingMode is equal to call._callingModeswebphone`, async () => {
      call._callingSettingMode = callingModes.webphone;
      call._callingSettings = {
        callingMode: callingModes.webphone
      };
      call._webphone = {
        connect: await sinon.stub().callsFake(() => {})
      };
      sinon.stub(call, '_webphone');
      call._initCallModule();
      sinon.assert.calledOnce(call._webphone.connect);
    });
    it(`_connect should not be called
     when _callingSettingMode is not equal to call._callingModeswebphone`, async () => {
      call._callingSettingMode = callingModes.ringout;
      call._callingSettings = {
        callingMode: callingModes.ringout
      };
      call._webphone = {
        connect: await sinon.stub().callsFake(() => {})
      };
      sinon.stub(call, '_webphone');
      call._initCallModule();
      sinon.assert.notCalled(call._webphone.connect);
    });
  });
  describe('_resetCallModule', () => {
    it(`webphone.disconnect should be called once
     when _callingSettingMode is equal to call._callingModeswebphone
     and call._webphone is not undefined`, () => {
      call._callingSettingMode = callingModes.webphone;
      call._callingSettings = {
        callingMode: callingModes.webphone
      };
      call._webphone = {
        disconnect: sinon.stub().callsFake(() => {})
      };
      sinon.stub(call, '_webphone');
      call._resetCallModule();
      sinon.assert.calledOnce(call._webphone.disconnect);
    });
    it(`webphone.disconnect should not be called
     when _callingSettingMode is not equal to call._callingModeswebphone
     and call._webphone is not undefined`, () => {
      call._callingSettingMode = callingModes.ringout;
      call._callingSettings = {
        callingMode: callingModes.ringout
      };
      call._callingModesWebphone = callingModes.webphone;
      call._webphone = {
        disconnect: sinon.stub().callsFake(() => {})
      };
      sinon.stub(call, '_webphone');
      call._resetCallModule();
      sinon.assert.notCalled(call._webphone.disconnect);
    });
  });
  describe('_processCall', async () => {
    it(`webphone.disconnect should be called once
     when call._callingSettings.callingMode is not equal to oldCallSettingMode
     and call._webphone is not undefined
     and oldCallSettingMode is equal to callingModes.webphone
     `, async () => {
      call._callSettingMode = callingModes.webphone;
      call._callingSettings = {
        callingMode: callingModes.ringout
      };
      call._webphone = {
        connect: await sinon.stub().callsFake(() => {}),
        disconnect: sinon.stub().callsFake(() => {})
      };
      sinon.stub(call, '_webphone');
      await call._processCall();
      sinon.assert.notCalled(call._webphone.connect);
      sinon.assert.calledOnce(call._webphone.disconnect);
    });
    it(`_connect should be called once
     when call._callingSettings.callingMode is not equal to oldCallSettingMode
     and call._webphone is not undefined
     and oldCallSettingMode is not equal to callingModes.webphone
     and call._callSettingMode is equal to callingModes.webphone
     `, async () => {
      call._callSettingMode = callingModes.ringout;
      call._callingSettings = {
        callingMode: callingModes.webphone
      };
      call._webphone = {
        connect: await sinon.stub().callsFake(() => {}),
        disconnect: sinon.stub().callsFake(() => {}),
      };
      sinon.stub(call, '_webphone');
      await call._processCall();
      sinon.assert.calledOnce(call._webphone.connect);
      sinon.assert.notCalled(call._webphone.disconnect);
    });
    it(`_connect and webphone.disconnect should not be called once
     when call._callingSettings.callingMode is not equal to oldCallSettingMode
     and call._webphone is not undefined
     and oldCallSettingMode is not equal to callingModes.webphone
     and call._callSettingMode is not equal to callingModes.webphone
     `, async () => {
      call._callSettingMode = callingModes.ringout;
      call._callingSettings = {
        callingMode: callingModes.softphone
      };
      call._webphone = {
        connect: await sinon.stub().callsFake(() => {}),
        disconnect: sinon.stub().callsFake(() => {})
      };
      sinon.stub(call, '_webphone');
      await call._processCall();
      sinon.assert.notCalled(call._webphone.connect);
      sinon.assert.notCalled(call._webphone.disconnect);
    });
    it(`_connect and webphone.disconnect should not be called once
     when call._callingSettings.callingMode is equal to oldCallSettingMode
     and oldCallSettingMode is not equal to callingModes.webphone
     and call._callSettingMode is not equal to callingModes.webphone
     `, async () => {
      call._callingSettingMode = callingModes.ringout;
      call._callingSettings = {
        callingMode: callingModes.ringout
      };
      call._webphone = {
        connect: await sinon.stub().callsFake(() => {}),
        disconnect: sinon.stub().callsFake(() => {})
      };
      sinon.stub(call, '_webphone');
      await call._processCall();
      sinon.assert.notCalled(call._webphone.connect);
      sinon.assert.notCalled(call._webphone.disconnect);
    });
  });
  describe('_onCall', () => {
    it(`onToNumberChange should be called once
    when isIdle is true
    and call.toNumber.trim.length is equal to 0
    and call.lastCallNumber is not equal to undefined`,
    () => {
      sinon.stub(call, 'isIdle', { get: () => true });
      sinon.stub(call, 'toNumber', { get: () => '' });
      sinon.stub(call, 'lastCallNumber', { get: () => '123' });
      sinon.stub(call, 'onToNumberChange');
      sinon.stub(call, '_getValidatedNumbers');
      call.onCall();
      sinon.assert.calledOnce(call.onToNumberChange);
      sinon.assert.notCalled(call._getValidatedNumbers);
    });
    it(`warning noToNumber should be called once
    when isIdle is true
    and call.toNumber.trim.length is equal to 0
    and call.lastCallNumber is  equal to undefined`,
    () => {
      sinon.stub(call, 'isIdle', { get: () => true });
      sinon.stub(call, 'toNumber', { get: () => '' });
      sinon.stub(call, 'lastCallNumber', { get: () => undefined });
      sinon.stub(call, 'onToNumberChange');
      sinon.stub(call, '_getValidatedNumbers');
      call._alert = {
        warning: sinon.stub().callsFake(() => {})
      };
      sinon.stub(call, '_alert');
      call.onCall();
      sinon.assert.calledWith(
        call._alert.warning,
        { message: callErrors.noToNumber }
      );
      sinon.assert.notCalled(call.onToNumberChange);
      sinon.assert.notCalled(call._getValidatedNumbers);
    });
    it(`_getValidatedNumbers should be called once
    when isIdle is true
    and call.toNumber.trim.length is not equal to 0
    and call.lastCallNumber is  equal to undefined`,
    () => {
      sinon.stub(call, 'isIdle', { get: () => true });
      sinon.stub(call, 'toNumber', { get: () => '123' });
      sinon.stub(call, 'lastCallNumber', { get: () => undefined });
      sinon.stub(call, '_getValidatedNumbers');
      sinon.stub(call, 'onToNumberChange');
      call.onCall();
      sinon.assert.calledOnce(call._getValidatedNumbers);
      sinon.assert.notCalled(call.onToNumberChange);
    });
    it(`_getValidatedNumbers should be called once
    when isIdle is true
    and call.toNumber.trim.length is not equal to 0
    and call.lastCallNumber is not equal to null`,
    () => {
      sinon.stub(call, 'isIdle', { get: () => true });
      sinon.stub(call, 'toNumber', { get: () => '123' });
      sinon.stub(call, 'lastCallNumber', { get: () => '123' });
      sinon.stub(call, '_getValidatedNumbers');
      sinon.stub(call, 'onToNumberChange');
      call.onCall();
      sinon.assert.calledOnce(call._getValidatedNumbers);
      sinon.assert.notCalled(call.onToNumberChange);
    });
    it(`_makeCall should be called once
    when isIdle is true
    and call.toNumber.trim.length is not equal to 0
    and validatedNumbers is not equal to null`,
    async () => {
      sinon.stub(call, 'isIdle', { get: () => true });
      sinon.stub(call, 'toNumber', { get: () => '123' });
      sinon.stub(call, 'onToNumberChange');
      sinon.stub(call, '_getValidatedNumbers').callsFake(async () => '123');
      sinon.stub(call, '_makeCall');
      await call.onCall();
      sinon.assert.notCalled(call.onToNumberChange);
      sinon.assert.calledOnce(call._makeCall);
    });
    it(`should catch error and alert warning connectFailed
    when isIdle is true
    and call.toNumber.trim.length is not equal to 0
    and validatedNumbers is not equal to null
    and _makeCall throws error`,
    async () => {
      sinon.stub(call, 'isIdle', { get: () => true });
      sinon.stub(call, 'toNumber', { get: () => '123' });
      sinon.stub(call, 'lastCallNumber', { get: () => '123' });
      sinon.stub(call, 'onToNumberChange');
      sinon.stub(call, '_getValidatedNumbers').callsFake(() => ['123']);
      sinon.stub(call, '_makeCall').throws(new Error({ message: ringoutErrors.firstLegConnectFailed }));
      call._alert = {
        warning: sinon.stub.callsFake(() => {}),
        danger: sinon.stub.callsFake(() => {})
      };
      sinon.stub(call, '_alert');
      try {
        await call.onCall();
      } catch (error) {
        sinon.assert.calledWith(call._alert.warning, {
          message: callErrors.connectFailed,
          payload: { message: ringoutErrors.firstLegConnectFailed }
        });
      }
    });
    it(`should catch error and alert warning networkError
    when isIdle is true
    and call.toNumber.trim.length is not equal to 0
    and validatedNumbers is not equal to null
    and _makeCall throws error failed to fetch`,
    async () => {
      sinon.stub(call, 'isIdle', { get: () => true });
      sinon.stub(call, 'toNumber', { get: () => '123' });
      sinon.stub(call, 'lastCallNumber', { get: () => '123' });
      sinon.stub(call, 'onToNumberChange');
      sinon.stub(call, '_getValidatedNumbers').callsFake(() => ['123']);
      sinon.stub(call, '_makeCall').throws(new Error({ message: 'Failed to fetch' }));
      call._alert = {
        warning: sinon.stub.callsFake(() => {}),
        danger: sinon.stub.callsFake(() => {})
      };
      sinon.stub(call, '_alert');
      try {
        await call.onCall();
      } catch (error) {
        sinon.assert.calledWith(call._alert.danger, {
          message: callErrors.networkError,
          payload: { message: 'Failed to fetch' }
        });
      }
    });
    it(`should catch error and alert danger internalError
    when isIdle is true
    and call.toNumber.trim.length is not equal to 0
    and validatedNumbers is not equal to null
    and _makeCall throws error`,
    async () => {
      sinon.stub(call, 'isIdle', { get: () => true });
      sinon.stub(call, 'toNumber', { get: () => '123' });
      sinon.stub(call, 'lastCallNumber', { get: () => '123' });
      sinon.stub(call, 'onToNumberChange');
      sinon.stub(call, '_getValidatedNumbers').callsFake(() => ['123']);
      sinon.stub(call, '_makeCall').throws(new Error({ message: 'foo' }));
      call._alert = {
        warning: sinon.stub.callsFake(() => {}),
        danger: sinon.stub.callsFake(() => {})
      };
      sinon.stub(call, '_alert');
      try {
        await call.onCall();
      } catch (error) {
        sinon.assert.calledWith(call._alert.danger, {
          message: callErrors.internalError,
          payload: { message: 'foo' }
        });
      }
    });
    it(`should not alert danger and warning
    when isIdle is true
    and call.toNumber.trim.length is not equal to 0
    and validatedNumbers is not equal to null
    and _makeCall throws error Refresh token has expired`,
    async () => {
      sinon.stub(call, 'isIdle', { get: () => true });
      sinon.stub(call, 'toNumber', { get: () => '123' });
      sinon.stub(call, 'lastCallNumber', { get: () => '123' });
      sinon.stub(call, 'onToNumberChange');
      sinon.stub(call, '_getValidatedNumbers').callsFake(() => ['123']);
      sinon.stub(call, '_makeCall').throws(new Error({ message: 'Refresh token has expired' }));
      call._alert = {
        warning: sinon.stub.callsFake(() => {}),
        danger: sinon.stub.callsFake(() => {})
      };
      sinon.stub(call, '_alert');
      try {
        await call.onCall();
      } catch (error) {
        sinon.assert.notCalled(call._alert.warning);
        sinon.assert.notCalled(call._alert.danger);
      }
    });
    it(`onToNumberChange and _getValidatedNumbers and _makeCall should not be called
    when isIdle is false
    and call.toNumber.trim.length is not equal to 0`,
    async () => {
      sinon.stub(call, 'isIdle', { get: () => false });
      sinon.stub(call, 'toNumber', { get: () => '123' });
      sinon.stub(call, 'lastCallNumber', { get: () => '123' });
      sinon.stub(call, 'onToNumberChange');
      sinon.stub(call, '_getValidatedNumbers').callsFake(async () => '123');
      sinon.stub(call, '_makeCall');
      await call.onCall();
      sinon.assert.notCalled(call.onToNumberChange);
      sinon.assert.notCalled(call._getValidatedNumbers);
      sinon.assert.notCalled(call._makeCall);
    });
  });
  describe('_getValidatedNumbers', async () => {
    it(`should return null when call._callingSettings.callingMode is equal to callingModes.webphone
    and call._callingSettings.fromNumber is null`,
    async () => {
      call._callingSettings = {
        callingMode: callingModes.webphone,
        fromNumber: null
      };
      const result = await call._getValidatedNumbers();
      expect(result).to.equal(null);
    });
    it(`should return null when call._callingSettings.callingMode is equal to callingModes.webphone
    and call._callingSettings.fromNumber is ''`,
    async () => {
      call._callingSettings = {
        callingMode: callingModes.webphone,
        fromNumber: ''
      };
      const result = await call._getValidatedNumbers();
      expect(result).to.equal(null);
    });
    it(`should return null when call._callingSettings.callingMode is not equal to callingModes.webphone
    and validatedResult.result is equal to false`,
    async () => {
      call._callingSettings = {
        callingMode: callingModes.softphone,
        fromNumber: '',
      };
      sinon.stub(call, 'toNumber', { get: () => '123' });
      const validatedResult = {
        result: false,
        errors: [],
      };
      call._numberValidate = {
        validateNumbers: sinon.stub().callsFake(async () => validatedResult)
      };
      sinon.stub(call, '_numberValidate');
      const result = await call._getValidatedNumbers();
      expect(result).to.equal(null);
    });
    it(`should return result when call._callingSettings.callingMode is not equal to callingModes.webphone
    and validatedResult.result is not equal to false`,
    async () => {
      call._callingSettings = {
        callingMode: callingModes.softphone,
      };
      sinon.stub(call, 'toNumber', { get: () => '123' });
      const validatedResult = {
        result: true,
        numbers: [{ e164: '123' }, { e164: '456' }],
        errors: [],
      };
      call._numberValidate = {
        validateNumbers: sinon.stub().callsFake(async () => validatedResult)
      };
      sinon.stub(call, '_numberValidate');
      const result = await call._getValidatedNumbers();
      expect(result.toNumber).to.equal('123');
      expect(result.fromNumber).to.equal('456');
    });
  });
  describe('_makeCall', async () => {
    let regionSettings;
    beforeEach(() => {
      regionSettings = {
        countryCode: 'foo',
        availableCountries: [{
          country: {
            isoCode: 'foo'
          }
        }]
      };
    });
    it(`call._softphone.makeCall should be called once
    when callingMode is callingModes.softphone`,
    async () => {
      call._callingSettings = {
        callingMode: callingModes.softphone,
        ringoutPrompt: 'foo'
      };
      call._regionSettings = regionSettings;
      call._softphone = {
        makeCall: sinon.stub().callsFake(() => {})
      };
      call._ringout = {
        makeCall: sinon.stub().callsFake(() => {})
      };
      call._webphone = {
        makeCall: sinon.stub().callsFake(() => {})
      };
      sinon.stub(call, '_softphone');
      sinon.stub(call, '_ringout');
      sinon.stub(call, '_webphone');
      await call._makeCall({ toNumber: '123', fromNumber: '456' });
      sinon.assert.calledOnce(call._softphone.makeCall);
      sinon.assert.notCalled(call._ringout.makeCall);
      sinon.assert.notCalled(call._webphone.makeCall);
    });
    it(`call._ringout.makeCall should be called once
    when callingMode is callingModes.ringout`,
    async () => {
      call._callingSettings = {
        callingMode: callingModes.ringout,
        ringoutPrompt: 'foo'
      };
      call._regionSettings = regionSettings;
      call._softphone = {
        makeCall: sinon.stub().callsFake(() => {})
      };
      call._ringout = {
        makeCall: sinon.stub().callsFake(() => {})
      };
      call._webphone = {
        makeCall: sinon.stub().callsFake(() => {})
      };
      sinon.stub(call, '_softphone');
      sinon.stub(call, '_ringout');
      sinon.stub(call, '_webphone');
      await call._makeCall({ toNumber: '123', fromNumber: '456' });
      sinon.assert.notCalled(call._softphone.makeCall);
      sinon.assert.calledOnce(call._ringout.makeCall);
      sinon.assert.notCalled(call._webphone.makeCall);
    });
    it(`call._webphone.makeCall should be called once
    when callingMode is callingModes.webphone`,
    async () => {
      call._callingSettings = {
        callingMode: callingModes.webphone,
        ringoutPrompt: 'foo'
      };
      call._regionSettings = regionSettings;
      call._softphone = {
        makeCall: sinon.stub().callsFake(() => {})
      };
      call._ringout = {
        makeCall: sinon.stub().callsFake(() => {})
      };
      call._webphone = {
        makeCall: sinon.stub().callsFake(() => {})
      };
      sinon.stub(call, '_softphone');
      sinon.stub(call, '_ringout');
      sinon.stub(call, '_webphone');
      await call._makeCall({ toNumber: '123', fromNumber: '456' });
      sinon.assert.notCalled(call._softphone.makeCall);
      sinon.assert.notCalled(call._ringout.makeCall);
      sinon.assert.calledOnce(call._webphone.makeCall);
    });
    it(`call._softphone.makeCall and call._ringout.makeCall
    and call._webphone.makeCall should not be called`,
    async () => {
      call._callingSettings = {
        callingMode: 'foo',
        ringoutPrompt: 'foo'
      };
      call._regionSettings = regionSettings;
      call._softphone = {
        makeCall: sinon.stub().callsFake(() => {})
      };
      call._ringout = {
        makeCall: sinon.stub().callsFake(() => {})
      };
      call._webphone = {
        makeCall: sinon.stub().callsFake(() => {})
      };
      sinon.stub(call, '_softphone');
      sinon.stub(call, '_ringout');
      sinon.stub(call, '_webphone');
      await call._makeCall({ toNumber: '123', fromNumber: '456' });
      sinon.assert.notCalled(call._softphone.makeCall);
      sinon.assert.notCalled(call._ringout.makeCall);
      sinon.assert.notCalled(call._webphone.makeCall);
    });
  });
});

