import cleanNumber from '../cleanNumber';
import { formatE164 } from 'phoneformat.js';

/**
 * @function
 * @description Normalize phone numbers into E164 format
 * @param {String} params.phoneNumber
 * @param {Boolean} params.removeExtension
 * @param {String} params.countryCode
 * @param {String} params.areaCode
 * @return {String}
 */
export default function normalizeNumber({
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

  let normalizedNumber;
  if (
    !hasPlus &&
    number.length === 7 &&
    (countryCode === 'CA' || countryCode === 'US') &&
    areaCode !== ''
  ) {
    normalizedNumber = formatE164(countryCode, `${areaCode + number}`);
  } else {
    normalizedNumber = formatE164(countryCode, `${hasPlus ? '+' : ''}${number}`);
  }

  return extension && !removeExtension ?
    `${normalizedNumber}*${extension}` :
    normalizedNumber;
}
