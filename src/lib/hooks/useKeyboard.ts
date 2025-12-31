import { useEffect, useCallback } from 'react'

interface UseKeyboardOptions {
  onNext?: () => void
  onPrev?: () => void
  enabled?: boolean
}

export function useKeyboard({
  onNext,
  onPrev,
  enabled = true,
}: UseKeyboardOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          onNext?.()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          onPrev?.()
          break
      }
    },
    [enabled, onNext, onPrev]
  )

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])
}
