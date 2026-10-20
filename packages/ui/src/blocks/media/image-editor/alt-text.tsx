'use client'

import { Field, FieldDescription, FieldLabel } from '../../../components/ui/field'
import { Textarea } from '../../../components/ui/textarea'
import type { ImageEditorCopy } from './data'

/* The image's alt text, with how much room is left and what good alt text
 * says. It's part of the edit, so Save hands it over with the image. */

const MAX = 250

export function AltText({
  value,
  disabled,
  copy,
  onChange,
}: {
  value: string
  disabled: boolean
  copy: ImageEditorCopy
  onChange: (alt: string) => void
}) {
  return (
    <Field className="border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel>{copy.alt}</FieldLabel>
        <span className="text-ui-sm text-fg-subtle tabular-nums">{copy.altCount(value.length, MAX)}</span>
      </div>
      <Textarea value={value} maxLength={MAX} rows={2} disabled={disabled} onChange={(event) => onChange(event.currentTarget.value)} />
      <FieldDescription>{copy.altHint}</FieldDescription>
    </Field>
  )
}
