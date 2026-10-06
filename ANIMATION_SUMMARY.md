# Animation Summary

The React frontend (`frontend/src`) is an engraved editorial design system: pale
sage paper (`--paper: #ebeee7`), dark green ink (`--ink: #2b3a30`) and one rust
accent (`--accent: #b4502a`), with Fraunces for display type and Inter for UI,
labels and data. Dark surfaces (`.tone-ink`, the opened zoom plate) swap in a
lighter accent (`#d98a5f`) so it keeps its contrast. The logo is an engraved
compass rose (`Mark` in `PillNav.tsx`). Motion is
carried by seven kit components plus a handful of smaller UI pieces. There is no
WebGL and no chart library; everything that draws is a 2D canvas, SVG or
plain DOM.

For how scroll is wired (Lenis, ScrollTrigger, pinning, scrubbing) see
[SCROLL_ANIMATIONS.md](SCROLL_ANIMATIONS.md).

## Libraries

| Package | Used for |
| --- | --- |
| `gsap` + `@gsap/react` | ScrollTrigger (pin, scrub), SplitText (word and line splits), `useGSAP` for scoped cleanup. Registered once in `lib/gsap.ts`. |
| `motion` | Route transitions, the pill nav, shared-layout highlights, `whileInView` chart bars. Imported from `motion/react`. |
| `lenis` | Smooth scroll, driven by GSAP's ticker so ScrollTrigger reads the same position (`lib/useSmoothScroll.ts`). |

## The seven kit components (`components/kit/`)

| Component | What it does | Driven by | Used on |
| --- | --- | --- | --- |
| `PillNav` | Floating pill header. The active route gets a spring highlight shared via `layoutId`; "Tools" opens a dropdown that blurs and scales in (hover on desktop, click or keyboard anywhere; Escape and outside clicks close it). Hides when scrolling down past 240px and returns on scroll up. Below 820px the pill expands into a staggered menu. Also exports `Mark` (the compass-rose logo) and `TOOLS`, which the hero and footer reuse. | Motion | Every page (`App.tsx`) |
| `AtomicGlobe` | Dotted globe on a 2D canvas: 1,400 points on a Fibonacci sphere, clumped into "land" with value noise, tilted 23.4°, ringed by three electron orbits. Orbits are split into a back half (hidden behind the sphere's disc) and a front half drawn over it. Drag to spin with inertia; the pointer adds slight parallax. An optional `progress` ref can tilt, shrink and lift it with scroll. | `requestAnimationFrame` | Home closing section |
| `TextRevealOnScroll` (`TextReveal.tsx`) | Paragraph whose words brighten from 14% to full opacity as it scrolls through the viewport. Scrubbed, so scrolling back dims them again. | GSAP SplitText + ScrollTrigger | Home "Why" |
| `SplitHeading` (`TextReveal.tsx`) | Heading whose lines rise out of a mask one after another (`expo.out`, 1.1s, 0.08s stagger). `trigger="load"` plays on mount; `trigger="scroll"` plays once at 88% of the viewport. Re-splits on resize. | GSAP SplitText | Home, Results, Insights, and every page title through `ui/PageHead` |
| `ScrollZoomReveal` | Pinned section and the first thing on the page. A thin rounded bar between the two headline halves opens to full-bleed via `clip-path` (passing through a capsule shape), so the media never distorts, while the media counter-zooms from 1.45× to 1×, the halves slide apart, and the overlay copy settles in at the end. The headline rises in on load. | GSAP timeline, scrubbed | Home "Intro" |
| `ImageScroller` | Vertical scroll drives a horizontal strip of cards. The section pins for exactly as long as the strip overflows; each image drifts inside its frame for parallax and a hairline tracks progress. Cards link to routes or in-page anchors. | GSAP ScrollTrigger + `containerAnimation` | Home "Tools" |
| `VerticalDialNav` | Fixed rotary dial on the right edge. Section labels and minor ticks sit on a drum that turns with scroll so the current section lines up with a fixed needle; labels further away tilt (`rotateX`) and fade. A readout shows `03/06`. It is drawn in ink and switches to paper colour while its needle is over a `[data-surface="dark"]` element. Clicking a label glides there through Lenis. Hidden below 1100px. | `requestAnimationFrame`, writes to the DOM directly | Home |
| `LanyardPass` | A badge hanging from a strap. The strap is a 14-segment Verlet rope; the card is two extra particles (clip and bottom edge) held a card-height apart, so it swings, twists on its vertical axis with horizontal speed, and can be grabbed by either end and thrown. On mount it drops in from above. The strap is an SVG ribbon with its label running along it through `<textPath>`. | Fixed-step (120 Hz) physics on `requestAnimationFrame` | Results |

## Supporting pieces

- **`components/Hero.tsx`**: the home hero, one viewport tall. The compass,
  lowercase Fraunces wordmark, tagline, a dot-separated tool nav (underlines
  draw in on hover) and a credits line stack at the top and stagger in on
  view. Below them a pen-and-ink viaduct video (a stagecoach crossing it) fills
  the rest of the viewport; `mix-blend-mode: multiply` drops its white
  background into the paper. The video only plays while on screen
  (`IntersectionObserver`). The nav becomes a 3×2 grid below 900px and 2×3
  below 600px.
- **`components/Plate.tsx`**: generative "printed plates" used as all imagery,
  so the repo ships no binary images and the art always matches the palette.
  Six kinds, each a reading of emissions data: `contour` (marching-squares
  isolines), `plume` (particles through a noise field), `routes` (freight arcs
  between hubs), `ridges` (ridgeline plot), `halftone` and `bars`. Output is
  deterministic per `seed`, comes in `paper` or `ink` tone, and repaints only
  when the element resizes (debounced 120ms). Plates are static, not animated.
- **`components/ui/Charts.tsx`**: four hand-built charts that replace the old
  chart library. `BarList` (labelled horizontal bars that double as a table),
  `DivergingBars` (SHAP contributions growing left or right from zero),
  `GroupedBars` (two or more series per category, used by Compare) and
  `StackBar` (one segmented bar with a legend). Bars grow in once on
  `whileInView`; hovering a row shows the exact value and, where it applies,
  the share of the total. Colours come from the `--series-1…5` CSS tokens.
- **`components/ui/CountUp.tsx`**: numbers roll up from zero (GSAP, `expo.out`,
  1.8s), on view by default or on mount with `onView={false}`.
- **`components/PageTransition.tsx`**: on route change an ink curtain rises over
  the old page, then lifts away carrying the new page's title.
- **`components/ui/Button.tsx`**: pill button whose label rolls up to a
  duplicate on hover. **`ui/Segmented.tsx`** slides a shared-layout thumb
  between options. **`ui/PageHead.tsx`** draws the index rule and runs the
  title through `SplitHeading`. **`Footer.tsx`** lifts its oversized wordmark in
  on view.

## Reduced motion

Every component checks `prefers-reduced-motion` and falls back to a still,
fully readable state:

- `App.tsx` wraps the tree in `<MotionConfig reducedMotion="user">`, and
  `PageTransition` renders a plain `<main>` with no curtain.
- Lenis is not started; scrolling is native.
- The hero video does not autoplay. `AtomicGlobe` draws one static frame. `LanyardPass` settles the rope
  off-screen (400 physics steps) and renders it at rest.
- `TextRevealOnScroll`, `SplitHeading`, `ScrollZoomReveal` and `CountUp` skip
  their tweens and show final values. `ScrollZoomReveal` also unpins in CSS and
  hides its split headline.
- `ImageScroller` falls back to a native horizontal swipe with scroll-snap (the
  same fallback it uses below 761px).
- `VerticalDialNav` snaps straight to the current section instead of easing.
- A global rule in `styles/global.css` shortens all CSS transitions and
  animations to 0.01ms.

## Performance notes

- Canvas components cap device pixel ratio at 2 and resize through
  `ResizeObserver`.
- `AtomicGlobe` and `LanyardPass` stop their animation loops, and the hero
  pauses its video, while off-screen (`IntersectionObserver`).
- `VerticalDialNav` reads scroll position in a rAF loop and writes transforms
  straight to the DOM, so nothing re-renders while scrolling.
- GSAP work lives in `useGSAP` with a `scope`, so tweens, ScrollTriggers and
  SplitText instances are reverted on unmount.
- Non-home routes are lazy-loaded in `App.tsx`.

## Files

```
frontend/src/
├── components/
│   ├── kit/
│   │   ├── AtomicGlobe.tsx
│   │   ├── ImageScroller.tsx
│   │   ├── LanyardPass.tsx
│   │   ├── PillNav.tsx
│   │   ├── ScrollZoomReveal.tsx
│   │   ├── TextReveal.tsx          TextRevealOnScroll + SplitHeading
│   │   └── VerticalDialNav.tsx
│   ├── ui/
│   │   ├── Charts.tsx              BarList · DivergingBars · GroupedBars · StackBar
│   │   ├── CountUp.tsx
│   │   ├── Button.tsx · PageHead.tsx · Range.tsx · Segmented.tsx
│   ├── Hero.tsx
│   ├── Plate.tsx
│   ├── PageTransition.tsx
│   └── Footer.tsx
├── lib/
│   ├── gsap.ts                     plugin registration + prefersReducedMotion()
│   └── useSmoothScroll.ts          Lenis + scrollToTarget / scrollToHash
└── styles/global.css               tokens, layout and component styles
```
