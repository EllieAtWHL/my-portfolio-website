// Compares two nullable numbers for Array.prototype.sort, keeping an unset
// value (null/undefined) last regardless of ascending/descending direction -
// a placeholder value (e.g. Number.MAX_SAFE_INTEGER) would instead flip
// which end it lands on when direction reverses, since it's still just an
// ordinary value to a plain ascending/descending comparison.
export function compareNullableNumbers(
  a: number | null | undefined,
  b: number | null | undefined,
  direction: 'asc' | 'desc' = 'asc'
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a < b) return direction === 'asc' ? -1 : 1;
  if (a > b) return direction === 'asc' ? 1 : -1;
  return 0;
}
