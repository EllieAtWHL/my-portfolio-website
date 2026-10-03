// Engine-independent replacements for Math.sin, Math.atan2 and Math.hypot,
// used by the picture generators.
//
// ECMAScript lets engines approximate sin/atan2/hypot, and V8, SpiderMonkey
// and JavaScriptCore can disagree in the last bit. The generators floor()
// these results into colour bands, and some inputs land exactly on a band
// edge (e.g. ring sectors on the diagonals, where atan2 is a multiple of
// pi/4), so a 1-ulp difference would make the same code build a different
// puzzle on Chrome and Safari. These versions use only + - * / and
// Math.sqrt/round/abs, which IEEE 754 and the spec make exact everywhere.
// Accuracy is ~1e-16 - plenty, since only determinism matters here.
//
// Tests can swap in the native Math functions (see the prototype-fidelity
// test) to prove the rest of the port matches the prototype exactly.

const HALF_PI = Math.PI / 2;

// Taylor series, Horner form; |r| <= pi/4 so terms past r^19 are below 1e-19.
function sinSeries(r: number): number {
  const r2 = r * r;
  let s = 1;
  for (let n = 19; n >= 3; n -= 2) s = 1 - (r2 / (n * (n - 1))) * s;
  return r * s;
}

function cosSeries(r: number): number {
  const r2 = r * r;
  let s = 1;
  for (let n = 20; n >= 2; n -= 2) s = 1 - (r2 / (n * (n - 1))) * s;
  return s;
}

export function sin(x: number): number {
  const k = Math.round(x / HALF_PI);
  const r = x - k * HALF_PI;
  switch (((k % 4) + 4) % 4) {
    case 0:
      return sinSeries(r);
    case 1:
      return cosSeries(r);
    case 2:
      return -sinSeries(r);
    default:
      return -cosSeries(r);
  }
}

function atan(z: number): number {
  const sign = z < 0 ? -1 : 1;
  let a = Math.abs(z);
  const inverted = a > 1;
  if (inverted) a = 1 / a;
  // atan(a) = 2 * atan(a / (1 + sqrt(1 + a^2))), twice: a <= tan(pi/16) ~ 0.2
  a = a / (1 + Math.sqrt(1 + a * a));
  a = a / (1 + Math.sqrt(1 + a * a));
  const a2 = a * a;
  let s = 0;
  for (let n = 27; n >= 3; n -= 2) s = (1 / n - a2 * s);
  const result = 4 * (a - a * a2 * s);
  return sign * (inverted ? HALF_PI - result : result);
}

export function atan2(y: number, x: number): number {
  if (x > 0) return atan(y / x);
  if (x < 0) return y >= 0 ? atan(y / x) + Math.PI : atan(y / x) - Math.PI;
  if (y > 0) return HALF_PI;
  if (y < 0) return -HALF_PI;
  return 0;
}

export function hypot(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}
