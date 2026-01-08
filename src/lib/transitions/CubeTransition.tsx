import { useRef, useEffect, useState, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SlideData } from '../types'

interface CubeTransitionProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
  direction: 'next' | 'prev'
  aspectRatio?: number
  onReady?: () => void
}

interface TextureData {
  texture: THREE.Texture
  imageAspect: number
}

// Calculate UV scale and offset for "cover" behavior (crop to fill)
const calculateCoverUV = (imageAspect: number, targetAspect: number) => {
  let scaleU = 1
  let scaleV = 1
  let offsetU = 0
  let offsetV = 0

  if (imageAspect > targetAspect) {
    // Image is wider than target - crop sides
    scaleU = targetAspect / imageAspect
    offsetU = (1 - scaleU) / 2
  } else {
    // Image is taller than target - crop top/bottom
    scaleV = imageAspect / targetAspect
    offsetV = (1 - scaleV) / 2
  }

  return { scaleU, scaleV, offsetU, offsetV }
}

const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function CubeTransition({
  slides,
  currentIndex,
  transitionDuration,
  direction,
  aspectRatio: _aspectRatio = 3 / 2,
  onReady,
}: CubeTransitionProps) {
  // Note: aspectRatio is accepted for API consistency but cube transition uses square faces
  void _aspectRatio
  const { viewport } = useThree()
  const pivotRef = useRef<THREE.Group>(null)
  const [isReady, setIsReady] = useState(false)
  const textureDataRef = useRef<TextureData[]>([])

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

  // Calculate cube dimensions based on viewport
  // The cube rotates so we need square faces, sized to fit the content
  // Fit within 60% of viewport
  const cubeSize = Math.min(viewport.width * 0.6, viewport.height * 0.6)
  const halfSize = cubeSize / 2

  // Load all textures with image aspect ratio information
  useEffect(() => {
    const loadPromises = slides.map((slide) =>
      new Promise<TextureData>((resolve) => {
        if (slide.image) {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const texture = new THREE.Texture(img)
            texture.needsUpdate = true
            texture.colorSpace = THREE.SRGBColorSpace
            resolve({
              texture,
              imageAspect: img.width / img.height,
            })
          }
          img.onerror = () => {
            const canvas = document.createElement('canvas')
            canvas.width = 512
            canvas.height = 512
            const ctx = canvas.getContext('2d')!
            ctx.fillStyle = '#333'
            ctx.fillRect(0, 0, 512, 512)
            const texture = new THREE.CanvasTexture(canvas)
            texture.colorSpace = THREE.SRGBColorSpace
            resolve({ texture, imageAspect: 1 })
          }
          img.src = slide.image
        } else {
          const canvas = document.createElement('canvas')
          canvas.width = 512
          canvas.height = 512
          const ctx = canvas.getContext('2d')!
          ctx.fillStyle = slide.backgroundColor || '#333'
          ctx.fillRect(0, 0, 512, 512)
          const texture = new THREE.CanvasTexture(canvas)
          texture.colorSpace = THREE.SRGBColorSpace
          resolve({ texture, imageAspect: 1 })
        }
      })
    )

    Promise.all(loadPromises).then((textureData) => {
      textureDataRef.current = textureData
      setIsReady(true)
      onReady?.()
    })

    return () => {
      textureDataRef.current.forEach((td) => td.texture.dispose())
      textureDataRef.current = []
    }
  }, [slides, onReady])

  // Apply UV transformation for cover behavior on a plane's geometry
  const applyPlaneUVs = useCallback((plane: THREE.Mesh | null, imageAspect: number) => {
    if (!plane) return
    const geometry = plane.geometry as THREE.PlaneGeometry
    const uvAttribute = geometry.getAttribute('uv')
    const uvArray = uvAttribute.array as Float32Array

    const { scaleU, scaleV, offsetU, offsetV } = calculateCoverUV(imageAspect, 1) // 1:1 target for square cube faces

    // Plane geometry has 4 vertices, 2 UV coords each
    // Default UVs are: (0,1), (1,1), (0,0), (1,0)
    uvArray[0] = offsetU
    uvArray[1] = offsetV + scaleV
    uvArray[2] = offsetU + scaleU
    uvArray[3] = offsetV + scaleV
    uvArray[4] = offsetU
    uvArray[5] = offsetV
    uvArray[6] = offsetU + scaleU
    uvArray[7] = offsetV

    uvAttribute.needsUpdate = true
  }, [])

  // Set texture on a plane with cover UV behavior
  const setPlaneTexture = useCallback((plane: THREE.Mesh | null, slideIndex: number) => {
    if (!plane) return
    const textureData = textureDataRef.current[slideIndex]
    if (!textureData) return

    const material = plane.material as THREE.MeshBasicMaterial
    if (material.map && material.map !== textureData.texture) {
      // Don't dispose shared textures
    }
    material.map = textureData.texture
    material.needsUpdate = true

    // Apply cover UVs
    applyPlaneUVs(plane, textureData.imageAspect)
  }, [applyPlaneUVs])

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
    if (textureDataRef.current.length === 0) return false

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
