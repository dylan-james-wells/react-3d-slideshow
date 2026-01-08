import React, { useState } from 'react'
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
    fontSize: 28,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  buttonHovered: {
    background: 'rgba(255, 255, 255, 1)',
    transform: 'scale(1.1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
  },
  buttonDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
}

function DefaultPrevButton() {
  return <span style={{ marginRight: 2 }}>&#8249;</span>
}

function DefaultNextButton() {
  return <span style={{ marginLeft: 2 }}>&#8250;</span>
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
  const isDefaultPrev = prevButton === undefined
  const isDefaultNext = nextButton === undefined
  const [prevHovered, setPrevHovered] = useState(false)
  const [nextHovered, setNextHovered] = useState(false)

  return (
    <div className="r3dss__controls" style={styles.container}>
      {showPrev && (
        <button
          className={`r3dss__control r3dss__control--prev ${!canGoPrev ? 'r3dss__control--disabled' : ''} ${prevHovered && canGoPrev && isDefaultPrev ? 'r3dss__control--hovered' : ''}`}
          style={{
            ...styles.button,
            ...(prevHovered && canGoPrev && isDefaultPrev ? styles.buttonHovered : {}),
            ...(canGoPrev ? {} : styles.buttonDisabled),
          }}
          onClick={onPrev}
          onMouseEnter={() => setPrevHovered(true)}
          onMouseLeave={() => setPrevHovered(false)}
          disabled={!canGoPrev}
          aria-label="Previous slide"
        >
          {prevButton ?? <DefaultPrevButton />}
        </button>
      )}
      {!showPrev && <div className="r3dss__control-spacer" />}
      {showNext && (
        <button
          className={`r3dss__control r3dss__control--next ${!canGoNext ? 'r3dss__control--disabled' : ''} ${nextHovered && canGoNext && isDefaultNext ? 'r3dss__control--hovered' : ''}`}
          style={{
            ...styles.button,
            ...(nextHovered && canGoNext && isDefaultNext ? styles.buttonHovered : {}),
            ...(canGoNext ? {} : styles.buttonDisabled),
          }}
          onClick={onNext}
          onMouseEnter={() => setNextHovered(true)}
          onMouseLeave={() => setNextHovered(false)}
          disabled={!canGoNext}
          aria-label="Next slide"
        >
          {nextButton ?? <DefaultNextButton />}
        </button>
      )}
    </div>
  )
}
