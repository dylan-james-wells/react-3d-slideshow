import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { SlideData } from '../types'

interface FadeTransitionProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
}

function FadeSlide({
  slide,
  isActive,
  transitionDuration,
  zIndex,
}: {
  slide: SlideData
  isActive: boolean
  transitionDuration: number
  zIndex: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const texture = useTexture(slide.image || '/placeholder.jpg')

  useFrame((_, delta) => {
    if (!materialRef.current) return

    const speed = (1 / transitionDuration) * 1000 * delta
    const targetOpacity = isActive ? 1 : 0

    materialRef.current.opacity = THREE.MathUtils.lerp(
      materialRef.current.opacity,
      targetOpacity,
      speed * 3
    )
  })

  return (
    <mesh ref={meshRef} position={[0, 0, zIndex * 0.01]}>
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

export function FadeTransition({
  slides,
  currentIndex,
  transitionDuration,
}: FadeTransitionProps) {
  const [visibleSlides, setVisibleSlides] = useState<number[]>([currentIndex])
  const [prevIndex, setPrevIndex] = useState(currentIndex)

  useEffect(() => {
    if (currentIndex !== prevIndex) {
      setVisibleSlides([prevIndex, currentIndex])
      setPrevIndex(currentIndex)

      const timeout = setTimeout(() => {
        setVisibleSlides([currentIndex])
      }, transitionDuration)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, prevIndex, transitionDuration])

  return (
    <group>
      {visibleSlides.map((slideIndex, i) => (
        <FadeSlide
          key={slides[slideIndex].id}
          slide={slides[slideIndex]}
          isActive={slideIndex === currentIndex}
          transitionDuration={transitionDuration}
          zIndex={i}
        />
      ))}
    </group>
  )
}
