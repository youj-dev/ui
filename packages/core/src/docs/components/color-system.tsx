import { useEffect, useRef, useState, type RefObject } from 'react'
import { grade, type ContrastGrade } from '../lib/color'
import { contrast, formatOklch, linearToOklch, parseColor, toHex, type LinearRgb } from '../../lib/youj/theme/color'
import { cn } from '../../lib/youj/cn'
import { Mono, Panel, useThemeKey } from './kit'

/* Live swatches: the tokens are derived in CSS from the theme contract, so
 * each value is resolved by the browser (through a probe element) and read
 * back. The page always shows what the current theme and preset resolve to. */

const BG = { canvas: 'bg-canvas', surface: 'bg-surface', well: 'bg-well' } as const
const TEXT = {
  fg: 'text-fg',
  'fg-muted': 'text-fg-muted',
  'fg-subtle': 'text-fg-subtle',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
} as const
const FILL = {
  canvas: 'bg-canvas',
  surface: 'bg-surface',
  well: 'bg-well',
  line: 'bg-line',
  'line-strong': 'bg-line-strong',
  fg: 'bg-fg',
  'fg-muted': 'bg-fg-muted',
  'fg-subtle': 'bg-fg-subtle',
  accent: 'bg-accent',
  'accent-contrast': 'bg-on-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const
type Token = keyof typeof FILL

const GROUPS: { title: string; note: string; tokens: Token[] }[] = [
  { title: 'Surfaces', note: 'Canvas is the page, surface holds content, and a well is sunk into it: a track, a rail, an empty box.', tokens: ['canvas', 'surface', 'well'] },
  { title: 'Lines', note: 'Hairlines for structure; line-strong for control outlines and plot frames.', tokens: ['line', 'line-strong'] },
  {
    title: 'Text',
    note: 'fg for content, fg-muted for supporting copy, fg-subtle for metadata. All three read at 4.5:1 or better on every surface.',
    tokens: ['fg', 'fg-muted', 'fg-subtle'],
  },
  { title: 'Accent', note: 'One electric ultramarine. Primary actions, focus rings, the moving thing. Use it sparingly.', tokens: ['accent', 'accent-contrast'] },
  { title: 'Semantic', note: 'Tuned to the accent’s lightness and chroma so status never outshouts it.', tokens: ['success', 'warning', 'danger'] },
]

type Values = Partial<Record<Token, LinearRgb>>

function useTokenValues(ref: RefObject<HTMLElement | null>) {
  const themeKey = useThemeKey()
  const [values, setValues] = useState<Values>({})
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const probe = document.createElement('span')
    probe.hidden = true
    el.appendChild(probe)
    const next: Values = {}
    for (const t of Object.keys(FILL) as Token[]) {
      probe.style.color = `var(--color-${t})`
      const rgb = parseColor(getComputedStyle(probe).color)
      if (rgb) next[t] = rgb
    }
    probe.remove()
    setValues(next)
  }, [ref, themeKey])
  return values
}

const gradeTone: Record<ContrastGrade, string> = {
  // Text in each tone's "ink" (a fifth of fg mixed back in): the plain tone on its
  // own tint drops under 4.5:1 in the light theme.
  AAA: 'text-[color-mix(in_oklab,var(--color-success)_80%,var(--color-fg))] bg-success-subtle ring-success-line',
  AA: 'text-[color-mix(in_oklab,var(--color-success)_80%,var(--color-fg))] bg-success-subtle ring-success-line',
  'AA Large': 'text-[color-mix(in_oklab,var(--color-warning)_80%,var(--color-fg))] bg-warning-subtle ring-warning-line',
  Fail: 'text-[color-mix(in_oklab,var(--color-danger)_80%,var(--color-fg))] bg-danger-subtle ring-danger-line',
}

export function ContrastBadge({ ratio }: { ratio: number }) {
  const g = grade(ratio)
  return (
    <span className={cn('inline-flex h-5 items-center gap-1 rounded-full px-1.5 font-mono text-[10.5px] font-medium ring-1 ring-inset', gradeTone[g])}>
      {ratio.toFixed(2)}
      <span className="font-sans font-semibold">{g}</span>
    </span>
  )
}

function ratioOf(values: Values, a: Token, b: Token) {
  const x = values[a]
  const y = values[b]
  return x && y ? contrast(x, y) : null
}

function Swatch({ token, values }: { token: Token; values: Values }) {
  const rgb = values[token] ?? null
  const raw = rgb ? formatOklch(linearToOklch(rgb)) : null
  const pairs: [string, number | null][] =
    token === 'accent'
      ? [['text on accent', ratioOf(values, 'accent-contrast', 'accent')], ['as text on canvas', ratioOf(values, 'accent', 'canvas')]]
      : token === 'accent-contrast'
        ? [['on accent', ratioOf(values, 'accent-contrast', 'accent')]]
        : token in TEXT
          ? [['on canvas', ratioOf(values, token, 'canvas')], ['on surface', ratioOf(values, token, 'surface')]]
          : []

  return (
    <Panel className="flex flex-col overflow-hidden">
      <div className={cn('relative h-24 border-b border-line', FILL[token])}>
        {token === 'accent' && (
          <span className="absolute bottom-3 left-3 text-[20px] font-semibold tracking-tight text-on-accent">Aa</span>
        )}
        {token === 'accent-contrast' && (
          <span className="absolute inset-3 grid place-items-center rounded-md bg-accent text-[20px] font-semibold tracking-tight text-on-accent">
            Aa
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13.5px] font-semibold tracking-tight text-fg">{token}</span>
          <Mono className="text-[11px]">{rgb ? toHex(rgb) : ''}</Mono>
        </div>
        <Mono className="truncate text-[11px] text-fg-muted">{raw || '…'}</Mono>
        {pairs.length > 0 && (
          <div className="mt-auto flex flex-col gap-1.5 pt-1">
            {pairs.map(([label, r]) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] text-fg-muted">{label}</span>
                {r !== null && <ContrastBadge ratio={r} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  )
}

export function ColorSwatches() {
  const ref = useRef<HTMLDivElement>(null)
  const values = useTokenValues(ref)
  return (
    <div ref={ref} className="flex flex-col gap-8">
      {GROUPS.map((g) => (
        <section key={g.title} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-[15px] font-semibold tracking-tight text-fg">{g.title}</h3>
            <p className="max-w-prose text-[13px] text-fg-muted">{g.note}</p>
          </div>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
            {g.tokens.map((t) => (
              <Swatch key={t} token={t} values={values} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/** Every text color on every surface, measured live. */
export function ContrastMatrix() {
  const ref = useRef<HTMLDivElement>(null)
  const values = useTokenValues(ref)
  const bgs = Object.keys(BG) as (keyof typeof BG)[]
  const fgs = Object.keys(TEXT) as (keyof typeof TEXT)[]
  return (
    <div ref={ref}>
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-fg-muted">Text \ Surface</th>
              {bgs.map((b) => (
                <th key={b} className="px-4 py-3 text-[12px] font-semibold text-fg">
                  {b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fgs.map((f) => (
              <tr key={f} className="border-t border-line">
                <th scope="row" className="px-4 py-2 font-mono text-[12px] font-normal text-fg-muted">
                  {f}
                </th>
                {bgs.map((b) => {
                  const r = ratioOf(values, f, b)
                  return (
                    <td key={b} className="p-1.5">
                      <div className={cn('flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2', BG[b])}>
                        {/* A sample of the pair, not content: the headers and the badge say what it shows. */}
                        <span aria-hidden className={cn('text-[24px] leading-none font-semibold tracking-tight', TEXT[f])}>
                          Aa
                        </span>
                        {r !== null && <ContrastBadge ratio={r} />}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
