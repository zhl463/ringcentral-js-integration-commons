const cleanRegex = /[^\d*+#]/g;
const plusRegex = /\+/g;
const extensionDelimiter = /[*#]/g;
/**
 * @function
 * @param {String} phoneNumber
 * @description Remove any characters except numeric, #, *, and leading +. We do not consider the 
 * situation that a number contains several *, # or a combination of these 2 symbols strictly.
 */
export default function cleanNumber(phoneNumber) {
  const cleaned = phoneNumber.replace(cleanRegex, '');
  const hasPlus = cleaned[0] === '+';
  const output = cleaned.replace(plusRegex, '')
    .split(extensionDelimiter)
    .slice(0, 2)
    .join('*');
  return hasPlus ?
    `+${output}` :
    output;
}
