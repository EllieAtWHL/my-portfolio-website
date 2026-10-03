// Puzzle codes: `D-XXXX`, where D is the difficulty (E/M/H) and XXXX is a
// 20-bit seed in a 32-character alphabet without look-alikes (no 0/O, 1/I).
//
// Hidden versioning: a code with no prefix means generator v1. When a change
// alters what codes build, bump the generator version, keep the old generator
// frozen, and new codes get a visible numeric prefix (`2M-4K7P`). The prefix
// is unambiguous because the difficulty letter always follows it. Only add a
// version to SUPPORTED_VERSIONS once its generator exists.

import type { Difficulty } from "../gen/difficulty.ts";

export const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const CURRENT_VERSION = 1;
export const SUPPORTED_VERSIONS: readonly number[] = [1];
export const INVALID_CODE_MESSAGE =
  "Codes look like M-4K7P: E, M or H, then four letters or numbers.";

export interface PuzzleCode {
  version: number;
  difficulty: Difficulty;
  seed: number;
  /** Canonical form, e.g. "M-4K7P" (v1) or "2M-4K7P". */
  code: string;
}

export function formatCode(version: number, difficulty: Difficulty, seed: number): string {
  let chars = "";
  for (let i = 0, n = seed; i < 4; i++, n = Math.floor(n / 32)) chars = ALPHABET[n % 32] + chars;
  return (version > 1 ? String(version) : "") + difficulty + "-" + chars;
}

// Forgiving: case-insensitive, hyphen (or any punctuation/space) optional.
export function parseCode(input: unknown): PuzzleCode | null {
  const cleaned = String(input ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const m = cleaned.match(/^([2-9])?([EMH])([2-9A-HJ-NP-Z]{4})$/);
  if (!m) return null;
  const version = m[1] ? Number(m[1]) : 1;
  if (!SUPPORTED_VERSIONS.includes(version)) return null;
  const difficulty = m[2] as Difficulty;
  let seed = 0;
  for (const ch of m[3]) seed = seed * 32 + ALPHABET.indexOf(ch);
  return { version, difficulty, seed, code: formatCode(version, difficulty, seed) };
}

// Picking a fresh code isn't part of generation, so Math.random is fine here.
export function randomCode(difficulty: Difficulty, random: () => number = Math.random): string {
  return formatCode(CURRENT_VERSION, difficulty, Math.floor(random() * 32 ** 4));
}
