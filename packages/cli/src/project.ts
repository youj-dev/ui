import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { CliError } from './ui'

export interface Change {
  path: string
  before: string | null
  after: string
}

/**
 * The app on disk, with edits staged in memory until `commit()`. Reads see the
 * staged edits, so codemods compose, and the staged set is the diff summary.
 * Paths are relative to the app root, with forward slashes.
 */
export class Project {
  private staged = new Map<string, Change>()
  readonly committed: Change[] = []

  constructor(readonly root: string) {}

  abs(path: string): string {
    return join(this.root, path)
  }

  /** The absolute path for a write: throws unless it stays under the app root, after resolving `..` and any symlink on the way. */
  private writable(path: string): string {
    const full = resolve(this.root, path)
    const inside = (base: string, target: string) => {
      const rel = relative(base, target)
      return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
    }
    const refuse = () => new CliError(`Refusing to write ${JSON.stringify(path)}: it is outside the app (${this.root}). This is a bug in youj; please report it.`)
    if (isAbsolute(path) || !inside(this.root, full)) throw refuse()
    // The deepest part that exists may be a symlink out of the app.
    let existing = full
    while (!existsSync(existing)) existing = dirname(existing)
    if (!inside(realpathSync(this.root), realpathSync(existing))) throw refuse()
    return full
  }

  exists(path: string): boolean {
    return this.staged.has(path) || existsSync(this.abs(path))
  }

  read(path: string): string | null {
    const staged = this.staged.get(path)
    if (staged) return staged.after
    try {
      return readFileSync(this.abs(path), 'utf8')
    } catch {
      return null
    }
  }

  json<T = Record<string, unknown>>(path: string): T | null {
    const text = this.read(path)
    if (text === null) return null
    try {
      return JSON.parse(text) as T
    } catch {
      return null
    }
  }

  write(path: string, content: string): void {
    this.writable(path)
    const before = this.staged.has(path) ? this.staged.get(path)!.before : this.readDisk(path)
    if (before === content) this.staged.delete(path)
    else this.staged.set(path, { path, before, after: content })
  }

  /** Puts a file back to `content` on disk, past anything staged. */
  restore(path: string, content: string): void {
    this.staged.delete(path)
    writeFileSync(this.writable(path), content)
  }

  /** The first path that exists. */
  find(...paths: string[]): string | null {
    return paths.find((p) => this.exists(p)) ?? null
  }

  /** Files under `dir` (relative) whose name passes `match`, skipping node_modules and dot folders. */
  walk(dir: string, match: (name: string) => boolean, depth = 6): string[] {
    const out: string[] = []
    const visit = (rel: string, level: number) => {
      let entries
      try {
        entries = readdirSync(this.abs(rel), { withFileTypes: true })
      } catch {
        return
      }
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
        const path = rel ? `${rel}/${entry.name}` : entry.name
        if (entry.isDirectory()) {
          if (level < depth && !['dist', 'build', 'out'].includes(entry.name)) visit(path, level + 1)
        } else if (match(entry.name)) out.push(path)
      }
    }
    visit(dir === '.' ? '' : dir, 0)
    return out.sort()
  }

  get pending(): Change[] {
    return [...this.staged.values()]
  }

  commit(): Change[] {
    const changes = this.pending
    for (const change of changes) {
      const full = this.writable(change.path)
      mkdirSync(dirname(full), { recursive: true })
      writeFileSync(full, change.after)
    }
    this.committed.push(...changes)
    this.staged.clear()
    return changes
  }

  private readDisk(path: string): string | null {
    try {
      return readFileSync(this.abs(path), 'utf8')
    } catch {
      return null
    }
  }
}

/** `to` as a relative import specifier from the file `from` (both project paths). */
export function importPath(from: string, to: string): string {
  const rel = relative(dirname(from), to).split(sep).join('/')
  return rel.startsWith('.') ? rel : `./${rel}`
}
