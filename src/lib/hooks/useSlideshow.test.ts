import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSlideshow } from './useSlideshow'

const mockSlides = [
  { id: 1, image: 'slide1.jpg' },
  { id: 2, image: 'slide2.jpg' },
  { id: 3, image: 'slide3.jpg' },
]

describe('useSlideshow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('starts at initialSlide', () => {
      const { result } = renderHook(() =>
        useSlideshow({ slides: mockSlides, initialSlide: 1 })
      )
      expect(result.current.currentIndex).toBe(1)
    })

    it('defaults to slide 0', () => {
      const { result } = renderHook(() =>
        useSlideshow({ slides: mockSlides })
      )
      expect(result.current.currentIndex).toBe(0)
    })

    it('returns totalSlides count', () => {
      const { result } = renderHook(() =>
        useSlideshow({ slides: mockSlides })
      )
      expect(result.current.totalSlides).toBe(3)
    })
  })

  describe('navigation', () => {
    it('next() advances to next slide', () => {
      const { result } = renderHook(() =>
        useSlideshow({ slides: mockSlides })
      )

      act(() => {
        result.current.next()
      })

      expect(result.current.currentIndex).toBe(1)
      expect(result.current.direction).toBe('next')
    })

    it('prev() goes to previous slide', () => {
      const { result } = renderHook(() =>
        useSlideshow({ slides: mockSlides, initialSlide: 2 })
      )

      act(() => {
        result.current.prev()
      })

      expect(result.current.currentIndex).toBe(1)
      expect(result.current.direction).toBe('prev')
    })

    it('goTo() jumps to specific slide', () => {
      const { result } = renderHook(() =>
        useSlideshow({ slides: mockSlides })
      )

      act(() => {
        result.current.goTo(2)
      })

      expect(result.current.currentIndex).toBe(2)
    })

    it('goTo() sets direction based on target', () => {
      const { result } = renderHook(() =>
        useSlideshow({ slides: mockSlides, initialSlide: 1 })
      )

      act(() => {
        result.current.goTo(2)
      })
      expect(result.current.direction).toBe('next')

      act(() => {
        result.current.goTo(0)
      })
      expect(result.current.direction).toBe('prev')
    })

    it('goTo() ignores out-of-bounds indices', () => {
      const { result } = renderHook(() =>
        useSlideshow({ slides: mockSlides, initialSlide: 1 })
      )

      act(() => {
        result.current.goTo(-1)
      })
      expect(result.current.currentIndex).toBe(1)

      act(() => {
        result.current.goTo(10)
      })
      expect(result.current.currentIndex).toBe(1)
    })
  })

  describe('loop behavior', () => {
    it('loops from last to first when loop=true', () => {
      const { result } = renderHook(() =>
        useSlideshow({ slides: mockSlides, initialSlide: 2, loop: true })
      )

      act(() => {
        result.current.next()
      })

      expect(result.current.currentIndex).toBe(0)
    })

    it('loops from first to last when loop=true', () => {
      const { result } = renderHook(() =>
        useSlideshow({ slides: mockSlides, initialSlide: 0, loop: true })
      )

      act(() => {
        result.current.prev()
      })

      expect(result.current.currentIndex).toBe(2)
    })

    it('does not loop when loop=false', () => {
      const { result } = renderHook(() =>
        useSlideshow({ slides: mockSlides, initialSlide: 2, loop: false })
      )

      act(() => {
        result.current.next()
      })

      expect(result.current.currentIndex).toBe(2)
      expect(result.current.canGoNext).toBe(false)
    })

    it('canGoNext/canGoPrev reflect boundaries when loop=false', () => {
      const { result } = renderHook(() =>
        useSlideshow({ slides: mockSlides, initialSlide: 0, loop: false })
      )

      expect(result.current.canGoPrev).toBe(false)
      expect(result.current.canGoNext).toBe(true)

      act(() => {
        result.current.goTo(2)
      })

      expect(result.current.canGoPrev).toBe(true)
      expect(result.current.canGoNext).toBe(false)
    })
  })

  describe('autoPlay', () => {
    it('advances automatically when autoPlay=true', () => {
      const { result } = renderHook(() =>
        useSlideshow({
          slides: mockSlides,
          autoPlay: true,
          autoPlayInterval: 1000,
        })
      )

      expect(result.current.currentIndex).toBe(0)

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.currentIndex).toBe(1)

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.currentIndex).toBe(2)
    })

    it('pauses when pause() is called', () => {
      const { result } = renderHook(() =>
        useSlideshow({
          slides: mockSlides,
          autoPlay: true,
          autoPlayInterval: 1000,
          pauseOnHover: true,
        })
      )

      act(() => {
        result.current.pause()
      })

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(result.current.currentIndex).toBe(0)
    })

    it('resumes after resume() is called', () => {
      const { result } = renderHook(() =>
        useSlideshow({
          slides: mockSlides,
          autoPlay: true,
          autoPlayInterval: 1000,
          pauseOnHover: true,
        })
      )

      act(() => {
        result.current.pause()
      })

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(result.current.currentIndex).toBe(0)

      act(() => {
        result.current.resume()
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.currentIndex).toBe(1)
    })

    it('pause() does nothing when pauseOnHover=false', () => {
      const { result } = renderHook(() =>
        useSlideshow({
          slides: mockSlides,
          autoPlay: true,
          autoPlayInterval: 1000,
          pauseOnHover: false,
        })
      )

      act(() => {
        result.current.pause()
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.currentIndex).toBe(1)
    })
  })

  describe('callbacks', () => {
    it('calls onSlideChange when slide changes', () => {
      const onSlideChange = vi.fn()

      const { result } = renderHook(() =>
        useSlideshow({
          slides: mockSlides,
          onSlideChange,
        })
      )

      // Called on mount with initial index
      expect(onSlideChange).toHaveBeenCalledWith(0)

      act(() => {
        result.current.next()
      })

      expect(onSlideChange).toHaveBeenCalledWith(1)
    })
  })
})
