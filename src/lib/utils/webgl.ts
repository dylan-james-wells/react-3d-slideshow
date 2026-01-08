let webglSupported: boolean | null = null

export function isWebGLSupported(): boolean {
  if (webglSupported !== null) {
    return webglSupported
  }

  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    webglSupported = gl !== null
  } catch {
    webglSupported = false
  }

  return webglSupported
}
