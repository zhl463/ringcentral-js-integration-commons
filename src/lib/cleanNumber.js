const cleanRegex = /[^\d*+#]/g;
const plusRegex = /\+/g;

/**
 * @function
 * @param {String} phoneNumber
 * @description Remove any characters except numeric, #, *, and leading +
 */
export default function cleanNumber(phoneNumber) {
  // remove everything except numerics,#, *, and leading +
  const result = phoneNumber.replace(cleanRegex, '');
  return result[0] === '+' ?
    `+${result.substring(1).replace(plusRegex, '')}` :
    result;
}
