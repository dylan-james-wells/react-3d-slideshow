import { Suspense } from 'react'
import { SlideData, TransitionStyle } from '../types'
import {
  CascadeTransition,
  CubeTransition,
  FlipTransition,
  GlitchTransition,
  WaveTransition,
  ZoomTransition,
} from '../transitions'

interface SceneProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
  style: TransitionStyle
  direction: 'next' | 'prev'
  cascadeSubdivisions?: number
  aspectRatio?: number
  glitchAberration?: number
  glitchScanlines?: number
  glitchGrain?: number
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
  cascadeSubdivisions = 20,
  aspectRatio = 3 / 2,
  glitchAberration = 0.5,
  glitchScanlines = 0.5,
  glitchGrain = 0.5,
}: SceneProps) {
  const renderTransition = () => {
    const props = {
      slides,
      currentIndex,
      transitionDuration,
      direction,
    }

    switch (style) {
      case 'cascade':
        return (
          <CascadeTransition
            {...props}
            subdivisions={cascadeSubdivisions}
            aspectRatio={aspectRatio}
          />
        )
      case 'cube':
        return <CubeTransition {...props} />
      case 'flip':
        return <FlipTransition {...props} />
      case 'glitch':
        return <GlitchTransition {...props} aspectRatio={aspectRatio} aberrationIntensity={glitchAberration} scanlinesIntensity={glitchScanlines} grainIntensity={glitchGrain} />
      case 'wave':
        return <WaveTransition {...props} />
      case 'zoom':
        return <ZoomTransition {...props} />
      default:
        return <CascadeTransition {...props} subdivisions={cascadeSubdivisions} aspectRatio={aspectRatio} />
    }
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ambientLight intensity={1} />
      {renderTransition()}
    </Suspense>
  )
}
