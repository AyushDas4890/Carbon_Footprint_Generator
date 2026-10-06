# Animation Testing Guide

A manual pass over the frontend's motion components. What each one is and how
it is wired is in [ANIMATION_SUMMARY.md](ANIMATION_SUMMARY.md) and
[SCROLL_ANIMATIONS.md](SCROLL_ANIMATIONS.md).

## Setup

Either build the app and let Django serve it:

```bash
npm --prefix frontend ci
npm --prefix frontend run build
python manage.py runserver        # http://127.0.0.1:8000/
```

or run Django on :8000 and `npm --prefix frontend run dev` alongside it, then
open http://127.0.0.1:5173/ (Vite proxies `/api` to Django).

Test at a desktop width of 1280px or more first; several components change
behaviour below 1100px, 820px and 761px (see "Small screens").

## 1. Home (`/`)

**Hero**

- [ ] The pill nav drops in from the top; the headline lines rise out of their
      masks one after another.
- [ ] The dotted globe fades and scales in, spins slowly, and its orange
      electrons travel the three orbits and disappear behind the sphere.
- [ ] Dragging the globe sideways spins it faster; after release it eases back
      to its idle speed.
- [ ] Scrolling out of the hero shrinks, lifts and tilts the globe.

**Dial nav (right edge)**

- [ ] The readout shows `01/06` and changes as each section crosses the middle
      of the screen.
- [ ] Labels turn on a drum; the active one lines up with the needle and the
      others tilt away and fade.
- [ ] Clicking a label glides to that section.

**Why**

- [ ] Words brighten one by one as the paragraph scrolls up; scrolling back
      dims them again.

**Model (scroll-zoom)**

- [ ] The section holds in place while a small framed plate opens to fill the
      screen, and "The hidden" / "number" slide apart.
- [ ] The stat numbers roll up from zero once the frame is open.

**Tools (image scroller)**

- [ ] The section pins and vertical scrolling moves the card strip sideways.
- [ ] Images drift slightly inside their frames; the hairline under the strip
      fills as you go.
- [ ] Unpinning happens exactly as the last card reaches the edge (no blank
      gap, no cut-off card).
- [ ] The "Predict" card glides to the calculator; the others route to their
      pages.

**Pill nav**

- [ ] Scrolling down past the hero hides the nav; any upward scroll brings it
      back.
- [ ] Hovering "Tools" opens the dropdown; Escape or a click outside closes it.
- [ ] The highlight slides between links when the route changes.

## 2. Route transitions

- [ ] Navigating between pages raises an ink curtain, which lifts away
      carrying the new page's title.
- [ ] The new page starts at the top, and pinned sections on it are not offset.

## 3. Results (`/results/`)

Submit the calculator on Home first; without a stored result the page
redirects back.

- [ ] The CO₂e figure counts up.
- [ ] The carbon pass drops in on its strap and settles. It can be grabbed by
      either end, thrown, and swings back; the strap text follows the ribbon.
- [ ] The lifecycle-stage bar and the feature-contribution chart grow in once;
      hovering a row or segment shows its exact value.
- [ ] Everyday equivalents count up as they scroll into view.

## 4. Insights, Compare, Decompose

- [ ] Insights: model metrics count up; each bar list grows in and shows a
      tooltip on hover. With no stored result it shows a plate and a prompt
      instead.
- [ ] Compare: after running a comparison, the grouped bars grow in with a
      legend above.
- [ ] Decompose: the empty state shows a ridges plate; after a decomposition
      the total counts up and the composition bar segments grow in.
- [ ] Plates repaint sharply after a window resize (no stretching or blur).

## 5. Reduced motion

Turn on the OS "reduce motion" setting, or in Chrome DevTools use Rendering →
"Emulate CSS media feature prefers-reduced-motion: reduce", then reload.

- [ ] No route curtain; pages swap instantly.
- [ ] Scrolling is native (no Lenis smoothing).
- [ ] The globe is a still image; the carbon pass hangs at rest.
- [ ] Headings and paragraphs are fully visible without animating.
- [ ] The scroll-zoom section shows the open media with its copy, no pin and no
      split headline.
- [ ] The tools strip is a native horizontal swipe with snap points.
- [ ] Numbers show their final values immediately.

## 6. Small screens

- [ ] Below 1100px the dial nav is hidden.
- [ ] Below 820px the pill nav shows a menu button; it expands the pill into a
      list of every page.
- [ ] Below 761px the tools strip becomes a native swipe with snap points
      instead of pinning.
- [ ] The carbon pass can be dragged with touch.

## If something looks wrong

- **Console errors**: open DevTools; most failures show up as a React or GSAP
  warning.
- **Pinned sections offset**: resize the window once. If that fixes it, a
  `ScrollTrigger.refresh()` is missing after content changed height (see
  SCROLL_ANIMATIONS.md, "Troubleshooting").
- **Nothing animates**: check that reduced motion is not enabled.
- **Stale UI after pulling**: rebuild with `npm --prefix frontend run build`,
  since Django serves `frontend/dist`.
