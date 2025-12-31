import { useRef, useEffect, useState, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SlideData } from '../types'

interface GlitchTransitionProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
  direction: 'next' | 'prev'
}

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D uCurrentTexture;
  uniform sampler2D uNextTexture;
  uniform float uProgress;
  uniform float uAberrationAmount;

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;

    // Chromatic aberration offset - increases toward edges
    vec2 center = uv - 0.5;
    float dist = length(center);
    vec2 aberrationOffset = center * dist * uAberrationAmount;

    // Sample current texture with chromatic aberration
    float currentR = texture2D(uCurrentTexture, uv + aberrationOffset).r;
    float currentG = texture2D(uCurrentTexture, uv).g;
    float currentB = texture2D(uCurrentTexture, uv - aberrationOffset).b;
    vec3 currentColor = vec3(currentR, currentG, currentB);

    // Sample next texture with chromatic aberration
    float nextR = texture2D(uNextTexture, uv + aberrationOffset).r;
    float nextG = texture2D(uNextTexture, uv).g;
    float nextB = texture2D(uNextTexture, uv - aberrationOffset).b;
    vec3 nextColor = vec3(nextR, nextG, nextB);

    // Crossfade between textures
    vec3 color = mix(currentColor, nextColor, uProgress);

    gl_FragColor = vec4(color, 1.0);
  }
`

export function GlitchTransition({
  slides,
  currentIndex,
  transitionDuration,
}: GlitchTransitionProps) {
  const { viewport } = useThree()
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const [textures, setTextures] = useState<THREE.Texture[]>([])
  const [isReady, setIsReady] = useState(false)

  const prevIndexRef = useRef(currentIndex)
  const progressRef = useRef(0)
  const isAnimatingRef = useRef(false)

  // Load all textures
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    const loadPromises = slides.map((slide) => {
      return new Promise<THREE.Texture>((resolve) => {
        if (slide.image) {
          loader.load(
            slide.image,
            (texture) => {
              texture.colorSpace = THREE.SRGBColorSpace
              resolve(texture)
            },
            undefined,
            () => {
              const canvas = document.createElement('canvas')
              canvas.width = 512
              canvas.height = 512
              const ctx = canvas.getContext('2d')!
              ctx.fillStyle = slide.backgroundColor || '#333'
              ctx.fillRect(0, 0, 512, 512)
              const fallback = new THREE.CanvasTexture(canvas)
              fallback.colorSpace = THREE.SRGBColorSpace
              resolve(fallback)
            }
          )
        } else {
          const canvas = document.createElement('canvas')
          canvas.width = 512
          canvas.height = 512
          const ctx = canvas.getContext('2d')!
          ctx.fillStyle = slide.backgroundColor || '#333'
          ctx.fillRect(0, 0, 512, 512)
          const fallback = new THREE.CanvasTexture(canvas)
          fallback.colorSpace = THREE.SRGBColorSpace
          resolve(fallback)
        }
      })
    })

    Promise.all(loadPromises).then((loaded) => {
      setTextures(loaded)
      setIsReady(true)
    })
  }, [slides])

  // Create shader material
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uCurrentTexture: { value: null },
        uNextTexture: { value: null },
        uProgress: { value: 0 },
        uAberrationAmount: { value: 0 },
      },
    })
  }, [])

  // Update textures when ready
  useEffect(() => {
    if (!isReady || textures.length === 0) return

    shaderMaterial.uniforms.uCurrentTexture.value = textures[currentIndex]
    shaderMaterial.uniforms.uNextTexture.value = textures[currentIndex]
    prevIndexRef.current = currentIndex
  }, [isReady, textures, shaderMaterial])

  // Handle slide changes
  useEffect(() => {
    if (!isReady || textures.length === 0) return
    if (currentIndex === prevIndexRef.current) return

    // Set up transition
    shaderMaterial.uniforms.uCurrentTexture.value = textures[prevIndexRef.current]
    shaderMaterial.uniforms.uNextTexture.value = textures[currentIndex]
    shaderMaterial.uniforms.uProgress.value = 0
    shaderMaterial.uniforms.uAberrationAmount.value = 0

    progressRef.current = 0
    isAnimatingRef.current = true
    prevIndexRef.current = currentIndex
  }, [currentIndex, isReady, textures, shaderMaterial])

  // Animation loop
  useFrame((_, delta) => {
    if (!materialRef.current) return

    if (isAnimatingRef.current) {
      const speed = (1 / transitionDuration) * 1000
      progressRef.current = Math.min(progressRef.current + delta * speed, 1)

      const progress = progressRef.current
      shaderMaterial.uniforms.uProgress.value = progress

      // Aberration ramps up to middle, then ramps down
      // Peak at progress = 0.5, using a sine curve for smooth ramp
      const aberration = Math.sin(progress * Math.PI) * 0.15
      shaderMaterial.uniforms.uAberrationAmount.value = aberration

      if (progressRef.current >= 1) {
        isAnimatingRef.current = false
        // Set both textures to the current one
        shaderMaterial.uniforms.uCurrentTexture.value = textures[currentIndex]
        shaderMaterial.uniforms.uNextTexture.value = textures[currentIndex]
        shaderMaterial.uniforms.uAberrationAmount.value = 0
      }
    }
  })

  const planeWidth = Math.min(viewport.width * 0.8, viewport.height * 0.8 * (16 / 9))
  const planeHeight = planeWidth * (9 / 16)

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
