import { defineConfig } from 'tsup'

const external = ['react', 'react-dom', 'hudsonkit', /^hudsonkit\//, 'ai', /^@hudsonkit\/ai/, 'zod', 'zustand']

export default defineConfig([
  // React app + UI: client-only.
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    external,
    banner: { js: "'use client';" },
  },
  // Headless engine and server toolset: no 'use client'.
  {
    entry: { engine: 'src/engine/index.ts', toolset: 'src/toolset.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    external,
  },
])
