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
| `autoPlayInterval` | `number` | `3000` | Time between auto-advances in milliseconds |
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
| `enableSwipe` | `boolean` | `true` | Enable touch swipe navigation |
| `enableKeyboard` | `boolean` | `true` | Enable arrow key navigation |

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

### Callbacks

| Prop | Type | Description |
|------|------|-------------|
| `onSlideChange` | `(index: number) => void` | Called when the active slide changes |

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

## License

MIT
