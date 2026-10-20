'use client'

import { useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { DropletIcon } from '@youj/icons/components/youj/icons/droplet'
import { useComponentLabels, colorOpacityFieldLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { useControllableState } from '../../hooks/use-controllable-state'
import { ColorPicker } from './color-picker'
import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group'
import { ScrubNumberField } from './scrub-number-field'

/* One color and how opaque it is, as one grouped control: a swatch that opens
 * the kit's ColorPicker, a hex field and an opacity percentage you can drag.
 * The group carries the one label; the hex and opacity fields are named
 * "Hex color" and "Opacity" inside it.
 *
 * The hex field shows six digits without the "#" and reads what a designer
 * pastes: 3, 4, 6 or 8 digits, with or without the "#". A paste that parses
 * is applied at once; the 4- and 8-digit forms carry an alpha, which sets the
 * opacity. Typed text commits on Enter or blur, is marked invalid while it
 * isn't a color, and is put back on blur or Escape. The opacity is a
 * ScrubNumberField: drag its drop handle, type, or use the arrow keys. */

interface ColorOpacityValue {
  /** `#rrggbb`. */
  color: string
  /** 0 to 100. */
  opacity: number
}

/** Three, four, six or eight hex digits, with or without the hash: the color as `#rrggbb`, and the alpha (0 to 100) when the text carries one. */
function parseHex(text: string): { color: string; opacity?: number } | null {
  const m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(text.trim())
  if (!m) return null
  let h = m[1]!.toLowerCase()
  if (h.length <= 4) h = [...h].map((c) => c + c).join('')
  return { color: `#${h.slice(0, 6)}`, opacity: h.length === 8 ? Math.round((parseInt(h.slice(6), 16) / 255) * 100) : undefined }
}

interface ColorOpacityFieldProps {
  value?: ColorOpacityValue
  defaultValue?: ColorOpacityValue
  onValueChange?: (value: ColorOpacityValue) => void
  /** `sm` fits a dense panel. Default 'default'. */
  size?: 'sm' | 'default'
  disabled?: boolean
  /** Names the whole group. Default 'Color'. */
  'aria-label'?: string
  id?: string
  className?: string
}

function ColorOpacityField({
  value: valueProp,
  defaultValue = { color: '#000000', opacity: 100 }, // youj-allow: the default color of the field
  onValueChange,
  size = 'default',
  disabled,
  'aria-label': ariaLabel,
  id,
  className,
}: ColorOpacityFieldProps) {
  const labels = useComponentLabels(colorOpacityFieldLabels)
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const [draft, setDraft] = useState<string | null>(null)
  const invalid = draft !== null && parseHex(draft) === null
  const hex = value.color.replace('#', '').toUpperCase()

  const change = (patch: Partial<ColorOpacityValue>) => {
    const next = { ...value, ...patch }
    if (next.color === value.color && next.opacity === value.opacity) return
    setValue(next)
    onValueChange?.(next)
  }
  const apply = (text: string) => {
    const parsed = parseHex(text)
    if (parsed) change({ color: parsed.color, ...(parsed.opacity !== undefined && { opacity: parsed.opacity }) })
    return parsed !== null
  }
  const commit = () => {
    if (draft !== null) apply(draft)
    setDraft(null)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commit()
    if (event.key === 'Escape' && draft !== null) {
      event.stopPropagation()
      setDraft(null)
    }
  }
  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    if (apply(event.clipboardData.getData('text'))) {
      event.preventDefault()
      setDraft(null)
    }
  }

  return (
    <div
      id={id}
      role="group"
      data-slot="color-opacity-field"
      aria-label={ariaLabel ?? labels.colour}
      className={cn('own:flex w-full min-w-0 items-center gap-1.5', className)}
    >
      {/* shape: the compact field takes the theme's small control height and corner (h-control-sm, rounded-field-sm) */}
      <InputGroup role={undefined} className={cn('flex-1', size === 'sm' && 'own:h-control-sm own:rounded-field-sm')}>
        <InputGroupAddon className="own:ps-1.5 own:pe-0">
          <ColorPicker
            swatchOnly
            disabled={disabled}
            value={value.color}
            onValueChange={(color) => change({ color })}
            aria-label={labels.colour}
          />
        </InputGroupAddon>
        <InputGroupInput
          aria-label={labels.hexColour}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          maxLength={10}
          value={draft ?? hex}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={commit}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          className="own:ps-1.5 own:font-mono own:text-ui-sm own:uppercase"
        />
      </InputGroup>
      <ScrubNumberField
        aria-label={labels.opacity}
        label={<DropletIcon size={14} trigger="none" />}
        unit="%"
        min={0}
        max={100}
        step={1}
        size={size}
        disabled={disabled}
        value={value.opacity}
        onValueChange={(opacity) => change({ opacity })}
        className="w-24 shrink-0"
      />
    </div>
  )
}

export { ColorOpacityField, type ColorOpacityFieldProps, type ColorOpacityValue }
