import { ReactNode } from 'react'

export type TransitionStyle =
  | 'carousel'
  | 'cube'
  | 'fade'
  | 'flip'
  | 'wave'
  | 'zoom'

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
}

export interface IndicatorsProps {
  total: number
  current: number
  onSelect: (index: number) => void
}
