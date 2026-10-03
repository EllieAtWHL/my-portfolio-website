// Placeholder entry point (WEB-195 only ports the pure core). The playable
// game - rendering, UI and the Web Worker - lands in WEB-196.
import { randomCode } from "./core/codes.ts";
import { generate } from "./gen/generate.ts";

const app = document.getElementById("app");
if (app) {
  const puzzle = generate(randomCode("E"));
  app.textContent = `Bobbin is coming soon. (Generated ${puzzle.code}: ${puzzle.grid.length}x${puzzle.grid.length}, ${puzzle.cols.flat().length} bobbins.)`;
}
