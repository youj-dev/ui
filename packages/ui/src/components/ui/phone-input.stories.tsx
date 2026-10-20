import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import { PhoneInput, type PhoneInputChange } from './phone-input'

const meta: Meta<typeof PhoneInput> = {
  title: 'UI/Inputs/PhoneInput',
  component: PhoneInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A phone number in one InputGroup: a country Select (flag, calling code, typeahead by name) and the national number, formatted as you type from a per-country pattern. The value is E.164 (`+14155550123`); typing or pasting an international number (+44 20…, 0044…) switches the country itself. The caret stays after the digit you typed whatever punctuation the pattern adds, and Backspace over a space or dash deletes the digit before it. Formatting is deliberately small, a pattern per country: validate strictly on the server or with libphonenumber-js.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof PhoneInput>

function Contact() {
  const [value, setValue] = useState('+14155550123')
  const [details, setDetails] = useState<PhoneInputChange | null>(null)
  const [touched, setTouched] = useState(false)
  const incomplete = touched && !!value && details?.complete === false
  return (
    <div className="flex w-80 flex-col gap-3">
      <Field invalid={incomplete} onBlur={() => setTouched(true)}>
        <FieldLabel>Mobile number</FieldLabel>
        <PhoneInput
          value={value}
          onValueChange={(next, d) => {
            setValue(next)
            setDetails(d)
          }}
        />
        <FieldError>{incomplete ? `That’s short for a ${details!.country.name} number.` : undefined}</FieldError>
        <FieldDescription>We’ll text a code to confirm it. Paste +44 20 7946 0958 to switch country.</FieldDescription>
      </Field>
      <code className="font-mono text-ui-sm text-fg-muted">value: {value || '""'}</code>
    </div>
  )
}

/** A mobile number with its country; the value stays E.164. */
export const Hero: Story = {
  render: () => <Contact />,
}

export const Playground: Story = {
  args: { defaultCountry: 'GB', disabled: false },
  render: (args) => (
    <Field className="w-80">
      <FieldLabel>Phone</FieldLabel>
      <PhoneInput {...args} />
    </Field>
  ),
}

/** A few countries' patterns. */
export const Formats: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      {['+442079460958', '+33612345678', '+819012345678', '+5511912345678'].map((v) => (
        <PhoneInput key={v} aria-label="Phone" defaultValue={v} />
      ))}
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Field className="w-80" disabled>
      <FieldLabel>Phone</FieldLabel>
      <PhoneInput defaultValue="+4930123456" disabled />
    </Field>
  ),
}
