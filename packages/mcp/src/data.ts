import { readFileSync } from 'node:fs'
import { Catalog } from './catalog'
import { localHost } from './tools/project'
import { INDEX_FILES, type YoujIndex } from './types'

/* The index ships in data/ next to dist/ (and next to src/ in the
 * workspace), so both resolve it the same way. Resolved on first use,
 * not at import: the Worker (worker/) bundles the JSON instead and never calls this.
 * The block files are not in it: data/sources/ keeps one file each, read on demand. */
let cache: YoujIndex | undefined

const dataDir = new URL('../data/', import.meta.url)

export function loadIndex(dir?: URL): YoujIndex {
  if (!dir && cache) return cache
  const base = dir ?? dataDir
  const index = Object.fromEntries(
    Object.entries(INDEX_FILES).map(([key, file]) => [key, JSON.parse(readFileSync(new URL(file, base), 'utf8'))]),
  ) as unknown as YoujIndex
  if (!dir) cache = index
  return index
}

/** The catalog over the local index, reading the app and the block files from disk. */
export const loadCatalog = (): Catalog => new Catalog(loadIndex(), localHost(dataDir))
