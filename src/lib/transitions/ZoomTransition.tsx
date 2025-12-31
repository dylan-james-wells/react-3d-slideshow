import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { SlideData } from '../types'

interface ZoomTransitionProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
  direction: 'next' | 'prev'
}

function ZoomSlide({
  slide,
  isActive,
  isEntering,
  transitionDuration,
  zIndex,
}: {
  slide: SlideData
  isActive: boolean
  isEntering: boolean
  transitionDuration: number
  zIndex: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const texture = useTexture(slide.image || '/placeholder.jpg')

  useFrame((_, delta) => {
    if (!meshRef.current || !materialRef.current) return

    const speed = (1 / transitionDuration) * 1000 * delta

    if (isActive) {
      const targetScale = 1
      const targetZ = 0
      const targetOpacity = 1

      meshRef.current.scale.x = THREE.MathUtils.lerp(
        meshRef.current.scale.x,
        targetScale,
        speed * 3
      )
      meshRef.current.scale.y = THREE.MathUtils.lerp(
        meshRef.current.scale.y,
        targetScale,
        speed * 3
      )
      meshRef.current.position.z = THREE.MathUtils.lerp(
        meshRef.current.position.z,
        targetZ,
        speed * 3
      )
      materialRef.current.opacity = THREE.MathUtils.lerp(
        materialRef.current.opacity,
        targetOpacity,
        speed * 3
      )
    } else {
      const targetScale = isEntering ? 0.5 : 1.5
      const targetZ = isEntering ? -2 : 2
      const targetOpacity = 0

      meshRef.current.scale.x = THREE.MathUtils.lerp(
        meshRef.current.scale.x,
        targetScale,
        speed * 3
      )
      meshRef.current.scale.y = THREE.MathUtils.lerp(
        meshRef.current.scale.y,
        targetScale,
        speed * 3
      )
      meshRef.current.position.z = THREE.MathUtils.lerp(
        meshRef.current.position.z,
        targetZ,
        speed * 3
      )
      materialRef.current.opacity = THREE.MathUtils.lerp(
        materialRef.current.opacity,
        targetOpacity,
        speed * 3
      )
    }
  })

  const initialScale = isActive ? 1 : isEntering ? 0.5 : 1
  const initialZ = isActive ? 0 : isEntering ? -2 : 0

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, initialZ + zIndex * 0.01]}
      scale={[initialScale, initialScale, 1]}
    >
      <planeGeometry args={[3, 2]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={isActive ? 1 : 0}
      />
    </mesh>
  )
}

export function ZoomTransition({
  slides,
  currentIndex,
  transitionDuration,
}: ZoomTransitionProps) {
  const [visibleSlides, setVisibleSlides] = useState<{
    index: number
    isEntering: boolean
  }[]>([{ index: currentIndex, isEntering: false }])
  const [prevIndex, setPrevIndex] = useState(currentIndex)

  useEffect(() => {
    if (currentIndex !== prevIndex) {
      setVisibleSlides([
        { index: prevIndex, isEntering: false },
        { index: currentIndex, isEntering: true },
      ])
      setPrevIndex(currentIndex)

      const timeout = setTimeout(() => {
        setVisibleSlides([{ index: currentIndex, isEntering: false }])
      }, transitionDuration)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, prevIndex, transitionDuration])

  return (
    <group>
      {visibleSlides.map(({ index: slideIndex, isEntering }) => (
        <ZoomSlide
          key={slides[slideIndex].id}
          slide={slides[slideIndex]}
          isActive={slideIndex === currentIndex}
          isEntering={isEntering}
          transitionDuration={transitionDuration}
          zIndex={slideIndex === currentIndex ? 1 : 0}
        />
      ))}
    </group>
  )
}
