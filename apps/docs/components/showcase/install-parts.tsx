import { showcaseFiles } from '@/lib/code-files'
import { codeUrl } from '@/lib/code-url'
import { registryItems } from '@/lib/registry'
import type { ShowcaseEntry } from '@/lib/showcase'
import type { CodeFile, CodeInstall } from './code-panel'

/* The server pieces of a block's or example's page that need no gallery card: the Blocks docs pages (components/docs/block-stories) import these rather than ./parts, which would put the card, and the live previews it draws, in every docs page's JavaScript. */

export function viewUrl(entry: Pick<ShowcaseEntry, 'kind' | 'slug'>) {
  return `/view/${entry.kind}/${entry.slug}`
}

/**
 * A block's or example's files as `youj add` writes them: at their install
 * paths, imports on the app's aliases (`@/components/ui/button`), written by
 * scripts/showcase.ts through the registry build's own rewrite. The page gets
 * each file's path and length; the Code tab fetches a file's text when it
 * shows it (app/code, lib/code-load.ts).
 */
export function installedFiles(entry: Pick<ShowcaseEntry, 'kind' | 'slug'>): CodeFile[] {
  return (showcaseFiles()[`${entry.kind}/${entry.slug}`] ?? []).map((f) => ({
    path: f.path,
    lines: f.code.split('\n').length,
    src: codeUrl.item(entry.kind, entry.slug, f.path),
  }))
}

/** One `youj add` for every block a composition stacks. */
export function stackInstall(names: string[]): CodeInstall {
  return { command: `npx youj add ${names.join(' ')}`, deps: names }
}

/** The `youj add` command that copies in a registry item, and the items it brings. */
export function registryInstall(name: string | undefined): CodeInstall | undefined {
  const item = name ? registryItems().get(name) : undefined
  if (!item) return undefined
  return {
    command: `npx youj add ${name}`,
    deps: (item.registryDependencies ?? []).map((d) => d.replace(/^.*\/r\/|\.json$/g, '')),
  }
}
