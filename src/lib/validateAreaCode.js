export default function validateAreaCode(code) {
  return !(
    code === undefined ||
    code.trim().length === 0 ||
    (code.length > 0 && (code.length !== 3 || code[0] === '0'))
  );
}
