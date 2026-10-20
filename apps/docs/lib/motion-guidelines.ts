/* The motion guidelines as data: the duration band for each kind of
 * interaction and the do/don't pairs. The guidelines page draws them, and
 * lib/markdown.ts writes the same rows as text for /llms.txt and the MCP
 * index, so the page and its Markdown can't disagree. Bands are named in
 * tokens and resolved against the tokens in effect, so they follow a theme's
 * motion personality. Plain data only: this runs in Node for the MCP index. */

export type BandToken = 'instant' | 'fast' | 'base' | 'slow' | 'deliberate' | 'snappy' | 'smooth' | 'settle'

export interface DurationBand {
  interaction: string
  examples: string
  /** How long, in tokens. Backticks render as code. */
  tokens: string
  /** The curve or spring. Backticks render as code. */
  curve: string
  /** The band's shortest and longest token; a spring counts its felt duration. */
  band: [BandToken, BandToken]
}

export const DURATION_BANDS: DurationBand[] = [
  { interaction: 'Press and hover', examples: 'buttons, rows, tints, focus rings', tokens: 'press in on `instant`, out on `fast`; hover `fast`', curve: '`standard`', band: ['instant', 'fast'] },
  { interaction: 'Toggle and select', examples: 'switches, checkboxes, tabs, segments', tokens: 'a thumb on `spring.snappy`; an indicator on `spring.smooth`', curve: 'spring, no overshoot', band: ['snappy', 'smooth'] },
  { interaction: 'Tooltip', examples: '`yj-tooltip`', tokens: 'in on `fast`, out on `instant`', curve: '`enter` in, `exit` out', band: ['instant', 'fast'] },
  { interaction: 'Menu and popover', examples: 'menus, selects, popovers: `yj-pop`', tokens: 'in on `fast`, out on `instant`', curve: '`enter` in, `exit` out', band: ['instant', 'fast'] },
  { interaction: 'Dialog and sheet', examples: '`yj-dialog`, `yj-sheet-*`, toasts', tokens: 'a dialog `base` in, `fast` out; a sheet or toast `slow` in', curve: '`enter` in, `exit` out', band: ['fast', 'slow'] },
  { interaction: 'List insert, remove, reorder', examples: 'PresenceList rows, cards', tokens: 'in on `base`, out on `fast`, moves on `spring.smooth`; `stagger.base` between', curve: '`enter`, `exit`, spring', band: ['fast', 'smooth'] },
  { interaction: 'Page and hero', examples: 'route changes, a landing reveal', tokens: '`slow` for a route, `deliberate` for a hero', curve: '`emphasized`', band: ['slow', 'deliberate'] },
  { interaction: 'Success and arrival', examples: 'a save lands, a task completes', tokens: '`spring.settle`', curve: 'the one overshoot', band: ['settle', 'settle'] },
]

export interface MotionTokenTable {
  durations: Record<string, number>
  springs: Record<string, { visualDuration: number; bounce: number }>
}

/** A band token in milliseconds: a duration as it is, a spring by how long it feels. */
export function bandMs(token: BandToken, tokens: MotionTokenTable): number {
  const spring = tokens.springs[token]
  return spring ? Math.round(spring.visualDuration * 1000) : tokens.durations[token]!
}

export function bandText([from, to]: [BandToken, BandToken], tokens: MotionTokenTable): string {
  const a = bandMs(from, tokens)
  const b = bandMs(to, tokens)
  return a === b ? `${a} ms` : `${a}–${b} ms`
}

export type DoDontId = 'origin' | 'only-changed' | 'hover' | 'reduced'

export interface DoDontPair {
  do: string
  dont: string
}

/** Captions for each live pair; the page's heading above it states the rule. */
export const DO_DONT: Record<DoDontId, DoDontPair> = {
  origin: { do: 'grows from its trigger: `yj-pop`, `fast` · `enter`', dont: 'grows from the middle of the page, 360 ms' },
  'only-changed': { do: 'the new row enters, the rest make room', dont: 'every row plays its entrance again' },
  hover: { do: 'the highlight is where the pointer is, on `fast`', dont: 'a 400 ms fade trails behind the pointer' },
  reduced: { do: 'reduced: the toast is simply there', dont: 'reduced: the toast still slides in' },
}

export function durationBandsMarkdown(tokens: MotionTokenTable): string {
  const rows = DURATION_BANDS.map((b) => `| ${b.interaction} (${b.examples}) | ${bandText(b.band, tokens)} | ${b.tokens} | ${b.curve} |`)
  return ['| Interaction | Band | Tokens | Curve |', '| --- | --- | --- | --- |', ...rows].join('\n')
}

export function doDontMarkdown(id: DoDontId): string {
  const pair = DO_DONT[id]
  return `- **Do:** ${pair.do}.\n- **Don't:** ${pair.dont}.`
}
