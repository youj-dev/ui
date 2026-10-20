// A block's files as `youj add` writes them into an app, for the
// showcase's Code tab and its .zip: each at its install path (`blocks/app/billing.tsx`)
// with its imports on the app's aliases (`@/components/ui/button`, `@/lib/utils`)
// and its own files importing each other relatively,
// through the same rewrite the registry build applies to the items it serves.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { installedSource } from '../../../packages/ui/scripts/app-imports.mjs'
import { motionEntries } from '../../../packages/ui/scripts/motion-exports.mjs'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url))
const UI = 'packages/ui/'

export interface InstalledFile {
  /** Where it lands in an app: `blocks/app/billing.tsx`. */
  path: string
  code: string
}

let entries: ReturnType<typeof motionEntries> | undefined

/** @param files source paths from the repository root: `packages/ui/src/blocks/app/billing.tsx` */
export function installedFiles(files: string[]): InstalledFile[] {
  entries ??= motionEntries()
  const own = files.map((file) => file.slice(UI.length))
  return own.map((path) => ({ path: path.replace(/^src\//, ''), code: installedSource(readFileSync(join(ROOT, UI, path), 'utf8'), path, entries!, own).trimEnd() }))
}
