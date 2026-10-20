'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type Ref } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { MapPinIcon } from '@youj/icons'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../../components/ui/input-group'
import { Spinner } from '../../../components/ui/spinner'
import { cn } from '../../../lib/utils'
import type { PaymentAddressSuggestion, PaymentFormCopy } from './data'

/* The first line of the address, which finds the rest. It's a plain field
 * (so the browser's autofill still fills every line) that, as you type, asks
 * for matching addresses in the chosen country and lists them under it: the
 * WAI-ARIA combobox with a listbox. Arrow keys move through them (the field
 * keeps focus), Enter or a click takes one and fills the other lines, Escape
 * or Tab closes the list and keeps what's typed. The count found is read
 * out. Typing on without picking is fine: it's still the first line. */

interface AddressSearchProps {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  inputRef: Ref<HTMLInputElement>
  invalid: boolean
  country: string
  placeholder: string
  copy: PaymentFormCopy
  plural: Intl.PluralRules
  search: (query: string, country: string) => Promise<PaymentAddressSuggestion[]> | PaymentAddressSuggestion[]
  onPick: (suggestion: PaymentAddressSuggestion) => void
}

export function AddressSearch({ value, onChange, onBlur, inputRef, invalid, country, placeholder, copy, plural, search, onPick }: AddressSearchProps) {
  const k = useYouj()
  const id = useId()
  const listId = `${id}-list`
  const [query, setQuery] = useState<string | null>(null)
  const [results, setResults] = useState<PaymentAddressSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [announced, setAnnounced] = useState('')
  // The props change identity on every render; the timer reads the latest.
  const latest = useRef({ search, country, copy, plural })
  useLayoutEffect(() => {
    latest.current = { search, country, copy, plural }
  })

  // Ask once typing pauses; a later answer replaces an earlier one, never the reverse.
  useEffect(() => {
    if (query === null || query.trim().length < 3) return
    let live = true
    const timer = setTimeout(() => {
      setLoading(true)
      const { search, country, copy, plural } = latest.current
      Promise.resolve(search(query, country))
        .then((found) => {
          if (!live) return
          setResults(found)
          setOpen(found.length > 0)
          setActive(-1)
          setAnnounced(copy.suggestions(found.length, plural.select(found.length)))
        })
        .catch(() => live && setResults([]))
        .finally(() => live && setLoading(false))
    }, 200)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [query])

  const pick = (suggestion: PaymentAddressSuggestion) => {
    setOpen(false)
    setActive(-1)
    setQuery(null)
    onPick(suggestion)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!results.length) return
      event.preventDefault()
      if (!open) setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + step + results.length + (i === -1 && step < 0 ? 1 : 0)) % results.length)
    } else if (event.key === 'Enter' && open && active >= 0) {
      event.preventDefault()
      pick(results[active]!)
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    } else if (event.key === 'Tab') setOpen(false)
  }

  const optionId = (index: number) => `${id}-option-${index}`
  return (
    <div className="relative">
      <InputGroup>
        <InputGroupAddon>
          <MapPinIcon size={15} className="text-fg-subtle" />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          value={value}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          aria-invalid={invalid || undefined}
          autoComplete="address-line1"
          placeholder={placeholder}
          onChange={(event) => {
            onChange(event.target.value)
            setQuery(event.target.value)
            if (event.target.value.trim().length < 3) setOpen(false)
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            setOpen(false)
            onBlur()
          }}
        />
        {loading && (
          <InputGroupAddon align="inline-end">
            <Spinner size={14} />
          </InputGroupAddon>
        )}
      </InputGroup>
      <MotionFeatures>
        <AnimatePresence>
          {open && (
            <m.ul
              key="list"
              id={listId}
              role="listbox"
              aria-label={copy.billing}
              data-yj-tone="overlay"
              initial={k.reduced ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0, transition: k.tween('fast', 'enter') }}
              exit={k.reduced ? { opacity: 0, transition: { type: false } } : { opacity: 0, y: -4, transition: k.tween('instant', 'exit') }}
              className="absolute inset-x-0 top-full z-20 mt-1.5 flex flex-col gap-0.5 rounded-lg border border-line bg-overlay p-1 text-fg shadow-lg"
            >
              {results.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => setActive(index)}
                  onClick={() => pick(suggestion)}
                  className={cn('flex cursor-default flex-col gap-0.5 rounded-md px-2.5 py-2', index === active && 'bg-hover')}
                >
                  <span className="text-ui text-fg">{suggestion.label}</span>
                  {suggestion.description && <span className="text-ui-sm text-fg-muted">{suggestion.description}</span>}
                </li>
              ))}
            </m.ul>
          )}
        </AnimatePresence>
      </MotionFeatures>
      <span className="sr-only" aria-live="polite">
        {announced}
      </span>
    </div>
  )
}
