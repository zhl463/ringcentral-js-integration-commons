import { formatLocal } from 'phoneformat.js';
import cleanNumber from '../cleanNumber';

const SWITCH_US_CA = {
  US: 'CA',
  CA: 'US',
};

/**
 * @function
 * @description Format phone numbers
 * @param {String} params.phoneNumber
 * @param {Boolean} params.removeExtension
 * @param {String} params.countryCode
 * @param {String} params.areaCode
 * @return {String}
 */
export default function formatNumber({
  phoneNumber,
  removeExtension = false,
  countryCode = 'US',
  areaCode = '',
}) {
  const cleaned = cleanNumber(`${phoneNumber}`);
  const hasPlus = cleaned[0] === '+';
  const withoutPlus = hasPlus ? cleaned.substring(1) : cleaned;

  if (
    withoutPlus === '' ||
    withoutPlus[0] === '*' // service number
  ) return withoutPlus;

  const [
    number,
    extension,
  ] = withoutPlus.split('*');

  // extension or special number
  if (number.length <= 5) return number;

  let formattedNumber;
  if (countryCode === 'CA' || countryCode === 'US') {
    const numberWithAreaCode = (!hasPlus && number.length === 7 && areaCode !== '') ?
      (areaCode + number) :
      number;
    formattedNumber = formatLocal(countryCode, `${hasPlus ? '+' : ''}${numberWithAreaCode}`);
    if (formattedNumber[0] === '+' && number[0] === '1') {
      const switchedFormat = formatLocal(
        SWITCH_US_CA[countryCode],
        `+${numberWithAreaCode}`
      );
      if (switchedFormat[0] !== '+') formattedNumber = switchedFormat;
    }
  } else {
    formattedNumber = formatLocal(countryCode, `${hasPlus ? '+' : ''}${number}`);
  }

  return extension && !removeExtension ?
    `${formattedNumber} * ${extension}` :
    formattedNumber;
}
