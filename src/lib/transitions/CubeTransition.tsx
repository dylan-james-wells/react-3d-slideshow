import { useRef, useEffect, useState, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SlideData } from '../types'

interface CubeTransitionProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
  direction: 'next' | 'prev'
}

const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function CubeTransition({
  slides,
  currentIndex,
  transitionDuration,
  direction,
}: CubeTransitionProps) {
  const { viewport } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const [isReady, setIsReady] = useState(false)
  const canvasesRef = useRef<HTMLCanvasElement[]>([])

  // We use 2 planes: current (front-facing) and next (positioned for rotation)
  const currentPlaneRef = useRef<THREE.Mesh>(null)
  const nextPlaneRef = useRef<THREE.Mesh>(null)

  const animStateRef = useRef({
    isAnimating: false,
    progress: 0,
    rotationAxis: 'y' as 'x' | 'y',
    rotationDirection: 1, // 1 or -1
  })

  // Track step: even = horizontal rotation, odd = vertical rotation
  const stepRef = useRef(0)
  const prevIndexRef = useRef(currentIndex)

  // Load all images
  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLCanvasElement> => {
      return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const size = Math.min(img.width, img.height)
          const canvas = document.createElement('canvas')
          canvas.width = 512
          canvas.height = 512
          const ctx = canvas.getContext('2d')!
          const offsetX = (img.width - size) / 2
          const offsetY = (img.height - size) / 2
          ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, 512, 512)
          resolve(canvas)
        }
        img.onerror = () => {
          const canvas = document.createElement('canvas')
          canvas.width = 512
          canvas.height = 512
          const ctx = canvas.getContext('2d')!
          ctx.fillStyle = '#333'
          ctx.fillRect(0, 0, 512, 512)
          resolve(canvas)
        }
        img.src = src
      })
    }

    const createFallback = (color: string): HTMLCanvasElement => {
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 512, 512)
      return canvas
    }

    Promise.all(
      slides.map((slide) =>
        slide.image ? loadImage(slide.image) : Promise.resolve(createFallback(slide.backgroundColor || '#333'))
      )
    ).then((canvases) => {
      canvasesRef.current = canvases
      setIsReady(true)
    })
  }, [slides])

  // Create texture from canvas
  const createTexture = useCallback((slideIndex: number): THREE.CanvasTexture => {
    const canvas = canvasesRef.current[slideIndex]
    if (!canvas) {
      const fallback = document.createElement('canvas')
      fallback.width = 512
      fallback.height = 512
      const texture = new THREE.CanvasTexture(fallback)
      texture.colorSpace = THREE.SRGBColorSpace
      return texture
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])

  // Set texture on a plane
  const setPlaneTexture = useCallback((plane: THREE.Mesh | null, slideIndex: number) => {
    if (!plane) return
    const material = plane.material as THREE.MeshBasicMaterial
    if (material.map) {
      material.map.dispose()
    }
    material.map = createTexture(slideIndex)
    material.needsUpdate = true
  }, [createTexture])

  const cubeSize = Math.min(viewport.width * 0.6, viewport.height * 0.6)
  const halfSize = cubeSize / 2

  // Initialize - set up first slide
  useEffect(() => {
    if (!isReady || !currentPlaneRef.current) return

    setPlaneTexture(currentPlaneRef.current, currentIndex)
    prevIndexRef.current = currentIndex
    stepRef.current = 0
  }, [isReady, setPlaneTexture]) // Note: currentIndex intentionally not in deps for init

  // Handle slide changes
  useEffect(() => {
    if (currentIndex === prevIndexRef.current || !isReady) return
    if (!currentPlaneRef.current || !nextPlaneRef.current || !groupRef.current) return

    const state = animStateRef.current
    const isForward = direction === 'next'
    const step = stepRef.current
    const isEvenStep = step % 2 === 0

    // Reset group rotation
    groupRef.current.rotation.set(0, 0, 0)

    // Current plane stays at front, facing camera
    currentPlaneRef.current.position.set(0, 0, halfSize)
    currentPlaneRef.current.rotation.set(0, 0, 0)

    // Set up next plane position based on rotation direction
    // The next plane is positioned at 90° from current, ready to rotate into view
    if (isForward) {
      if (isEvenStep) {
        // Rotate right: next plane is on the left side
        nextPlaneRef.current.position.set(-halfSize, 0, 0)
        nextPlaneRef.current.rotation.set(0, Math.PI / 2, 0)
        state.rotationAxis = 'y'
        state.rotationDirection = -1 // Y decreases (rotate right)
      } else {
        // Rotate down: next plane is on top
        nextPlaneRef.current.position.set(0, halfSize, 0)
        nextPlaneRef.current.rotation.set(-Math.PI / 2, 0, 0)
        state.rotationAxis = 'x'
        state.rotationDirection = 1 // X increases (rotate down)
      }
      stepRef.current++
    } else {
      // Backward
      if (step > 0) {
        const prevStepWasEven = (step - 1) % 2 === 0
        if (prevStepWasEven) {
          // Undo right: next plane is on the right side
          nextPlaneRef.current.position.set(halfSize, 0, 0)
          nextPlaneRef.current.rotation.set(0, -Math.PI / 2, 0)
          state.rotationAxis = 'y'
          state.rotationDirection = 1 // Y increases (rotate left)
        } else {
          // Undo down: next plane is on bottom
          nextPlaneRef.current.position.set(0, -halfSize, 0)
          nextPlaneRef.current.rotation.set(Math.PI / 2, 0, 0)
          state.rotationAxis = 'x'
          state.rotationDirection = -1 // X decreases (rotate up)
        }
        stepRef.current--
      }
    }

    // Set textures
    setPlaneTexture(currentPlaneRef.current, prevIndexRef.current)
    setPlaneTexture(nextPlaneRef.current, currentIndex)

    // Make next plane visible
    nextPlaneRef.current.visible = true

    state.isAnimating = true
    state.progress = 0
    prevIndexRef.current = currentIndex
  }, [currentIndex, isReady, direction, halfSize, setPlaneTexture])

  // Animation
  useFrame((_, delta) => {
    if (!groupRef.current || !currentPlaneRef.current || !nextPlaneRef.current) return
    const state = animStateRef.current

    if (state.isAnimating) {
      const speed = (1 / transitionDuration) * 1000
      state.progress = Math.min(state.progress + delta * speed, 1)
      const t = easeInOutCubic(state.progress)

      // Rotate the group
      const angle = (Math.PI / 2) * t * state.rotationDirection
      if (state.rotationAxis === 'y') {
        groupRef.current.rotation.y = angle
      } else {
        groupRef.current.rotation.x = angle
      }

      if (state.progress >= 1) {
        state.isAnimating = false

        // Animation complete - reset for next transition
        groupRef.current.rotation.set(0, 0, 0)

        // Swap: current plane now shows the new slide, positioned at front
        setPlaneTexture(currentPlaneRef.current, currentIndex)
        currentPlaneRef.current.position.set(0, 0, halfSize)
        currentPlaneRef.current.rotation.set(0, 0, 0)

        // Hide next plane
        nextPlaneRef.current.visible = false
      }
    }
  })

  if (!isReady) {
    return (
      <mesh>
        <boxGeometry args={[cubeSize, cubeSize, cubeSize]} />
        <meshBasicMaterial color="#333" />
      </mesh>
    )
  }

  return (
    <>
      <ambientLight intensity={1} />
      <group ref={groupRef}>
        {/* Current slide - front facing */}
        <mesh ref={currentPlaneRef} position={[0, 0, halfSize]}>
          <planeGeometry args={[cubeSize, cubeSize]} />
          <meshBasicMaterial side={THREE.FrontSide} />
        </mesh>

        {/* Next slide - positioned based on rotation direction */}
        <mesh ref={nextPlaneRef} visible={false}>
          <planeGeometry args={[cubeSize, cubeSize]} />
          <meshBasicMaterial side={THREE.FrontSide} />
        </mesh>
      </group>
    </>
  )
}
