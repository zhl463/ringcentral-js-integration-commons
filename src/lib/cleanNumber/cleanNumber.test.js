import { expect } from 'chai';
import cleanNumber, { hasNumber, hasInvalidChar } from '.';

describe('cleanNumber', () => {
  it(`should return numeric values if number only contains numeric values`, () => {
    expect(cleanNumber('6508370092')).to.equal('6508370092');
  });
  it(`should return '' if number is iamn%@onedi!@$%^&()_=\\][';/.,~nu><.,,?/mber`, () => {
    expect(cleanNumber("iamn%@onedi!@$%^&()_=\\][';/.,~nu><.,,?/mber")).to.equal('');
  });

  it(`should return numeric values with * if number contains numeric values and *`, () => {
    expect(cleanNumber('6508370092*101')).to.equal('6508370092*101');
  });
  it(`should return leading * if number contains leading *`, () => {
    expect(cleanNumber('*101')).to.equal('*101');
  });

  it(`should return numeric values with * if number contains numeric values and #`, () => {
    expect(cleanNumber('6508370092#101')).to.equal('6508370092*101');
  });
  it(`should return leading * if number contains leading #`, () => {
    expect(cleanNumber('#101')).to.equal('*101');
  });

  it(`should return leading + if number contains leading +`, () => {
    expect(cleanNumber('+16508370092')).to.equal('+16508370092');
  });
  it(`should not return + if + is not leading`, () => {
    expect(cleanNumber('165+08370092')).to.equal('16508370092');
  });

  it(`should return numeric value with +, * if number is +abc*10d1`, () => {
    expect(cleanNumber('+abc*10d1')).to.equal('+*101');
  });
  it(`should return numeric value with +, * if number is +abc#10d1`, () => {
    expect(cleanNumber('+abc#10d1')).to.equal('+*101');
  });
});

describe('hasInvalidChar', () => {
  it(`should return true if value is @#!123 (only allow number and *#+)`, () => {
    expect(hasInvalidChar('@#!123')).to.be.true;
  });
  it(`should return false if value is +#1*23`, () => {
    expect(hasInvalidChar('+#1*23')).to.be.fasle;
  });
});

describe('hasNumber', () => {
  it(`should return true if number is #123`, () => {
    expect(hasNumber('#123')).to.be.true;
  });
  it(`should return false if number is #&^%$`, () => {
    expect(hasNumber('#&^%$')).to.be.false;
  });
});
