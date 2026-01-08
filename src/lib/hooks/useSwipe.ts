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
  const startX = useRef<number | null>(null)
  const endX = useRef<number | null>(null)
  const isDragging = useRef(false)

  const handleSwipeEnd = useCallback(() => {
    if (!enabled || startX.current === null || endX.current === null)
      return

    const diff = startX.current - endX.current

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        onSwipeLeft?.()
      } else {
        onSwipeRight?.()
      }
    }

    startX.current = null
    endX.current = null
  }, [enabled, threshold, onSwipeLeft, onSwipeRight])

  // Touch events
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return
      startX.current = e.touches[0].clientX
    },
    [enabled]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return
      endX.current = e.touches[0].clientX
    },
    [enabled]
  )

  const handleTouchEnd = useCallback(() => {
    handleSwipeEnd()
  }, [handleSwipeEnd])

  // Mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return
      isDragging.current = true
      startX.current = e.clientX
    },
    [enabled]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || !isDragging.current) return
      endX.current = e.clientX
    },
    [enabled]
  )

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    handleSwipeEnd()
  }, [handleSwipeEnd])

  const handleMouseLeave = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    handleSwipeEnd()
  }, [handleSwipeEnd])

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  }
}
