import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from './native-select'

const meta: Meta<typeof NativeSelect> = {
  title: 'UI/Primitives/NativeSelect',
  component: NativeSelect,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The browser’s own <select>, dressed as a Youj field: Input’s border, hover and focus ring, the control heights and Select’s chevron. The picker is the operating system’s (a wheel or sheet on phones), it works before hydration, and it submits with a plain form. Use Select when you need custom rows, search or motion in the popup.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof NativeSelect>

/** A settings form: a labeled field with option groups, the three sizes, and the invalid and disabled states. */
export const Hero: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="ns-region">Region</FieldLabel>
        <NativeSelect id="ns-region" defaultValue="fra" className="w-full">
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

      <div className="flex items-center gap-2">
        {(['sm', 'default', 'lg'] as const).map((size) => (
          <NativeSelect key={size} size={size} aria-label={`Priority, ${size}`} defaultValue="high">
            <NativeSelectOption value="urgent">Urgent</NativeSelectOption>
            <NativeSelectOption value="high">High</NativeSelectOption>
            <NativeSelectOption value="low">Low</NativeSelectOption>
          </NativeSelect>
        ))}
      </div>

      <Field data-invalid>
        <FieldLabel htmlFor="ns-plan">Plan</FieldLabel>
        <NativeSelect id="ns-plan" aria-invalid defaultValue="" className="w-full">
          <NativeSelectOption value="" disabled>
            Choose a plan
          </NativeSelectOption>
          <NativeSelectOption value="hobby">Hobby</NativeSelectOption>
          <NativeSelectOption value="pro">Pro</NativeSelectOption>
        </NativeSelect>
        <FieldError>Pick a plan to continue.</FieldError>
      </Field>

      <NativeSelect aria-label="Team (locked)" disabled defaultValue="design" className="w-full">
        <NativeSelectOption value="design">Design</NativeSelectOption>
      </NativeSelect>
    </div>
  ),
}
