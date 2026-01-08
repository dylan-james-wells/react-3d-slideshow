import { useRef, useEffect, useState, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SlideData } from '../types'
import vertexShader from '../shaders/glitch.vert?raw'
import fragmentShader from '../shaders/glitch.frag?raw'

interface GlitchTransitionProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
  direction: 'next' | 'prev'
  aspectRatio?: number
  aberrationIntensity?: number
  scanlinesIntensity?: number
  grainIntensity?: number
  fullscreen?: boolean
  onReady?: () => void
}

interface TextureData {
  texture: THREE.Texture
  imageAspect: number
}

// Calculate UV scale and offset for "cover" behavior (crop to fill)
const calculateCoverUV = (imageAspect: number, targetAspect: number) => {
  let scaleX = 1
  let scaleY = 1
  let offsetX = 0
  let offsetY = 0

  if (imageAspect > targetAspect) {
    // Image is wider than target - crop sides
    scaleX = targetAspect / imageAspect
    offsetX = (1 - scaleX) / 2
  } else {
    // Image is taller than target - crop top/bottom
    scaleY = imageAspect / targetAspect
    offsetY = (1 - scaleY) / 2
  }

  return { scaleX, scaleY, offsetX, offsetY }
}

export function GlitchTransition({
  slides,
  currentIndex,
  transitionDuration,
  aspectRatio = 3 / 2,
  aberrationIntensity = 0.5,
  scanlinesIntensity = 0.5,
  grainIntensity = 0.5,
  fullscreen = false,
  onReady,
}: GlitchTransitionProps) {
  const { viewport } = useThree()
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const [textureData, setTextureData] = useState<TextureData[]>([])
  const [isReady, setIsReady] = useState(false)

  const prevIndexRef = useRef(currentIndex)
  const progressRef = useRef(0)
  const isAnimatingRef = useRef(false)

  // Load all textures with image aspect ratio information
  useEffect(() => {
    const loadPromises = slides.map((slide) => {
      return new Promise<TextureData>((resolve) => {
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
            ctx.fillStyle = slide.backgroundColor || '#333'
            ctx.fillRect(0, 0, 512, 512)
            const fallback = new THREE.CanvasTexture(canvas)
            fallback.colorSpace = THREE.SRGBColorSpace
            resolve({ texture: fallback, imageAspect: 1 })
          }
          img.src = slide.image
        } else {
          const canvas = document.createElement('canvas')
          canvas.width = 512
          canvas.height = 512
          const ctx = canvas.getContext('2d')!
          ctx.fillStyle = slide.backgroundColor || '#333'
          ctx.fillRect(0, 0, 512, 512)
          const fallback = new THREE.CanvasTexture(canvas)
          fallback.colorSpace = THREE.SRGBColorSpace
          resolve({ texture: fallback, imageAspect: 1 })
        }
      })
    })

    Promise.all(loadPromises).then((loaded) => {
      setTextureData(loaded)
      setIsReady(true)
      onReady?.()
    })
  }, [slides, onReady])

  // Create shader material
  const shaderMaterial = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uCurrentTexture: { value: null },
        uNextTexture: { value: null },
        uProgress: { value: 0 },
        uShowNext: { value: 0 },
        uAberrationAmount: { value: 0 },
        uTime: { value: 0 },
        uOverlayIntensity: { value: 0 },
        uLayer1Offset: { value: new THREE.Vector2(0, 0) },
        uLayer2Offset: { value: new THREE.Vector2(0, 0) },
        uHueShift1: { value: 0 },
        uHueShift2: { value: 0 },
        uScanlinesIntensity: { value: 0 },
        uGrainIntensity: { value: 0 },
        uUvScale: { value: new THREE.Vector2(1, 1) },
        uUvOffset: { value: new THREE.Vector2(0, 0) },
      },
    })
    return material
  }, [])

  // Update textures when ready
  useEffect(() => {
    if (!isReady || textureData.length === 0) return

    shaderMaterial.uniforms.uCurrentTexture.value = textureData[currentIndex].texture
    shaderMaterial.uniforms.uNextTexture.value = textureData[currentIndex].texture
    prevIndexRef.current = currentIndex
  }, [isReady, textureData, shaderMaterial])

  // Handle slide changes
  useEffect(() => {
    if (!isReady || textureData.length === 0) return
    if (currentIndex === prevIndexRef.current) return

    // Set up transition
    shaderMaterial.uniforms.uCurrentTexture.value = textureData[prevIndexRef.current].texture
    shaderMaterial.uniforms.uNextTexture.value = textureData[currentIndex].texture
    shaderMaterial.uniforms.uProgress.value = 0
    shaderMaterial.uniforms.uAberrationAmount.value = 0

    progressRef.current = 0
    isAnimatingRef.current = true
    prevIndexRef.current = currentIndex
  }, [currentIndex, isReady, textureData, shaderMaterial])

  // Track time and glitch state for erratic movement
  const timeRef = useRef(0)
  const glitchStateRef = useRef({
    // Layer 1 state
    layer1TargetX: 0,
    layer1TargetY: 0,
    layer1CurrentX: 0,
    layer1CurrentY: 0,
    layer1NextGlitch: 0,
    layer1GlitchSpeed: 0.1,
    // Layer 2 state
    layer2TargetX: 0,
    layer2TargetY: 0,
    layer2CurrentX: 0,
    layer2CurrentY: 0,
    layer2NextGlitch: 0,
    layer2GlitchSpeed: 0.1,
    // Hue state
    hue1Target: 0,
    hue1Current: 0,
    hue2Target: 0,
    hue2Current: 0,
    hueNextGlitch: 0,
  })

  // Animation loop
  useFrame((_, delta) => {
    if (!materialRef.current) return

    if (isAnimatingRef.current) {
      const speed = (1 / transitionDuration) * 1000
      progressRef.current = Math.min(progressRef.current + delta * speed, 1)
      timeRef.current += delta

      const progress = progressRef.current
      const time = timeRef.current
      const glitch = glitchStateRef.current
      shaderMaterial.uniforms.uProgress.value = progress
      shaderMaterial.uniforms.uTime.value = time

      // Phase 1 (0-0.5): Effects ramp up on current slide
      // Phase 2 (0.5-1): Effects ramp down on next slide
      // Swap happens at progress = 0.5
      const showNext = progress >= 0.5 ? 1 : 0
      shaderMaterial.uniforms.uShowNext.value = showNext

      // Use a flattened sine curve that holds at peak longer
      // sin^0.7 rises/falls more slowly and holds near max longer
      const sinProgress = Math.sin(progress * Math.PI)
      const flattenedCurve = Math.pow(sinProgress, 0.6)

      // Aberration ramps up, holds, then ramps down
      // Scale aberration by intensity (0.15 is the base max, scaled by 0-1 intensity)
      const aberration = flattenedCurve * 0.3 * aberrationIntensity
      shaderMaterial.uniforms.uAberrationAmount.value = aberration

      // Overlay intensity follows same flattened curve
      const overlayIntensity = flattenedCurve
      shaderMaterial.uniforms.uOverlayIntensity.value = overlayIntensity

      // Scanlines intensity follows the same curve
      shaderMaterial.uniforms.uScanlinesIntensity.value = flattenedCurve * scanlinesIntensity

      // Grain intensity follows the same curve
      shaderMaterial.uniforms.uGrainIntensity.value = flattenedCurve * grainIntensity

      // === Jerky glitch movement for layer 1 ===
      if (time >= glitch.layer1NextGlitch) {
        // Jump to new random target
        glitch.layer1TargetX = (Math.random() - 0.5) * 0.1
        glitch.layer1TargetY = (Math.random() - 0.5) * 0.08
        // Random speed: sometimes very fast, sometimes slow
        glitch.layer1GlitchSpeed = Math.random() < 0.3 ? 0.5 + Math.random() * 0.5 : 0.05 + Math.random() * 0.15
        // Random interval until next glitch (fast bursts vs slow periods)
        glitch.layer1NextGlitch = time + (Math.random() < 0.4 ? 0.02 + Math.random() * 0.05 : 0.1 + Math.random() * 0.2)
      }
      // Lerp toward target with variable speed
      glitch.layer1CurrentX += (glitch.layer1TargetX - glitch.layer1CurrentX) * glitch.layer1GlitchSpeed
      glitch.layer1CurrentY += (glitch.layer1TargetY - glitch.layer1CurrentY) * glitch.layer1GlitchSpeed
      shaderMaterial.uniforms.uLayer1Offset.value.set(glitch.layer1CurrentX, glitch.layer1CurrentY)

      // === Jerky glitch movement for layer 2 ===
      if (time >= glitch.layer2NextGlitch) {
        glitch.layer2TargetX = (Math.random() - 0.5) * 0.1
        glitch.layer2TargetY = (Math.random() - 0.5) * 0.08
        glitch.layer2GlitchSpeed = Math.random() < 0.3 ? 0.5 + Math.random() * 0.5 : 0.05 + Math.random() * 0.15
        glitch.layer2NextGlitch = time + (Math.random() < 0.4 ? 0.02 + Math.random() * 0.05 : 0.1 + Math.random() * 0.2)
      }
      glitch.layer2CurrentX += (glitch.layer2TargetX - glitch.layer2CurrentX) * glitch.layer2GlitchSpeed
      glitch.layer2CurrentY += (glitch.layer2TargetY - glitch.layer2CurrentY) * glitch.layer2GlitchSpeed
      shaderMaterial.uniforms.uLayer2Offset.value.set(glitch.layer2CurrentX, glitch.layer2CurrentY)

      // === Jerky hue rotation ===
      if (time >= glitch.hueNextGlitch) {
        glitch.hue1Target = Math.random()
        glitch.hue2Target = Math.random()
        glitch.hueNextGlitch = time + (Math.random() < 0.5 ? 0.03 + Math.random() * 0.07 : 0.15 + Math.random() * 0.25)
      }
      glitch.hue1Current += (glitch.hue1Target - glitch.hue1Current) * 0.15
      glitch.hue2Current += (glitch.hue2Target - glitch.hue2Current) * 0.15
      shaderMaterial.uniforms.uHueShift1.value = glitch.hue1Current
      shaderMaterial.uniforms.uHueShift2.value = glitch.hue2Current

      if (progressRef.current >= 1) {
        isAnimatingRef.current = false
        // Set both textures to the current one
        shaderMaterial.uniforms.uCurrentTexture.value = textureData[currentIndex].texture
        shaderMaterial.uniforms.uNextTexture.value = textureData[currentIndex].texture
        shaderMaterial.uniforms.uShowNext.value = 0
        shaderMaterial.uniforms.uAberrationAmount.value = 0
        shaderMaterial.uniforms.uOverlayIntensity.value = 0
        shaderMaterial.uniforms.uLayer1Offset.value.set(0, 0)
        shaderMaterial.uniforms.uLayer2Offset.value.set(0, 0)
        shaderMaterial.uniforms.uHueShift1.value = 0
        shaderMaterial.uniforms.uHueShift2.value = 0
        shaderMaterial.uniforms.uScanlinesIntensity.value = 0
        shaderMaterial.uniforms.uGrainIntensity.value = 0
        timeRef.current = 0
        // Reset glitch state
        glitch.layer1CurrentX = 0
        glitch.layer1CurrentY = 0
        glitch.layer2CurrentX = 0
        glitch.layer2CurrentY = 0
        glitch.hue1Current = 0
        glitch.hue2Current = 0
        glitch.layer1NextGlitch = 0
        glitch.layer2NextGlitch = 0
        glitch.hueNextGlitch = 0
      }
    }
  })

  // Calculate plane dimensions based on aspect ratio and fullscreen mode
  let planeWidth: number
  let planeHeight: number
  let uvScale = { x: 1, y: 1 }
  let uvOffset = { x: 0, y: 0 }

  // Get the current image's aspect ratio for cover UV calculation
  const currentImageAspect = textureData.length > 0 ? textureData[currentIndex]?.imageAspect ?? aspectRatio : aspectRatio

  if (fullscreen) {
    // In fullscreen mode, fill the entire viewport
    planeWidth = viewport.width
    planeHeight = viewport.height

    // Calculate UV scaling to achieve "cover" behavior for viewport
    const viewportAspect = viewport.width / viewport.height

    // First, apply cover for the source image to the target aspect ratio
    const imageCover = calculateCoverUV(currentImageAspect, viewportAspect)
    uvScale.x = imageCover.scaleX
    uvScale.y = imageCover.scaleY
    uvOffset.x = imageCover.offsetX
    uvOffset.y = imageCover.offsetY
  } else {
    // Standard mode: fit within 80% of viewport
    const maxWidth = viewport.width * 0.8
    const maxHeight = viewport.height * 0.8

    if (maxWidth / aspectRatio <= maxHeight) {
      planeWidth = maxWidth
      planeHeight = maxWidth / aspectRatio
    } else {
      planeHeight = maxHeight
      planeWidth = maxHeight * aspectRatio
    }

    // Apply cover UV for the source image to crop it to the target aspect ratio
    const imageCover = calculateCoverUV(currentImageAspect, aspectRatio)
    uvScale.x = imageCover.scaleX
    uvScale.y = imageCover.scaleY
    uvOffset.x = imageCover.offsetX
    uvOffset.y = imageCover.offsetY
  }

  // Update UV uniforms
  if (shaderMaterial.uniforms.uUvScale) {
    shaderMaterial.uniforms.uUvScale.value.set(uvScale.x, uvScale.y)
    shaderMaterial.uniforms.uUvOffset.value.set(uvOffset.x, uvOffset.y)
  }

  if (!isReady) {
    return (
      <mesh>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshBasicMaterial color="#111" />
      </mesh>
    )
  }

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[planeWidth, planeHeight]} />
      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </mesh>
  )
}
