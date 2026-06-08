# Scroll Animation System Documentation

## Overview

This Carbon Footprint Generator now features a comprehensive scroll animation system that triggers animations both on page load and when elements scroll into view. The animations repeat when you scroll back up and down, creating a dynamic and engaging user experience.

## Features

### 1. **Initial Page Load Animations**

- Elements animate when the page first loads
- Staggered timing for sequential appearance
- Smooth fade-in and slide-up effects

### 2. **Scroll-Triggered Animations**

- Elements re-animate when scrolling into viewport
- Animations reset when elements leave viewport
- Repeatable animations for continuous engagement

### 3. **Multiple Animation Types**

- **Fade In**: Smooth opacity transition with slight upward movement
- **Slide Up**: Elements slide up from below
- **Slide Left**: Elements slide in from the left
- **Slide Right**: Elements slide in from the right
- **Scale Up**: Elements scale from 85% to 100% with fade

## CSS Classes

### Base Animation Classes (Page Load)

```css
.fade-in          /* Fades in with slight upward movement */
.slide-up         /* Slides up from below */
.slide-in-left    /* Slides in from left */
.slide-in-right   /* Slides in from right */
.scale-up         /* Scales up with fade */
```

### Scroll Animation Classes (Viewport Triggered)

```css
.scroll-fade-in    /* Fades in on scroll */
.scroll-slide-left /* Slides from left on scroll */
.scroll-slide-right/* Slides from right on scroll */
.scroll-scale      /* Scales up on scroll */
```

### Stagger Classes (Delay Timing)

```css
.stagger-1  /* 0.1s delay */
.stagger-2  /* 0.2s delay */
.stagger-3  /* 0.3s delay */
.stagger-4  /* 0.4s delay */
.stagger-5  /* 0.5s delay */
.stagger-6  /* 0.6s delay */
```

## How It Works

### 1. CSS Transitions

Elements with scroll animation classes start invisible:

```css
.scroll-fade-in {
  opacity: 0;
  transform: translateY(30px);
  transition:
    opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 2. Intersection Observer

JavaScript monitors when elements enter/leave the viewport:

```javascript
const observerOptions = {
  root: null,
  rootMargin: "0px 0px -100px 0px",
  threshold: 0.1,
};
```

### 3. Visibility Toggle

When elements intersect viewport, the `.visible` class is added:

```css
.scroll-fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### 4. Repeatable Animations

When elements leave viewport, `.visible` class is removed, allowing re-animation on scroll back.

## Usage Examples

### Example 1: Simple Fade In

```html
<div class="glass-card scroll-fade-in">
  <h2>This will fade in when scrolled into view</h2>
</div>
```

### Example 2: Slide with Stagger

```html
<div class="stats-grid">
  <div class="stat-card scroll-scale stagger-1">Card 1</div>
  <div class="stat-card scroll-scale stagger-2">Card 2</div>
  <div class="stat-card scroll-scale stagger-3">Card 3</div>
</div>
```

### Example 3: Combined Animations

```html
<div class="glass-card fade-in scroll-fade-in" style="animation-delay: 0.2s;">
  <!-- Animates on page load AND on scroll -->
</div>
```

## Automatic Application

The JavaScript automatically adds scroll animations to:

- **Stat Cards**: `.scroll-scale` with staggered delays
- **Glass Cards**: `.scroll-fade-in` with staggered delays
- **Breakdown Items**: `.scroll-slide-left` with staggered delays
- **Compensation Items**: `.scroll-slide-right` with staggered delays

## Customization

### Adjust Animation Speed

Modify the transition duration in CSS:

```css
.scroll-fade-in {
  transition:
    opacity 1.2s ease,
    transform 1.2s ease; /* Slower */
}
```

### Change Trigger Point

Adjust the `rootMargin` in JavaScript:

```javascript
rootMargin: "0px 0px -200px 0px"; // Trigger earlier
```

### Disable Repeat Animations

Uncomment the unobserve line in `app.js`:

```javascript
observer.unobserve(entry.target); // Animate only once
```

## Browser Support

- ✅ Chrome/Edge (Modern)
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ⚠️ IE11 (Requires polyfill for Intersection Observer)

## Performance

- Uses CSS transforms (GPU accelerated)
- Intersection Observer is efficient (no scroll listeners)
- Minimal JavaScript overhead
- Smooth 60fps animations

## Testing

1. **Load the page** - Elements should animate in sequence
2. **Scroll down** - New elements should animate as they appear
3. **Scroll up** - Elements should fade out
4. **Scroll down again** - Elements should re-animate

## Files Modified

1. `static/css/main.css` - Animation keyframes and classes
2. `static/js/app.js` - Intersection Observer implementation
3. `core/templates/home.html` - Added scroll classes
4. `core/templates/results.html` - Added scroll classes
5. `core/templates/insights.html` - Added scroll classes

## Troubleshooting

### Animations not triggering?

- Check browser console for JavaScript errors
- Ensure elements have scroll animation classes
- Verify Intersection Observer is supported

### Animations too fast/slow?

- Adjust `transition` duration in CSS
- Modify `animation-delay` inline styles

### Elements not visible initially?

- Ensure scroll animation classes have `opacity: 0` initial state
- Check that JavaScript is loaded and running

## Future Enhancements

- [ ] Add parallax scrolling effects
- [ ] Implement scroll-linked animations
- [ ] Add entrance/exit animation variants
- [ ] Create animation presets for different page types
