import type { CSSProperties, ElementType } from 'react'
import { cn } from '../../../lib/utils'
import type { Clip, Lane, Session, MusicStudioCopy } from './data'

/* The song as lanes of clips under a ruler of bars: section names ride the
 * ruler (the one playing lit), each clip is a tinted block in its lane's
 * chart color with its waveform and name, and the grid under the clips
 * follows the snap (a line every beat, eighth or sixteenth, bars stronger).
 * The playhead is a hairline in ink across every lane. A search dims the
 * clips it doesn't match. On a phone the lanes scroll sideways under their
 * names. The lanes are a list, each clip a line of text, so the arrangement
 * reads in order without the picture. */

interface ArrangementProps {
  session: Session
  beat: number
  section: number
  /** Grid lines per bar: 4, 8 or 16. */
  snap: number
  query: string
  copy: MusicStudioCopy
  Heading: ElementType
  headingId: string
}

const matches = (lane: Lane, clip: Clip, q: string) => !q || clip.name.toLowerCase().includes(q) || lane.name.toLowerCase().includes(q)

/** A clip's waveform: bars whose heights come from its place in the song, so it's the same on every render. */
function Wave({ seed, count, spiky }: { seed: number; count: number; spiky: boolean }) {
  const bars = Array.from({ length: count }, (_, i) => {
    const v = Math.abs(Math.sin(i * 1.9 + seed) * Math.cos(i * 0.47 + seed * 1.3))
    return spiky ? 0.18 + 0.82 * v ** 2 : 0.3 + 0.55 * v
  })
  return (
    <svg aria-hidden viewBox={`0 0 ${count * 3} 20`} preserveAspectRatio="none" className="absolute inset-x-1.5 top-[55%] h-[52%] -translate-y-1/2 opacity-70">
      {bars.map((h, i) => (
        <rect key={i} x={i * 3} y={10 - h * 10} width="1.4" height={h * 20} rx="0.7" fill="var(--clip)" />
      ))}
    </svg>
  )
}

function Arrangement({ session, beat, section, snap, query, copy, Heading, headingId }: ArrangementProps) {
  const q = query.trim().toLowerCase()
  const span = (from: number, to: number) => ({ insetInlineStart: `${((from - 1) / session.bars) * 100}%`, width: `${((to - from + 1) / session.bars) * 100}%` })
  const at = Math.min(100, (beat / (session.bars * session.meter)) * 100)
  const grid = {
    backgroundImage: [
      `repeating-linear-gradient(to right, color-mix(in oklab, var(--color-fg) 11%, transparent) 0 1px, transparent 1px calc(100% / ${session.bars}))`,
      `repeating-linear-gradient(to right, color-mix(in oklab, var(--color-fg) 4.5%, transparent) 0 1px, transparent 1px calc(100% / ${session.bars * snap}))`,
    ].join(', '),
  }

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <Heading id={headingId} className="sr-only">
        {copy.arrangement}
      </Heading>
      <div data-slot="studio-arrangement" className="yj-scrollbar overflow-x-auto pb-2 [--lane-head:--spacing(22)]">
        <div className="relative min-w-184">
          {/* The ruler: section names over their first bar, and every fourth bar's number. */}
          <div aria-hidden className="relative ms-(--lane-head) h-11 border-b border-line">
            {session.sections.map((s, i) => (
              <span
                key={s.name}
                data-slot="studio-section"
                data-current={i === section || undefined}
                className="absolute top-1 font-mono text-ui-xs tracking-wide text-fg-muted uppercase transition-[color] yj-duration-fast ease-standard data-current:text-fg"
                style={{ insetInlineStart: `${((s.start - 1) / session.bars) * 100}%` }}
              >
                <span className={cn('me-1.5 inline-block size-1.5 rounded-full bg-current align-middle', i !== section && 'opacity-40')} />
                {s.name}
              </span>
            ))}
            {Array.from({ length: session.bars / 4 }, (_, i) => 1 + i * 4).map((bar) => (
              <span key={bar} className="absolute bottom-1 font-mono text-ui-xs text-fg-muted tabular-nums" style={{ insetInlineStart: `${((bar - 1) / session.bars) * 100}%` }}>
                {bar}
              </span>
            ))}
          </div>

          <ol aria-labelledby={headingId} className="mt-2 flex flex-col gap-1.5">
            {session.lanes.map((lane, l) => (
              <li key={lane.id} className="grid grid-cols-[var(--lane-head)_minmax(0,1fr)] items-stretch">
                <span className="sticky start-0 z-10 flex items-center gap-2 bg-canvas pe-3 text-ui-sm font-medium text-fg">
                  <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: `var(--color-chart-${lane.tone})` }} />
                  {lane.name}
                </span>
                <ul aria-label={lane.name} className="relative h-[clamp(3.5rem,10.5dvh,6.5rem)] overflow-hidden rounded-lg bg-transparent" style={grid}>
                  {lane.clips.map((clip, c) => (
                    <li
                      key={clip.name}
                      data-slot="studio-clip"
                      data-dim={!matches(lane, clip, q) || undefined}
                      className="absolute inset-y-1 overflow-hidden rounded-md border transition-[opacity] yj-duration-base ease-standard data-dim:opacity-25"
                      style={
                        {
                          ...span(clip.from, clip.to),
                          '--clip': `var(--color-chart-${lane.tone})`,
                          backgroundColor: 'color-mix(in oklab, var(--clip) 14%, var(--color-surface))',
                          borderColor: 'color-mix(in oklab, var(--clip) 42%, transparent)',
                        } as CSSProperties
                      }
                    >
                      <Wave seed={l * 7 + c * 3 + 1} count={(clip.to - clip.from + 1) * 5} spiky={lane.id === 'drums' || lane.id === 'vox'} />
                      <span className="relative block truncate px-2 pt-1 text-ui-xs font-medium text-fg">
                        {clip.name}
                        <span className="sr-only">, {copy.bar(clip.from)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          {/* The playhead, across the ruler and every lane. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 start-(--lane-head) end-0">
            <div data-slot="studio-playhead" className="absolute inset-y-0 w-px -translate-x-1/2 bg-fg rtl:translate-x-1/2" style={{ insetInlineStart: `${at}%` }}>
              <span className="absolute -top-0.5 left-1/2 size-2 -translate-x-1/2 rotate-45 rounded-[2px] bg-fg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { Arrangement }
