import React, { useState, useMemo } from 'react'
import { ControlsProps, FocusRingStyles } from '../types'

function buildFocusStyles(ring: FocusRingStyles = {}) {
  const color = ring.color ?? '#fff'
  const width = ring.width ?? 2
  const offset = ring.offset ?? 2
  return `
.r3dss__control:focus {
  outline: none;
}
.r3dss__control:focus-visible {
  outline: ${width}px solid ${color};
  outline-offset: ${offset}px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), 0 0 0 4px rgba(0, 0, 0, 0.3);
}
`
}

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
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  customButton: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    pointerEvents: 'auto',
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
  return <span style={{ paddingRight: 4 }}>&#9664;</span>
}

function DefaultNextButton() {
  return <span style={{ paddingLeft: 4 }}>&#9654;</span>
}

export function Controls({
  onNext,
  onPrev,
  canGoNext,
  canGoPrev,
  prevButton,
  nextButton,
  focusRingStyles,
}: ControlsProps) {
  const showPrev = prevButton !== null
  const showNext = nextButton !== null
  const isDefaultPrev = prevButton === undefined
  const isDefaultNext = nextButton === undefined
  const [prevHovered, setPrevHovered] = useState(false)
  const [nextHovered, setNextHovered] = useState(false)

  const focusStyles = useMemo(
    () => buildFocusStyles(focusRingStyles),
    [focusRingStyles]
  )

  return (
    <>
      <style>{focusStyles}</style>
      <div
        className="r3dss__controls"
        role="group"
        aria-label="Slideshow controls"
        style={styles.container}
      >
        {showPrev && (
          <button
            type="button"
            className={`r3dss__control r3dss__control--prev ${!canGoPrev ? 'r3dss__control--disabled' : ''} ${prevHovered && canGoPrev && isDefaultPrev ? 'r3dss__control--hovered' : ''} ${!isDefaultPrev ? 'r3dss__control--custom' : ''}`}
            style={{
              ...(isDefaultPrev ? styles.button : styles.customButton),
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
            type="button"
            className={`r3dss__control r3dss__control--next ${!canGoNext ? 'r3dss__control--disabled' : ''} ${nextHovered && canGoNext && isDefaultNext ? 'r3dss__control--hovered' : ''} ${!isDefaultNext ? 'r3dss__control--custom' : ''}`}
            style={{
              ...(isDefaultNext ? styles.button : styles.customButton),
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
    </>
  )
}
