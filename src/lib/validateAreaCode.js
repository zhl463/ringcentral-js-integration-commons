export default function validateAreaCode(code) {
  return !(
    code.length > 0 &&
    (
      code.length !== 3 ||
      code[0] === '0'
      // /^(0|1|8)/.test(code)
    )
  );
}
