import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ComponentDoc } from '@/scripts/props'

export type { ComponentDoc, PropDoc } from '@/scripts/props'

let cache: Record<string, ComponentDoc> | undefined

/** Props extracted at build time by scripts/props.ts. */
export function componentDocs(): Record<string, ComponentDoc> {
  cache ??= JSON.parse(readFileSync(join(process.cwd(), 'generated/props.json'), 'utf8')) as Record<string, ComponentDoc>
  return cache
}

export function componentDoc(name: string): ComponentDoc {
  const doc = componentDocs()[name]
  if (!doc) throw new Error(`No props extracted for "${name}". Is it exported from a component file? (pnpm -F docs generate)`)
  return doc
}

/** Component exports of a source file, e.g. `src/components/.../magnetic.tsx` → Magnetic, MagneticInner. */
export function componentsIn(path: string): string[] {
  return Object.values(componentDocs())
    .filter((doc) => doc.file.endsWith(`/${path}`) && !doc.name.endsWith('Props'))
    .map((doc) => doc.name)
}
