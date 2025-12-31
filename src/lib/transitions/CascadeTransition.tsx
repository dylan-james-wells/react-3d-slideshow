import { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SlideData } from '../types'

interface CascadeTransitionProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
  direction: 'next' | 'prev'
  subdivisions?: number
  aspectRatio?: number
}

const CUBE_SIZE = 1
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
  faceMaterials: THREE.MeshStandardMaterial[]
}

export function CascadeTransition({
  slides,
  currentIndex,
  transitionDuration,
  direction,
  subdivisions = 20,
  aspectRatio = 3 / 2,
}: CascadeTransitionProps) {
  const { viewport } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const cubeDataRef = useRef<CubeData[]>([])
  const texturesRef = useRef<THREE.Texture[]>([])
  const prevIndexRef = useRef(currentIndex)
  const animationProgressRef = useRef(0)
  const targetProgressRef = useRef(0)
  const isAnimatingRef = useRef(false)
  const animationDirectionRef = useRef<'forward' | 'backward'>('forward')
  const [isReady, setIsReady] = useState(false)
  const initializedRef = useRef(false)

  // Calculate grid dimensions based on aspect ratio
  const gridCols = subdivisions
  const gridRows = Math.max(1, Math.round(subdivisions / aspectRatio))

  // Calculate the scale to fit the viewport
  const getScale = () => {
    const gridWidth = gridCols * (CUBE_SIZE + GAP)
    const gridHeight = gridRows * (CUBE_SIZE + GAP)

    // Use viewport dimensions (in Three.js units at z=0)
    const viewportWidth = viewport.width
    const viewportHeight = viewport.height

    // Scale to fit with some padding
    const scaleX = (viewportWidth * 0.95) / gridWidth
    const scaleY = (viewportHeight * 0.85) / gridHeight

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

    const gridWidth = gridCols * (CUBE_SIZE + GAP)
    const gridHeight = gridRows * (CUBE_SIZE + GAP)

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        // Calculate UV offset for this cube's position in the grid
        const uMin = col / gridCols
        const uMax = (col + 1) / gridCols
        const vMin = row / gridRows
        const vMax = (row + 1) / gridRows

        const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)
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
        const faceMaterials = [
          new THREE.MeshStandardMaterial({ map: initialTexture }), // +X (right)
          new THREE.MeshStandardMaterial({ map: initialTexture }), // -X (left)
          new THREE.MeshStandardMaterial({ map: initialTexture }), // +Y (top)
          new THREE.MeshStandardMaterial({ map: initialTexture }), // -Y (bottom)
          new THREE.MeshStandardMaterial({ map: initialTexture }), // +Z (front)
          new THREE.MeshStandardMaterial({ map: initialTexture }), // -Z (back)
        ]

        const cube = new THREE.Mesh(geometry, faceMaterials)

        // Position cube centered in the grid
        const x = (col * (CUBE_SIZE + GAP)) - gridWidth / 2 + (CUBE_SIZE + GAP) / 2
        const y = (row * (CUBE_SIZE + GAP)) - gridHeight / 2 + (CUBE_SIZE + GAP) / 2
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
  }, [isReady, gridCols, gridRows, currentIndex])

  // Handle slide changes
  useEffect(() => {
    if (currentIndex !== prevIndexRef.current && texturesRef.current.length > 0 && cubeDataRef.current.length > 0) {
      const dir = direction === 'next' ? 'forward' : 'backward'
      animationDirectionRef.current = dir

      // Update side textures to show the target image
      const targetTexture = texturesRef.current[currentIndex]
      if (targetTexture) {
        for (const cubeData of cubeDataRef.current) {
          // Update the side faces that will be revealed during rotation
          cubeData.faceMaterials[0].map = targetTexture // +X (right)
          cubeData.faceMaterials[1].map = targetTexture // -X (left)
          cubeData.faceMaterials[0].needsUpdate = true
          cubeData.faceMaterials[1].needsUpdate = true
        }
      }

      targetProgressRef.current = 1
      isAnimatingRef.current = true
      prevIndexRef.current = currentIndex
    }
  }, [currentIndex, direction])

  // Animation loop
  useFrame((_, delta) => {
    // Update scale every frame to handle resize
    if (groupRef.current) {
      const scale = getScale()
      groupRef.current.scale.setScalar(scale)
    }

    if (!isAnimatingRef.current || cubeDataRef.current.length === 0) return

    const speed = ANIMATION_SPEED * (1000 / transitionDuration) * 0.8

    // Animate towards target
    if (animationProgressRef.current < targetProgressRef.current) {
      animationProgressRef.current = Math.min(
        animationProgressRef.current + delta * speed,
        targetProgressRef.current
      )
    }

    // Check if animation is complete
    if (animationProgressRef.current >= 1) {
      // Complete transition - update all faces to current texture
      const currentTexture = texturesRef.current[currentIndex]
      if (currentTexture) {
        for (const cubeData of cubeDataRef.current) {
          cubeData.mesh.rotation.y = 0
          cubeData.mesh.position.z = cubeData.baseZ
          for (const mat of cubeData.faceMaterials) {
            mat.map = currentTexture
            mat.needsUpdate = true
          }
        }
      }
      animationProgressRef.current = 0
      targetProgressRef.current = 0
      isAnimatingRef.current = false
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

        // Z offset temporarily disabled
        // const zOffset = Math.sin(cubeProgress * Math.PI) * CUBE_SIZE * 0.5
        // cubeData.mesh.position.z = cubeData.baseZ + zOffset
      } else {
        cubeData.mesh.rotation.y = 0
        // cubeData.mesh.position.z = cubeData.baseZ
      }
    }
  })

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 5, 10]} intensity={0.5} />
      <group ref={groupRef} />
    </>
  )
}
