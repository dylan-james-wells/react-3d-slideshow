import { Suspense } from 'react'
import { SlideData, TransitionStyle } from '../types'
import {
  CarouselTransition,
  CubeTransition,
  FadeTransition,
  FlipTransition,
  WaveTransition,
  ZoomTransition,
} from '../transitions'

interface SceneProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
  style: TransitionStyle
  direction: 'next' | 'prev'
}

function LoadingFallback() {
  return (
    <mesh>
      <planeGeometry args={[3, 2]} />
      <meshBasicMaterial color="#333" />
    </mesh>
  )
}

export function Scene({
  slides,
  currentIndex,
  transitionDuration,
  style,
  direction,
}: SceneProps) {
  const renderTransition = () => {
    const props = {
      slides,
      currentIndex,
      transitionDuration,
      direction,
    }

    switch (style) {
      case 'carousel':
        return <CarouselTransition {...props} />
      case 'cube':
        return <CubeTransition {...props} />
      case 'fade':
        return <FadeTransition {...props} />
      case 'flip':
        return <FlipTransition {...props} />
      case 'wave':
        return <WaveTransition {...props} />
      case 'zoom':
        return <ZoomTransition {...props} />
      default:
        return <FadeTransition {...props} />
    }
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ambientLight intensity={1} />
      {renderTransition()}
    </Suspense>
  )
}
