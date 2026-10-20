// Renders a module's SSR cases the way a server does: a plain Node process with
// no DOM, the package's own Vite config (TSX, aliases), and node_modules loaded
// natively. Prints { [case]: html } as JSON on stdout.
//
//   node scripts/ssr-render.mjs <cases-module>
//
// The module exports `cases: Record<string, () => ReactElement>`. The packages'
// hydration tests hydrate the same cases in jsdom and compare.
//
// The server runs in another locale and time zone than the browser (German,
// UTC+14), as a real one often does: anything formatted with the runtime's
// defaults renders different text on each side and fails hydration.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

if (!process.env.YOUJ_SSR_FOREIGN) {
  // Node reads its default locale at startup, so the foreign server is a child process.
  const env = { ...process.env, YOUJ_SSR_FOREIGN: '1', LC_ALL: 'de_DE.UTF-8', LANG: 'de_DE.UTF-8', TZ: 'Pacific/Kiritimati' }
  execFileSync(process.execPath, [fileURLToPath(import.meta.url), ...process.argv.slice(2)], { env, stdio: 'inherit' })
  process.exit(0)
}

const file = resolve(process.argv[2])
let root = dirname(file)
while (!existsSync(join(root, 'package.json'))) root = dirname(root)

const server = await createServer({
  root,
  configFile: join(root, 'vitest.config.ts'),
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
})
try {
  // The package's own react-dom, so it shares React with the externalized imports.
  const { renderToString } = createRequire(join(root, 'package.json'))('react-dom/server')
  const { cases } = await server.ssrLoadModule(file)
  const html = {}
  for (const [name, render] of Object.entries(cases)) html[name] = renderToString(render())
  process.stdout.write(JSON.stringify(html))
} finally {
  await server.close()
}
