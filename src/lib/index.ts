export { Slideshow } from './components/Slideshow'
export { Controls } from './components/Controls'
export { Indicators } from './components/Indicators'
export { LoadingSpinner, type LoadingSpinnerProps } from './components/LoadingSpinner'
export { FallbackSlideshow, type FallbackSlideshowProps } from './components/FallbackSlideshow'

export { useSlideshow } from './hooks/useSlideshow'
export { useSwipe } from './hooks/useSwipe'
export { useKeyboard } from './hooks/useKeyboard'

export { isWebGLSupported } from './utils/webgl'

export type {
  SlideshowProps,
  SlideshowHandle,
  SlideData,
  TransitionStyle,
  ControlsProps,
  IndicatorsProps,
  FocusRingStyles,
} from './types'
