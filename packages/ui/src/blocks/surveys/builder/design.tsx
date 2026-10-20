'use client'

import { Field, FieldLabel } from '../../../components/ui/field'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { cn } from '../../../lib/utils'
import type { SurveyDesign } from '../question/data'
import { stretchedRadio } from '../question/shared'
import { ACCENTS, type SurveyBuilderCopy } from './data'

/* The survey's look: an accent (or the app's own), the corners its cards and
 * controls take, the typeface of its titles, and the layout its link opens
 * in. Each is a theme input, so every color stays readable in light and dark
 * and in every preset; the preview wears it as it changes. */

interface DesignPanelProps {
  design: SurveyDesign | undefined
  onChange: (design: SurveyDesign | undefined) => void
  copy: SurveyBuilderCopy
}

export function DesignPanel({ design, onChange, copy }: DesignPanelProps) {
  const set = (patch: Partial<SurveyDesign>) => {
    const next = { ...design, ...patch }
    const kept = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined && v !== '')) as SurveyDesign
    onChange(Object.keys(kept).length ? kept : undefined)
  }
  return (
    <div className="flex flex-col gap-5">
      <Field>
        <FieldLabel>{copy.accent}</FieldLabel>
        <RadioGroup
          aria-label={copy.accent}
          value={design?.accent ?? ''}
          onValueChange={(accent) => set({ accent: (accent as string) || undefined })}
          className="flex flex-wrap gap-2"
        >
          {ACCENTS.map((accent, i) => (
            <label
              key={accent || 'app'}
              className={cn(
                'relative grid size-8 cursor-pointer place-items-center rounded-full',
                'ring-offset-2 ring-offset-overlay has-data-checked:ring-2 has-data-checked:ring-fg',
              )}
            >
              <RadioGroupItem value={accent} aria-label={accent ? copy.accentLabel(i) : copy.accentInherit} className={stretchedRadio} />
              {/* The app's own accent: inside a ring, set apart from the swatches a survey can wear. */}
              <span
                aria-hidden
                className={cn(
                  'pointer-events-none size-full rounded-full',
                  accent ? 'border border-line-strong' : 'border border-dashed border-fg-subtle p-1',
                )}
                style={accent ? { backgroundColor: accent } : undefined}
              >
                {!accent && <span className="block size-full rounded-full bg-accent" />}
              </span>
            </label>
          ))}
        </RadioGroup>
      </Field>
      <Field>
        <FieldLabel>{copy.corners}</FieldLabel>
        <SegmentedControl
          variant="pill"
          aria-label={copy.corners}
          value={design?.corners ?? 'soft'}
          onValueChange={(corners) => set({ corners: corners === 'soft' ? undefined : (corners as SurveyDesign['corners']) })}
          className="w-full *:flex-1"
        >
          {(['sharp', 'soft', 'round'] as const).map((c) => (
            <SegmentedControlItem key={c} value={c}>
              {copy.cornerNames[c]}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </Field>
      <Field>
        <FieldLabel>{copy.font}</FieldLabel>
        <SegmentedControl
          variant="pill"
          aria-label={copy.font}
          value={design?.font ?? 'sans'}
          onValueChange={(font) => set({ font: font === 'sans' ? undefined : (font as SurveyDesign['font']) })}
          className="w-full *:flex-1"
        >
          {(['sans', 'serif', 'mono'] as const).map((f) => (
            <SegmentedControlItem key={f} value={f} className={f === 'serif' ? 'font-serif' : f === 'mono' ? 'font-mono' : undefined}>
              {copy.fontNames[f]}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </Field>
      <Field>
        <FieldLabel>{copy.layout}</FieldLabel>
        <SegmentedControl
          variant="pill"
          aria-label={copy.layout}
          value={design?.layout ?? 'conversational'}
          onValueChange={(layout) => set({ layout: layout === 'conversational' ? undefined : (layout as SurveyDesign['layout']) })}
          className="w-full *:flex-1"
        >
          {(['conversational', 'form', 'deck'] as const).map((l) => (
            <SegmentedControlItem key={l} value={l} className="px-2 text-ui-sm">
              {copy.layouts[l]}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </Field>
    </div>
  )
}
