// The entry's self-test: it runs main.ts exactly as the grader does — twice, in two throwaway output directories in
// the repository's own scratch tree — and judges what it wrote. It also proves the entrypoint fails loudly instead
// of writing half a POST.json when the file it hands over is missing, oversized or malformed.
//
//   node test/selftest.mjs
//
// Exit code 0 when every case passes, 1 otherwise. Nothing here is part of the entry: the grader runs main.ts and
// reads /output/POST.json, never this file.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = join(ROOT, 'main.ts');
const POST = join(ROOT, 'POST.json');

let failures = 0;
function check(name, ok, detail = '') {
  process.stdout.write(`${ok ? 'ok  ' : 'FAIL'}  ${name}${ok || !detail ? '' : ` — ${detail}`}\n`);
  if (!ok) failures += 1;
}

// Runs the entrypoint against one bot directory and one output directory, and answers what it wrote and its exit
// code. A failing case never throws here; it is the exit code the test judges.
function runEntry(botDir, outDir) {
  return spawnSync(process.execPath, [ENTRY], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, MAKEFUN_BOT_DIR: botDir, MAKEFUN_OUTPUT_DIR: outDir },
  });
}

const scratch = mkdtempSync(join(tmpdir(), 'gta6-meme-x-selftest-'));
try {
  // 1. the two runs the grader makes must agree, byte for byte, with each other and with the repository's file.
  const a = join(scratch, 'run-a');
  const b = join(scratch, 'run-b');
  const runA = runEntry(ROOT, a);
  const runB = runEntry(ROOT, b);
  check('run 1 exits 0', runA.status === 0, runA.stderr.trim());
  check('run 2 exits 0', runB.status === 0, runB.stderr.trim());
  check('run 1 prints nothing on stdout', runA.stdout === '', JSON.stringify(runA.stdout));

  const wrote = readFileSync(join(a, 'POST.json'));
  const wroteAgain = readFileSync(join(b, 'POST.json'));
  const source = readFileSync(POST);
  check('the two runs wrote the same bytes', wrote.equals(wroteAgain));
  check('what it wrote is the repository POST.json, byte for byte', wrote.equals(source));

  // 2. the address the file holds is one the gate would read: a JSON object with a url string.
  const parsed = JSON.parse(wrote.toString('utf8'));
  check('POST.json parses to an object with a url string', typeof parsed?.url === 'string' && parsed.url !== '');

  // 3. the entrypoint is what the bounty asks for: node22, the standard library, and no network.
  const entrySource = readFileSync(ENTRY, 'utf8');
  check('it imports only node: builtins', /^import .*from 'node:/m.test(entrySource));
  check('it reaches no network', !/\b(fetch|http|https|net|dgram)\b\s*\(/.test(entrySource));

  // 4. a repository with no POST.json must fail the run, not write an empty one.
  const empty = join(scratch, 'no-post');
  mkdirSync(empty, { recursive: true });
  const missing = runEntry(empty, join(scratch, 'no-post-out'));
  check('a missing POST.json fails the run', missing.status === 1, `exit ${missing.status}`);
  check('a missing POST.json writes no output file', !hasOutput(join(scratch, 'no-post-out')));

  // 5. a malformed one must fail it too.
  const broken = join(scratch, 'broken');
  mkdirSync(broken, { recursive: true });
  writeFileSync(join(broken, 'POST.json'), '{not json');
  const malformed = runEntry(broken, join(scratch, 'broken-out'));
  check('a malformed POST.json fails the run', malformed.status === 1, `exit ${malformed.status}`);
  check('a malformed POST.json writes no output file', !hasOutput(join(scratch, 'broken-out')));

  // 6. one over the gate's 16384-byte cap must fail it as well.
  const oversized = join(scratch, 'big');
  mkdirSync(oversized, { recursive: true });
  writeFileSync(join(oversized, 'POST.json'), JSON.stringify({ url: 'x'.repeat(17 * 1024) }));
  const tooBig = runEntry(oversized, join(scratch, 'big-out'));
  check('an oversized POST.json fails the run', tooBig.status === 1, `exit ${tooBig.status}`);
  check('an oversized POST.json writes no output file', !hasOutput(join(scratch, 'big-out')));

  // 7. MAKEFUN_VERBOSE=1 reports the copy instead of staying silent, and the placeholder this repository still
  // holds is warned about on stderr while the copy still goes through.
  const verbose = spawnSync(process.execPath, [ENTRY], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, MAKEFUN_BOT_DIR: ROOT, MAKEFUN_OUTPUT_DIR: join(scratch, 'verbose'), MAKEFUN_VERBOSE: '1' },
  });
  check('MAKEFUN_VERBOSE=1 reports the url it read', verbose.stdout.includes(parsed.url), verbose.stdout.trim());
  check('it still exits 0 when it warns', verbose.status === 0, `exit ${verbose.status}`);
  check(
    'a placeholder url is warned about, not silently handed over',
    /placeholder/.test(verbose.stderr),
    verbose.stderr.trim(),
  );

  // 8. a post address of the right shape is handed over with no warning at all.
  const good = join(scratch, 'good');
  mkdirSync(good, { recursive: true });
  writeFileSync(join(good, 'POST.json'), '{"url":"https://x.com/rioxbt/status/1999999999999999999"}\n');
  const goodRun = runEntry(good, join(scratch, 'good-out'));
  check('a real post address is handed over', goodRun.status === 0, goodRun.stderr.trim());
  check('a real post address raises no warning', goodRun.stderr === '', goodRun.stderr.trim());

  // 9. handing a file over to itself would truncate the repository's own POST.json, so it is refused.
  const same = spawnSync(process.execPath, [ENTRY], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, MAKEFUN_BOT_DIR: ROOT, MAKEFUN_OUTPUT_DIR: ROOT },
  });
  check('a source and output directory that are the same file is refused', same.status === 1, `exit ${same.status}`);
  check('the refused run left POST.json whole', readFileSync(POST).equals(source));
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

function hasOutput(dir) {
  try {
    readFileSync(join(dir, 'POST.json'));
    return true;
  } catch {
    return false;
  }
}

process.stdout.write(failures === 0 ? '\nall checks passed\n' : `\n${failures} check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);
