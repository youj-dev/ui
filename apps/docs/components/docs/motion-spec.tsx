import { spring as springGenerator } from 'motion'
import {
  durations,
  easings,
  springs,
  staggers,
  type DurationToken,
  type EasingToken,
  type SpringToken,
  type StaggerToken,
} from '@youj/core/lib/youj/tokens'
import { InlineCode } from './inline-code'
import { ScrollFrame } from './scroll-table'

export interface MotionSpecRow {
  /** The moment that moves, e.g. "Enter" or "Indicator". */
  moment: string
  duration?: DurationToken
  ease?: EasingToken
  spring?: SpringToken
  stagger?: StaggerToken
  /** Timing that isn't a token, e.g. a shader clock. */
  value?: string
  /** What moves, e.g. "opacity, translate". Backticks render as code. */
  note?: string
}

const W = 44
const H = 24
const PAD = 3

/** The easing curve, time along x, progress up y. */
function EaseGlyph({ ease }: { ease: EasingToken }) {
  const [x1, y1, x2, y2] = easings[ease]
  const px = (x: number) => PAD + x * (W - PAD * 2)
  const py = (y: number) => H - PAD - y * (H - PAD * 2)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden className="shrink-0 overflow-visible">
      <path d={`M${px(0)} ${py(1)}H${px(1)}`} className="stroke-line" strokeWidth={1} strokeDasharray="2 2" fill="none" />
      <path d={`M${px(0)} ${py(0)}C${px(x1)} ${py(y1)} ${px(x2)} ${py(y2)} ${px(1)} ${py(1)}`} className="stroke-accent" strokeWidth={1.5} fill="none" />
    </svg>
  )
}

/** The spring's response, sampled from Motion's own solver, so overshoot shows exactly as it plays. */
function SpringGlyph({ token }: { token: SpringToken }) {
  const { visualDuration, bounce } = springs[token]
  const gen = springGenerator({ keyframes: [0, 1], visualDuration, bounce })
  const span = visualDuration * 1000 * 1.8
  const top = 1.12
  const points = Array.from({ length: 41 }, (_, i) => {
    const t = (i / 40) * span
    const value = gen.next(t).value as number
    return `${(PAD + (i / 40) * (W - PAD * 2)).toFixed(2)},${(H - PAD - (value / top) * (H - PAD * 2)).toFixed(2)}`
  })
  const target = H - PAD - (1 / top) * (H - PAD * 2)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden className="shrink-0 overflow-visible">
      <path d={`M${PAD} ${target}H${W - PAD}`} className="stroke-line" strokeWidth={1} strokeDasharray="2 2" fill="none" />
      <polyline points={points.join(' ')} className="stroke-accent" strokeWidth={1.5} fill="none" strokeLinejoin="round" />
    </svg>
  )
}

function Token({ children }: { children: string }) {
  return <code className="token-chip">{children}</code>
}

function describe(row: MotionSpecRow) {
  const tokens: string[] = []
  const values: string[] = []
  if (row.duration) {
    tokens.push(`duration.${row.duration}`)
    values.push(`${durations[row.duration]}ms`)
  }
  if (row.ease) {
    tokens.push(`ease.${row.ease}`)
    values.push(`cubic-bezier(${easings[row.ease].join(', ')})`)
  }
  if (row.spring) {
    const { visualDuration, bounce } = springs[row.spring]
    tokens.push(`spring.${row.spring}`)
    values.push(`${visualDuration}s, bounce ${bounce}`)
  }
  if (row.stagger) {
    tokens.push(`stagger.${row.stagger}`)
    values.push(`${staggers[row.stagger]}ms step`)
  }
  if (row.value) values.push(row.value)
  return { tokens, values }
}

/**
 * The motion tokens an item uses and what it does under reduced motion.
 * Values are read from the token source, so the table can't drift from the code.
 */
export function MotionSpec({ rows, reduced }: { rows: MotionSpecRow[]; reduced: string }) {
  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-line">
      <ScrollFrame label="Motion tokens, scrolls sideways" className="outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
        {/* Below sm the rows stack, as a props table's do (props-table.tsx). */}
        <table className="w-full border-collapse text-start max-sm:block">
          <caption className="sr-only">Motion tokens</caption>
          <thead className="bg-surface max-sm:sr-only">
            <tr className="border-b border-line">
              <th scope="col" className="type-label px-4 py-2.5 text-start font-medium">
                Moment
              </th>
              <th scope="col" className="type-label px-4 py-2.5 text-start font-medium">
                Tokens
              </th>
              <th scope="col" className="type-label hidden px-4 py-2.5 text-start font-medium md:table-cell">
                Value
              </th>
              {/* The curve is a picture of the values beside it; a phone keeps the words. */}
              <th scope="col" className="type-label hidden w-[76px] px-4 py-2.5 text-start font-medium sm:table-cell">
                <span className="sr-only">Curve</span>
              </th>
            </tr>
          </thead>
          <tbody className="max-sm:block">
            {rows.map((row) => {
              const { tokens, values } = describe(row)
              return (
                <tr key={row.moment} className="spec-row max-sm:block max-sm:px-4 max-sm:py-3">
                  <th scope="row" className="spec-moment max-sm:block max-sm:p-0">
                    {row.moment}
                    {row.note && (
                      <span className="spec-note">
                        <InlineCode text={row.note} />
                      </span>
                    )}
                  </th>
                  <td className="px-4 py-3 max-sm:mt-2 max-sm:block max-sm:p-0">
                    <div className="flex flex-wrap gap-1">
                      {tokens.length ? tokens.map((t) => <Token key={t}>{t}</Token>) : <span className="text-[13px] text-fg-muted">no token</span>}
                    </div>
                    <p className="spec-values-inline">{values.join(' · ')}</p>
                  </td>
                  <td className="spec-values">
                    {values.map((v, i) => (
                      <span key={v} className={i === 0 ? 'spec-value text-fg' : 'spec-value text-fg-muted'}>
                        {v}
                      </span>
                    ))}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {row.ease ? <EaseGlyph ease={row.ease} /> : row.spring ? <SpringGlyph token={row.spring} /> : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </ScrollFrame>
      {/* Outside the scroller, so the sentence wraps to the frame and never needs scrolling to read. */}
      <div className="flex flex-col gap-1 border-t border-line bg-surface px-4 py-3 text-[13.5px] leading-relaxed sm:flex-row sm:gap-6">
        <p className="inline-flex shrink-0 items-center gap-2 self-start font-medium whitespace-nowrap text-fg sm:leading-relaxed">
          <span aria-hidden className="size-1.5 rounded-[1px] bg-warning" />
          Reduced motion
        </p>
        <p className="min-w-0 text-fg-muted">
          <InlineCode text={reduced} />
        </p>
      </div>
    </div>
  )
}
