'use client'

import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '../../../components/ui/field'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { cn } from '../../../lib/utils'
import { PACKS, type SoundPackId, type SoundSettingsCopy } from './data'

/* The packs as choice cards: the whole card is the target, arrows move
 * between them (one tab stop). Each has a small signature, its loudness
 * over time as bars, so the four read apart before they're heard: glass
 * rings long, wood knocks and stops, felt swells, digital steps. The chosen
 * one's bars take the accent. Choosing is silent; Play below is how a pack
 * is heard. */

function Signature({ peaks, chosen }: { peaks: readonly number[]; chosen: boolean }) {
  return (
    <span aria-hidden className="flex h-8 items-end gap-0.5">
      {peaks.map((peak, i) => (
        <span
          key={i}
          style={{ height: `${Math.max(8, peak * 100)}%` }}
          className={cn('w-[3px] rounded-full transition-colors yj-duration-base ease-standard', chosen ? 'bg-accent' : 'bg-fg-subtle')}
        />
      ))}
    </span>
  )
}

export function PackPicker({ value, onChange, disabled, copy }: { value: SoundPackId; onChange: (pack: SoundPackId) => void; disabled: boolean; copy: SoundSettingsCopy }) {
  return (
    <RadioGroup
      aria-label={copy.packTitle}
      value={value}
      disabled={disabled}
      onValueChange={(next) => onChange(next as SoundPackId)}
      className="grid gap-2.5 sm:grid-cols-2"
    >
      {PACKS.map((pack) => (
        <FieldLabel key={pack.id} className="min-w-0">
          <Field orientation="horizontal" disabled={disabled} className="items-center gap-3">
            <Signature peaks={pack.signature} chosen={pack.id === value && !disabled} />
            <FieldContent className="min-w-0 gap-0.5">
              <FieldTitle className="text-ui font-medium">{copy.packs[pack.id].name}</FieldTitle>
              <FieldDescription className="text-ui-sm">{copy.packs[pack.id].detail}</FieldDescription>
            </FieldContent>
            <RadioGroupItem value={pack.id} className="ms-auto self-start" />
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  )
}
