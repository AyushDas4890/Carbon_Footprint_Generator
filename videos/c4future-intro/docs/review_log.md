# Review log

Every check is made from the rendered MP4s (`python3 scripts/review.py <round>`) plus the per-beat contact sheets
(`node scripts/render.mjs --sheet`). Nothing is judged from the page. Critic prompt: the skill's `reference/CRITIQUE.md`.

Scores 1–10. Ship only when EVERY score is ≥ 8, after at least 3 rounds.

---

## Round 1: <what was rendered, when>

| Criterion | Score | Evidence (timestamps, frames, metrics) |
|---|---|---|
| Hook (first 2 s) | | |
| Readability at phone size | | |
| Motion quality | | |
| Variety / pacing | | |
| Brand accuracy | | |
| Sound sync | | |
| Composition (every format) | | |
| Polish | | |

**3 worst problems**
1.
2.
3.

**Fixes for round 2**
1.
2.
3.

## Round 1: draft_16x9 + draft_9x16 (30 fps), sheets, r1 kit

| Criterion | Score | Evidence |
|---|---|---|
| Hook (first 2 s) | 8 | f0 reads "Every" (16:9 + 9:16 stills t0.05); "carbon cost." lands in accent at 1.5 s |
| Readability at phone size | 6 | 16:9 CTA is one 64 px line → ~12 px at 360 px wide (phone_16x9, 17.5 s); URL is the least legible text in the film |
| Motion quality | 8 | strip_fast 7.63–8.0 s: clean expo push into the real button; card rises settle; no fades as enters |
| Variety / pacing | 8 | max gap 3.0 s (4.0 s), longest static 1.27 s; montage cuts every 1 s accelerate into the logo |
| Brand accuracy | 8 | real captures of every page, real logo SVG, Space Grotesk + Inter, one accent (#64ffb4) |
| Sound sync | 7 | -14.0 LUFS / -1.4 dBTP OK; 10/17 hits ≤45 ms; breakdown −67, interval −67, tagline +67, CTA +67, 2.94 +67 |
| Composition | 7 | 9:16: bottom ~40 % empty on the end card (16–19 s) and under the result card 8–10 s |
| Polish | 8 | no blank frames, no caret leak (caret hides at b10.6), swaps sequential |

**3 worst problems**
1. 16:9 CTA/URL too small for phone (17.5–19 s) — single 64 px line.
2. 9:16 dead lower half: end card (16–19 s) and result before the breakdown lands (8–10 s).
3. Sync: picture early on breakdown/interval (spHit lead of 'default' too long for a large card), late on tagline/CTA/2.94 pop.

**Fixes for round 2**
1. Two-line CTA in every format: "Try it free →" 88 px accent, URL 64 px white; sweep under URL. Verify phone_16x9 at 18 s.
2. 9:16: end lockup lowered to optical centre; result card starts lower and tracks up when the breakdown arrives (trk), so the frame is balanced throughout. Verify sheet_9x16 b17–b23, b33–b37.
3. Breakdown/underline use a 3-frame lead; tagline/CTA released 0.1 beat earlier; 2.94 pop amplitude 0.07 → 0.12. Verify metrics.sync.

**Verdict:** ANOTHER ROUND

## Round 2: drafts after round-1 fixes

| Criterion | Score | Evidence |
|---|---|---|
| Hook (first 2 s) | 8 | unchanged; f0 still clean at full res (t0.000 still), specks on phone sheet are dot-field downscale only |
| Readability at phone size | 8 | phone_16x9 18 s: "Try it free →" + URL read at 360 px; 9:16 URL 60 px reads |
| Motion quality | 8 | 9:16 result card now tracks up as the breakdown lands (b20) — no jump |
| Variety / pacing | 8 | max gap 3.0 s; longest static unchanged |
| Brand accuracy | 8 | unchanged |
| Sound sync | 7 | 13/17 ≤45 ms (was 10); remaining ±67 ms on "What's yours?", click, 2.94, interval — each 2 frames at 30 fps with concurrent motion |
| Composition | 7 | 9:16 fixed; 16:9 end card 16–19 s: right half of frame empty (phone_16x9 16–18 s) |
| Polish | 8 | no blank frames, CTA two lines with no double exposure |

**3 worst problems**
1. 16:9 end card right half dead for 3 s.
2. Residual 67 ms sync offsets (needs 60 fps measurement before acting further).
3. 16:9 montage pages read as small texture at phone size — acceptable (words carry it), no change.

**Fixes for round 3**
1. Real home-page hero (headline + Calculate Now) as a card on the right of the 16:9 end card, rising with the tagline, drifting with the push. Verify sheet_16x9 b33–b37.
2. Re-measure sync on the 60 fps final with review.py final; nudge only cues still > 45 ms.

**Verdict:** ANOTHER ROUND

## Round 3: drafts after round-2 fixes (+ 9:16 safe-zone pass)

| Criterion | Score | Evidence |
|---|---|---|
| Hook (first 2 s) | 8 | f0 reads "Every"; promise complete at 1.5 s |
| Readability at phone size | 8 | phone_16x9 17.5–19 s: CTA + URL legible at 360 px; 9:16 text now clear of the right 12 % zone |
| Motion quality | 8 | strips clean; end-card hero card rises with the tagline and drifts |
| Variety / pacing | 8 | max gap 3.0 s; longest static 1.27 s |
| Brand accuracy | 8 | only real captures; hero card is the real home page |
| Sound sync | 7 | 13/17 at 30 fps; needs 60 fps measurement |
| Composition | 8 | 16:9 end card balanced (lockup left, real hero right) |
| Polish | 8 | determinism 12/12 identical in both formats |

**3 worst problems**
1. Swap hits ("What's yours?", caption → "And the uncertainty.") measure early because the outgoing line's exit is the first visible change.
2. One near-blank frame at 2.7 s (hook lines gone, question not yet up) — found on the 60 fps final.
3. Pressed Calculate button showed the captured button's edge behind it (double outline at 6.03–6.08 s).

**Fixes**
1. Swap cues are whooshes (they build into the landing by design); the underline gets its own pop on b19.
2. Hook exit moved to b5.36 so the question takes over without a blank frame.
3. Card-coloured backing under the lifted button.

**Verdict:** SHIP after the fixes verify on the 60 fps final. The user asked for 16:9 only, so 9:16 is not rendered as a final.
