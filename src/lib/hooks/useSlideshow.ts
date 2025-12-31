import { useState, useCallback, useEffect, useRef } from 'react'
import { SlideData } from '../types'

interface UseSlideshowOptions {
  slides: SlideData[]
  initialSlide?: number
  autoPlay?: boolean
  autoPlayInterval?: number
  loop?: boolean
  pauseOnHover?: boolean
  onSlideChange?: (index: number) => void
}

export function useSlideshow({
  slides,
  initialSlide = 0,
  autoPlay = false,
  autoPlayInterval = 5000,
  loop = true,
  pauseOnHover = true,
  onSlideChange,
}: UseSlideshowOptions) {
  const [currentIndex, setCurrentIndex] = useState(initialSlide)
  const [isPaused, setIsPaused] = useState(false)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSlides = slides.length

  const canGoNext = loop || currentIndex < totalSlides - 1
  const canGoPrev = loop || currentIndex > 0

  const next = useCallback(() => {
    if (!canGoNext) return
    setDirection('next')
    setCurrentIndex((prev) => {
      const nextIndex = prev >= totalSlides - 1 ? 0 : prev + 1
      return nextIndex
    })
  }, [canGoNext, totalSlides])

  const prev = useCallback(() => {
    if (!canGoPrev) return
    setDirection('prev')
    setCurrentIndex((prev) => {
      const prevIndex = prev <= 0 ? totalSlides - 1 : prev - 1
      return prevIndex
    })
  }, [canGoPrev, totalSlides])

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalSlides) return
      setDirection(index > currentIndex ? 'next' : 'prev')
      setCurrentIndex(index)
    },
    [currentIndex, totalSlides]
  )

  const pause = useCallback(() => {
    if (pauseOnHover) {
      setIsPaused(true)
    }
  }, [pauseOnHover])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  useEffect(() => {
    onSlideChange?.(currentIndex)
  }, [currentIndex, onSlideChange])

  useEffect(() => {
    if (autoPlay && !isPaused) {
      intervalRef.current = setInterval(next, autoPlayInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoPlay, autoPlayInterval, isPaused, next])

  return {
    currentIndex,
    direction,
    next,
    prev,
    goTo,
    pause,
    resume,
    canGoNext,
    canGoPrev,
    totalSlides,
  }
}
