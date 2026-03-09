/**
 * sync-paths.js
 *
 * Syncs PathPlanner path files from the robot code into the dashboard's
 * public/paths folder, and auto-generates automap.json by parsing the
 * .auto files so you never need to maintain it by hand.
 *
 * Usage:  node scripts/sync-paths.js            (one-shot sync)
 *         node scripts/sync-paths.js --watch     (continuous polling)
 *    or:  npm run sync-paths / npm run sync-paths:watch
 *
 * Configure ROBOT_PROJECT_PATH below (or pass it as an env var).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Configuration ──────────────────────────────────────────────
const ROBOT_PROJECT_PATH =
  process.env.ROBOT_PROJECT_PATH ||
  path.resolve(__dirname, '..', '..', 'Rebuilt');

const PATHPLANNER_DIR = path.join(
  ROBOT_PROJECT_PATH,
  'src',
  'main',
  'deploy',
  'pathplanner'
);
const PATHS_SRC = path.join(PATHPLANNER_DIR, 'paths');
const AUTOS_SRC = path.join(PATHPLANNER_DIR, 'autos');

const DASHBOARD_PATHS_DIR = path.join(__dirname, '..', 'public', 'paths');

// ── Helpers ────────────────────────────────────────────────────

/** Recursively collect all pathName references from an auto command tree. */
function extractPathNames(command) {
  const names = [];
  if (!command) return names;

  if (command.type === 'path' && command.data?.pathName) {
    names.push(command.data.pathName);
  }

  // Recurse into sequential / parallel / deadline / race groups
  const children = command.data?.commands;
  if (Array.isArray(children)) {
    for (const child of children) {
      names.push(...extractPathNames(child));
    }
  }

  return names;
}

// ── Main sync ──────────────────────────────────────────────────

function sync() {
  // Validate source directories exist
  if (!fs.existsSync(PATHS_SRC)) {
    console.error(`❌  Path source folder not found: ${PATHS_SRC}`);
    console.error('    Make sure ROBOT_PROJECT_PATH is set correctly.');
    process.exit(1);
  }

  // Ensure destination exists
  fs.mkdirSync(DASHBOARD_PATHS_DIR, { recursive: true });

  // 1. Copy all .path files
  const pathFiles = fs.readdirSync(PATHS_SRC).filter((f) => f.endsWith('.path'));
  let copied = 0;
  for (const file of pathFiles) {
    fs.copyFileSync(path.join(PATHS_SRC, file), path.join(DASHBOARD_PATHS_DIR, file));
    copied++;
  }
  console.log(`✔  Copied ${copied} .path file(s) from robot code`);

  // 2. Parse .auto files and build automap
  const automap = {};

  if (fs.existsSync(AUTOS_SRC)) {
    const autoFiles = fs.readdirSync(AUTOS_SRC).filter((f) => f.endsWith('.auto'));

    for (const file of autoFiles) {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(AUTOS_SRC, file), 'utf-8'));
        const autoName = path.basename(file, '.auto');
        const pathNames = extractPathNames(content.command);

        if (pathNames.length > 0) {
          automap[autoName] = pathNames;
        }
      } catch (err) {
        console.warn(`⚠  Skipping ${file}: ${err.message}`);
      }
    }
  }

  const automapPath = path.join(DASHBOARD_PATHS_DIR, 'automap.json');
  fs.writeFileSync(automapPath, JSON.stringify(automap, null, 2) + '\n');
  console.log(`✔  Generated automap.json with ${Object.keys(automap).length} auto routine(s):`);
  for (const [name, paths] of Object.entries(automap)) {
    console.log(`     ${name} → [${paths.join(', ')}]`);
  }
}

// ── Watch / Poll mode ──────────────────────────────────────────

const POLL_INTERVAL_MS = 3000; // check every 3 seconds

/** Build a snapshot of mtimes for all relevant files in a directory. */
function getFileSnapshot(dir, ext) {
  const snap = {};
  if (!fs.existsSync(dir)) return snap;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(ext))) {
    try {
      snap[file] = fs.statSync(path.join(dir, file)).mtimeMs;
    } catch { /* file may have been deleted between readdir and stat */ }
  }
  return snap;
}

function snapshotsEqual(a, b) {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => b[k] === a[k]);
}

function startWatching() {
  let lastPaths = {};
  let lastAutos = {};

  console.log(`Watching for changes every ${POLL_INTERVAL_MS / 1000}s …\n`);

  // Initial sync
  sync();
  lastPaths = getFileSnapshot(PATHS_SRC, '.path');
  lastAutos = getFileSnapshot(AUTOS_SRC, '.auto');

  setInterval(() => {
    const curPaths = getFileSnapshot(PATHS_SRC, '.path');
    const curAutos = getFileSnapshot(AUTOS_SRC, '.auto');

    if (!snapshotsEqual(lastPaths, curPaths) || !snapshotsEqual(lastAutos, curAutos)) {
      console.log(`\nChange detected – re-syncing …`);
      sync();
      lastPaths = curPaths;
      lastAutos = curAutos;
    }
  }, POLL_INTERVAL_MS);
}

// ── Entry point ────────────────────────────────────────────────

const watchMode = process.argv.includes('--watch');

if (watchMode) {
  startWatching();
} else {
  sync();
  console.log('\nDone! Dashboard paths are in sync with robot code.');
}
