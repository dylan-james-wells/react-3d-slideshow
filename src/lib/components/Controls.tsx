import React from 'react'
import { ControlsProps } from '../types'

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: 'translateY(-50%)',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 10px',
    pointerEvents: 'none',
    zIndex: 10,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  buttonDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
}

export function Controls({
  onNext,
  onPrev,
  canGoNext,
  canGoPrev,
}: ControlsProps) {
  return (
    <div style={styles.container}>
      <button
        style={{
          ...styles.button,
          ...(canGoPrev ? {} : styles.buttonDisabled),
        }}
        onClick={onPrev}
        disabled={!canGoPrev}
        aria-label="Previous slide"
      >
        &#8249;
      </button>
      <button
        style={{
          ...styles.button,
          ...(canGoNext ? {} : styles.buttonDisabled),
        }}
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Next slide"
      >
        &#8250;
      </button>
    </div>
  )
}
