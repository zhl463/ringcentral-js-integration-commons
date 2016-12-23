import fetchList from '../../lib/fetchList';
import DataFetcher from '../../lib/DataFetcher';

export default class ExtensionPhoneNumber extends DataFetcher {
  constructor({
    client,
    ...options,
  }) {
    super({
      name: 'extensionPhoneNumber',
      client,
      fetchFunction: () => (fetchList(params => (
        client.account().extension().phoneNumber().list(params)
      ))),
      ...options,
    });

    this.addSelector(
      'numbers',
      () => this.data,
      data => data || [],
    );

    this.addSelector(
      'companyNumbers',
      () => this.numbers,
      phoneNumbers => phoneNumbers.filter(p => p.usageType === 'CompanyNumber'),
    );

    this.addSelector(
      'mainCompanyNumber',
      () => this.numbers,
      phoneNumbers => phoneNumbers.find(p => p.usageType === 'MainCompanyNumber'),
    );

    this.addSelector(
      'directNumbers',
      () => this.numbers,
      phoneNumbers => phoneNumbers.filter(p => p.usageType === 'DirectNumber'),
    );

    this.addSelector(
      'callerIdNumbers',
      () => this.numbers,
      phoneNumbers => phoneNumbers.filter(p => (
        (p.features && p.features.indexOf('CallerId') !== -1) ||
        (p.usageType === 'ForwardedNumber' && p.status === 'PortedIn')
      )),
    );

    this.addSelector(
      'smsSenderNumbers',
      () => this.numbers,
      phoneNumbers =>
        phoneNumbers.filter(
          p => (p.features && p.features.indexOf('SmsSender') !== -1)
        ),
    );
  }

  get numbers() {
    return this._selectors.numbers();
  }

  get mainCompanyNumber() {
    return this._selectors.mainCompanyNumber();
  }

  get companyNumbers() {
    return this._selectors.companyNumbers();
  }

  get directNumbers() {
    return this._selectors.directNumbers();
  }

  get callerIdNumbers() {
    return this._selectors.callerIdNumbers();
  }

  get smsSenderNumbers() {
    return this._selectors.smsSenderNumbers();
  }
}
