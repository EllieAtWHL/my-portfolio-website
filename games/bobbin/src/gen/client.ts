// Main-thread side of puzzle generation. Uses the Web Worker when it can and
// falls back to generating inline if workers aren't available or fail, so
// the game always works - just possibly with a brief pause.
import { generate, type Puzzle } from "./generate.ts";

type Pending = { resolve: (p: Puzzle) => void; reject: (e: Error) => void };

export class PuzzleSource {
  private worker: Worker | null = null;
  private readonly pending = new Map<string, Pending[]>();
  private readonly cache = new Map<string, Puzzle>();

  constructor(createWorker?: () => Worker) {
    try {
      this.worker = createWorker?.() ?? null;
    } catch {
      this.worker = null;
    }
    if (this.worker) {
      this.worker.onmessage = (e: MessageEvent<{ code: string; puzzle?: Puzzle; error?: string }>) => {
        const { code, puzzle, error } = e.data;
        const waiters = this.pending.get(code) ?? [];
        this.pending.delete(code);
        if (puzzle) this.cache.set(code, puzzle);
        for (const w of waiters) {
          if (puzzle) w.resolve(puzzle);
          else w.reject(new Error(error ?? "Generation failed"));
        }
      };
      this.worker.onerror = () => this.fallBackToInline();
    }
  }

  /** The puzzle for a canonical code; cached, so Restart never regenerates. */
  get(code: string): Promise<Puzzle> {
    const cached = this.cache.get(code);
    if (cached) return Promise.resolve(cached);
    if (!this.worker) return Promise.resolve(this.generateInline(code));
    return new Promise((resolve, reject) => {
      const waiters = this.pending.get(code);
      if (waiters) waiters.push({ resolve, reject });
      else {
        this.pending.set(code, [{ resolve, reject }]);
        this.worker!.postMessage({ code });
      }
    });
  }

  private generateInline(code: string): Puzzle {
    const puzzle = generate(code);
    this.cache.set(code, puzzle);
    return puzzle;
  }

  private fallBackToInline() {
    this.worker?.terminate();
    this.worker = null;
    for (const [code, waiters] of this.pending) {
      for (const w of waiters) {
        try {
          w.resolve(this.generateInline(code));
        } catch (error) {
          w.reject(error as Error);
        }
      }
    }
    this.pending.clear();
  }
}
