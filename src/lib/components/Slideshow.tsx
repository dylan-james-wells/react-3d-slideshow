import React, { forwardRef, useImperativeHandle, useMemo, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { SlideshowProps, SlideshowHandle } from '../types'
import { useSlideshow, useSwipe, useKeyboard } from '../hooks'
import { Scene } from './Scene'
import { Controls } from './Controls'
import { Indicators } from './Indicators'
import { LoadingSpinner } from './LoadingSpinner'

const defaultProps: Partial<SlideshowProps> = {
  style: 'cascade',
  autoPlay: false,
  autoPlayInterval: 5000,
  showControls: true,
  showIndicators: true,
  loop: true,
  transitionDuration: 800,
  width: '100%',
  height: 400,
  initialSlide: 0,
  enableSwipe: true,
  enableKeyboard: true,
  pauseOnHover: true,
  cascadeMinTiles: 10,
  aspectRatio: 3 / 2,
  glitchAberration: 0.5,
  glitchScanlines: 0.5,
  glitchGrain: 0.5,
}

export const Slideshow = forwardRef<SlideshowHandle, SlideshowProps>(
  (props, ref) => {
    const {
      slides,
      style = defaultProps.style!,
      autoPlay = defaultProps.autoPlay,
      autoPlayInterval = defaultProps.autoPlayInterval,
      showControls = defaultProps.showControls,
      showIndicators = defaultProps.showIndicators,
      loop = defaultProps.loop,
      transitionDuration = defaultProps.transitionDuration!,
      width = defaultProps.width,
      height = defaultProps.height,
      className,
      onSlideChange,
      initialSlide = defaultProps.initialSlide,
      enableSwipe = defaultProps.enableSwipe,
      enableKeyboard = defaultProps.enableKeyboard,
      pauseOnHover = defaultProps.pauseOnHover,
      cascadeMinTiles = defaultProps.cascadeMinTiles,
      aspectRatio = defaultProps.aspectRatio,
      glitchAberration = defaultProps.glitchAberration,
      glitchScanlines = defaultProps.glitchScanlines,
      glitchGrain = defaultProps.glitchGrain,
      fullscreen = false,
      loadingSpinner,
      prevButton,
      nextButton,
      renderIndicator,
    } = props

    const [isLoading, setIsLoading] = useState(true)
    const handleReady = useCallback(() => setIsLoading(false), [])

    const {
      currentIndex,
      direction,
      next,
      prev,
      goTo,
      pause,
      resume,
      canGoNext,
      canGoPrev,
    } = useSlideshow({
      slides,
      initialSlide,
      autoPlay,
      autoPlayInterval,
      loop,
      pauseOnHover,
      onSlideChange,
    })

    const {
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleMouseLeave,
    } = useSwipe({
      onSwipeLeft: next,
      onSwipeRight: prev,
      enabled: enableSwipe,
    })

    useKeyboard({
      onNext: next,
      onPrev: prev,
      enabled: enableKeyboard,
    })

    useImperativeHandle(ref, () => ({
      next,
      prev,
      goTo,
      getCurrentIndex: () => currentIndex,
    }))

    const containerStyle: React.CSSProperties = useMemo(
      () => ({
        position: 'relative',
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        overflow: 'hidden',
        borderRadius: 8,
        background: '#000',
      }),
      [width, height]
    )

    if (slides.length === 0) {
      return (
        <div style={containerStyle} className={className}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#666',
            }}
          >
            No slides provided
          </div>
        </div>
      )
    }

    const onMouseLeave = useCallback(() => {
      handleMouseLeave()
      resume()
    }, [handleMouseLeave, resume])

    return (
      <div
        style={{ ...containerStyle, cursor: enableSwipe ? 'grab' : undefined }}
        className={className}
        onMouseEnter={pause}
        onMouseLeave={onMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          dpr={[1, 2]}
          style={{ touchAction: 'pan-y' }}
          flat
        >
          <Scene
            slides={slides}
            currentIndex={currentIndex}
            transitionDuration={transitionDuration}
            style={style}
            direction={direction}
            cascadeMinTiles={cascadeMinTiles}
            aspectRatio={aspectRatio}
            glitchAberration={glitchAberration}
            glitchScanlines={glitchScanlines}
            glitchGrain={glitchGrain}
            fullscreen={fullscreen}
            onReady={handleReady}
          />
        </Canvas>

        {isLoading && loadingSpinner !== null && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#000',
              zIndex: 10,
            }}
          >
            {loadingSpinner ?? <LoadingSpinner />}
          </div>
        )}

        {showControls && slides.length > 1 && (
          <Controls
            onNext={next}
            onPrev={prev}
            canGoNext={canGoNext}
            canGoPrev={canGoPrev}
            prevButton={prevButton}
            nextButton={nextButton}
          />
        )}

        {showIndicators && slides.length > 1 && (
          <Indicators
            total={slides.length}
            current={currentIndex}
            onSelect={goTo}
            renderIndicator={renderIndicator}
          />
        )}
      </div>
    )
  }
)

Slideshow.displayName = 'Slideshow'
