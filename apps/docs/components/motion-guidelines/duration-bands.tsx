'use client'

import { motionPersonalities } from '@youj/core/lib/youj/tokens'
import { useYouj } from '@youj/core'
import { InlineCode } from '@/components/docs/inline-code'
import { bandMs, bandText, DURATION_BANDS } from '@/lib/motion-guidelines'

/* How long each kind of interaction takes, as a band on one time axis with
 * the five durations as gridlines: the short answers to input sit at the
 * start, the sheets and heroes further out, and nothing past `deliberate`.
 * Values are the tokens in effect, so a calm or lively theme redraws it. */

export function DurationBands() {
  const k = useYouj()
  const tokens = motionPersonalities[k.motionPersonality]
  const grid = Object.entries(tokens.durations) as [string, number][]
  const end = Math.ceil((tokens.durations.deliberate + 40) / 100) * 100
  const at = (ms: number) => `${(ms / end) * 100}%`

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-line">
      <table className="w-full border-collapse text-start">
        <caption className="sr-only">
          How long each kind of interaction takes, in the {k.motionPersonality} personality&apos;s tokens, and the curve it rides
        </caption>
        <thead className="bg-surface">
          <tr className="border-b border-line">
            <th scope="col" className="type-label px-4 py-2.5 text-start font-medium">
              Interaction
            </th>
            <th scope="col" className="type-label hidden px-4 py-2.5 text-start font-medium sm:table-cell">
              <span className="sr-only">Band</span>
              {/* The axis: the five durations, in milliseconds. */}
              <span aria-hidden className="relative block h-3 min-w-44">
                {grid.map(([name, ms]) => (
                  <span key={name} title={name} className="absolute top-0 -translate-x-1/2 font-mono text-[10px] tracking-normal text-fg-muted normal-case rtl:translate-x-1/2" style={{ insetInlineStart: at(ms) }}>
                    {ms}
                  </span>
                ))}
              </span>
            </th>
            <th scope="col" className="type-label px-4 py-2.5 text-start font-medium">
              Tokens and curve
            </th>
          </tr>
        </thead>
        <tbody>
          {DURATION_BANDS.map((row) => {
            const from = bandMs(row.band[0], tokens)
            const to = bandMs(row.band[1], tokens)
            return (
              <tr key={row.interaction} className="border-b border-line align-top last:border-b-0">
                <th scope="row" className="w-[34%] px-4 py-3 text-start text-[13.5px] font-medium text-fg sm:w-[26%]">
                  {row.interaction}
                  <span className="mt-0.5 block text-[12px] font-normal text-fg-muted">
                    <InlineCode text={row.examples} />
                  </span>
                  <span className="mt-1.5 block type-small text-fg sm:hidden">{bandText(row.band, tokens)}</span>
                </th>
                <td className="hidden w-[34%] px-4 py-3 sm:table-cell">
                  <span className="block type-small text-fg">{bandText(row.band, tokens)}</span>
                  <span aria-hidden className="relative mt-2 block h-3 min-w-44">
                    {grid.map(([name, ms]) => (
                      <span key={name} className="absolute inset-y-0 w-px bg-line" style={{ insetInlineStart: at(ms) }} />
                    ))}
                    <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
                    {from === to ? (
                      <span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent rtl:translate-x-1/2" style={{ insetInlineStart: at(from) }} />
                    ) : (
                      <span
                        className="absolute top-0.5 bottom-0.5 rounded-full bg-accent"
                        style={{ insetInlineStart: at(from), width: `calc(${at(to - from)} + 2px)` }}
                      />
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] leading-relaxed text-fg-muted">
                  <InlineCode text={row.tokens} />
                  <span className="mt-1 block text-[12px]">
                    Curve: <InlineCode text={row.curve} />
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
