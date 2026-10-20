/* The two halves of a build, shared by scripts/build.ts and the tests: the
 * data step (read through Vite's SSR loader, so the TSX icons load as they do
 * in the docs) and the bundle (one IIFE for Figma's sandbox, the kit inlined). */

import { fileURLToPath } from 'node:url'
import { build, createServer, type Plugin, type Rolldown } from 'vite'
import type { Kit } from '../src/kit.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const coreSrc = fileURLToPath(new URL('../../core/src', import.meta.url))
const uiSrc = fileURLToPath(new URL('../../ui/src', import.meta.url))
const iconsSrc = fileURLToPath(new URL('../../icons/src', import.meta.url))
const illustrationsSrc = fileURLToPath(new URL('../../illustrations/src', import.meta.url))
const alias = [
  { find: /^@youj\/core$/, replacement: `${coreSrc}/index.ts` },
  { find: /^@youj\/core\/(.*)$/, replacement: `${coreSrc}/$1` },
  { find: /^@youj\/icons$/, replacement: `${iconsSrc}/index.ts` },
  { find: /^@youj\/icons\/(.*)$/, replacement: `${iconsSrc}/$1` },
  { find: /^@youj\/illustrations$/, replacement: `${illustrationsSrc}/index.ts` },
  { find: /^@youj\/illustrations\/(.*)$/, replacement: `${illustrationsSrc}/$1` },
  { find: /^@youj\/react\/(.*)$/, replacement: `${uiSrc}/$1` },
]

export async function loadKit(): Promise<Kit> {
  const vite = await createServer({
    root,
    configFile: false,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias },
  })
  try {
    const data = (await vite.ssrLoadModule('/src/data/build-kit.ts')) as { buildKit: () => Kit }
    return data.buildKit()
  } finally {
    await vite.close()
  }
}

/** Bundles the plugin with `kit` inlined. Writes dist/code.js, or returns the code when `write` is false. */
export async function bundlePlugin(kit: Kit, write = true): Promise<string> {
  const kitModule: Plugin = {
    name: 'youj-kit',
    resolveId: (id) => (id === 'virtual:youj-kit' ? '\0youj-kit' : null),
    load: (id) => (id === '\0youj-kit' ? `export default ${JSON.stringify(kit)}` : null),
  }
  const result = await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [kitModule],
    build: {
      write,
      lib: { entry: 'src/plugin/main.ts', formats: ['iife'], name: 'YoujKit', fileName: () => 'code.js' },
      outDir: 'dist',
      emptyOutDir: true,
      // Figma's sandbox: plain ES2017 syntax is the safe floor.
      target: 'es2017',
      minify: false,
      reportCompressedSize: false,
    },
  })
  const outputs = (Array.isArray(result) ? result : [result]) as Rolldown.RolldownOutput[]
  const chunk = outputs.flatMap((o) => o.output).find((o) => o.type === 'chunk')
  if (!chunk || chunk.type !== 'chunk') throw new Error('bundle: no chunk')
  return chunk.code
}
