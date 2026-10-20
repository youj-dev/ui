'use client'

import { useId, useLayoutEffect, useRef, useState, type ChangeEvent, type ClipboardEvent } from 'react'
import { useComponentLabels } from '@youj/core/labels'
import { phoneInputLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from './input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

/* A phone number: a country Select (flag, typeahead by name) and the national
 * number, formatted as you type from a per-country pattern. The value is
 * E.164 (`+14155550123`); a pasted or typed international number (+44 20…)
 * switches the country itself. The caret stays after the digit you typed,
 * whatever punctuation the pattern adds, and Backspace over a space or dash
 * deletes the digit before it. Formatting is deliberately small (a pattern
 * per country, no carrier rules): for strict validation, check on the server
 * or bring libphonenumber-js. */

interface PhoneCountry {
  /** ISO 3166-1 alpha-2, e.g. 'GB'. The flag is derived from it. */
  code: string
  name: string
  /** Calling code without '+', e.g. '44'. */
  dial: string
  /** National format, '#' per digit, e.g. '#### ######'. */
  pattern: string
}

const c = (code: string, name: string, dial: string, pattern: string): PhoneCountry => ({ code, name, dial, pattern })

/** A starter set of countries; pass your own `countries` for more. */
const PHONE_COUNTRIES: PhoneCountry[] = [
  c('AR', 'Argentina', '54', '## ####-####'),
  c('AU', 'Australia', '61', '### ### ###'),
  c('AT', 'Austria', '43', '### ######'),
  c('BD', 'Bangladesh', '880', '####-######'),
  c('BE', 'Belgium', '32', '### ## ## ##'),
  c('BR', 'Brazil', '55', '(##) #####-####'),
  c('CA', 'Canada', '1', '(###) ###-####'),
  c('CL', 'Chile', '56', '# #### ####'),
  c('CN', 'China', '86', '### #### ####'),
  c('CO', 'Colombia', '57', '### #######'),
  c('CZ', 'Czechia', '420', '### ### ###'),
  c('DK', 'Denmark', '45', '## ## ## ##'),
  c('EG', 'Egypt', '20', '### ### ####'),
  c('FI', 'Finland', '358', '## ### ####'),
  c('FR', 'France', '33', '# ## ## ## ##'),
  c('DE', 'Germany', '49', '### ########'),
  c('GR', 'Greece', '30', '### ### ####'),
  c('HK', 'Hong Kong', '852', '#### ####'),
  c('IN', 'India', '91', '#####-#####'),
  c('ID', 'Indonesia', '62', '###-###-####'),
  c('IE', 'Ireland', '353', '## ### ####'),
  c('IL', 'Israel', '972', '##-###-####'),
  c('IT', 'Italy', '39', '### ### ####'),
  c('JP', 'Japan', '81', '##-####-####'),
  c('KE', 'Kenya', '254', '### ######'),
  c('MY', 'Malaysia', '60', '##-### ####'),
  c('MX', 'Mexico', '52', '## #### ####'),
  c('NL', 'Netherlands', '31', '# ########'),
  c('NZ', 'New Zealand', '64', '## ### ####'),
  c('NG', 'Nigeria', '234', '### ### ####'),
  c('NO', 'Norway', '47', '### ## ###'),
  c('PK', 'Pakistan', '92', '### #######'),
  c('PE', 'Peru', '51', '### ### ###'),
  c('PH', 'Philippines', '63', '### ### ####'),
  c('PL', 'Poland', '48', '### ### ###'),
  c('PT', 'Portugal', '351', '### ### ###'),
  c('SA', 'Saudi Arabia', '966', '## ### ####'),
  c('SG', 'Singapore', '65', '#### ####'),
  c('ZA', 'South Africa', '27', '## ### ####'),
  c('KR', 'South Korea', '82', '##-####-####'),
  c('ES', 'Spain', '34', '### ## ## ##'),
  c('SE', 'Sweden', '46', '##-### ## ##'),
  c('CH', 'Switzerland', '41', '## ### ## ##'),
  c('TW', 'Taiwan', '886', '### ### ###'),
  c('TH', 'Thailand', '66', '## ### ####'),
  c('TR', 'Türkiye', '90', '### ### ## ##'),
  c('UA', 'Ukraine', '380', '## ### ## ##'),
  c('AE', 'United Arab Emirates', '971', '## ### ####'),
  c('GB', 'United Kingdom', '44', '#### ######'),
  c('US', 'United States', '1', '(###) ###-####'),
  c('VN', 'Vietnam', '84', '## ### ## ##'),
]

/** The emoji flag for an ISO country code, from its regional indicator letters. */
function flagOf(code: string) {
  return String.fromCodePoint(...[...code.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65))
}

/** Digits laid into a pattern, stopping at the last digit; extra digits follow after a space. */
function formatNational(digits: string, pattern: string) {
  let out = ''
  let i = 0
  for (const ch of pattern) {
    if (i >= digits.length) break
    if (ch === '#') out += digits[i++]
    else out += ch
  }
  return i < digits.length ? `${out} ${digits.slice(i)}` : out
}

/** The country whose calling code prefixes `digits` (longest match; `prefer` wins a shared code). */
function matchCountry(digits: string, countries: PhoneCountry[], prefer?: string) {
  const matches = countries.filter((country) => digits.startsWith(country.dial))
  if (!matches.length) return undefined
  const longest = Math.max(...matches.map((m) => m.dial.length))
  const best = matches.filter((m) => m.dial.length === longest)
  return best.find((m) => m.code === prefer) ?? best[0]
}

/** Splits an E.164 string into its country and national digits. */
function parsePhone(value: string, countries: PhoneCountry[], prefer?: string) {
  const digits = value.replace(/\D/g, '')
  const country = value.trim().startsWith('+') ? matchCountry(digits, countries, prefer) : undefined
  return { country, national: country ? digits.slice(country.dial.length) : digits }
}

interface PhoneInputChange {
  country: PhoneCountry
  /** National digits only. */
  national: string
  /** Every digit the pattern asks for is there. */
  complete: boolean
}

interface PhoneInputProps {
  /** E.164, e.g. '+14155550123'. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string, details: PhoneInputChange) => void
  /** ISO code of the country to start with. Default 'US'. */
  defaultCountry?: string
  countries?: PhoneCountry[]
  /** Submits the E.164 value in a hidden input. */
  name?: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
  className?: string
  id?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

function PhoneInput({
  value: valueProp,
  defaultValue,
  onValueChange,
  defaultCountry = 'US',
  countries = PHONE_COUNTRIES,
  name,
  disabled,
  required,
  placeholder,
  className,
  ...props
}: PhoneInputProps) {
  const labels = useComponentLabels(phoneInputLabels)
  const [initial] = useState(() => parsePhone(valueProp ?? defaultValue ?? '', countries, defaultCountry))
  const [countryCode, setCountryCode] = useState(initial.country?.code ?? defaultCountry)
  const [uncontrolled, setUncontrolled] = useState(initial.national)
  const controlled = valueProp !== undefined ? parsePhone(valueProp, countries, countryCode) : undefined
  // A controlled value that names a country moves the select with it.
  const activeCode = controlled?.country?.code ?? countryCode
  const country = countries.find((x) => x.code === activeCode) ?? countries[0]!
  const national = controlled ? controlled.national : uncontrolled
  const input = useRef<HTMLInputElement>(null)
  const caretDigits = useRef<number | null>(null)
  const countryLabelId = useId()
  // "+4…" while an international code is still being typed, before it names a country.
  const [draft, setDraft] = useState<string | null>(null)

  const emit = (next: string, target: PhoneCountry) => {
    const trimmed = next.slice(0, 15 - target.dial.length)
    if (valueProp === undefined) setUncontrolled(trimmed)
    setCountryCode(target.code)
    const complete = trimmed.length >= (target.pattern.match(/#/g)?.length ?? 0)
    onValueChange?.(trimmed ? `+${target.dial}${trimmed}` : '', { country: target, national: trimmed, complete })
  }

  const formatted = formatNational(national, country.pattern)

  // Keep the caret after the same digit once the text is re-formatted.
  useLayoutEffect(() => {
    const el = input.current
    if (caretDigits.current === null || !el || document.activeElement !== el) return
    let seen = 0
    let pos = 0
    while (pos < formatted.length && seen < caretDigits.current) {
      if (/\d/.test(formatted[pos]!)) seen++
      pos++
    }
    el.setSelectionRange(pos, pos)
    caretDigits.current = null
  })

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const el = event.currentTarget
    const raw = el.value
    const caret = el.selectionStart ?? raw.length
    let digits = raw.replace(/\D/g, '')
    let before = raw.slice(0, caret).replace(/\D/g, '').length
    // Backspace over punctuation: take the digit before it instead.
    if (digits === national && raw.length < formatted.length && before > 0) {
      digits = digits.slice(0, before - 1) + digits.slice(before)
      before--
    }
    // Typed "+44…" or "0044…": an international number picks its country.
    const international = raw.trim().startsWith('+') || digits.startsWith('00')
    if (international) {
      const full = digits.replace(/^00/, '')
      const match = matchCountry(full, countries, country.code)
      if (!match) return setDraft(raw.trim().startsWith('+') ? `+${digits}` : digits)
      setDraft(null)
      caretDigits.current = Math.max(0, before - match.dial.length - (digits.startsWith('00') ? 2 : 0))
      return emit(full.slice(match.dial.length), match)
    }
    setDraft(null)
    caretDigits.current = before
    emit(digits, country)
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text')
    if (!/^\s*(\+|00)/.test(text)) return
    const full = text.replace(/\D/g, '').replace(/^00/, '')
    const match = matchCountry(full, countries, country.code)
    if (!match) return
    event.preventDefault()
    const next = full.slice(match.dial.length)
    caretDigits.current = next.length
    emit(next, match)
  }

  const example = country.pattern.replace(/#/g, () => '5')

  return (
    <InputGroup data-slot="phone-input" aria-disabled={disabled || undefined} className={cn('overflow-hidden', className)}>
      <InputGroupAddon align="inline-start" className="h-full self-stretch own:py-0 own:ps-0 has-[>button]:ms-0 own:rounded-s-[inherit]">
        <Select
          value={country.code}
          onValueChange={(code) => {
            const next = countries.find((x) => x.code === code)
            if (!next) return
            emit(national, next)
            input.current?.focus()
          }}
          disabled={disabled}
          itemToStringLabel={(code: string) => countries.find((x) => x.code === code)?.name ?? code}
        >
          {/* Named by its own label: inside a Field, the Field's label is the number's. */}
          <span id={countryLabelId} hidden>
            {labels.phoneCountry(country.name, `+${country.dial}`)}
          </span>
          <SelectTrigger
            aria-labelledby={countryLabelId}
            // shape: a part of the group's well, not a field of its own: its slot keeps the field look (fill, radius,
            // height) off it, it fills the group's inside edge to edge, and the group clips it to its corners.
            data-slot="phone-input-country"
            className={cn(
              'h-full data-[size=default]:h-full gap-1 own:rounded-s-[inherit] own:rounded-e-none border-0 own:bg-transparent own:ps-2.5 own:pe-1.5 shadow-none',
              'own:hover:bg-hover own:data-popup-open:bg-hover',
              'focus-visible:shadow-none focus-ring focus-visible:-outline-offset-2',
            )}
          >
            <SelectValue className="flex-none">
              {(code: string) => (
                <span aria-hidden className="own:text-base own:leading-none">
                  {flagOf(code)}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start" className="max-h-72 w-64">
            {countries.map((x) => (
              <SelectItem key={x.code} value={x.code} label={x.name}>
                <span aria-hidden className="own:text-base own:leading-none">
                  {flagOf(x.code)}
                </span>
                <span className="min-w-0 flex-1 truncate">{x.name}</span>
                <span className="own:text-ui-sm own:text-fg-muted own:tabular-nums">+{x.dial}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span aria-hidden className="h-4 w-px bg-line" />
        <InputGroupText className="own:ps-1.5 text-fg own:tabular-nums">+{country.dial}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        ref={input}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={draft ?? formatted}
        onChange={handleChange}
        onBlur={() => setDraft(null)}
        onPaste={handlePaste}
        placeholder={placeholder ?? example}
        disabled={disabled}
        required={required}
        className="own:ps-1 own:tabular-nums"
        {...props}
      />
      {name && <input type="hidden" name={name} value={national ? `+${country.dial}${national}` : ''} />}
    </InputGroup>
  )
}

export {
  PhoneInput,
  PHONE_COUNTRIES,
  flagOf,
  formatNational,
  parsePhone,
  type PhoneCountry,
  type PhoneInputChange,
  type PhoneInputProps,
}
