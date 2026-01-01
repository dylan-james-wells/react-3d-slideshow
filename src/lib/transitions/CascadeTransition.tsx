import { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SlideData } from '../types'

interface CascadeTransitionProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
  direction: 'next' | 'prev'
  minTiles?: number
  aspectRatio?: number
}

// Calculate grid dimensions for square tiles
// minTiles is the minimum number of tiles in the shorter dimension
const calculateGridDimensions = (aspectRatio: number, minTiles: number) => {
  const safeTiles = Math.max(2, minTiles)

  if (aspectRatio >= 1) {
    // Landscape or square: height is shorter dimension
    const rows = safeTiles
    const cols = Math.max(2, Math.round(safeTiles * aspectRatio))
    return { rows, cols }
  } else {
    // Portrait: width is shorter dimension
    const cols = safeTiles
    const rows = Math.max(2, Math.round(safeTiles / aspectRatio))
    return { rows, cols }
  }
}

// Base size for the entire grid (in Three.js units)
const GRID_BASE_SIZE = 3
const GAP = 0
const ANIMATION_SPEED = 1.5

const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

interface CubeData {
  mesh: THREE.Mesh
  row: number
  col: number
  baseZ: number
  faceMaterials: THREE.MeshBasicMaterial[]
}

export function CascadeTransition({
  slides,
  currentIndex,
  transitionDuration,
  direction,
  minTiles = 10,
  aspectRatio = 3 / 2,
}: CascadeTransitionProps) {
  const { viewport } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const cubeDataRef = useRef<CubeData[]>([])
  const texturesRef = useRef<THREE.Texture[]>([])
  const displayedIndexRef = useRef(currentIndex) // The slide currently shown
  const targetIndexRef = useRef(currentIndex) // The final target slide
  const animationProgressRef = useRef(0)
  const isAnimatingRef = useRef(false)
  const animationDirectionRef = useRef<'forward' | 'backward'>('forward')
  const [isReady, setIsReady] = useState(false)
  const initializedRef = useRef(false)

  // Calculate grid dimensions for square tiles
  const { rows: gridRows, cols: gridCols } = calculateGridDimensions(aspectRatio, minTiles)

  // Calculate cube size so total grid size remains constant regardless of subdivisions
  // Grid width = gridCols * cubeSize, we want grid width to equal GRID_BASE_SIZE * aspectRatio
  // Grid height = gridRows * cubeSize, we want grid height to equal GRID_BASE_SIZE
  const cubeSize = GRID_BASE_SIZE / gridRows

  // Fixed grid dimensions based on aspect ratio
  const gridWidth = GRID_BASE_SIZE * aspectRatio
  const gridHeight = GRID_BASE_SIZE

  // Reset initialization when grid parameters change
  useEffect(() => {
    if (initializedRef.current && groupRef.current) {
      // Clean up existing cubes
      while (groupRef.current.children.length > 0) {
        const child = groupRef.current.children[0]
        groupRef.current.remove(child)
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          }
        }
      }
      cubeDataRef.current = []
      initializedRef.current = false
    }
  }, [aspectRatio, minTiles, gridRows, gridCols])

  // Calculate the scale to fit the viewport
  const getScale = () => {
    // Use viewport dimensions (in Three.js units at z=0)
    const viewportWidth = viewport.width
    const viewportHeight = viewport.height

    // Scale to fit with some padding
    const scaleX = (viewportWidth * 0.8) / gridWidth
    const scaleY = (viewportHeight * 0.8) / gridHeight

    return Math.min(scaleX, scaleY)
  }

  // Load textures
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.crossOrigin = 'anonymous'

    const loadPromises = slides.map(
      (slide) =>
        new Promise<THREE.Texture>((resolve) => {
          if (slide.image) {
            loader.load(
              slide.image,
              (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace
                resolve(texture)
              },
              undefined,
              () => {
                // On error, create a placeholder
                const canvas = document.createElement('canvas')
                canvas.width = 64
                canvas.height = 64
                const ctx = canvas.getContext('2d')!
                ctx.fillStyle = '#333'
                ctx.fillRect(0, 0, 64, 64)
                const texture = new THREE.CanvasTexture(canvas)
                resolve(texture)
              }
            )
          } else {
            const canvas = document.createElement('canvas')
            canvas.width = 64
            canvas.height = 64
            const ctx = canvas.getContext('2d')!
            ctx.fillStyle = slide.backgroundColor || '#333'
            ctx.fillRect(0, 0, 64, 64)
            const texture = new THREE.CanvasTexture(canvas)
            resolve(texture)
          }
        })
    )

    Promise.all(loadPromises).then((textures) => {
      texturesRef.current = textures
      setIsReady(true)
    })

    return () => {
      texturesRef.current.forEach((t) => t.dispose())
      texturesRef.current = []
    }
  }, [slides])

  // Initialize grid when textures are ready
  useEffect(() => {
    if (!isReady || !groupRef.current || texturesRef.current.length === 0) return
    if (initializedRef.current) return

    initializedRef.current = true

    const initialTexture = texturesRef.current[currentIndex] || texturesRef.current[0]
    if (!initialTexture) return

    // Clear existing cubes
    while (groupRef.current.children.length > 0) {
      const child = groupRef.current.children[0]
      groupRef.current.remove(child)
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose())
        }
      }
    }
    cubeDataRef.current = []

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        // Calculate UV offset for this cube's position in the grid
        const uMin = col / gridCols
        const uMax = (col + 1) / gridCols
        const vMin = row / gridRows
        const vMax = (row + 1) / gridRows

        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)
        const uvAttribute = geometry.getAttribute('uv')
        const uvArray = uvAttribute.array as Float32Array

        // All faces get the same UV mapping for this grid position
        for (let face = 0; face < 6; face++) {
          const baseIndex = face * 8
          uvArray[baseIndex + 0] = uMin
          uvArray[baseIndex + 1] = vMax
          uvArray[baseIndex + 2] = uMax
          uvArray[baseIndex + 3] = vMax
          uvArray[baseIndex + 4] = uMin
          uvArray[baseIndex + 5] = vMin
          uvArray[baseIndex + 6] = uMax
          uvArray[baseIndex + 7] = vMin
        }
        uvAttribute.needsUpdate = true

        // Face order: +X, -X, +Y, -Y, +Z, -Z
        // Use MeshBasicMaterial to display textures without lighting effects
        const faceMaterials = [
          new THREE.MeshBasicMaterial({ map: initialTexture }), // +X (right)
          new THREE.MeshBasicMaterial({ map: initialTexture }), // -X (left)
          new THREE.MeshBasicMaterial({ map: initialTexture }), // +Y (top)
          new THREE.MeshBasicMaterial({ map: initialTexture }), // -Y (bottom)
          new THREE.MeshBasicMaterial({ map: initialTexture }), // +Z (front)
          new THREE.MeshBasicMaterial({ map: initialTexture }), // -Z (back)
        ]

        const cube = new THREE.Mesh(geometry, faceMaterials)

        // Position cube centered in the grid
        const x = (col * (cubeSize + GAP)) - gridWidth / 2 + (cubeSize + GAP) / 2
        const y = (row * (cubeSize + GAP)) - gridHeight / 2 + (cubeSize + GAP) / 2
        cube.position.set(x, y, 0)

        groupRef.current.add(cube)
        cubeDataRef.current.push({
          mesh: cube,
          row,
          col,
          baseZ: 0,
          faceMaterials,
        })
      }
    }
  }, [isReady, gridCols, gridRows, cubeSize, gridWidth, gridHeight, currentIndex])

  // Handle slide changes - just update the target, animation loop handles the rest
  useEffect(() => {
    if (currentIndex !== targetIndexRef.current && texturesRef.current.length > 0) {
      targetIndexRef.current = currentIndex
      // Determine overall direction based on target vs current displayed
      const dir = direction === 'next' ? 'forward' : 'backward'
      animationDirectionRef.current = dir
    }
  }, [currentIndex, direction])

  // Helper to start animating to the next slide in sequence
  const startNextTransition = () => {
    if (cubeDataRef.current.length === 0 || texturesRef.current.length === 0) return false

    const displayed = displayedIndexRef.current
    const target = targetIndexRef.current

    if (displayed === target) return false

    // Determine which slide to animate to next (one step toward target)
    const dir = animationDirectionRef.current
    let nextIndex: number

    if (dir === 'forward') {
      nextIndex = (displayed + 1) % slides.length
    } else {
      nextIndex = (displayed - 1 + slides.length) % slides.length
    }

    // Update side textures to show the next image
    const nextTexture = texturesRef.current[nextIndex]
    if (nextTexture) {
      for (const cubeData of cubeDataRef.current) {
        cubeData.faceMaterials[0].map = nextTexture // +X (right)
        cubeData.faceMaterials[1].map = nextTexture // -X (left)
        cubeData.faceMaterials[0].needsUpdate = true
        cubeData.faceMaterials[1].needsUpdate = true
      }
    }

    animationProgressRef.current = 0
    isAnimatingRef.current = true
    return true
  }

  // Animation loop
  useFrame((_, delta) => {
    // Update scale every frame to handle resize
    if (groupRef.current) {
      const scale = getScale()
      groupRef.current.scale.setScalar(scale)
    }

    // If not animating, check if we need to start a new transition
    if (!isAnimatingRef.current) {
      if (displayedIndexRef.current !== targetIndexRef.current) {
        startNextTransition()
      }
      if (!isAnimatingRef.current) return
    }

    if (cubeDataRef.current.length === 0) return

    const speed = ANIMATION_SPEED * (1000 / transitionDuration) * 0.8

    // Animate towards completion
    animationProgressRef.current = Math.min(
      animationProgressRef.current + delta * speed,
      1
    )

    // Check if this single transition is complete
    if (animationProgressRef.current >= 1) {
      // Move displayed index one step in the animation direction
      const dir = animationDirectionRef.current
      if (dir === 'forward') {
        displayedIndexRef.current = (displayedIndexRef.current + 1) % slides.length
      } else {
        displayedIndexRef.current = (displayedIndexRef.current - 1 + slides.length) % slides.length
      }

      // Update all faces to the newly displayed texture
      const newTexture = texturesRef.current[displayedIndexRef.current]
      if (newTexture) {
        for (const cubeData of cubeDataRef.current) {
          cubeData.mesh.rotation.y = 0
          cubeData.mesh.position.z = cubeData.baseZ
          for (const mat of cubeData.faceMaterials) {
            mat.map = newTexture
            mat.needsUpdate = true
          }
        }
      }

      animationProgressRef.current = 0
      isAnimatingRef.current = false

      // Check if we need to continue to the next slide
      if (displayedIndexRef.current !== targetIndexRef.current) {
        startNextTransition()
      }
      return
    }

    // Apply animation progress to cubes
    const maxDiagonal = (gridCols - 1) + (gridRows - 1)
    const animDir = animationDirectionRef.current

    for (const cubeData of cubeDataRef.current) {
      const flippedRow = gridRows - 1 - cubeData.row
      let diagonalIndex: number

      if (animDir === 'forward') {
        diagonalIndex = cubeData.col + flippedRow
      } else {
        diagonalIndex = gridCols - 1 - cubeData.col + cubeData.row
      }

      const normalizedDiagonal = diagonalIndex / maxDiagonal
      // waveSpread controls how spread out the cascade is (higher = more staggered)
      const waveSpread = 0.7
      const cubeStartProgress = normalizedDiagonal * waveSpread
      const cubeEndProgress = cubeStartProgress + (1 - waveSpread)

      let cubeProgress = 0
      if (animationProgressRef.current > cubeStartProgress) {
        cubeProgress = Math.min(
          1,
          (animationProgressRef.current - cubeStartProgress) /
            (cubeEndProgress - cubeStartProgress)
        )
      }

      if (cubeProgress > 0) {
        const easedProgress = easeInOutCubic(cubeProgress)
        const rotation =
          easedProgress * (Math.PI / 2) * (animDir === 'forward' ? 1 : -1)
        cubeData.mesh.rotation.y = rotation
      } else {
        cubeData.mesh.rotation.y = 0
      }
    }
  })

  return <group ref={groupRef} />
}
