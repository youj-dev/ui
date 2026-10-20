import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { IconNode } from '@/components/icons/static-svg'

let cache: Record<string, IconNode[]> | undefined

/** Every Youj icon at rest, rendered at build time by scripts/icon-svgs.ts. */
export function iconSvgs(): Record<string, IconNode[]> {
  cache ??= JSON.parse(readFileSync(join(process.cwd(), 'generated/icon-svgs.json'), 'utf8')) as Record<string, IconNode[]>
  return cache
}
