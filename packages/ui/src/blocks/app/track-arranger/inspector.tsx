'use client'

import type { CSSProperties, ElementType } from 'react'
import type { TimelineClip, TimelineTrack } from '../../../components/ui/track-timeline'
import { formatClipTime } from '../../../components/ui/track-timeline'
import { Field, FieldLabel } from '../../../components/ui/field'
import { NumberInput } from '../../../components/ui/number-input'
import { Slider } from '../../../components/ui/slider'
import { Eyebrow } from '../../../components/ui/typography'
import { GAIN, type TrackArrangerCopy } from './data'
import { numberFormat } from '../../../lib/utils'

interface InspectorProps {
  clip: TimelineClip | undefined
  track: TimelineTrack | undefined
  /** The track's place, for its color. */
  index: number
  length: number
  copy: TrackArrangerCopy
  SectionTitle: ElementType
  titleId: string
  onTrim: (edge: 'start' | 'end', to: number) => void
  onGain: (db: number) => void
}

/** The selected clip: where it starts and ends, to the tenth of a second, and its gain on a fader. */
function Inspector({ clip, track, index, length, copy, SectionTitle, titleId, onTrim, onGain }: InspectorProps) {
  const tenths = { minimumFractionDigits: 1, maximumFractionDigits: 1 }
  const db = numberFormat(copy.locale, { ...tenths, signDisplay: 'exceptZero' })
  const gain = clip?.gain ?? 0

  return (
    <section aria-labelledby={titleId} data-slot="track-arranger-inspector" className="flex flex-col gap-4" style={{ '--track': `var(--color-chart-${track?.color ?? (index % 5) + 1})` } as CSSProperties}>
      <div className="flex min-w-0 items-baseline gap-3">
        <SectionTitle id={titleId} className="shrink-0">
          <Eyebrow>{copy.inspector}</Eyebrow>
        </SectionTitle>
        {clip && track ? (
          <p className="flex min-w-0 items-center gap-2 truncate text-ui-lg text-fg">
            <span aria-hidden className="size-2 shrink-0 rounded-full bg-(--track)" />
            <span className="truncate font-mono">{clip.name}</span>
            <span className="truncate text-ui-sm text-fg-muted">{copy.onTrack(track.name)}</span>
          </p>
        ) : (
          <p className="truncate text-ui-sm text-fg-muted">{copy.none}</p>
        )}
      </div>

      {clip && (
        <div className="grid grid-cols-2 items-end gap-x-4 gap-y-4 sm:grid-cols-[repeat(2,minmax(0,--spacing(36)))_minmax(0,1fr)_auto]">
          <Field>
            <FieldLabel>{copy.start}</FieldLabel>
            <NumberInput value={clip.start} onValueChange={(v) => v !== null && onTrim('start', v)} min={0} max={length} step={0.1} largeStep={1} format={tenths} locale={copy.locale} unit={copy.seconds} />
          </Field>
          <Field>
            <FieldLabel>{copy.end}</FieldLabel>
            <NumberInput value={clip.end} onValueChange={(v) => v !== null && onTrim('end', v)} min={0} max={length} step={0.1} largeStep={1} format={tenths} locale={copy.locale} unit={copy.seconds} />
          </Field>
          <div className="col-span-2 flex min-w-0 flex-col gap-2 sm:col-span-1">
            <div className="flex items-baseline justify-between gap-3">
              <Eyebrow aria-hidden>{copy.gain}</Eyebrow>
              <span aria-hidden data-slot="track-arranger-gain" className="font-mono text-ui-sm text-fg tabular-nums">
                {copy.decibels(db.format(gain))}
              </span>
            </div>
            <Slider
              aria-label={copy.gain}
              min={GAIN.min}
              max={GAIN.max}
              step={GAIN.step}
              value={[gain]}
              onValueChange={(v) => onGain(Array.isArray(v) ? v[0]! : (v as number))}
              getAriaValueText={(_, v) => copy.decibels(db.format(v))}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1 sm:col-span-1 sm:items-end">
            <Eyebrow>{copy.length}</Eyebrow>
            <span data-slot="track-arranger-length" className="font-mono text-ui-lg text-fg tabular-nums">
              {formatClipTime(clip.end - clip.start, copy.locale)}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}

export { Inspector }
