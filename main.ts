// gta6-meme-x-01 — the entrypoint the grader runs (node22, repository root).
//
// The entry is the post on X, never this program: the house reads the post from X, makes a dossier of its first
// picture and its text, and hands that to the judge. All main.ts has to do is hand the post's address over, so it
// copies POST.json from the repository (/bot, or MAKEFUN_BOT_DIR) to /output/POST.json (MAKEFUN_OUTPUT_DIR), byte
// for byte, and stops. Nothing this program writes about the post is judged.
//
// It is strict about the little it does: standard library only, no network, no wall clock, no file outside those
// two directories, and two runs of the entry write the same bytes. It is silent on success, as the starter is;
// MAKEFUN_VERBOSE=1 makes it report what it handed over. A POST.json the house will refuse — the starter's
// placeholder, a share link, a url of the wrong shape — is reported as a warning on stderr while the copy still
// goes through, so a local run says what the gate will say without ever changing what the repository holds.
//
// Exit codes: 0 the address was handed over (warnings allowed), 1 it could not be (nothing readable was written).

import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const BOT_DIR = resolve(process.env.MAKEFUN_BOT_DIR ?? '/bot');
const OUTPUT_DIR = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const SOURCE = join(BOT_DIR, 'POST.json');
const TARGET = join(OUTPUT_DIR, 'POST.json');
const VERBOSE = process.env.MAKEFUN_VERBOSE === '1';

// The gate's own cap for this file (RULES.txt, "The gate": post_file, a JSON object of at most 16384 bytes).
const MAX_POST_FILE_BYTES = 16 * 1024;

// The shapes the house reads as an X post's own address (RULES.txt, "The post file"): https://x.com/<handle>/status/<id>,
// the same on twitter.com, a www. or mobile. prefix before either, and the /i/web/status/<id> form. The id is digits
// only, and a query or fragment after it is read past.
const POST_ADDRESS =
  /^https:\/\/(?:(?:www\.|mobile\.)?(?:x|twitter)\.com\/(?:i\/web\/status\/|[A-Za-z0-9_]+\/(?:status|statuses)\/)\d+)(?:[?#]\S*)?$/;

function readPost(): { url: string; bytes: Buffer; extraKeys: string[] } {
  const bytes = readFileSync(SOURCE);
  if (bytes.byteLength > MAX_POST_FILE_BYTES) {
    throw new Error(`POST.json is ${bytes.byteLength} bytes, over the gate's ${MAX_POST_FILE_BYTES}-byte cap for it`);
  }

  // A byte-order mark is not JSON, but a file that carries one is still perfectly readable.
  const text = bytes.toString('utf8').replace(/^\uFEFF/, '');

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`POST.json is not valid JSON (${(err as Error).message})`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('POST.json is not a JSON object');
  }

  const url = (parsed as Record<string, unknown>).url;
  if (typeof url !== 'string' || url.trim() === '') {
    throw new Error('POST.json carries no url string');
  }

  const extraKeys = Object.keys(parsed as Record<string, unknown>).filter((key) => key !== 'url');
  return { url, bytes, extraKeys };
}

// Advisory only: these never stop the copy, so the grader still reads the repository's own POST.json, and they say
// what the house would say about it.
function noticesFor(url: string, extraKeys: string[]): string[] {
  const notices: string[] = [];
  if (/[<>{]/.test(url)) {
    notices.push(
      'url is still the starter placeholder: publish the meme on X, paste the address the post shows into POST.json, and commit it',
    );
  } else if (!POST_ADDRESS.test(url)) {
    notices.push(`url is not a shape the house reads as a post's own address: ${url}`);
  }
  if (extraKeys.length > 0) {
    notices.push(`POST.json carries keys the gate does not read: ${extraKeys.join(', ')}`);
  }
  return notices;
}

function main(): void {
  // Copying a file onto itself would hand the grader a truncated POST.json, so refuse it outright.
  if (SOURCE === TARGET) {
    throw new Error(`${SOURCE} and ${TARGET} are the same file: MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR must differ`);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const post = readPost();
  const notices = noticesFor(post.url, post.extraKeys);

  // The grader reads /output/POST.json, so the repository's own bytes are what it must see, unchanged.
  copyFileSync(SOURCE, TARGET);
  if (!readFileSync(TARGET).equals(post.bytes)) {
    throw new Error(`the bytes handed to ${TARGET} are not the repository's POST.json`);
  }

  if (VERBOSE) {
    process.stdout.write(
      `handed over ${SOURCE} -> ${TARGET} (${statSync(TARGET).size} bytes)\nurl: ${post.url}\n`,
    );
  }
  for (const notice of notices) {
    process.stderr.write(`warning: ${notice}\n`);
  }
}

try {
  main();
} catch (err) {
  process.stderr.write(`POST.json could not be handed over from ${SOURCE}: ${(err as Error).message}\n`);
  process.exit(1);
}
