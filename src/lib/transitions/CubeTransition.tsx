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
  const pivotRef = useRef<THREE.Group>(null)
  const [isReady, setIsReady] = useState(false)
  const canvasesRef = useRef<HTMLCanvasElement[]>([])

  // Two planes that form an "L" shape, rotating around their shared edge
  const currentPlaneRef = useRef<THREE.Mesh>(null)
  const nextPlaneRef = useRef<THREE.Mesh>(null)

  const animStateRef = useRef({
    isAnimating: false,
    progress: 0,
    rotationAxis: new THREE.Vector3(0, 1, 0),
    rotationAngle: Math.PI / 2, // Always 90 degrees, sign determines direction
    targetSlideIndex: 0, // The slide we're animating to
    rushMode: false, // When true, animate faster to catch up
  })

  // Track step: even = horizontal rotation, odd = vertical rotation
  const stepRef = useRef(0)
  const prevIndexRef = useRef(currentIndex)
  const lastDirectionRef = useRef(direction)
  const pendingIndexRef = useRef<number | null>(null) // Queue for next slide if animation is running

  const cubeSize = Math.min(viewport.width * 0.6, viewport.height * 0.6)
  const halfSize = cubeSize / 2

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

  // Track initialization
  const initializedRef = useRef(false)
  const initialSlideRef = useRef(currentIndex)

  // Initialize - set up first slide (only once)
  useEffect(() => {
    if (!isReady || !currentPlaneRef.current || !pivotRef.current) return
    if (initializedRef.current) return

    // Current plane at front, centered
    currentPlaneRef.current.position.set(0, 0, halfSize)
    currentPlaneRef.current.rotation.set(0, 0, 0)
    setPlaneTexture(currentPlaneRef.current, initialSlideRef.current)

    // Reset pivot
    pivotRef.current.position.set(0, 0, 0)
    pivotRef.current.rotation.set(0, 0, 0)

    prevIndexRef.current = initialSlideRef.current
    stepRef.current = 0
    initializedRef.current = true
  }, [isReady, halfSize, setPlaneTexture])

  // Helper to start animation for a specific slide transition
  const startAnimation = useCallback((targetIndex: number, dir: 'next' | 'prev') => {
    if (!currentPlaneRef.current || !nextPlaneRef.current || !pivotRef.current) return

    const state = animStateRef.current
    const isForward = dir === 'next'
    const step = stepRef.current
    const isEvenStep = step % 2 === 0

    // Pivot stays at origin (center of theoretical cube)
    pivotRef.current.position.set(0, 0, 0)
    pivotRef.current.rotation.set(0, 0, 0)

    // Position planes as two faces of a cube centered at origin
    if (isForward) {
      if (isEvenStep) {
        // Rotate right around Y axis
        currentPlaneRef.current.position.set(0, 0, halfSize)
        currentPlaneRef.current.rotation.set(0, 0, 0)

        nextPlaneRef.current.position.set(halfSize, 0, 0)
        nextPlaneRef.current.rotation.set(0, Math.PI / 2, 0)

        state.rotationAxis.set(0, 1, 0)
        state.rotationAngle = -Math.PI / 2
      } else {
        // Rotate down around X axis
        currentPlaneRef.current.position.set(0, 0, halfSize)
        currentPlaneRef.current.rotation.set(0, 0, 0)

        nextPlaneRef.current.position.set(0, halfSize, 0)
        nextPlaneRef.current.rotation.set(-Math.PI / 2, 0, 0)

        state.rotationAxis.set(1, 0, 0)
        state.rotationAngle = Math.PI / 2
      }
      stepRef.current++
    } else {
      // Backward
      if (step > 0) {
        const prevStepWasEven = (step - 1) % 2 === 0
        if (prevStepWasEven) {
          currentPlaneRef.current.position.set(0, 0, halfSize)
          currentPlaneRef.current.rotation.set(0, 0, 0)

          nextPlaneRef.current.position.set(-halfSize, 0, 0)
          nextPlaneRef.current.rotation.set(0, -Math.PI / 2, 0)

          state.rotationAxis.set(0, 1, 0)
          state.rotationAngle = Math.PI / 2
        } else {
          currentPlaneRef.current.position.set(0, 0, halfSize)
          currentPlaneRef.current.rotation.set(0, 0, 0)

          nextPlaneRef.current.position.set(0, -halfSize, 0)
          nextPlaneRef.current.rotation.set(Math.PI / 2, 0, 0)

          state.rotationAxis.set(1, 0, 0)
          state.rotationAngle = -Math.PI / 2
        }
        stepRef.current--
      }
    }

    // Set textures
    setPlaneTexture(currentPlaneRef.current, prevIndexRef.current)
    setPlaneTexture(nextPlaneRef.current, targetIndex)

    nextPlaneRef.current.visible = true
    lastDirectionRef.current = dir

    state.isAnimating = true
    state.progress = 0
    state.targetSlideIndex = targetIndex
  }, [halfSize, setPlaneTexture])

  // Handle slide changes
  useEffect(() => {
    if (currentIndex === prevIndexRef.current || !isReady) return
    if (!initializedRef.current) return
    if (!currentPlaneRef.current || !nextPlaneRef.current || !pivotRef.current) return

    const state = animStateRef.current

    // If animation is running, queue the new slide and enable rush mode
    if (state.isAnimating) {
      pendingIndexRef.current = currentIndex
      state.rushMode = true
      return
    }

    startAnimation(currentIndex, direction)
  }, [currentIndex, isReady, direction, startAnimation])

  // Animation
  useFrame((_, delta) => {
    if (!pivotRef.current || !currentPlaneRef.current || !nextPlaneRef.current) return
    const state = animStateRef.current

    if (state.isAnimating) {
      // Speed up animation if there are pending slides (rush mode)
      const rushMultiplier = state.rushMode ? 4 : 1
      const speed = (1 / transitionDuration) * 1000 * rushMultiplier
      state.progress = Math.min(state.progress + delta * speed, 1)
      const t = easeInOutCubic(state.progress)

      // Rotate the pivot group
      const angle = state.rotationAngle * t
      if (state.rotationAxis.x === 1) {
        pivotRef.current.rotation.set(angle, 0, 0)
      } else {
        pivotRef.current.rotation.set(0, angle, 0)
      }

      if (state.progress >= 1) {
        state.isAnimating = false
        state.rushMode = false

        // Reset everything for next transition
        pivotRef.current.position.set(0, 0, 0)
        pivotRef.current.rotation.set(0, 0, 0)

        // Current plane shows new slide at front
        currentPlaneRef.current.position.set(0, 0, halfSize)
        currentPlaneRef.current.rotation.set(0, 0, 0)
        setPlaneTexture(currentPlaneRef.current, state.targetSlideIndex)

        // Hide next plane
        nextPlaneRef.current.visible = false

        // Update prevIndexRef now that animation is complete
        prevIndexRef.current = state.targetSlideIndex

        // If there's a pending slide, start animating to it
        if (pendingIndexRef.current !== null && pendingIndexRef.current !== state.targetSlideIndex) {
          const pendingIndex = pendingIndexRef.current
          pendingIndexRef.current = null
          // Determine direction based on index difference
          const dir = pendingIndex > state.targetSlideIndex ? 'next' : 'prev'
          state.rushMode = true // Keep rushing if more pending
          startAnimation(pendingIndex, dir)
        }
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
      <group ref={pivotRef}>
        {/* Current slide */}
        <mesh ref={currentPlaneRef}>
          <planeGeometry args={[cubeSize, cubeSize]} />
          <meshBasicMaterial side={THREE.FrontSide} />
        </mesh>

        {/* Next slide */}
        <mesh ref={nextPlaneRef} visible={false}>
          <planeGeometry args={[cubeSize, cubeSize]} />
          <meshBasicMaterial side={THREE.FrontSide} />
        </mesh>
      </group>
    </>
  )
}
