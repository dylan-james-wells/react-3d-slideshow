import React, { useMemo } from 'react'
import { SlideData } from '../types'

export interface FallbackSlideshowProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
  aspectRatio?: number
}

export function FallbackSlideshow({
  slides,
  currentIndex,
  transitionDuration,
  aspectRatio = 3 / 2,
}: FallbackSlideshowProps) {
  const containerStyle: React.CSSProperties = useMemo(
    () => ({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
    }),
    []
  )

  const slideStyle = useMemo(
    (): React.CSSProperties => ({
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      transition: `opacity ${transitionDuration}ms ease-in-out`,
    }),
    [transitionDuration]
  )

  const contentStyle = useMemo(
    (): React.CSSProperties => ({
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: `min(100%, calc(100vh * ${aspectRatio}))`,
      height: `min(100%, calc(100vw / ${aspectRatio}))`,
      maxWidth: '100%',
      maxHeight: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: `opacity ${transitionDuration}ms ease-in-out`,
    }),
    [transitionDuration, aspectRatio]
  )

  return (
    <div className="r3dss__fallback" style={containerStyle}>
      {slides.map((slide, index) => {
        const isActive = index === currentIndex
        const opacity = isActive ? 1 : 0
        const zIndex = isActive ? 1 : 0

        if (slide.image) {
          return (
            <img
              key={slide.id}
              src={slide.image}
              alt=""
              className={`r3dss__fallback-slide ${isActive ? 'r3dss__fallback-slide--active' : ''}`}
              style={{
                ...slideStyle,
                opacity,
                zIndex,
                backgroundColor: slide.backgroundColor || 'transparent',
              }}
            />
          )
        }

        if (slide.content) {
          return (
            <div
              key={slide.id}
              className={`r3dss__fallback-slide ${isActive ? 'r3dss__fallback-slide--active' : ''}`}
              style={{
                ...contentStyle,
                opacity,
                zIndex,
                backgroundColor: slide.backgroundColor || '#000',
              }}
            >
              {slide.content}
            </div>
          )
        }

        return (
          <div
            key={slide.id}
            className={`r3dss__fallback-slide ${isActive ? 'r3dss__fallback-slide--active' : ''}`}
            style={{
              ...contentStyle,
              opacity,
              zIndex,
              backgroundColor: slide.backgroundColor || '#333',
            }}
          />
        )
      })}
    </div>
  )
}
