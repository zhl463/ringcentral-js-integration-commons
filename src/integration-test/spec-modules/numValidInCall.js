import { ensureLogin, containsErrorMessage } from '../utils/HelpUtil';
import callErrors from '../../modules/Call/callErrors';
import { waitUntilEqual } from '../utils/WaitUtil';

export default (Auth, Alert, Client, RegionSettings, Call, accountWithMultiDP) => {
  describe('Number Validation when Making Phone Call', async function () {
    this.timeout(10000);
    let conditionalDescribe = describe;
    const isLoginSuccess = await ensureLogin(Auth, accountWithMultiDP);
    if (!isLoginSuccess) {
      conditionalDescribe = describe.skip;
      console.error('Skip test case as failed to login with credential ', accountWithMultiDP);
    }
    conditionalDescribe('Basic Validation', function () {
      this.timeout(10000);
      beforeEach(async function () {
        const isAlertClear = await waitUntilEqual(() => {
          Alert.dismissAll();
          return Alert.state.messages.length;
        }, 'Alert', 0, 5);
        if (!isAlertClear) {
          console.error('Alert is not cleared after dismissAll');
        }
      });
      it('Should Alert Invalid Number - Invalid Char in ToNumber', async () => {
        Call.onToNumberChange("iamn%@onedi!@$%^&()_=\\][';/.,~nu><.,,?/mber#*");
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber))
          .to.not.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension))
          .to.equal(undefined);
      });
      it('Should Alert Invalid Number - Valid Special Char but No Digital Number', async () => {
        Call.onToNumberChange('+#');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber))
          .to.not.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension))
          .to.equal(undefined);
      });
      it('Should Not Alert Anything - Call Number in E.164 Format', async () => {
        Call.onToNumberChange('+13065221112');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension))
          .to.equal(undefined);
      });
    });

    conditionalDescribe('Validation with Last Called Number', function () {
      this.timeout(10000);
      beforeEach(async function () {
        const isAlertClear = await waitUntilEqual(() => {
          Alert.dismissAll();
          return Alert.state.messages.length;
        }, 'Alert', 0, 5);
        if (!isAlertClear) {
          console.error('Alert is not cleared after dismissAll');
          this.skip();
        }
      });
      it('Should Remember Last Called Number', async () => {
        Call.onToNumberChange('123abc');
        await Call.onCall();
        expect(Call.lastCallNumber).to.equal('123abc');
      });
      it('Should Not Alert Anything - Call Empty Number with Valid Last Called Number', async () => {
        Call.onToNumberChange('+13065221112');
        await Call.onCall();
        Call.onToNumberChange(' ');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension))
          .to.equal(undefined);
      });
      it('Should Alert Invalid Number - Call None Digital Number with Valid Last Called Number', async () => {
        Call.onToNumberChange('+13065221112');
        await Call.onCall();
        Call.onToNumberChange("iamn%@onedi!@$%^&()_=\\][';/.,~nu><.,,?/mber");
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber))
          .to.not.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension))
          .to.equal(undefined);
      });
      it('Should Not Alert Anything - Call Number in E.164 Format with Invalid Last Called Number', async () => {
        Call.onToNumberChange('123abc');
        await Call.onCall();
        Alert.dismissAll();
        Call.onToNumberChange('+13065221112');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension))
          .to.equal(undefined);
      });
    });

    conditionalDescribe('Validation with US/CA Local Number Format', function () {
      this.timeout(10000);
      beforeEach(async function () {
        const isAlertClear = await waitUntilEqual(() => {
          Alert.dismissAll();
          return Alert.state.messages.length;
        }, 'Alert', 0, 5);
        if (!isAlertClear) {
          console.error('Alert is not cleared after dismissAll');
          this.skip();
        }
      });
      it('Should Not Alert Anything - Call Number in (xxx)xxx-xxxx Format', async () => {
        RegionSettings.setData({ countryCode: 'US', areaCode: '' });
        Call.onToNumberChange('(650)827-5672');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber))
          .to.equal(undefined);
      });
      it('Should Not Alert Anything - Call Number in (xxx) xxx-xxxx Format', async () => {
        RegionSettings.setData({ countryCode: 'US', areaCode: '' });
        Call.onToNumberChange('(650) 827-5672');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber))
          .to.equal(undefined);
      });
      it('Should Not Alert Anything - Call Number in (xxx)xxx-xxxx*xxx Format', async () => {
        RegionSettings.setData({ countryCode: 'US', areaCode: '' });
        Call.onToNumberChange('(650)827-5672*101');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber))
          .to.equal(undefined);
      });
      it('Should Not Alert Anything - Call Number in (xxx) xxx-xxxx Format', async () => {
        RegionSettings.setData({ countryCode: 'US', areaCode: '' });
        Call.onToNumberChange('(650) 827-5672*101');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber))
          .to.equal(undefined);
      });
      it('Should Not Alert Anything - Call Number in xxx-xxx-xxxx Format', async () => {
        RegionSettings.setData({ countryCode: 'US', areaCode: '' });
        Call.onToNumberChange('650-827-5672');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber))
          .to.equal(undefined);
      });
      it('Should Not Alert Anything - Call Number in xxx-xxx-xxxx*xxx Format', async () => {
        RegionSettings.setData({ countryCode: 'US', areaCode: '' });
        Call.onToNumberChange('650-827-5672*101');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber))
          .to.equal(undefined);
      });
    });

    conditionalDescribe('Validation with Region Setting', function () {
      this.timeout(10000);
      beforeEach(async function () {
        const isAlertClear = await waitUntilEqual(() => {
          Alert.dismissAll();
          return Alert.state.messages.length;
        }, 'Alert', 0, 5);
        if (!isAlertClear) {
          console.error('Alert is not cleared after dismissAll');
          this.skip();
        }
      });
      it('Should Alert No AreaCode - Call 7 Digital Number with US Dialing Plan without Area Code', async () => {
        RegionSettings.setData({ countryCode: 'US', areaCode: '' });
        Call.onToNumberChange('6545672');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode))
          .to.not.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber))
          .to.equal(undefined);
      });
      it('Should Alert No AreaCode - Call 7 Digital Number with CA Dialing Plan without Area Code', async () => {
        RegionSettings.setData({ countryCode: 'CA', areaCode: '' });
        Call.onToNumberChange('6545672');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode))
          .to.not.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension))
          .to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber))
          .to.equal(undefined);
      });
      it('Should Not Alert Anything - Call 7 Digital Number with US Dialing Plan and Area Code', async function () {
        RegionSettings.setData({ countryCode: 'US', areaCode: '650' });
        Call.onToNumberChange('6545672');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension)).to.equal(undefined);
      });
      it('Should Not Alert Anything - Call 7 Digital Number with CA Dialing Plan and Area Code', async function () {
        RegionSettings.setData({ countryCode: 'CA', areaCode: '650' });
        Call.onToNumberChange('6545672');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension)).to.equal(undefined);
      });
      it('Should Not Alert Anything - Call 7 Digital Number with non US/CA Dialing Plan', async function () {
        RegionSettings.setData({ countryCode: 'GB', areaCode: '' });
        Call.onToNumberChange('6545672');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension)).to.equal(undefined);
      });
      it('Should Alert Special Number - Call 911 with US Dialing Plan', async function () {
        RegionSettings.setData({ countryCode: 'US', areaCode: '' });
        Call.onToNumberChange('911');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber)).to.not.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension)).to.equal(undefined);
      });
      it('Should Alert Special Number - Call 999 with GB Dialing Plan', async function () {
        RegionSettings.setData({ countryCode: 'GB', areaCode: '' });
        Call.onToNumberChange('999');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber)).to.not.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension)).to.equal(undefined);
      });
      it('Should Not Alert Special Number - Call 999 with US Dialing Plan', async function () {
        RegionSettings.setData({ countryCode: 'US', areaCode: '' });
        Call.onToNumberChange('999');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber)).to.equal(undefined);
      });
      it('Should Not Alert Special Number - Call 911 with GB Dialing Plan', async function () {
        RegionSettings.setData({ countryCode: 'GB', areaCode: '' });
        Call.onToNumberChange('911');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber)).to.equal(undefined);
      });
      it('Should Not Alert Anything - Call 101(Existed Extension/Not Special Number) with US Dialing Plan', async function () {
        RegionSettings.setData({ countryCode: 'US', areaCode: '' });
        Call.onToNumberChange('101');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension)).to.equal(undefined);
      });
      it('Should Alert Special Number - Call 101(Existed Extension/Speical Number) with GB Dialing Plan', async function () {
        RegionSettings.setData({ countryCode: 'GB', areaCode: '' });
        Call.onToNumberChange('101');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber)).to.not.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension)).to.equal(undefined);
      });
      it('Should Not Alert Anything - Call 102(Existed Extension) with GB Dialing Plan', async function () {
        RegionSettings.setData({ countryCode: 'GB', areaCode: '' });
        Call.onToNumberChange('102');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension)).to.equal(undefined);
      });
      it('Should Alert Not An Extension - Call 998(Non Extension) with US Dialing Plan', async function () {
        RegionSettings.setData({ countryCode: 'US', areaCode: '' });
        Call.onToNumberChange('998');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension)).to.not.equal(undefined);
      });
      it('Should Alert Not An Extension - Call 998(Non Extension) with GB Dialing Plan', async function () {
        RegionSettings.setData({ countryCode: 'GB', areaCode: '' });
        Call.onToNumberChange('998');
        await Call.onCall();
        expect(containsErrorMessage(Alert.state.messages, callErrors.noToNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.noAreaCode)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.specialNumber)).to.equal(undefined);
        expect(containsErrorMessage(Alert.state.messages, callErrors.notAnExtension)).to.not.equal(undefined);
      });
    });
  });
};
