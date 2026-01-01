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
  })

  const displayedIndexRef = useRef(currentIndex) // The slide currently shown
  const targetIndexRef = useRef(currentIndex) // The final target slide
  const animationDirectionRef = useRef<'forward' | 'backward'>('forward')

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

    displayedIndexRef.current = initialSlideRef.current
    targetIndexRef.current = initialSlideRef.current
    initializedRef.current = true
  }, [isReady, halfSize, setPlaneTexture])

  // Helper to start animating to the next slide in sequence
  const startNextTransition = useCallback(() => {
    if (!currentPlaneRef.current || !nextPlaneRef.current || !pivotRef.current) return false
    if (canvasesRef.current.length === 0) return false

    const displayed = displayedIndexRef.current
    const target = targetIndexRef.current

    if (displayed === target) return false

    const state = animStateRef.current
    const dir = animationDirectionRef.current
    const isForward = dir === 'forward'

    // Calculate the next slide index (one step toward target)
    let nextIndex: number
    if (isForward) {
      nextIndex = (displayed + 1) % slides.length
    } else {
      nextIndex = (displayed - 1 + slides.length) % slides.length
    }

    // Determine rotation type based on the TARGET slide index
    // Even indices (0, 2, 4...) use horizontal rotation to arrive
    // Odd indices (1, 3, 5...) use vertical rotation to arrive
    const targetIsEven = nextIndex % 2 === 0

    // Pivot stays at origin (center of theoretical cube)
    pivotRef.current.position.set(0, 0, 0)
    pivotRef.current.rotation.set(0, 0, 0)

    // Current plane always starts at front
    currentPlaneRef.current.position.set(0, 0, halfSize)
    currentPlaneRef.current.rotation.set(0, 0, 0)

    // Position next plane based on rotation type and direction
    if (isForward) {
      if (targetIsEven) {
        // Going to even slide: rotate down (vertical)
        nextPlaneRef.current.position.set(0, halfSize, 0)
        nextPlaneRef.current.rotation.set(-Math.PI / 2, 0, 0)
        state.rotationAxis.set(1, 0, 0)
        state.rotationAngle = Math.PI / 2
      } else {
        // Going to odd slide: rotate right (horizontal)
        nextPlaneRef.current.position.set(halfSize, 0, 0)
        nextPlaneRef.current.rotation.set(0, Math.PI / 2, 0)
        state.rotationAxis.set(0, 1, 0)
        state.rotationAngle = -Math.PI / 2
      }
    } else {
      // Backward - reverse the rotation that got us to the current slide
      if (targetIsEven) {
        // Going back to even slide: rotate up (reverse of down)
        nextPlaneRef.current.position.set(0, -halfSize, 0)
        nextPlaneRef.current.rotation.set(Math.PI / 2, 0, 0)
        state.rotationAxis.set(1, 0, 0)
        state.rotationAngle = -Math.PI / 2
      } else {
        // Going back to odd slide: rotate left (reverse of right)
        nextPlaneRef.current.position.set(-halfSize, 0, 0)
        nextPlaneRef.current.rotation.set(0, -Math.PI / 2, 0)
        state.rotationAxis.set(0, 1, 0)
        state.rotationAngle = Math.PI / 2
      }
    }

    // Set textures
    setPlaneTexture(currentPlaneRef.current, displayed)
    setPlaneTexture(nextPlaneRef.current, nextIndex)

    nextPlaneRef.current.visible = true

    state.isAnimating = true
    state.progress = 0

    return true
  }, [halfSize, setPlaneTexture, slides.length])

  // Handle slide changes - just update the target, animation loop handles the rest
  useEffect(() => {
    if (currentIndex !== targetIndexRef.current && isReady) {
      targetIndexRef.current = currentIndex
      // Determine overall direction based on target vs current displayed
      const dir = direction === 'next' ? 'forward' : 'backward'
      animationDirectionRef.current = dir
    }
  }, [currentIndex, direction, isReady])

  // Animation
  useFrame((_, delta) => {
    if (!pivotRef.current || !currentPlaneRef.current || !nextPlaneRef.current) return
    const state = animStateRef.current

    // If not animating, check if we need to start a new transition
    if (!state.isAnimating) {
      if (displayedIndexRef.current !== targetIndexRef.current) {
        startNextTransition()
      }
      if (!state.isAnimating) return
    }

    const speed = (1 / transitionDuration) * 1000
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
      // Move displayed index one step in the animation direction
      const dir = animationDirectionRef.current
      if (dir === 'forward') {
        displayedIndexRef.current = (displayedIndexRef.current + 1) % slides.length
      } else {
        displayedIndexRef.current = (displayedIndexRef.current - 1 + slides.length) % slides.length
      }

      state.isAnimating = false

      // Reset everything for next transition
      pivotRef.current.position.set(0, 0, 0)
      pivotRef.current.rotation.set(0, 0, 0)

      // Current plane shows new slide at front
      currentPlaneRef.current.position.set(0, 0, halfSize)
      currentPlaneRef.current.rotation.set(0, 0, 0)
      setPlaneTexture(currentPlaneRef.current, displayedIndexRef.current)

      // Hide next plane
      nextPlaneRef.current.visible = false

      // Check if we need to continue to the next slide
      if (displayedIndexRef.current !== targetIndexRef.current) {
        startNextTransition()
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
