/// <reference types="vite/client" />

// Shader file imports
declare module '*.vert' {
  const content: string
  export default content
}

declare module '*.frag' {
  const content: string
  export default content
}

declare module '*.glsl' {
  const content: string
  export default content
}
