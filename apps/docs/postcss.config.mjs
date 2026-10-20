import { fileURLToPath } from 'node:url'

export default {
  // The order matters: gallery-delta trims gallery.css against global.css once Tailwind has compiled it, and flatten-has
  // then rewrites what is left in both sheets. Turbopack resolves a plugin's name from outside this folder, so a local
  // plugin is named by its absolute path.
  plugins: {
    '@tailwindcss/postcss': {},
    [fileURLToPath(new URL('./postcss/gallery-delta.mjs', import.meta.url))]: {},
    [fileURLToPath(new URL('./postcss/flatten-has.mjs', import.meta.url))]: {},
  },
}
