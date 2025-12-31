import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { SlideData } from '../types'

interface CarouselTransitionProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
}

function CarouselSlide({
  slide,
  index,
  currentIndex,
  totalSlides,
  transitionDuration,
}: {
  slide: SlideData
  index: number
  currentIndex: number
  totalSlides: number
  transitionDuration: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(slide.image || '/placeholder.jpg')

  const targetPosition = useMemo(() => {
    const diff = index - currentIndex
    const radius = 4
    const angle = (diff / totalSlides) * Math.PI * 2

    return {
      x: Math.sin(angle) * radius,
      z: Math.cos(angle) * radius - radius,
      rotationY: -angle,
    }
  }, [index, currentIndex, totalSlides])

  useFrame((_, delta) => {
    if (!meshRef.current) return

    const speed = (1 / transitionDuration) * 1000 * delta

    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      targetPosition.x,
      speed * 3
    )
    meshRef.current.position.z = THREE.MathUtils.lerp(
      meshRef.current.position.z,
      targetPosition.z,
      speed * 3
    )
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      targetPosition.rotationY,
      speed * 3
    )
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[3, 2]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  )
}

export function CarouselTransition({
  slides,
  currentIndex,
  transitionDuration,
}: CarouselTransitionProps) {
  return (
    <group>
      {slides.map((slide, index) => (
        <CarouselSlide
          key={slide.id}
          slide={slide}
          index={index}
          currentIndex={currentIndex}
          totalSlides={slides.length}
          transitionDuration={transitionDuration}
        />
      ))}
    </group>
  )
}
