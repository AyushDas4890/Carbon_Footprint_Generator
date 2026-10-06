# Scroll Animations

How scroll-linked motion works in the React frontend (`frontend/src`). For the
full component inventory, including the non-scroll pieces, see
[ANIMATION_SUMMARY.md](ANIMATION_SUMMARY.md).

## Wiring

Three pieces cooperate, all set up once:

1. **`lib/gsap.ts`** registers `ScrollTrigger`, `SplitText` and `useGSAP` and
   re-exports them, together with `prefersReducedMotion()`. Import GSAP from
   here, never from `gsap` directly, so the plugins are always registered.
2. **`lib/useSmoothScroll.ts`** starts Lenis (`duration: 1.15`, exponential
   ease) inside `App.tsx`. Lenis is advanced by `gsap.ticker` rather than its
   own rAF loop, `lagSmoothing(0)` is set, and every Lenis scroll event calls
   `ScrollTrigger.update`. Smoothed scroll and ScrollTrigger therefore read the
   same position on the same frame. Under reduced motion Lenis is not created.
3. **`App.tsx`** runs route changes through
   `<AnimatePresence mode="wait">`. When the old page has exited it scrolls to
   the top and calls `ScrollTrigger.refresh()` on the next frame, so the new
   page's pinned sections are measured after the swap.

`useSmoothScroll.ts` also exports two helpers that every in-page jump should use:

- `scrollToTarget(elementOrY, offset)` glides through Lenis when it is running
  and falls back to `window.scrollTo` otherwise.
- `scrollToHash` is a click handler for `<a href="#id">` links. `Button` and
  `ImageScroller` attach it automatically to hash links.

## Scroll-driven components

| Component | Trigger | Behaviour |
| --- | --- | --- |
| `TextRevealOnScroll` | `top 82%` → `bottom 45%`, `scrub: true` | Words (SplitText `type: 'words'`) go from opacity 0.14 to 1 with a 0.1 stagger. Reverses on scroll up. |
| `SplitHeading` (`trigger="scroll"`) | `top 88%`, `once: true` | Masked lines rise from `yPercent: 110`. With `trigger="load"` there is no ScrollTrigger and it plays on mount after `delay`. |
| `ScrollZoomReveal` | `top top` → `bottom bottom`, `scrub: 0.6` | The section is `320vh` tall with a sticky inner stage, so it "pins" through CSS rather than GSAP. One timeline opens the frame's `clip-path` from a thin rounded bar, `inset(48.4% 42% … round 999px)` (`inset(48.6% 30% …)` at 600px and below), to `inset(0)`. The CSS sets the same start value so nothing flashes before GSAP runs. The timeline also scales the media 1.45 → 1, moves the headline halves to `xPercent ∓160`, fades the "Scroll to open" hint, then staggers the overlay copy in from 82% of the way through. |
| `ImageScroller` | `top top` → `+=(scrollWidth − innerWidth)`, `pin: true`, `scrub: 0.8` | The track translates left by exactly its overflow. Each `.isc-img-inner` uses `containerAnimation` to drift `xPercent −12 → 12` as its card crosses the viewport. A separate trigger scales the progress hairline from 0 to 1. `invalidateOnRefresh` re-measures on resize. Only active under `gsap.matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)')`; otherwise CSS turns the track into a native scroll-snap strip. |
| `VerticalDialNav` | Own rAF loop, no ScrollTrigger | Each frame it reads the `top` of every section id, computes a continuous index (1.5 = halfway between sections 1 and 2) against the viewport midline, eases toward it (factor 0.14) and writes `translateY` on the drum and `rotateX`/`opacity` on each label and tick. Every sixth frame it hit-tests under the needle (`elementsFromPoint`, which respects `clip-path`) and toggles `is-on-dark` when the nearest `[data-surface]` ancestor is `dark`. Mark any new dark section with `data-surface="dark"`. |
| `Hero` | Motion `whileInView`, `viewport={{ once: true, amount: 0.4 }}` | The compass, wordmark, tagline, nav and credits rise in with a 0.09s stagger. An `IntersectionObserver` (threshold 0.15) plays the background video only while the hero is visible. |
| `CountUp` | `top 92%`, `once: true` | Rolls the number up from zero. Pass `onView={false}` to start on mount instead. |
| Charts (`ui/Charts.tsx`) | Motion `whileInView`, `viewport={{ once: true }}` | Bars grow on `scaleX` (segments on `scaleY`) with a per-row delay. These use Motion's IntersectionObserver, not ScrollTrigger. |
| `PillNav` | Motion `useScroll` | Hides when `scrollY` increases past 240px and reappears on any upward scroll, unless a menu is open. |

## Home page section order

`pages/Home.tsx` declares its sections once and passes them to the dial:

```ts
const SECTIONS = [
  { id: 'intro', label: 'Intro' },        // ScrollZoomReveal + CountUp stats
  { id: 'overview', label: 'Overview' },  // Hero (engraving video)
  { id: 'why', label: 'Why' },            // TextRevealOnScroll
  { id: 'calculate', label: 'Calculate' },// calculator form
  { id: 'tools', label: 'Tools' },        // ImageScroller of Plate cards
  { id: 'start', label: 'Start' },        // closing CTA + AtomicGlobe
];
```

Each `id` must exist on a rendered element. The dial measures them by
`document.getElementById`, so a missing id simply never becomes active.

## Usage

```tsx
import { SplitHeading, TextRevealOnScroll } from '../components/kit/TextReveal';
import { ScrollZoomReveal } from '../components/kit/ScrollZoomReveal';
import { Plate } from '../components/Plate';

<SplitHeading className="heading">Five inputs. <em>One honest number.</em></SplitHeading>

<TextRevealOnScroll className="why-text">
  Most of a product's footprint is decided <em>before it exists.</em>
</TextRevealOnScroll>

<ScrollZoomReveal id="intro" left="The hidden" right="number"
  media={<Plate kind="contour" seed={14} tone="ink" label="Topographic contour plate" />}>
  <p className="mono eyebrow">01 — The model</p>
</ScrollZoomReveal>
```

`<em>` inside `TextRevealOnScroll` keeps its own styling and picks up the
accent once lit.

## Adding a new scroll animation

- Write it inside `useGSAP(() => { … }, { scope: ref })` so its tweens,
  ScrollTriggers and SplitText instances are reverted on unmount. Return
  `split.revert()` or `mm.revert()` for anything created outside a tween.
- Bail out early with `if (prefersReducedMotion()) return;` and make sure the
  un-animated markup reads correctly on its own. For layout that only works
  animated (pinning, horizontal tracks), put the whole setup in
  `gsap.matchMedia()` and give CSS a fallback under the same media query.
- Use function values (`x: () => -distance()`) plus `invalidateOnRefresh: true`
  for anything that depends on element sizes.
- Don't add a second smooth-scroll or rAF-driven `scrollTo`; go through
  `scrollToTarget` so Lenis stays the single source of scroll position.
- For per-frame values another component needs (like `AtomicGlobe`'s
  `progress`), pass a ref, not state.

## Troubleshooting

**Pinned sections are offset or end early after navigating.** The new page was
measured before its content mounted. `App.tsx` already refreshes on
`onExitComplete`; if a page loads data that changes its height, call
`ScrollTrigger.refresh()` after the data arrives.

**Scrubbed animations stutter or lag behind the wheel.** Check that nothing
creates its own Lenis instance or rAF loop calling `lenis.raf`. There must be
exactly one, the one in `useSmoothScroll`.

**Nothing animates.** The OS "reduce motion" setting is on; that is the
intended fallback. In Chrome DevTools, Rendering → "Emulate CSS media feature
prefers-reduced-motion" toggles it for testing.

**Heading lines split wrongly after a font loads or the window resizes.**
`SplitHeading` uses `autoSplit: true` and re-creates its tween in `onSplit`.
Keep that pattern for any new line-based split.
