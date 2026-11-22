// main.ts — Emberfall Duel's hand-in program for the make.fun bounty
// best-card-game-20261122-1826. It copies game/ and screenshots/ from this
// repository into the output directory and writes /output/dossier.json
// with buildDossier from vendor/makefun-game.ts.
//
// Run it exactly as the grader does: plain `node main.ts` with no flags.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = import.meta.dirname;
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Remove every entry inside a directory, never the directory itself. */
function clearDirectoryContents(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return;
  }
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function handIn() {
  const indexHtml = join(repoRoot, 'game', 'index.html');
  if (!existsSync(indexHtml)) {
    throw new Error(`no game/index.html at ${indexHtml}: the game is missing`);
  }
  if (!existsSync(join(repoRoot, 'screenshots'))) {
    throw new Error('no screenshots/ directory: the game has no screenshots');
  }
  clearDirectoryContents(outDir);
  cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`Emberfall Duel handed in: ${outDir}`);
}

handIn();
