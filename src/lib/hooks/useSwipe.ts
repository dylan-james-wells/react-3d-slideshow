import { useRef, useCallback } from 'react'

interface UseSwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  enabled?: boolean
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
}: UseSwipeOptions) {
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return
      touchStartX.current = e.touches[0].clientX
    },
    [enabled]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return
      touchEndX.current = e.touches[0].clientX
    },
    [enabled]
  )

  const handleTouchEnd = useCallback(() => {
    if (!enabled || touchStartX.current === null || touchEndX.current === null)
      return

    const diff = touchStartX.current - touchEndX.current

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        onSwipeLeft?.()
      } else {
        onSwipeRight?.()
      }
    }

    touchStartX.current = null
    touchEndX.current = null
  }, [enabled, threshold, onSwipeLeft, onSwipeRight])

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
