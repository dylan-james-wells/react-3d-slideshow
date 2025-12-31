import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { SlideData } from '../types'

interface WaveTransitionProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
  direction: 'next' | 'prev'
}

const SEGMENTS = 32

function WaveSlide({
  slide,
  isActive,
  transitionDuration,
  direction,
  zIndex,
}: {
  slide: SlideData
  isActive: boolean
  transitionDuration: number
  direction: 'next' | 'prev'
  zIndex: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(slide.image || '/placeholder.jpg')
  const progressRef = useRef(isActive ? 1 : 0)

  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(3, 2, SEGMENTS, SEGMENTS)
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    const speed = (1 / transitionDuration) * 1000 * delta
    const targetProgress = isActive ? 1 : 0
    progressRef.current = THREE.MathUtils.lerp(
      progressRef.current,
      targetProgress,
      speed * 2
    )

    const positions = meshRef.current.geometry.attributes.position
    const originalPositions = geometry.attributes.position

    for (let i = 0; i < positions.count; i++) {
      const x = originalPositions.getX(i)
      const y = originalPositions.getY(i)

      const waveProgress = isActive
        ? progressRef.current
        : 1 - progressRef.current

      const waveOffset = direction === 'next' ? x + 1.5 : -x + 1.5
      const normalizedOffset = waveOffset / 3
      const waveDelay = normalizedOffset * 0.5

      const adjustedProgress = Math.max(
        0,
        Math.min(1, (waveProgress - waveDelay) / 0.5)
      )

      const wave =
        Math.sin(adjustedProgress * Math.PI) *
        0.3 *
        Math.sin(state.clock.elapsedTime * 2 + x * 2)

      const z = isActive
        ? wave * (1 - adjustedProgress)
        : wave * adjustedProgress

      positions.setXYZ(i, x, y, z + zIndex * 0.01)
    }

    positions.needsUpdate = true

    const material = meshRef.current.material as THREE.MeshBasicMaterial
    material.opacity = progressRef.current
  })

  return (
    <mesh ref={meshRef} geometry={geometry.clone()}>
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  )
}

export function WaveTransition({
  slides,
  currentIndex,
  transitionDuration,
  direction,
}: WaveTransitionProps) {
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
      {visibleSlides.map((slideIndex) => (
        <WaveSlide
          key={slides[slideIndex].id}
          slide={slides[slideIndex]}
          isActive={slideIndex === currentIndex}
          transitionDuration={transitionDuration}
          direction={direction}
          zIndex={slideIndex === currentIndex ? 1 : 0}
        />
      ))}
    </group>
  )
}
