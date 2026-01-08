import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useSwipe } from './useSwipe'

// Helper to create mock touch events
const createTouchEvent = (clientX: number): React.TouchEvent => ({
  touches: [{ clientX }] as unknown as React.TouchList,
} as React.TouchEvent)

describe('useSwipe', () => {
  describe('swipe detection', () => {
    it('calls onSwipeLeft when swiping left past threshold', () => {
      const onSwipeLeft = vi.fn()
      const onSwipeRight = vi.fn()

      const { result } = renderHook(() =>
        useSwipe({
          onSwipeLeft,
          onSwipeRight,
          threshold: 50,
        })
      )

      act(() => {
        result.current.handleTouchStart(createTouchEvent(200))
        result.current.handleTouchMove(createTouchEvent(100))
        result.current.handleTouchEnd()
      })

      expect(onSwipeLeft).toHaveBeenCalledTimes(1)
      expect(onSwipeRight).not.toHaveBeenCalled()
    })

    it('calls onSwipeRight when swiping right past threshold', () => {
      const onSwipeLeft = vi.fn()
      const onSwipeRight = vi.fn()

      const { result } = renderHook(() =>
        useSwipe({
          onSwipeLeft,
          onSwipeRight,
          threshold: 50,
        })
      )

      act(() => {
        result.current.handleTouchStart(createTouchEvent(100))
        result.current.handleTouchMove(createTouchEvent(200))
        result.current.handleTouchEnd()
      })

      expect(onSwipeRight).toHaveBeenCalledTimes(1)
      expect(onSwipeLeft).not.toHaveBeenCalled()
    })

    it('does not trigger swipe below threshold', () => {
      const onSwipeLeft = vi.fn()
      const onSwipeRight = vi.fn()

      const { result } = renderHook(() =>
        useSwipe({
          onSwipeLeft,
          onSwipeRight,
          threshold: 50,
        })
      )

      act(() => {
        result.current.handleTouchStart(createTouchEvent(100))
        result.current.handleTouchMove(createTouchEvent(130)) // Only 30px difference
        result.current.handleTouchEnd()
      })

      expect(onSwipeLeft).not.toHaveBeenCalled()
      expect(onSwipeRight).not.toHaveBeenCalled()
    })

    it('respects custom threshold', () => {
      const onSwipeLeft = vi.fn()

      const { result } = renderHook(() =>
        useSwipe({
          onSwipeLeft,
          threshold: 100,
        })
      )

      // 60px swipe with 100px threshold - should not trigger
      act(() => {
        result.current.handleTouchStart(createTouchEvent(200))
        result.current.handleTouchMove(createTouchEvent(140))
        result.current.handleTouchEnd()
      })

      expect(onSwipeLeft).not.toHaveBeenCalled()

      // 120px swipe - should trigger
      act(() => {
        result.current.handleTouchStart(createTouchEvent(200))
        result.current.handleTouchMove(createTouchEvent(80))
        result.current.handleTouchEnd()
      })

      expect(onSwipeLeft).toHaveBeenCalledTimes(1)
    })
  })

  describe('enabled state', () => {
    it('does not track touches when disabled', () => {
      const onSwipeLeft = vi.fn()

      const { result } = renderHook(() =>
        useSwipe({
          onSwipeLeft,
          enabled: false,
        })
      )

      act(() => {
        result.current.handleTouchStart(createTouchEvent(200))
        result.current.handleTouchMove(createTouchEvent(50))
        result.current.handleTouchEnd()
      })

      expect(onSwipeLeft).not.toHaveBeenCalled()
    })

    it('works when enabled=true (default)', () => {
      const onSwipeLeft = vi.fn()

      const { result } = renderHook(() =>
        useSwipe({
          onSwipeLeft,
        })
      )

      act(() => {
        result.current.handleTouchStart(createTouchEvent(200))
        result.current.handleTouchMove(createTouchEvent(100))
        result.current.handleTouchEnd()
      })

      expect(onSwipeLeft).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('handles touchEnd without touchMove', () => {
      const onSwipeLeft = vi.fn()

      const { result } = renderHook(() =>
        useSwipe({
          onSwipeLeft,
        })
      )

      // Should not crash when touchEnd is called without touchMove
      act(() => {
        result.current.handleTouchStart(createTouchEvent(200))
        result.current.handleTouchEnd()
      })

      expect(onSwipeLeft).not.toHaveBeenCalled()
    })

    it('handles multiple swipes in sequence', () => {
      const onSwipeLeft = vi.fn()
      const onSwipeRight = vi.fn()

      const { result } = renderHook(() =>
        useSwipe({
          onSwipeLeft,
          onSwipeRight,
        })
      )

      // First swipe left
      act(() => {
        result.current.handleTouchStart(createTouchEvent(200))
        result.current.handleTouchMove(createTouchEvent(100))
        result.current.handleTouchEnd()
      })

      // Second swipe right
      act(() => {
        result.current.handleTouchStart(createTouchEvent(100))
        result.current.handleTouchMove(createTouchEvent(200))
        result.current.handleTouchEnd()
      })

      expect(onSwipeLeft).toHaveBeenCalledTimes(1)
      expect(onSwipeRight).toHaveBeenCalledTimes(1)
    })
  })
})
