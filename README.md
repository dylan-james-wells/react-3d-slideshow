# React 3D Slideshow

> **Warning**: This library is a work in progress and has not been thoroughly tested. Use at your own risk in production environments.

A React slideshow component with 3D transitions powered by Three.js and @react-three/fiber.

[**Live Demo**](https://dylan-james-wells.github.io/react-3d-slideshow/)

## Installation

```bash
npm install react-3d-slideshow
```

## Quick Start

```tsx
import { Slideshow } from 'react-3d-slideshow'

const slides = [
  { id: 1, image: '/image1.jpg' },
  { id: 2, image: '/image2.jpg' },
  { id: 3, image: '/image3.jpg' },
]

function App() {
  return (
    <Slideshow
      slides={slides}
      style="glitch"
      aspectRatio={16 / 9}
      autoPlay
      loop
    />
  )
}
```

## Transition Styles

- **glitch** - Chromatic aberration, scanlines, and film grain effects
- **cascade** - 3D cube grid with diagonal wave animation
- **cube** - Simple 3D cube rotation between slides

## Props

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `slides` | `SlideData[]` | required | Array of slide objects with `id` and `image` properties |
| `style` | `'glitch' \| 'cascade' \| 'cube'` | `'cascade'` | Transition style to use |
| `transitionDuration` | `number` | `800` | Duration of transitions in milliseconds |
| `aspectRatio` | `number` | `1.5` (3:2) | Aspect ratio for the slideshow display area |
| `fullscreen` | `boolean` | `false` | Fill the entire viewport (glitch and cascade only) |

### Autoplay Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `autoPlay` | `boolean` | `false` | Automatically advance slides |
| `autoPlayInterval` | `number` | `5000` | Time between auto-advances in milliseconds |
| `pauseOnHover` | `boolean` | `true` | Pause autoplay when hovering over the slideshow |
| `loop` | `boolean` | `true` | Loop back to first slide after reaching the end |

### Layout Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `string \| number` | `'100%'` | Width of the slideshow container |
| `height` | `string \| number` | `400` | Height of the slideshow container |
| `initialSlide` | `number` | `0` | Index of the initial slide to display |
| `className` | `string` | - | CSS class for the container element |

### UI Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showControls` | `boolean` | `true` | Show prev/next navigation buttons |
| `showIndicators` | `boolean` | `true` | Show slide indicator dots |
| `enableSwipe` | `boolean` | `true` | Enable touch swipe and mouse drag navigation |
| `enableKeyboard` | `boolean` | `true` | Enable arrow key navigation |

### Custom UI Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `loadingSpinner` | `ReactElement \| null` | default spinner | Custom loading spinner. Set to `null` to hide |
| `prevButton` | `ReactElement \| null` | default button | Custom previous button. Set to `null` to hide |
| `nextButton` | `ReactElement \| null` | default button | Custom next button. Set to `null` to hide |
| `renderIndicator` | `(index: number, isActive: boolean) => ReactElement` | - | Custom indicator renderer |
| `focusRingStyles` | `FocusRingStyles` | - | Customize keyboard focus ring appearance |

### Glitch Effect Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `glitchAberration` | `number` | `0.5` | Chromatic aberration intensity (0-1) |
| `glitchScanlines` | `number` | `0.5` | Scanlines effect intensity (0-1) |
| `glitchGrain` | `number` | `0.5` | Film grain effect intensity (0-1) |

### Cascade Effect Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cascadeMinTiles` | `number` | `10` | Minimum number of tiles in the shorter dimension |

### Accessibility Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ariaLabel` | `string` | `'Image slideshow'` | Accessible label for the slideshow region |
| `getSlideAriaLabel` | `(index: number, total: number) => string` | - | Custom function to generate slide announcements |
| `focusRingStyles` | `FocusRingStyles` | - | Customize focus ring color, width, and offset |

### WebGL Fallback Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fallback` | `ReactElement \| null` | crossfade slideshow | Custom fallback when WebGL is unavailable. Set to `null` to show nothing |
| `onWebGLUnsupported` | `() => void` | - | Callback fired when WebGL is not supported |

### Callbacks

| Prop | Type | Description |
|------|------|-------------|
| `onSlideChange` | `(index: number) => void` | Called when the active slide changes |
| `onWebGLUnsupported` | `() => void` | Called when WebGL is not available |

## Customization

### Custom Navigation Buttons

```tsx
<Slideshow
  slides={slides}
  prevButton={<MyCustomPrevButton />}
  nextButton={<MyCustomNextButton />}
/>
```

Set to `null` to hide a button entirely:

```tsx
<Slideshow
  slides={slides}
  prevButton={null}  // Hide prev button
  nextButton={<MyNextButton />}
/>
```

### Custom Indicators

```tsx
<Slideshow
  slides={slides}
  renderIndicator={(index, isActive) => (
    <div className={isActive ? 'dot active' : 'dot'} />
  )}
/>
```

### Custom Loading Spinner

```tsx
import { LoadingSpinner } from 'react-3d-slideshow'

// Use built-in spinner with custom props
<Slideshow
  slides={slides}
  loadingSpinner={<LoadingSpinner size={64} color="#ff0000" />}
/>

// Or use your own component
<Slideshow
  slides={slides}
  loadingSpinner={<MyCustomSpinner />}
/>

// Or hide it entirely
<Slideshow
  slides={slides}
  loadingSpinner={null}
/>
```

### Focus Ring Styles

Customize the keyboard focus ring for accessibility:

```tsx
<Slideshow
  slides={slides}
  focusRingStyles={{
    color: '#00ff00',  // Focus ring color (default: '#fff')
    width: 3,          // Ring width in pixels (default: 2)
    offset: 4,         // Ring offset in pixels (default: 2)
  }}
/>
```

### WebGL Fallback

When WebGL is not supported, the slideshow automatically falls back to a simple crossfade effect. You can customize this behavior:

```tsx
// Use default crossfade fallback (default behavior)
<Slideshow slides={slides} />

// Custom fallback component
<Slideshow
  slides={slides}
  fallback={<MyCustomFallbackSlideshow slides={slides} />}
  onWebGLUnsupported={() => console.log('WebGL not available')}
/>

// Show nothing when WebGL unavailable
<Slideshow
  slides={slides}
  fallback={null}
/>
```

You can also check WebGL support programmatically:

```tsx
import { isWebGLSupported } from 'react-3d-slideshow'

if (isWebGLSupported()) {
  // WebGL is available
}
```

## Ref API

The `Slideshow` component exposes methods via a ref for programmatic control:

```tsx
import { useRef } from 'react'
import { Slideshow, SlideshowHandle } from 'react-3d-slideshow'

function App() {
  const slideshowRef = useRef<SlideshowHandle>(null)

  return (
    <>
      <Slideshow ref={slideshowRef} slides={slides} />
      <button onClick={() => slideshowRef.current?.next()}>Next</button>
      <button onClick={() => slideshowRef.current?.prev()}>Previous</button>
      <button onClick={() => slideshowRef.current?.goTo(2)}>Go to slide 3</button>
    </>
  )
}
```

### Methods

| Method | Description |
|--------|-------------|
| `next()` | Advance to the next slide |
| `prev()` | Go to the previous slide |
| `goTo(index: number)` | Jump to a specific slide by index |
| `getCurrentIndex()` | Get the current slide index |

## CSS Class Names

The component uses BEM-style class names for styling customization:

| Class | Description |
|-------|-------------|
| `.r3dss` | Root container |
| `.r3dss--cascade` | Root with cascade style |
| `.r3dss--cube` | Root with cube style |
| `.r3dss--glitch` | Root with glitch style |
| `.r3dss--empty` | Root when no slides provided |
| `.r3dss__canvas` | Three.js canvas element |
| `.r3dss__controls` | Navigation controls container |
| `.r3dss__control` | Navigation button |
| `.r3dss__control--prev` | Previous button |
| `.r3dss__control--next` | Next button |
| `.r3dss__control--disabled` | Disabled button state |
| `.r3dss__control--hovered` | Hovered button state |
| `.r3dss__control--custom` | Custom button element |
| `.r3dss__indicators` | Indicator dots container |
| `.r3dss__indicator` | Individual indicator dot |
| `.r3dss__indicator--active` | Active indicator |
| `.r3dss__indicator--custom` | Custom indicator element |
| `.r3dss__loader` | Loading spinner container |
| `.r3dss__spinner` | Default loading spinner |
| `.r3dss__live-region` | Screen reader announcements |
| `.r3dss__empty-message` | Empty state message |
| `.r3dss__fallback` | WebGL fallback container |
| `.r3dss__fallback-slide` | Fallback slide element |

## Slide Data

Each slide object should have the following structure:

```ts
interface SlideData {
  id: string | number      // Unique identifier
  image?: string           // Image URL
  content?: ReactNode      // Custom React content (not fully supported)
  backgroundColor?: string // Fallback background color
}
```

## Types

All TypeScript types are exported for convenience:

```tsx
import type {
  SlideshowProps,
  SlideshowHandle,
  SlideData,
  TransitionStyle,
  ControlsProps,
  IndicatorsProps,
  FocusRingStyles,
  LoadingSpinnerProps,
  FallbackSlideshowProps,
} from 'react-3d-slideshow'
```

## License

MIT
