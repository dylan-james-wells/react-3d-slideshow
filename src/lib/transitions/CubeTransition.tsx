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

// Face indices in our group
const FRONT = 0
const BACK = 1
const RIGHT = 2
const LEFT = 3
const TOP = 4
const BOTTOM = 5

export function CubeTransition({
  slides,
  currentIndex,
  transitionDuration,
  direction,
}: CubeTransitionProps) {
  const { viewport } = useThree()
  const cubeRef = useRef<THREE.Group>(null)
  const [isReady, setIsReady] = useState(false)
  const canvasesRef = useRef<HTMLCanvasElement[]>([])

  const animStateRef = useRef({
    isAnimating: false,
    progress: 0,
    targetRotation: { x: 0, y: 0 },
  })

  // Track which rotation we're doing: even = horizontal (right), odd = vertical (down)
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

  // Create texture from canvas with optional rotation (in degrees)
  const createTexture = useCallback((slideIndex: number, rotationDeg: number = 0): THREE.CanvasTexture => {
    const canvas = canvasesRef.current[slideIndex]
    if (!canvas) {
      const fallback = document.createElement('canvas')
      fallback.width = 512
      fallback.height = 512
      const texture = new THREE.CanvasTexture(fallback)
      texture.colorSpace = THREE.SRGBColorSpace
      return texture
    }

    if (rotationDeg === 0) {
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      return texture
    }

    const size = canvas.width
    const rotatedCanvas = document.createElement('canvas')
    rotatedCanvas.width = size
    rotatedCanvas.height = size
    const ctx = rotatedCanvas.getContext('2d')!
    ctx.translate(size / 2, size / 2)
    ctx.rotate((rotationDeg * Math.PI) / 180)
    ctx.translate(-size / 2, -size / 2)
    ctx.drawImage(canvas, 0, 0)

    const texture = new THREE.CanvasTexture(rotatedCanvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])

  // Set a face's texture
  const setFaceTexture = useCallback((faceIndex: number, slideIndex: number, rotationDeg: number = 0) => {
    if (!cubeRef.current) return
    const face = cubeRef.current.children[faceIndex] as THREE.Mesh
    if (!face) return

    const material = face.material as THREE.MeshBasicMaterial
    if (material.map) {
      material.map.dispose()
    }
    material.map = createTexture(slideIndex, rotationDeg)
    material.needsUpdate = true
  }, [createTexture])

  // Setup all faces for a given "current" slide at rest position
  // The cube is always at rotation (0,0,0) when at rest
  // Based on step (even/odd), we set up the adjacent faces differently
  const setupFaces = useCallback((curr: number, step: number) => {
    const n = slides.length
    const next = (curr + 1) % n
    const prev = (curr - 1 + n) % n
    const isEvenStep = step % 2 === 0

    // FRONT always shows current slide upright
    setFaceTexture(FRONT, curr, 0)

    if (isEvenStep) {
      // Even step: next rotation goes RIGHT (Y-90), so LEFT face becomes visible
      // Prev rotation would go UP (X-90), so TOP face would become visible
      setFaceTexture(LEFT, next, 0)        // next slide, upright
      setFaceTexture(TOP, prev, 180)       // prev slide, needs 180° to appear upright after X- rotation
      // Also prepare right and bottom for potential backwards from next step
      setFaceTexture(RIGHT, prev, 0)
      setFaceTexture(BOTTOM, next, 180)
    } else {
      // Odd step: next rotation goes DOWN (X+90), so BOTTOM face becomes visible
      // Prev rotation would go LEFT (Y+90), so RIGHT face would become visible
      setFaceTexture(BOTTOM, next, 180)    // next slide, needs 180° for X+ rotation
      setFaceTexture(RIGHT, prev, 0)       // prev slide, upright
      // Also prepare left and top for potential backwards from next step
      setFaceTexture(LEFT, next, 0)
      setFaceTexture(TOP, prev, 180)
    }
  }, [slides.length, setFaceTexture])

  // Initialize cube
  useEffect(() => {
    if (!isReady || !cubeRef.current) return

    const group = cubeRef.current
    const cubeSize = Math.min(viewport.width * 0.6, viewport.height * 0.6)
    const halfSize = cubeSize / 2

    // Clear existing
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        const mat = child.material as THREE.MeshBasicMaterial
        if (mat.map) mat.map.dispose()
        mat.dispose()
      }
      group.remove(child)
    }

    // Create 6 faces as planes
    const createFace = (pos: THREE.Vector3, rot: THREE.Euler): THREE.Mesh => {
      const geometry = new THREE.PlaneGeometry(cubeSize, cubeSize)
      const material = new THREE.MeshBasicMaterial({ side: THREE.FrontSide })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(pos)
      mesh.rotation.copy(rot)
      return mesh
    }

    // Order: FRONT, BACK, RIGHT, LEFT, TOP, BOTTOM
    const faces = [
      createFace(new THREE.Vector3(0, 0, halfSize), new THREE.Euler(0, 0, 0)),           // FRONT (+Z)
      createFace(new THREE.Vector3(0, 0, -halfSize), new THREE.Euler(0, Math.PI, 0)),    // BACK (-Z)
      createFace(new THREE.Vector3(halfSize, 0, 0), new THREE.Euler(0, Math.PI/2, 0)),   // RIGHT (+X)
      createFace(new THREE.Vector3(-halfSize, 0, 0), new THREE.Euler(0, -Math.PI/2, 0)), // LEFT (-X)
      createFace(new THREE.Vector3(0, halfSize, 0), new THREE.Euler(-Math.PI/2, 0, 0)),  // TOP (+Y)
      createFace(new THREE.Vector3(0, -halfSize, 0), new THREE.Euler(Math.PI/2, 0, 0)),  // BOTTOM (-Y)
    ]

    faces.forEach((f) => group.add(f))

    // Reset rotation
    group.rotation.set(0, 0, 0)

    // Setup faces for initial state
    stepRef.current = 0
    setupFaces(currentIndex, 0)

    // Reset animation state
    animStateRef.current = {
      isAnimating: false,
      progress: 0,
      targetRotation: { x: 0, y: 0 },
    }
    prevIndexRef.current = currentIndex
  }, [isReady, slides.length, viewport.width, viewport.height, currentIndex, setupFaces])

  // Handle slide changes
  useEffect(() => {
    if (currentIndex === prevIndexRef.current || !isReady || !cubeRef.current) return

    const state = animStateRef.current
    const isForward = direction === 'next'
    const step = stepRef.current
    const isEvenStep = step % 2 === 0

    // The cube is always at rotation (0, 0, 0) at rest
    // We animate to the target rotation, then reset
    if (isForward) {
      if (isEvenStep) {
        // Even step: rotate RIGHT (Y decreases by 90°)
        state.targetRotation = { x: 0, y: -Math.PI / 2 }
      } else {
        // Odd step: rotate DOWN (X increases by 90°)
        state.targetRotation = { x: Math.PI / 2, y: 0 }
      }
      stepRef.current++
    } else {
      // Backward - undo based on the step we came from
      if (step > 0) {
        const prevStepWasEven = (step - 1) % 2 === 0
        if (prevStepWasEven) {
          // Previous was RIGHT rotation, undo with LEFT (Y increases)
          state.targetRotation = { x: 0, y: Math.PI / 2 }
        } else {
          // Previous was DOWN rotation, undo with UP (X decreases)
          state.targetRotation = { x: -Math.PI / 2, y: 0 }
        }
        stepRef.current--
      }
    }

    state.isAnimating = true
    state.progress = 0
    prevIndexRef.current = currentIndex
  }, [currentIndex, isReady, direction])

  // Animation
  useFrame((_, delta) => {
    if (!cubeRef.current) return
    const state = animStateRef.current

    if (state.isAnimating) {
      const speed = (1 / transitionDuration) * 1000
      state.progress = Math.min(state.progress + delta * speed, 1)
      const t = easeInOutCubic(state.progress)

      // Animate from (0, 0) to target
      cubeRef.current.rotation.x = state.targetRotation.x * t
      cubeRef.current.rotation.y = state.targetRotation.y * t

      if (state.progress >= 1) {
        state.isAnimating = false

        // KEY INSIGHT: Reset cube rotation to (0, 0, 0) and update textures
        // so the new current slide is on the FRONT face, upright
        cubeRef.current.rotation.set(0, 0, 0)

        // Setup faces for the new current slide and new step
        setupFaces(currentIndex, stepRef.current)
      }
    }
  })

  const cubeSize = Math.min(viewport.width * 0.6, viewport.height * 0.6)

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
      <group ref={cubeRef} />
    </>
  )
}
