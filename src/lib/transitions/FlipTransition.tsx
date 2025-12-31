import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { SlideData } from '../types'

interface FlipTransitionProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
  direction: 'next' | 'prev'
}

export function FlipTransition({
  slides,
  currentIndex,
  transitionDuration,
  direction,
}: FlipTransitionProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [targetRotation, setTargetRotation] = useState(0)
  const [prevIndex, setPrevIndex] = useState(currentIndex)
  const [visibleSlides, setVisibleSlides] = useState<number[]>([currentIndex])

  const textures = useTexture(
    slides.map((slide) => slide.image || '/placeholder.jpg')
  )

  useEffect(() => {
    if (currentIndex !== prevIndex) {
      setVisibleSlides([prevIndex, currentIndex])
      const rotationDelta = direction === 'next' ? Math.PI : -Math.PI
      setTargetRotation((prev) => prev + rotationDelta)
      setPrevIndex(currentIndex)

      const timeout = setTimeout(() => {
        setVisibleSlides([currentIndex])
      }, transitionDuration)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, prevIndex, direction, transitionDuration])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    const speed = (1 / transitionDuration) * 1000 * delta
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotation,
      speed * 3
    )
  })

  return (
    <group ref={groupRef}>
      {visibleSlides.map((slideIndex) => {
        const isCurrent = slideIndex === currentIndex
        const zOffset = isCurrent ? 0.01 : -0.01
        const rotationY = isCurrent ? 0 : Math.PI

        return (
          <mesh
            key={slides[slideIndex].id}
            position={[0, 0, zOffset]}
            rotation={[0, rotationY, 0]}
          >
            <planeGeometry args={[3, 2]} />
            <meshBasicMaterial
              map={textures[slideIndex]}
              side={THREE.FrontSide}
            />
          </mesh>
        )
      })}
    </group>
  )
}
