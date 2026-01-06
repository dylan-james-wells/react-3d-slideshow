// Glitch transition vertex shader
// Applies UV scaling and offset for cover mode (object-fit: cover equivalent)

varying vec2 vUv;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;

void main() {
  // Apply UV scaling and offset for cover mode
  vUv = uv * uUvScale + uUvOffset;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
