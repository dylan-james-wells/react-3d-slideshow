import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { SlideData } from '../types'

interface CubeTransitionProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
  direction: 'next' | 'prev'
}

export function CubeTransition({
  slides,
  currentIndex,
  transitionDuration,
  direction,
}: CubeTransitionProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [targetRotation, setTargetRotation] = useState(0)
  const [prevIndex, setPrevIndex] = useState(currentIndex)

  const textures = useTexture(
    slides.map((slide) => slide.image || '/placeholder.jpg')
  )

  useEffect(() => {
    if (currentIndex !== prevIndex) {
      const rotationDelta = direction === 'next' ? -Math.PI / 2 : Math.PI / 2
      setTargetRotation((prev) => prev + rotationDelta)
      setPrevIndex(currentIndex)
    }
  }, [currentIndex, prevIndex, direction])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    const speed = (1 / transitionDuration) * 1000 * delta
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotation,
      speed * 4
    )
  })

  const getVisibleFaces = () => {
    const faces: { position: [number, number, number]; rotation: [number, number, number]; textureIndex: number }[] = []
    const faceOrder = [0, 1, 2, 3]

    faceOrder.forEach((offset, i) => {
      const textureIndex = (currentIndex + offset) % slides.length
      const angle = (i * Math.PI) / 2

      faces.push({
        position: [Math.sin(angle) * 1.5, 0, Math.cos(angle) * 1.5],
        rotation: [0, -angle, 0],
        textureIndex,
      })
    })

    return faces
  }

  return (
    <group ref={groupRef}>
      {getVisibleFaces().map((face, index) => (
        <mesh
          key={index}
          position={face.position}
          rotation={face.rotation}
        >
          <planeGeometry args={[3, 2]} />
          <meshBasicMaterial
            map={textures[face.textureIndex]}
            side={THREE.FrontSide}
          />
        </mesh>
      ))}
    </group>
  )
}
