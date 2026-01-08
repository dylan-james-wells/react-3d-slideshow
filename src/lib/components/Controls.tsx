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

function DefaultPrevButton() {
  return <>&#8249;</>
}

function DefaultNextButton() {
  return <>&#8250;</>
}

export function Controls({
  onNext,
  onPrev,
  canGoNext,
  canGoPrev,
  prevButton,
  nextButton,
}: ControlsProps) {
  const showPrev = prevButton !== null
  const showNext = nextButton !== null

  return (
    <div className="r3dss__controls" style={styles.container}>
      {showPrev && (
        <button
          className={`r3dss__control r3dss__control--prev ${!canGoPrev ? 'r3dss__control--disabled' : ''}`}
          style={{
            ...styles.button,
            ...(canGoPrev ? {} : styles.buttonDisabled),
          }}
          onClick={onPrev}
          disabled={!canGoPrev}
          aria-label="Previous slide"
        >
          {prevButton ?? <DefaultPrevButton />}
        </button>
      )}
      {!showPrev && <div className="r3dss__control-spacer" />}
      {showNext && (
        <button
          className={`r3dss__control r3dss__control--next ${!canGoNext ? 'r3dss__control--disabled' : ''}`}
          style={{
            ...styles.button,
            ...(canGoNext ? {} : styles.buttonDisabled),
          }}
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Next slide"
        >
          {nextButton ?? <DefaultNextButton />}
        </button>
      )}
    </div>
  )
}
