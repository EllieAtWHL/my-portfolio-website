// Runs the playtested prototype's own generator (reference/bobbin/prototype.html)
// in Node and writes its output for a fixed set of codes. The port's
// prototype-fidelity test compares against this file, so it proves the port
// builds the same puzzles as the prototype rather than just matching itself.
//
// Usage: node games/bobbin/scripts/prototype-fixtures.mjs
// Only needs re-running if the code list below changes - the prototype is frozen.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");
const html = readFileSync(join(root, "reference/bobbin/prototype.html"), "utf8");

// Everything before `const TICK` is pure rules/generation code with no DOM access.
const script = html.split("<script>")[1].split("const TICK")[0];
const context = vm.createContext({ Math });
vm.runInContext(`${script}; this.generate = generate;`, context);

export const CODES = [
  "E-2222", "E-4K7P", "E-ZZZZ", "E-MNPQ", "E-8B3D", "E-QR5T",
  "M-2222", "M-4K7P", "M-ZZZZ", "M-MNPQ", "M-8B3D", "M-QR5T",
  "H-2222", "H-4K7P", "H-ZZZZ", "H-MNPQ", "H-8B3D", "H-QR5T",
];

const out = {};
for (const code of CODES) {
  const lv = context.generate(code);
  out[code] = {
    grid: lv.grid,
    cols: lv.cols.map((col) => col.map((b) => ({ c: b.c, n: b.n }))),
    rack: lv.cfg.rack,
    belt: lv.cfg.belt,
  };
}
const target = join(here, "../src/__tests__/fixtures/prototype-v8.json");
writeFileSync(target, JSON.stringify(out) + "\n");
console.log(`Wrote ${CODES.length} prototype puzzles to ${target}`);
