import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const app = join(dirname(fileURLToPath(import.meta.url)), '..')
const packagesDir = join(app, '../../packages')
const read = (file) => JSON.parse(readFileSync(file, 'utf8'))

/**
 * The workspace packages the docs app depends on, from its package.json: name, `src/` folder, and whether its exports
 * map every subpath to `src/` (those are aliased to source, so `@youj/core/lib/x` resolves without an extension).
 * next.config.mjs (transpilePackages) and vitest.config.ts (aliases) read this; tsconfig's `paths` mirror it by hand
 * and lib/workspace-packages.test.ts keeps the two in step.
 */
export function workspacePackages() {
  const { dependencies = {} } = read(join(app, 'package.json'))
  const byName = new Map(
    readdirSync(packagesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((d) => {
        try {
          return [[read(join(packagesDir, d.name, 'package.json')).name, d.name]]
        } catch {
          return []
        }
      }),
  )
  return Object.entries(dependencies)
    .filter(([, range]) => String(range).startsWith('workspace:'))
    .map(([name]) => {
      const dir = byName.get(name)
      if (!dir) throw new Error(`${name} is a workspace dependency of the docs app but has no folder in packages/`)
      const { exports = {} } = read(join(packagesDir, dir, 'package.json'))
      const aliasSubpaths = exports['./*'] === './src/*' && Object.values(exports).every((to) => String(to).startsWith('./src/'))
      return { name, src: join(packagesDir, dir, 'src'), aliasSubpaths }
    })
}
