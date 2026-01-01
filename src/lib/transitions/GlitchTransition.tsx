import { useRef, useEffect, useState, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SlideData } from '../types'

interface GlitchTransitionProps {
  slides: SlideData[]
  currentIndex: number
  transitionDuration: number
  direction: 'next' | 'prev'
  aspectRatio?: number
  aberrationIntensity?: number
  scanlinesIntensity?: number
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
  uniform float uShowNext;
  uniform float uAberrationAmount;
  uniform float uTime;
  uniform float uOverlayIntensity;
  uniform vec2 uLayer1Offset;
  uniform vec2 uLayer2Offset;
  uniform float uHueShift1;
  uniform float uHueShift2;
  uniform float uScanlinesIntensity;

  varying vec2 vUv;

  // Hue rotation function
  vec3 hueRotate(vec3 color, float hue) {
    float angle = hue * 6.28318530718; // Convert to radians (0-1 maps to 0-2PI)
    float s = sin(angle);
    float c = cos(angle);
    vec3 weights = (vec3(2.0 * c, -sqrt(3.0) * s - c, sqrt(3.0) * s - c) + 1.0) / 3.0;
    vec3 result = vec3(
      dot(color, weights.xyz),
      dot(color, weights.zxy),
      dot(color, weights.yzx)
    );
    return result;
  }

  // Hard light blend mode: combines multiply and screen based on overlay brightness
  vec3 hardLight(vec3 base, vec3 overlay) {
    vec3 result;
    result.r = overlay.r < 0.5 ? 2.0 * base.r * overlay.r : 1.0 - 2.0 * (1.0 - base.r) * (1.0 - overlay.r);
    result.g = overlay.g < 0.5 ? 2.0 * base.g * overlay.g : 1.0 - 2.0 * (1.0 - base.g) * (1.0 - overlay.g);
    result.b = overlay.b < 0.5 ? 2.0 * base.b * overlay.b : 1.0 - 2.0 * (1.0 - base.b) * (1.0 - overlay.b);
    return result;
  }

  void main() {
    vec2 uv = vUv;

    // When not animating, just show the texture directly (no processing)
    if (uAberrationAmount < 0.001) {
      gl_FragColor = texture2D(uCurrentTexture, uv);
      #include <colorspace_fragment>
      return;
    }

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

    // Choose which texture to show based on uShowNext (0 = current, 1 = next)
    // The swap happens at peak intensity (no crossfade, instant switch)
    vec3 baseColor = uShowNext < 0.5 ? currentColor : nextColor;

    // === Overlay Layers with heavy aberration and hue rotation ===
    // These create the stretched, ghostly duplicate effect

    float heavyAberration = uAberrationAmount * 5.0; // Much stronger aberration for overlays

    // Layer 1 - offset and heavily aberrated
    vec2 layer1Uv = uv + uLayer1Offset;
    vec2 layer1Center = layer1Uv - 0.5;
    float layer1Dist = length(layer1Center);
    vec2 layer1AberrationOffset = layer1Center * layer1Dist * heavyAberration;

    // Sample from active texture for layer 1
    float layer1CurrentR = texture2D(uCurrentTexture, layer1Uv + layer1AberrationOffset).r;
    float layer1CurrentG = texture2D(uCurrentTexture, layer1Uv).g;
    float layer1CurrentB = texture2D(uCurrentTexture, layer1Uv - layer1AberrationOffset).b;
    vec3 layer1CurrentColor = vec3(layer1CurrentR, layer1CurrentG, layer1CurrentB);

    float layer1NextR = texture2D(uNextTexture, layer1Uv + layer1AberrationOffset).r;
    float layer1NextG = texture2D(uNextTexture, layer1Uv).g;
    float layer1NextB = texture2D(uNextTexture, layer1Uv - layer1AberrationOffset).b;
    vec3 layer1NextColor = vec3(layer1NextR, layer1NextG, layer1NextB);

    vec3 layer1Color = uShowNext < 0.5 ? layer1CurrentColor : layer1NextColor;
    layer1Color = hueRotate(layer1Color, uHueShift1);

    // Layer 2 - different offset and aberration
    vec2 layer2Uv = uv + uLayer2Offset;
    vec2 layer2Center = layer2Uv - 0.5;
    float layer2Dist = length(layer2Center);
    vec2 layer2AberrationOffset = layer2Center * layer2Dist * heavyAberration;

    // Sample from active texture for layer 2
    float layer2CurrentR = texture2D(uCurrentTexture, layer2Uv + layer2AberrationOffset).r;
    float layer2CurrentG = texture2D(uCurrentTexture, layer2Uv).g;
    float layer2CurrentB = texture2D(uCurrentTexture, layer2Uv - layer2AberrationOffset).b;
    vec3 layer2CurrentColor = vec3(layer2CurrentR, layer2CurrentG, layer2CurrentB);

    float layer2NextR = texture2D(uNextTexture, layer2Uv + layer2AberrationOffset).r;
    float layer2NextG = texture2D(uNextTexture, layer2Uv).g;
    float layer2NextB = texture2D(uNextTexture, layer2Uv - layer2AberrationOffset).b;
    vec3 layer2NextColor = vec3(layer2NextR, layer2NextG, layer2NextB);

    vec3 layer2Color = uShowNext < 0.5 ? layer2CurrentColor : layer2NextColor;
    layer2Color = hueRotate(layer2Color, uHueShift2);

    // Apply hard light blend mode
    vec3 blended1 = hardLight(baseColor, layer1Color);
    vec3 blended2 = hardLight(baseColor, layer2Color);

    // Mix in the blended overlays based on intensity
    vec3 finalColor = baseColor;
    finalColor = mix(finalColor, blended1, uOverlayIntensity * 0.4);
    finalColor = mix(finalColor, blended2, uOverlayIntensity * 0.4);

    // === Scanlines effect ===
    if (uScanlinesIntensity > 0.001) {
      // Rescale intensity: old 10% = new 50%, so multiply by 0.2
      float scaledIntensity = uScanlinesIntensity * 0.2;

      // Create horizontal scanlines - lower frequency for more visible lines
      float scanlineFreq = 300.0;
      float scrollSpeed = uTime * 80.0;

      // Create the base scanline pattern
      float scanlineY = uv.y * scanlineFreq + scrollSpeed;
      float scanline = sin(scanlineY) * 0.5 + 0.5;

      // Sharpen the scanlines to create distinct dark bands
      scanline = smoothstep(0.3, 0.7, scanline);

      // Dark scanlines (the dark lines between the bright ones)
      float darkness = mix(1.0, 0.3, (1.0 - scanline) * scaledIntensity);
      finalColor *= darkness;

      // Add CRT phosphor glow between lines
      float glow = scanline * 0.15 * scaledIntensity;
      finalColor += glow;

      // Add subtle flicker
      float flicker = sin(uTime * 45.0) * 0.03 * scaledIntensity;
      finalColor *= (1.0 + flicker);
    }

    gl_FragColor = vec4(finalColor, 1.0);

    // Apply sRGB encoding to match Three.js output color space
    #include <colorspace_fragment>
  }
`

export function GlitchTransition({
  slides,
  currentIndex,
  transitionDuration,
  aspectRatio = 3 / 2,
  aberrationIntensity = 0.5,
  scanlinesIntensity = 0.5,
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
      },
    })
    return material
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
        shaderMaterial.uniforms.uCurrentTexture.value = textures[currentIndex]
        shaderMaterial.uniforms.uNextTexture.value = textures[currentIndex]
        shaderMaterial.uniforms.uShowNext.value = 0
        shaderMaterial.uniforms.uAberrationAmount.value = 0
        shaderMaterial.uniforms.uOverlayIntensity.value = 0
        shaderMaterial.uniforms.uLayer1Offset.value.set(0, 0)
        shaderMaterial.uniforms.uLayer2Offset.value.set(0, 0)
        shaderMaterial.uniforms.uHueShift1.value = 0
        shaderMaterial.uniforms.uHueShift2.value = 0
        shaderMaterial.uniforms.uScanlinesIntensity.value = 0
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

  // Calculate plane dimensions based on aspect ratio
  const maxWidth = viewport.width * 0.8
  const maxHeight = viewport.height * 0.8
  let planeWidth: number
  let planeHeight: number

  if (maxWidth / aspectRatio <= maxHeight) {
    planeWidth = maxWidth
    planeHeight = maxWidth / aspectRatio
  } else {
    planeHeight = maxHeight
    planeWidth = maxHeight * aspectRatio
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
