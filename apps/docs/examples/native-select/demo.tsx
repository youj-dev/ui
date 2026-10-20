'use client'

import { Field, FieldDescription, FieldLabel, NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '@youj/react'

export default function NativeSelectDemo() {
  return (
    <Field className="w-full max-w-xs">
      <FieldLabel htmlFor="region">Region</FieldLabel>
      <NativeSelect id="region" name="region" defaultValue="fra" className="w-full">
        <NativeSelectOptGroup label="Europe">
          <NativeSelectOption value="fra">Frankfurt (eu-central-1)</NativeSelectOption>
          <NativeSelectOption value="dub">Dublin (eu-west-1)</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Americas">
          <NativeSelectOption value="iad">Virginia (us-east-1)</NativeSelectOption>
          <NativeSelectOption value="sfo">California (us-west-1)</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
      <FieldDescription>Where new projects store their data.</FieldDescription>
    </Field>
  )
}
