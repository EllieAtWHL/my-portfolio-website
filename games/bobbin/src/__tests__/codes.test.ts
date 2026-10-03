/** @jest-environment node */
import { ALPHABET, formatCode, parseCode, randomCode } from "../core/codes.ts";

describe("parseCode", () => {
  it("parses a canonical v1 code", () => {
    expect(parseCode("M-4K7P")).toEqual({ version: 1, difficulty: "M", seed: 2 * 32 ** 3 + 17 * 32 ** 2 + 5 * 32 + 21, code: "M-4K7P" });
  });

  it.each(["m4k7p", "m-4k7p", " M 4K7P ", "M_4K-7P"])("is forgiving about case and separators: %j", (input) => {
    expect(parseCode(input)?.code).toBe("M-4K7P");
  });

  it.each([
    ["", "empty"],
    ["X-4K7P", "unknown difficulty"],
    ["M-4K7", "too short"],
    ["M-4K7PQ", "too long"],
    ["M-4K7O", "look-alike O"],
    ["M-4K71", "look-alike 1"],
    ["M-IK7P", "look-alike I"],
    ["2M-4K7P", "unsupported generator version"],
    ["1M-4K7P", "v1 is never written with a prefix"],
  ])("rejects %j (%s)", (input) => {
    expect(parseCode(input)).toBeNull();
  });

  it("handles non-string input", () => {
    expect(parseCode(undefined)).toBeNull();
    expect(parseCode(null)).toBeNull();
  });

  it("covers every seed from 2222 to ZZZZ", () => {
    expect(parseCode("E-2222")?.seed).toBe(0);
    expect(parseCode("E-ZZZZ")?.seed).toBe(32 ** 4 - 1);
  });
});

describe("formatCode", () => {
  it("round-trips every alphabet character in every position", () => {
    for (let i = 0; i < 32; i++) {
      const seed = i * (1 + 32 + 32 ** 2 + 32 ** 3);
      const code = formatCode(1, "H", seed);
      expect(code).toBe("H-" + ALPHABET[i].repeat(4));
      expect(parseCode(code)?.seed).toBe(seed);
    }
  });

  it("only shows a version prefix after v1", () => {
    expect(formatCode(1, "E", 0)).toBe("E-2222");
    expect(formatCode(2, "E", 0)).toBe("2E-2222");
  });
});

describe("randomCode", () => {
  it("makes a valid code at the requested difficulty", () => {
    expect(randomCode("H", () => 0)).toBe("H-2222");
    expect(randomCode("E", () => 0.999999999)).toBe("E-ZZZZ");
    const code = randomCode("M");
    expect(parseCode(code)?.difficulty).toBe("M");
  });
});
