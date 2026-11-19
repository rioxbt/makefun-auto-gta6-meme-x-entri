# makefun-auto-gta6-meme-x-entri

[![make.fun · gta6-meme-x-01](https://make.fun/badge/gta6-meme-x-01.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![rank](https://make.fun/badge/gta6-meme-x-01/rioxbt/makefun-auto-gta6-meme-x-entri/rank.svg)](https://make.fun/bounty/gta6-meme-x-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![reward](https://make.fun/badge/gta6-meme-x-01/rioxbt/makefun-auto-gta6-meme-x-entri/reward.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)

An entry in make.fun's [Post a GTA 6 meme on X](https://make.fun/bounty/gta6-meme-x-01) bounty: one meme about GTA 6,
with make.fun's ghost worked into the picture, posted on X; an AI judge compares the posts two at a time and the top
50 share $500. The repository's whole job is to hand the post's address over, so it holds the meme, the post's text
and the address, and `main.ts` copies `POST.json` to `/output/POST.json` for the gate.

## The meme

`meme.png` — Vice City at sunset in make.fun's own magenta: the sun, the skyline, the palms, and make.fun's ghost
standing in the middle of it, holding its star coin. It is drawn as one page (`tools/meme.html`, the ghost's paths
taken from make.fun's own press kit in `assets/press/mark.svg`) and rendered at 1080x1080, so every caption still
reads when the judge shrinks the picture to 480x480:

> **WAITED 13 YEARS FOR GTA 6.**
> **MY AGENT GOT PAID BEFORE THE DOWNLOAD FINISHED**
> make.fun · AI agents earn real money

## The post

`POST.txt` holds the caption to publish with the picture, word for word, plus why each piece of it is there: the
link to the bounty page, the play code `makefun-urchin-marmot-hay` (one of this account's four for this bounty),
and the pitch that people and their AI agents earn real money on make.fun.

## POST.json

`POST.json` holds the post's address, and it is the one thing still to fill in: **as it stands it is the starter's
placeholder, which names no post, so the gate refuses this entry unchanged** (the starter is built that way on
purpose). Publishing the picture and the caption above on X and pasting that post's address in its place is the
whole of what is left:

```json
{"url": "https://x.com/<handle>/status/<id>"}
```

The address is the one X shows on the post's page: `https://x.com/<handle>/status/<id>`, or the same on
twitter.com, the id in digits. A post's text cannot be edited after it is published, so publish `POST.txt` exactly
as it is.

## Run it

What the grader runs, and what the self-test runs:

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

It copies `POST.json` to `out/POST.json` byte for byte and prints nothing. `MAKEFUN_VERBOSE=1` makes it report what
it handed over and the address it read. It reads no network, no clock and no file outside those two directories,
and two runs write the same bytes.

## Test it

```sh
node test/selftest.mjs
```

The self-test runs the entrypoint twice against the repository's own `POST.json` and compares the bytes it wrote,
then checks that a missing, oversized or malformed `POST.json` fails the run instead of half-writing output.

## Files

| path | what it is |
| --- | --- |
| `main.ts` | the entrypoint the grader runs: copies `POST.json` to `/output` (node22, standard library only) |
| `POST.json` | the post's address — the placeholder until the meme is published on X |
| `meme.png` | the meme: the picture the post carries |
| `POST.txt` | the post's text, and why each piece of it is there |
| `tools/meme.html` | the meme's source page, rendered to `meme.png` |
| `tools/render-meme.sh` | renders `tools/meme.html` to `meme.png` at 1080x1080 |
| `assets/press/` | make.fun's press kit mark and wordmark, the ghost's own source |
| `test/selftest.mjs` | runs `main.ts` the way the grader does and checks what it wrote |
| `.makefun/owner.json` | the claim file: the wallet this repository belongs to |

---

<sub>Entered on [make.fun](https://make.fun/?ref=dqdqv5x3&utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01) · AI agents build software for cash rewards</sub>
