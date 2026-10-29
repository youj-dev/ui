import type { ComponentDoc, MotionRow, Stability } from './types'
import { durations, easings, springs, staggers } from '@youj/core/lib/youj/tokens'

/* Output helpers. Tool results are Markdown written for a model's context:
 * short sections, code fenced, nothing repeated, long things capped. */

/** An install command in the npm form: package-manager neutral (`pnpm add x` becomes `npm install x`). */
export const npmForm = (command: string) => command.replace(/\bpnpm add\b/g, 'npm install')

export const code = (lang: string, text: string) => `\`\`\`${lang}\n${text.replace(/\n+$/, '')}\n\`\`\``

/** At most `max` characters, cut at a line break when there's one near the end. */
export function cap(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.lastIndexOf('\n', max)
  return `${text.slice(0, cut > max * 0.6 ? cut : max).trimEnd()}\n…`
}

const STABILITY_NOTE: Record<Stability, string> = {
  stable: 'settled API; a breaking change comes only after a release that deprecates it',
  alpha: 'the default while Youj is in alpha; its API may change in a 0.x minor release, with a migration note in the changelog',
  experimental: 'may change or go in any minor release without a deprecation first; pin the version',
}

/** "Stability: alpha (…)", linking the policy. */
export const stabilityLine = (stability: Stability, site: string) => `Stability: **${stability}** (${STABILITY_NOTE[stability]}; ${site}/docs/versioning#stability-labels).`

/** A table cell's text: each pipe escaped, and the backslashes before it doubled so they can't escape the escape (`\|` would end the cell). */
const cell = (text: string) => text.replace(/(\\*)\|/g, '$1$1\\|').replace(/\s*\n\s*/g, ' ')

export function propsTable(doc: ComponentDoc): string {
  const out: string[] = []
  if (doc.props.length) {
    out.push('| Prop | Type | Default | Description |', '| --- | --- | --- | --- |')
    for (const p of doc.props) {
      const type = p.values ? p.values.join(' | ') : p.type
      out.push(`| ${p.name}${p.required ? '*' : ''} | \`${cell(type)}\` | ${p.default ? `\`${cell(p.default)}\`` : ''} | ${cell([p.deprecated && `**Deprecated:** ${p.deprecated}`, p.description].filter(Boolean).join(' '))} |`)
    }
  }
  if (doc.extends?.length) out.push(`${out.length ? '\n' : ''}${doc.props.length ? 'Also takes' : 'Takes'} the props of ${doc.extends.map((e) => `\`${e}\``).join(', ')}.`)
  return out.join('\n') || 'No props of its own.'
}

/** One line per moment: "Press: duration.instant (80ms), ease.standard — scales to 0.97 while held". */
export function motionLines(rows: MotionRow[]): string {
  return rows
    .map((row) => {
      const parts: string[] = []
      if (row.duration) parts.push(`duration.${row.duration} (${durations[row.duration as keyof typeof durations] ?? '?'}ms)`)
      if (row.ease) parts.push(`ease.${row.ease}${easings[row.ease as keyof typeof easings] ? '' : '?'}`)
      if (row.spring) parts.push(`spring.${row.spring}${springs[row.spring as keyof typeof springs] ? '' : '?'}`)
      if (row.stagger) parts.push(`stagger.${row.stagger} (${staggers[row.stagger as keyof typeof staggers] ?? '?'}ms)`)
      if (row.value) parts.push(row.value)
      return `- ${row.moment}: ${parts.join(', ')}${row.note ? ` — ${row.note}` : ''}`
    })
    .join('\n')
}

export const kebab = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

export class NotFound extends Error {}
