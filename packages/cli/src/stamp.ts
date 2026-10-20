/* Where each copied file came from. `add` records, per item, the version it copied
 * and a sha256 of every file as it left it, in youj.json at the app root:
 *   { "items": { "button": { "version": "0.2.0", "files": { "src/components/ui/button.tsx": "<sha256>" } } } }
 * A file whose hash still matches is untouched (safe to replace); one that doesn't
 * is yours. The hash is of what we left on disk, which is the common ancestor a
 * later three-way merge (`youj update`) needs. No header comment goes in the files:
 * it would change them from the registry's, which `add` compares against, and CSS
 * and JSON have no one comment syntax. */

import { createHash } from 'node:crypto'
import type { Project } from './project'

export const MANIFEST = 'youj.json'

export interface Manifest {
  items: Record<string, { version: string; files: Record<string, string> }>
}

export const hashOf = (content: string) => createHash('sha256').update(content).digest('hex')

export function readManifest(project: Project): Manifest {
  const found = project.json<Partial<Manifest>>(MANIFEST)
  return { items: found && typeof found.items === 'object' && found.items ? found.items : {} }
}

/**
 * Records the files `add` left in place, each under its item, with the hash of what's on disk now.
 * A file already recorded stays under its first item, so a shared file isn't claimed twice. Keys are sorted so
 * adding the same thing again writes the same bytes.
 */
export function stamp(project: Project, copied: { item: string; path: string }[], version: string): void {
  if (!copied.length) return
  const manifest = readManifest(project)
  const owner = (path: string) => Object.keys(manifest.items).find((item) => path in manifest.items[item]!.files)
  for (const { item, path } of copied) {
    const content = project.read(path)
    if (content === null) continue
    const to = owner(path) ?? item
    const entry = (manifest.items[to] ??= { version, files: {} })
    entry.version = version
    entry.files[path] = hashOf(content)
  }
  const sorted = (o: Record<string, never> | object) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : 1)))
  const items = Object.fromEntries(Object.entries(sorted(manifest.items)).map(([name, e]) => [name, { version: e.version, files: sorted(e.files) }]))
  project.write(MANIFEST, `${JSON.stringify({ items }, null, 2)}\n`)
  project.commit()
}

/** What the manifest says about the copies on disk: the ones you edited, and the ones from a version other than `version`. */
export function inspect(project: Project, version: string): { edited: { item: string; path: string }[]; older: { item: string; version: string }[] } {
  const edited: { item: string; path: string }[] = []
  const older: { item: string; version: string }[] = []
  for (const [item, entry] of Object.entries(readManifest(project).items)) {
    if (entry.version !== version) older.push({ item, version: entry.version })
    for (const [path, hash] of Object.entries(entry.files)) {
      const current = project.read(path)
      if (current !== null && hashOf(current) !== hash) edited.push({ item, path })
    }
  }
  return { edited, older }
}
