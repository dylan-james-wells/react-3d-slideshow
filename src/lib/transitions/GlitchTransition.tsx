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

// Custom shader for glitch effect
const glitchVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const glitchFragmentShader = `
  uniform sampler2D uTexture;
  uniform sampler2D uNextTexture;
  uniform float uProgress;
  uniform float uTime;
  uniform float uGlitchIntensity;

  varying vec2 vUv;

  // Random function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  // Block noise for glitch blocks
  float blockNoise(vec2 st, float scale) {
    vec2 i = floor(st * scale);
    return random(i);
  }

  void main() {
    vec2 uv = vUv;
    float progress = uProgress;
    float glitchAmount = uGlitchIntensity;

    // Create glitch timing - more intense in the middle of transition
    float glitchPhase = sin(progress * 3.14159);
    float intensity = glitchAmount * glitchPhase;

    // Horizontal displacement glitch
    float blockSize = 20.0 + random(vec2(floor(uTime * 10.0))) * 30.0;
    float block = floor(uv.y * blockSize);
    float blockRand = random(vec2(block, floor(uTime * 15.0)));

    // Only apply horizontal shift to some blocks
    float horizontalShift = 0.0;
    if (blockRand > 0.7) {
      horizontalShift = (random(vec2(block, uTime)) - 0.5) * 0.15 * intensity;
    }

    // RGB split / chromatic aberration
    float rgbShift = 0.02 * intensity;

    // Scanline effect
    float scanline = sin(uv.y * 400.0 + uTime * 10.0) * 0.04 * intensity;

    // Apply horizontal displacement
    vec2 uvR = uv + vec2(horizontalShift + rgbShift, 0.0);
    vec2 uvG = uv + vec2(horizontalShift, 0.0);
    vec2 uvB = uv + vec2(horizontalShift - rgbShift, 0.0);

    // Clamp UVs
    uvR = clamp(uvR, 0.0, 1.0);
    uvG = clamp(uvG, 0.0, 1.0);
    uvB = clamp(uvB, 0.0, 1.0);

    // Sample both textures
    vec4 currentR = texture2D(uTexture, uvR);
    vec4 currentG = texture2D(uTexture, uvG);
    vec4 currentB = texture2D(uTexture, uvB);

    vec4 nextR = texture2D(uNextTexture, uvR);
    vec4 nextG = texture2D(uNextTexture, uvG);
    vec4 nextB = texture2D(uNextTexture, uvB);

    // Mix between current and next based on progress
    // Add some randomness to the mix for glitchy transition
    float mixNoise = blockNoise(uv + uTime, 10.0) * 0.3 * intensity;
    float mixFactor = clamp(progress + mixNoise - 0.15, 0.0, 1.0);

    // Random block replacement - some blocks switch early/late
    float blockSwitch = blockNoise(vec2(block, floor(uTime * 8.0)), 1.0);
    if (blockSwitch > 0.85 && intensity > 0.1) {
      mixFactor = blockSwitch > 0.92 ? 1.0 : 0.0;
    }

    vec3 currentColor = vec3(currentR.r, currentG.g, currentB.b);
    vec3 nextColor = vec3(nextR.r, nextG.g, nextB.b);

    vec3 color = mix(currentColor, nextColor, mixFactor);

    // Add scanlines
    color += scanline;

    // Occasional white noise blocks
    float noiseBlock = blockNoise(uv + vec2(uTime * 5.0, 0.0), 50.0);
    if (noiseBlock > 0.98 && intensity > 0.2) {
      color = vec3(random(uv + uTime));
    }

    // Color corruption - occasionally shift hue
    float colorCorrupt = random(vec2(floor(uTime * 20.0), block));
    if (colorCorrupt > 0.95 && intensity > 0.3) {
      color.rgb = color.gbr; // Rotate color channels
    }

    // Vignette flicker
    float vignette = 1.0 - length(uv - 0.5) * 0.5;
    float flicker = 0.95 + random(vec2(uTime * 30.0)) * 0.1 * intensity;
    color *= vignette * flicker;

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
  const timeRef = useRef(0)

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
              // On error, create a fallback texture
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
      vertexShader: glitchVertexShader,
      fragmentShader: glitchFragmentShader,
      uniforms: {
        uTexture: { value: null },
        uNextTexture: { value: null },
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uGlitchIntensity: { value: 1.0 },
      },
    })
  }, [])

  // Update textures when ready
  useEffect(() => {
    if (!isReady || textures.length === 0) return

    shaderMaterial.uniforms.uTexture.value = textures[currentIndex]
    shaderMaterial.uniforms.uNextTexture.value = textures[currentIndex]
    prevIndexRef.current = currentIndex
  }, [isReady, textures, shaderMaterial])

  // Handle slide changes
  useEffect(() => {
    if (!isReady || textures.length === 0) return
    if (currentIndex === prevIndexRef.current) return

    // Set up transition
    shaderMaterial.uniforms.uTexture.value = textures[prevIndexRef.current]
    shaderMaterial.uniforms.uNextTexture.value = textures[currentIndex]
    shaderMaterial.uniforms.uProgress.value = 0

    progressRef.current = 0
    isAnimatingRef.current = true
    prevIndexRef.current = currentIndex
  }, [currentIndex, isReady, textures, shaderMaterial])

  // Animation loop
  useFrame((_, delta) => {
    if (!materialRef.current) return

    // Update time for shader effects
    timeRef.current += delta
    shaderMaterial.uniforms.uTime.value = timeRef.current

    if (isAnimatingRef.current) {
      const speed = (1 / transitionDuration) * 1000
      progressRef.current = Math.min(progressRef.current + delta * speed, 1)
      shaderMaterial.uniforms.uProgress.value = progressRef.current

      if (progressRef.current >= 1) {
        isAnimatingRef.current = false
        // Set both textures to the current one
        shaderMaterial.uniforms.uTexture.value = textures[currentIndex]
        shaderMaterial.uniforms.uNextTexture.value = textures[currentIndex]
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
