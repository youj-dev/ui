'use client'

import { Field, FieldDescription, FieldLabel, PHONE_COUNTRIES, PhoneInput } from '@youj/react'

// Only the countries this service delivers to, from the starter set.
const EUROPE = PHONE_COUNTRIES.filter((country) => ['AT', 'BE', 'DE', 'ES', 'FR', 'IT', 'NL', 'PT'].includes(country.code))

export default function PhoneInputCountries() {
  return (
    <div className="grid w-full max-w-lg gap-6 sm:grid-cols-2">
      <Field>
        <FieldLabel>Delivery contact</FieldLabel>
        <PhoneInput name="phone" countries={EUROPE} defaultCountry="DE" />
        <FieldDescription>We deliver within the EU.</FieldDescription>
      </Field>
      <Field disabled>
        <FieldLabel>Account phone</FieldLabel>
        <PhoneInput defaultValue="+4930123456" disabled />
        <FieldDescription>Managed by your organization.</FieldDescription>
      </Field>
    </div>
  )
}
