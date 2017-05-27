import { expect } from 'chai';
import sinon from 'sinon';
import { createStore } from 'redux';
import AccountExtension from './index';
import {
  getDataReducer,
} from './getAccountExtensionReducer';
import actionTypes from './actionTypes';
import * as accountExtensionHelper from './accountExtensionHelper';

describe('AccountExtension Unit Test', () => {
  let accountExtension;
  let store;

  beforeEach(() => {
    accountExtension = sinon.createStubInstance(AccountExtension);
    store = createStore(getDataReducer(actionTypes));
    accountExtension._store = store;
    accountExtension._actionTypes = actionTypes;
    [
      'isAvailableExtension',
      'processExtension',
      'addExtension',
      'deleteExtension',
      'fetchExtensionData',
      '_subscriptionHandleFn'
    ].forEach((key) => {
      accountExtension[key].restore();
    });
  });

  describe('isAvailableExtension', () => {
    it('Should return true when availableExtensions contains the extenionNumber', () => {
      const availableExtensions = [{ ext: 123 }];
      sinon.stub(accountExtension, 'availableExtensions', {
        get: () => availableExtensions
      });
      expect(accountExtension.isAvailableExtension(123)).to.equal(true);
    });
    it('Should return true when availableExtensions contains the extenionNumber', () => {
      const availableExtensions = [{ ext: 123 }];
      sinon.stub(accountExtension, 'availableExtensions', {
        get: () => availableExtensions
      });
      expect(accountExtension.isAvailableExtension(456)).to.equal(false);
    });
  });

  describe('_subscriptionHandleFn', () => {
    it('proccssExtension should not be called when message event is incorrect', async () => {
      const message = {
        event: 'abc',
        body: {
          extensions: [{}, {}]
        }
      };
      sinon.stub(accountExtension, 'processExtension');
      await accountExtension._subscriptionHandleFn(message);
      sinon.assert.notCalled(accountExtension.processExtension);
    });
    it('proccssExtension should not be called when got no extensions', async () => {
      const message = {
        event: 'abc',
        body: {}
      };
      sinon.stub(accountExtension, 'processExtension');
      await accountExtension._subscriptionHandleFn(message);
      sinon.assert.notCalled(accountExtension.processExtension);
    });
    it('proccssExtension should be called twice when got two extensions', async () => {
      const message = {
        event: '/extension',
        body: {
          extensions: [{}, {}]
        }
      };
      sinon.stub(accountExtension, 'processExtension');
      await accountExtension._subscriptionHandleFn(message);
      sinon.assert.calledTwice(accountExtension.processExtension);
    });
  });

  describe('processExtension', () => {
    let isEssential;
    beforeEach(() => {
      isEssential = sinon.stub(accountExtensionHelper, 'isEssential');
      sinon.stub(accountExtension, 'fetchExtensionData').callsFake(() => []);
    });
    afterEach(() => {
      sinon.restore(isEssential);
    });
    it('deleteExtension should be called when eventType is Delete', () => {
      const item = {
        id: 1,
        eventType: 'Delete',
      };
      sinon.stub(accountExtension, 'deleteExtension');
      accountExtension.processExtension(item);
      sinon.assert.calledOnce(accountExtension.deleteExtension);
    });
    it('deleteExtension should be called when eventType is Create but the extension is not essential', async () => {
      const item = {
        id: 1,
        eventType: 'Create',
      };
      isEssential.callsFake(() => false);
      sinon.stub(accountExtension, 'isAvailableExtension').callsFake(() => true);

      sinon.stub(accountExtension, 'deleteExtension');
      await accountExtension.processExtension(item);
      sinon.assert.called(accountExtension.deleteExtension);
    });
    it('deleteExtension should be called when eventType is Update but the extension is not essential', async () => {
      const item = {
        id: 1,
        eventType: 'Update',
      };
      isEssential.callsFake(() => false);
      sinon.stub(accountExtension, 'isAvailableExtension').callsFake(() => true);

      sinon.stub(accountExtension, 'deleteExtension');
      await accountExtension.processExtension(item);
      sinon.assert.called(accountExtension.deleteExtension);
    });
    it('addExtension should be called when eventType is Create but the extension is not essential', async () => {
      const item = {
        id: 1,
        eventType: 'Create',
      };
      isEssential.callsFake(() => true);
      sinon.stub(accountExtension, 'isAvailableExtension').callsFake(() => false);

      sinon.stub(accountExtension, 'addExtension');
      await accountExtension.processExtension(item);
      sinon.assert.called(accountExtension.addExtension);
    });
    it('addExtension should be called when eventType is Update but the extension is not essential', async () => {
      const item = {
        id: 1,
        eventType: 'Update',
      };
      isEssential.callsFake(() => true);
      sinon.stub(accountExtension, 'isAvailableExtension').callsFake(() => false);

      sinon.stub(accountExtension, 'addExtension');
      await accountExtension.processExtension(item);
      sinon.assert.called(accountExtension.addExtension);
    });
  });
});
