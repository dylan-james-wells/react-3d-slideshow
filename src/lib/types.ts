import { ReactNode, ReactElement } from 'react'

export type TransitionStyle =
  | 'cascade'
  | 'cube'
  | 'glitch'

export interface SlideData {
  id: string | number
  image?: string
  content?: ReactNode
  backgroundColor?: string
}

export interface SlideshowProps {
  slides: SlideData[]
  style?: TransitionStyle
  autoPlay?: boolean
  autoPlayInterval?: number
  showControls?: boolean
  showIndicators?: boolean
  loop?: boolean
  transitionDuration?: number
  width?: string | number
  height?: string | number
  className?: string
  onSlideChange?: (index: number) => void
  initialSlide?: number
  enableSwipe?: boolean
  enableKeyboard?: boolean
  pauseOnHover?: boolean
  /** Cascade minTiles (for 'cascade' style) - minimum tiles in shorter dimension, creates square tiles */
  cascadeMinTiles?: number
  /** Aspect ratio for images (for 'cascade' style) - e.g., 16/9, 4/3, 3/2 */
  aspectRatio?: number
  /** Glitch aberration intensity (for 'glitch' style) - 0 to 1, default 0.5 */
  glitchAberration?: number
  /** Glitch scanlines intensity (for 'glitch' style) - 0 to 1, default 0.5 */
  glitchScanlines?: number
  /** Glitch film grain intensity (for 'glitch' style) - 0 to 1, default 0.5 */
  glitchGrain?: number
  /** Fullscreen cover mode - fills container like object-fit: cover (for 'glitch' style) */
  fullscreen?: boolean
  /** Custom loading spinner element. Set to null to disable, or provide a custom ReactElement */
  loadingSpinner?: ReactElement | null
  /** Custom previous button element. Set to null to hide, or provide a custom ReactElement */
  prevButton?: ReactElement | null
  /** Custom next button element. Set to null to hide, or provide a custom ReactElement */
  nextButton?: ReactElement | null
  /** Custom indicator renderer. Receives index and isActive, returns a ReactElement */
  renderIndicator?: (index: number, isActive: boolean) => ReactElement
  /** Accessible label for the slideshow region. Defaults to "Image slideshow" */
  ariaLabel?: string
  /** Custom function to generate slide announcement text for screen readers */
  getSlideAriaLabel?: (index: number, total: number) => string
}

export interface SlideshowHandle {
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  getCurrentIndex: () => number
}

export interface SlideProps {
  slide: SlideData
  position: number
  isActive: boolean
  transitionDuration: number
  style: TransitionStyle
  totalSlides: number
}

export interface ControlsProps {
  onNext: () => void
  onPrev: () => void
  canGoNext: boolean
  canGoPrev: boolean
  prevButton?: ReactElement | null
  nextButton?: ReactElement | null
}

export interface IndicatorsProps {
  total: number
  current: number
  onSelect: (index: number) => void
  renderIndicator?: (index: number, isActive: boolean) => ReactElement
}
