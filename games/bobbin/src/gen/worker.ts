// Web Worker: builds puzzles off the main thread, so a slow phone never
// freezes the page while a new puzzle generates ("Knitting...").
import { generate } from "./generate.ts";

export interface GenerateRequest {
  code: string;
}

self.onmessage = (e: MessageEvent<GenerateRequest>) => {
  const { code } = e.data;
  try {
    self.postMessage({ code, puzzle: generate(code) });
  } catch (error) {
    self.postMessage({ code, error: String(error) });
  }
};
