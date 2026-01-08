// Glitch transition fragment shader
// Creates a glitchy transition effect with chromatic aberration,
// hue-rotated overlay layers, scanlines, and film grain

#define PI 3.14159265359
#define TWO_PI 6.28318530718

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
uniform float uGrainIntensity;

varying vec2 vUv;

// Film grain noise function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Hue rotation function
// Rotates the color hue by a given amount (0-1 maps to 0-360 degrees)
vec3 hueRotate(vec3 color, float hue) {
  float angle = hue * TWO_PI; // Convert to radians (0-1 maps to 0-2PI)
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

// Hard light blend mode
// Combines multiply and screen based on overlay brightness
// Creates high-contrast overlay effect
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

  // ============================================
  // CHROMATIC ABERRATION
  // Offset increases toward edges for a lens-like effect
  // ============================================
  vec2 center = uv - 0.5;
  float dist = length(center);
  vec2 aberrationOffset = center * dist * uAberrationAmount;

  // Sample current texture with chromatic aberration (RGB split)
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

  // ============================================
  // OVERLAY LAYERS
  // Creates stretched, ghostly duplicate effect with heavy aberration and hue rotation
  // ============================================
  float heavyAberration = uAberrationAmount * 5.0; // Much stronger aberration for overlays

  // --- Layer 1: offset and heavily aberrated ---
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

  // --- Layer 2: different offset and aberration ---
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

  // Apply hard light blend mode to overlay layers
  vec3 blended1 = hardLight(baseColor, layer1Color);
  vec3 blended2 = hardLight(baseColor, layer2Color);

  // Mix in the blended overlays based on intensity
  vec3 finalColor = baseColor;
  finalColor = mix(finalColor, blended1, uOverlayIntensity * 0.4);
  finalColor = mix(finalColor, blended2, uOverlayIntensity * 0.4);

  // ============================================
  // SCANLINES EFFECT
  // CRT-style horizontal lines with glow and flicker
  // ============================================
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

  // ============================================
  // FILM GRAIN EFFECT
  // Animated noise overlay for that analog feel
  // ============================================
  if (uGrainIntensity > 0.001) {
    // Rescale intensity: old 20% = new 50%, so multiply by 0.4
    float scaledGrain = uGrainIntensity * 0.4;

    // Create animated grain by using time to offset the noise
    vec2 grainUv = uv * 500.0 + uTime * 100.0;
    float grain = random(grainUv) - 0.5;

    // Apply grain - adds and subtracts brightness randomly
    finalColor += grain * scaledGrain * 0.15;
  }

  gl_FragColor = vec4(finalColor, 1.0);

  // Apply sRGB encoding to match Three.js output color space
  #include <colorspace_fragment>
}
