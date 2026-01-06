import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import { string } from 'rollup-plugin-string'
import { readFileSync } from 'fs'
import { dirname, resolve as pathResolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Custom plugin to handle Vite's ?raw suffix for shader imports
const rawSuffixPlugin = () => ({
  name: 'raw-suffix',
  resolveId(source, importer) {
    if (source.endsWith('?raw')) {
      // Strip the ?raw suffix and resolve the path relative to importer
      const cleanSource = source.slice(0, -4)
      if (importer) {
        const importerDir = dirname(importer)
        return pathResolve(importerDir, cleanSource)
      }
      return pathResolve(__dirname, cleanSource)
    }
    return null
  },
})

export default [
  {
    input: 'src/lib/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      rawSuffixPlugin(),
      resolve(),
      commonjs(),
      string({
        include: ['**/*.vert', '**/*.frag', '**/*.glsl'],
      }),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
        exclude: ['**/*.demo.tsx', '**/demo/**', 'src/main.tsx', 'src/App.tsx'],
      }),
    ],
    external: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'],
  },
  {
    input: 'dist/lib/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
  },
]
