'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Combobox } from '../../../components/ui/combobox'
import { FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/form'
import { InputGroup, InputGroupInput } from '../../../components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { cn } from '../../../lib/utils'
import { AddressSearch } from './address-search'
import { type PaymentAddress, type PaymentAddressPart, type PaymentAddressSuggestion, type PaymentCountry, type PaymentFormCopy, type PaymentValues } from './data'

/* The billing address, in the country's own order and terms. The country
 * comes first because it decides the rest: a US address ends City, State,
 * ZIP code; a German one puts the postal code before the city; a Japanese
 * one starts from the postal code and the prefecture. Its regions are a list
 * where the country has a fixed one, and its postal code is checked in its
 * own shape (and tidied as you leave it: "e16pg" becomes "E1 6PG"). The
 * first line looks the address up and fills the others, each filled line
 * lit for a moment so you see what changed; focus moves on to the line most
 * people still need to add, the flat or suite. */

const AUTOCOMPLETE: Record<PaymentAddressPart, string> = {
  line1: 'address-line1',
  line2: 'address-line2',
  city: 'address-level2',
  region: 'address-level1',
  postal: 'postal-code',
}

interface AddressFieldsProps {
  countries: PaymentCountry[]
  country: PaymentCountry
  copy: PaymentFormCopy
  plural: Intl.PluralRules
  search: (query: string, country: string) => Promise<PaymentAddressSuggestion[]> | PaymentAddressSuggestion[]
}

export function AddressFields({ countries, country, copy, plural, search }: AddressFieldsProps) {
  const form = useFormContext<PaymentValues>()
  const line2 = useRef<HTMLInputElement>(null)
  // The lines a lookup just filled, lit for a moment.
  const [lit, setLit] = useState<string[]>([])
  useEffect(() => {
    if (!lit.length) return
    const timer = setTimeout(() => setLit([]), 900)
    return () => clearTimeout(timer)
  }, [lit])

  const fill = (suggestion: PaymentAddressSuggestion) => {
    const filled = Object.entries(suggestion.address).filter(([part]) => part !== 'country') as [keyof PaymentAddress, string][]
    for (const [part, value] of filled) form.setValue(`address.${part}`, value, { shouldDirty: true, shouldValidate: true })
    setLit(filled.map(([part]) => part))
    requestAnimationFrame(() => line2.current?.focus())
  }

  const part = (name: PaymentAddressPart) => {
    const label =
      name === 'line1' ? copy.addressLine1 : name === 'line2' ? copy.addressLine2 : name === 'city' ? country.city.label : name === 'postal' ? country.postal.label : (country.region?.label ?? '')
    if (name === 'region' && !country.region) return null
    return (
      <FormField<PaymentValues, `address.${PaymentAddressPart}`>
        key={name}
        name={`address.${name}`}
        render={({ field, fieldState }) => (
          <FormItem className="min-w-0">
            <FormLabel>
              {label}
              {name === 'line2' && <span className="font-normal text-fg-subtle"> ({copy.optional})</span>}
            </FormLabel>
            {name === 'line1' ? (
              <AddressSearch
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                invalid={fieldState.invalid}
                country={country.code}
                placeholder={copy.addressPlaceholder}
                copy={copy}
                plural={plural}
                search={search}
                onPick={fill}
              />
            ) : name === 'region' && country.region?.options ? (
              <Select items={country.region.options.map((o) => ({ value: o, label: o }))} value={field.value || null} onValueChange={(value) => field.onChange(value ?? '')}>
                <SelectTrigger
                  ref={field.ref}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid || undefined}
                  // shape: a field the address lookup just filled lights up for a beat
                  className={cn('w-full', lit.includes(name) && 'bg-selected')}
                >
                  <SelectValue placeholder={copy.regionPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {country.region.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              // shape: a field the address lookup just filled lights up for a beat
              <InputGroup className={cn('transition-[background-color,border-color,box-shadow] yj-duration-deliberate', lit.includes(name) && 'bg-selected')}>
                <InputGroupInput
                  {...field}
                  ref={(node: HTMLInputElement | null) => {
                    field.ref(node)
                    if (name === 'line2') line2.current = node
                  }}
                  autoComplete={AUTOCOMPLETE[name]}
                  aria-invalid={fieldState.invalid || undefined}
                  onBlur={() => {
                    // A postal code is tidied into its country's shape as you leave it.
                    if (name === 'postal' && country.postal.normalize && field.value) {
                      const tidy = country.postal.normalize(field.value)
                      if (tidy !== field.value) form.setValue('address.postal', tidy, { shouldDirty: true })
                    }
                    field.onBlur()
                  }}
                />
              </InputGroup>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <FormField<PaymentValues, 'address.country'>
        name="address.country"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{copy.country}</FormLabel>
            <Combobox
              ref={field.ref}
              options={countries.map((c) => ({ value: c.code, label: c.name, keywords: [c.code] }))}
              value={field.value}
              onValueChange={(code) => {
                if (!code || code === field.value) return
                field.onChange(code)
                // A region from the last country means nothing in this one.
                const next = countries.find((c) => c.code === code)
                const region = form.getValues('address.region')
                if (region && !next?.region?.options?.includes(region)) form.setValue('address.region', '')
                if (form.formState.touchedFields.address?.postal) void form.trigger('address.postal')
              }}
              onBlur={field.onBlur}
              searchPlaceholder={copy.searchCountry}
              className="w-full"
            />
          </FormItem>
        )}
      />
      {country.layout.map((row, index) => {
        const parts = row.filter((name) => name !== 'region' || country.region)
        return (
          <div
            key={`${country.code}-${index}`}
            className={cn(
              'grid gap-3',
              parts.length === 2 && '@sm/pay:grid-cols-2',
              parts.length === 3 && 'grid-cols-2 @md/pay:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,0.8fr)] *:first:col-span-2 @md/pay:*:first:col-span-1',
            )}
          >
            {parts.map(part)}
          </div>
        )
      })}
    </div>
  )
}
