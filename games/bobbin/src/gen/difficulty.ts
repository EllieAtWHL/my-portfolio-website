// Difficulty configs (generator v1). Changing any value here changes what
// codes build, so it needs a generator version bump - see core/codes.ts.
// `casual` is the target win-rate band for the casual simulated player (one
// who reacts to what's on screen but doesn't plan ahead).

export type Difficulty = "E" | "M" | "H";
export type PictureType = "rings" | "waves" | "quilt" | "sprite" | "mix";
export type DealMode = "round-robin" | "random" | "mixed";

export interface DifficultyConfig {
  label: string;
  size: readonly [number, number];
  colours: readonly [number, number];
  /** Scramble window: 0 keeps the ideal peel order, ~100 is a full shuffle. */
  window: number;
  rack: number;
  belt: number;
  maxCap: number;
  deal: DealMode;
  casual: readonly [number, number];
  /** Picture generators to pick from; repeats weight the pick. */
  pics: readonly PictureType[];
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  E: {
    label: "Easy",
    size: [9, 10],
    colours: [4, 4],
    window: 100,
    rack: 4,
    belt: 4,
    maxCap: 20,
    deal: "random",
    casual: [0.45, 0.85],
    pics: ["rings", "waves", "quilt", "sprite", "mix"],
  },
  M: {
    label: "Medium",
    size: [11, 12],
    colours: [5, 5],
    window: 40,
    rack: 3,
    belt: 4,
    maxCap: 20,
    deal: "random",
    casual: [0.15, 0.45],
    pics: ["rings", "waves", "quilt", "mix"],
  },
  H: {
    label: "Hard",
    size: [12, 13],
    colours: [6, 6],
    window: 100,
    rack: 3,
    belt: 4,
    maxCap: 20,
    deal: "random",
    casual: [0, 0.12],
    pics: ["rings", "rings", "waves", "quilt"],
  },
};

/** Number of supply columns bobbins are dealt into. */
export const COLUMNS = 3;
