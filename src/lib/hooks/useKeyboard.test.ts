import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useKeyboard } from './useKeyboard'

describe('useKeyboard', () => {
  const dispatchKeyDown = (key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true })
    window.dispatchEvent(event)
  }

  describe('arrow key handling', () => {
    it('calls onNext for ArrowRight', () => {
      const onNext = vi.fn()
      const onPrev = vi.fn()

      renderHook(() => useKeyboard({ onNext, onPrev }))

      dispatchKeyDown('ArrowRight')

      expect(onNext).toHaveBeenCalledTimes(1)
      expect(onPrev).not.toHaveBeenCalled()
    })

    it('calls onNext for ArrowDown', () => {
      const onNext = vi.fn()

      renderHook(() => useKeyboard({ onNext }))

      dispatchKeyDown('ArrowDown')

      expect(onNext).toHaveBeenCalledTimes(1)
    })

    it('calls onPrev for ArrowLeft', () => {
      const onNext = vi.fn()
      const onPrev = vi.fn()

      renderHook(() => useKeyboard({ onNext, onPrev }))

      dispatchKeyDown('ArrowLeft')

      expect(onPrev).toHaveBeenCalledTimes(1)
      expect(onNext).not.toHaveBeenCalled()
    })

    it('calls onPrev for ArrowUp', () => {
      const onPrev = vi.fn()

      renderHook(() => useKeyboard({ onPrev }))

      dispatchKeyDown('ArrowUp')

      expect(onPrev).toHaveBeenCalledTimes(1)
    })

    it('ignores other keys', () => {
      const onNext = vi.fn()
      const onPrev = vi.fn()

      renderHook(() => useKeyboard({ onNext, onPrev }))

      dispatchKeyDown('Enter')
      dispatchKeyDown('Space')
      dispatchKeyDown('a')

      expect(onNext).not.toHaveBeenCalled()
      expect(onPrev).not.toHaveBeenCalled()
    })
  })

  describe('enabled state', () => {
    it('does not respond to keys when disabled', () => {
      const onNext = vi.fn()

      renderHook(() => useKeyboard({ onNext, enabled: false }))

      dispatchKeyDown('ArrowRight')

      expect(onNext).not.toHaveBeenCalled()
    })

    it('responds to keys when enabled (default)', () => {
      const onNext = vi.fn()

      renderHook(() => useKeyboard({ onNext }))

      dispatchKeyDown('ArrowRight')

      expect(onNext).toHaveBeenCalledTimes(1)
    })

    it('responds when enabled changes from false to true', () => {
      const onNext = vi.fn()

      const { rerender } = renderHook(
        ({ enabled }) => useKeyboard({ onNext, enabled }),
        { initialProps: { enabled: false } }
      )

      dispatchKeyDown('ArrowRight')
      expect(onNext).not.toHaveBeenCalled()

      rerender({ enabled: true })

      dispatchKeyDown('ArrowRight')
      expect(onNext).toHaveBeenCalledTimes(1)
    })
  })

  describe('cleanup', () => {
    it('removes event listener on unmount', () => {
      const onNext = vi.fn()

      const { unmount } = renderHook(() => useKeyboard({ onNext }))

      unmount()

      dispatchKeyDown('ArrowRight')

      expect(onNext).not.toHaveBeenCalled()
    })
  })

  describe('optional callbacks', () => {
    it('handles missing onNext gracefully', () => {
      const onPrev = vi.fn()

      renderHook(() => useKeyboard({ onPrev }))

      // Should not throw
      expect(() => dispatchKeyDown('ArrowRight')).not.toThrow()
    })

    it('handles missing onPrev gracefully', () => {
      const onNext = vi.fn()

      renderHook(() => useKeyboard({ onNext }))

      // Should not throw
      expect(() => dispatchKeyDown('ArrowLeft')).not.toThrow()
    })
  })
})
