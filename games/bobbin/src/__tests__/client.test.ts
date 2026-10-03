/** @jest-environment node */
import { PuzzleSource } from "../gen/client.ts";
import { generate } from "../gen/generate.ts";

// A stand-in Worker that answers on the next microtask, like the real one would.
class FakeWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  posted: string[] = [];
  terminated = false;
  private readonly mode: "ok" | "crash";
  constructor(mode: "ok" | "crash" = "ok") {
    this.mode = mode;
  }
  postMessage({ code }: { code: string }) {
    this.posted.push(code);
    queueMicrotask(() => {
      if (this.mode === "crash") this.onerror?.();
      else this.onmessage?.({ data: { code, puzzle: generate(code) } } as MessageEvent);
    });
  }
  terminate() {
    this.terminated = true;
  }
}

describe("PuzzleSource", () => {
  it("generates in the worker and caches, so Restart never regenerates", async () => {
    const worker = new FakeWorker();
    const source = new PuzzleSource(() => worker as unknown as Worker);
    const [a, b] = await Promise.all([source.get("E-2222"), source.get("E-2222")]);
    expect(a).toBe(b);
    expect(await source.get("E-2222")).toBe(a);
    expect(worker.posted).toEqual(["E-2222"]);
  });

  it("falls back to generating inline when the worker crashes", async () => {
    const worker = new FakeWorker("crash");
    const source = new PuzzleSource(() => worker as unknown as Worker);
    const p = await source.get("M-2222");
    expect(p.code).toBe("M-2222");
    expect(worker.terminated).toBe(true);
  });

  it("works with no worker at all", async () => {
    const source = new PuzzleSource(() => {
      throw new Error("Workers unsupported");
    });
    expect((await source.get("H-2222")).code).toBe("H-2222");
    expect((await new PuzzleSource().get("E-ZZZZ")).code).toBe("E-ZZZZ");
  });

  it("passes worker errors on to the caller", async () => {
    const source = new PuzzleSource(() => {
      const w = new FakeWorker();
      w.postMessage = ({ code }) => queueMicrotask(() => w.onmessage?.({ data: { code, error: "boom" } } as MessageEvent));
      return w as unknown as Worker;
    });
    await expect(source.get("E-2222")).rejects.toThrow("boom");
  });
});
