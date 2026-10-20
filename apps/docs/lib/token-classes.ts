import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROLES } from '@youj/core/lib/youj/theme'
import { ROLE_DOCS, ROLE_GROUPS } from './theme-roles'

/* Every class a theme drives, as plain names to copy: the roles' classes from
 * core's ROLES, and the corner, height, type and shadow classes from the
 * tokens ui.css declares. Read at build time, so the list can't drift from
 * the tokens; the theming page shows it as a static list and its Markdown
 * export carries the same. */

const UI_CSS = join(/*turbopackIgnore: true*/ process.cwd(), '../../packages/ui/src/styles/ui.css')

/** Tailwind's own steps, which ui.css re-tunes but doesn't add. */
const STOCK = new Set(['xs', 'sm', 'md', 'lg', 'xl', '2xl'])

export interface TokenClassGroup {
  group: string
  classes: string[]
}

let cache: TokenClassGroup[] | undefined

/** The groups, in order: the role groups, then corners, heights, type and shadows. */
export function tokenClasses(): TokenClassGroup[] {
  if (cache) return cache
  const tokens = [...readFileSync(UI_CSS, 'utf8').matchAll(/^\s*--(radius|spacing|text|shadow)-([a-z0-9-]+)\s*:/gm)].map(([, kind, name]) => ({ kind: kind!, name: name! }))
  const of = (kind: string, prefix: string, keep: (name: string) => boolean = () => true) => [
    ...new Set(tokens.filter((t) => t.kind === kind && keep(t.name) && !t.name.includes('--')).map((t) => `${prefix}-${t.name}`)),
  ]
  cache = [
    ...ROLE_GROUPS.map((group) => ({
      group,
      classes: ROLES.filter((role) => ROLE_DOCS[role].group === group && !ROLE_DOCS[role].utility.startsWith('(')).map((role) => ROLE_DOCS[role].utility),
    })),
    { group: 'Corners', classes: of('radius', 'rounded', (name) => !STOCK.has(name)) },
    { group: 'Control heights', classes: of('spacing', 'h', (name) => name.startsWith('control')) },
    { group: 'Interface type', classes: of('text', 'text', (name) => name.startsWith('ui')) },
    { group: 'Shadows', classes: of('shadow', 'shadow') },
  ]
  return cache
}

/** The list as Markdown, for the page's text export. */
export function tokenClassesMarkdown(): string {
  return tokenClasses()
    .map(({ group, classes }) => `- **${group}:** ${classes.map((name) => `\`${name}\``).join(' ')}`)
    .join('\n')
}
