import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The live example that stands for the page at `href`: its main demo,
 * `examples/<last segment>/demo.tsx` (or `<folder>-<last segment>/demo.tsx`
 * when two sections share the name), when the docs have one. Read at build
 * time, so a page gains its picture the moment its demo exists.
 */
export function exampleFor(href: string | undefined): string | undefined {
  const segments = href?.split(/[?#]/)[0]?.split('/').filter(Boolean) ?? []
  const slug = segments.at(-1)
  if (!slug || !href?.startsWith('/docs/')) return undefined
  // A name two sections share is prefixed by its folder: /docs/components/chat/empty-state → chat-empty-state/demo.
  const names = [`${segments.at(-2)}-${slug}/demo`, `${slug}/demo`]
  return names.find((name) => existsSync(join(process.cwd(), 'examples', `${name}.tsx`)))
}
