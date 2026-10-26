import { closeSync, constants, fstatSync, openSync, readFileSync, realpathSync, readdirSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Host } from '../catalog'
import type { ProjectFiles } from './project-info'

const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const packageName = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i

/** No ancestor searches; resolve links before reading, and keep every target inside the app. */
export class LocalProject implements ProjectFiles {
  readonly root: string
  constructor(cwd = process.cwd()) {
    try { this.root = realpathSync(resolve(cwd)) } catch { this.root = resolve(cwd) }
  }

  path(file: string): string | undefined {
    const inside = (path: string) => { const rel = relative(this.root, path); return rel !== '..' && !rel.startsWith('../') && !isAbsolute(rel) }
    const path = resolve(this.root, file)
    if (!inside(path)) return undefined
    try { const actual = realpathSync(path); return inside(actual) ? actual : undefined } catch { return undefined }
  }

  read(file: string): string | undefined {
    const path = this.path(file)
    if (!path) return undefined
    // Open once and read that handle: a link swapped in after the check above can't redirect the read. The path is then resolved again, and must still lead to this file.
    let handle: number | undefined
    try {
      handle = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
      const opened = fstatSync(handle)
      if (!opened.isFile() || opened.size > 1_000_000) return undefined
      const again = this.path(file)
      const now = again && statSync(again)
      if (!now || now.dev !== opened.dev || now.ino !== opened.ino) return undefined
      return readFileSync(handle, 'utf8')
    } catch { return undefined } finally { if (handle !== undefined) closeSync(handle) }
  }

  json(file: string): Record<string, unknown> | undefined {
    const text = this.read(file)
    if (text === undefined) return undefined
    try { const value: unknown = JSON.parse(text); return value && typeof value === 'object' && !Array.isArray(value) ? object(value) : undefined } catch { return undefined }
  }

  installed(name: string): string | undefined {
    if (!packageName.test(name)) return undefined
    const version = this.json(`node_modules/${name}/package.json`)?.version
    return typeof version === 'string' ? version : undefined
  }

  styles(): string[] {
    const out: string[] = []
    const visited = new Set<string>()
    let remaining = 2000
    const walk = (dir: string, depth: number) => {
      const path = this.path(dir)
      if (!path || visited.has(path) || depth > 8 || remaining <= 0) return
      visited.add(path)
      try {
        for (const entry of readdirSync(path, { withFileTypes: true })) {
          if (--remaining < 0) break
          if (entry.name.startsWith('.') || ['node_modules', 'dist', 'build', 'out', 'public'].includes(entry.name)) continue
          const file = `${dir}/${entry.name}`
          if (entry.isDirectory()) walk(file, depth + 1)
          else if (entry.name.endsWith('.css')) out.push(file)
        }
      } catch { /* Missing or unreadable directory. */ }
    }
    walk('.', 0)
    return out
  }
}

/** A tool-supplied `cwd` must resolve (symlinks included) to process.cwd() or a directory inside it. */
function insideServerCwd(value: string): boolean {
  const real = (path: string) => { try { return realpathSync(path) } catch { return resolve(path) } }
  const rel = relative(real(process.cwd()), real(resolve(value)))
  return rel === '' || (rel !== '..' && !rel.startsWith('../') && !isAbsolute(rel))
}

/** The Youj version the app in `cwd` has installed, if any. */
function installedVersion(cwd = process.cwd()): string | undefined {
  const project = new LocalProject(cwd)
  for (const name of ['@youj/react', '@youj/core', '@youj/motion', '@youj/loaders', '@youj/miniatures', '@youj/icons', '@youj/illustrations', '@youj/sound']) {
    const version = project.installed(name)
    if (version) return version
  }
  return undefined
}

/** The local server: the app on disk, and the block sources in data/sources/ next to the JSON index. */
export const localHost = (dir: URL): Host => ({
  project: (cwd) => new LocalProject(cwd),
  insideCwd: insideServerCwd,
  installedVersion,
  source: (file) => readFile(join(fileURLToPath(dir), 'sources', file), 'utf8').catch(() => undefined),
})
