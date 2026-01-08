import React from 'react'
import { IndicatorsProps } from '../types'

const focusStyles = `
.r3dss__indicator:focus {
  outline: none;
}
.r3dss__indicator:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
`

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 8,
    zIndex: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.9)',
    background: 'transparent',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.2s ease',
  },
  dotActive: {
    background: 'rgba(255, 255, 255, 0.9)',
    transform: 'scale(1.2)',
  },
}

export function Indicators({ total, current, onSelect, renderIndicator }: IndicatorsProps) {
  return (
    <>
      <style>{focusStyles}</style>
      <div
        className="r3dss__indicators"
        role="tablist"
        aria-label="Slide indicators"
        style={styles.container}
      >
        {Array.from({ length: total }, (_, i) => {
          const isActive = i === current

          if (renderIndicator) {
            return (
              <button
                key={i}
                type="button"
                role="tab"
                className={`r3dss__indicator r3dss__indicator--custom ${isActive ? 'r3dss__indicator--active' : ''}`}
                onClick={() => onSelect(i)}
                aria-label={`Slide ${i + 1}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                {renderIndicator(i, isActive)}
              </button>
            )
          }

          return (
            <button
              key={i}
              type="button"
              role="tab"
              className={`r3dss__indicator ${isActive ? 'r3dss__indicator--active' : ''}`}
              style={{
                ...styles.dot,
                ...(isActive ? styles.dotActive : {}),
              }}
              onClick={() => onSelect(i)}
              aria-label={`Slide ${i + 1}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
            />
          )
        })}
      </div>
    </>
  )
}
