export function isPowerOfTwo(value) {
  return (
    Number.isInteger(value) && value >= 2 && Number.isInteger(Math.log2(value))
  );
}
