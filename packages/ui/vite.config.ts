import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const coreSrc = fileURLToPath(new URL('../core/src', import.meta.url))
const motionSrc = fileURLToPath(new URL('../motion/src', import.meta.url))

// Exists for tooling (shadcn CLI detection); the review surface is the root Storybook.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@youj\/core$/, replacement: `${coreSrc}/index.ts` },
      { find: /^@youj\/motion$/, replacement: `${motionSrc}/index.ts` },
      { find: /^@youj\/core\/(.*)$/, replacement: `${coreSrc}/$1` },
      { find: /^@youj\/motion\/(.*)$/, replacement: `${motionSrc}/$1` },
      { find: /^@\/(.*)$/, replacement: fileURLToPath(new URL('./src/$1', import.meta.url)) },
    ],
  },
})
