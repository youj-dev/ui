import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Form } from '@base-ui/react/form'
import { Button } from './button'
import { Checkbox } from './checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from './field'
import { Input } from './input'
import { RadioGroup, RadioGroupItem } from './radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Switch } from './switch'

const meta: Meta<typeof Field> = {
  title: 'UI/Primitives/Field',
  component: Field,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Field is Base UI\'s Field.Root with shadcn\'s layout parts. The wiring is correct by construction: FieldLabel names the control, FieldDescription and a visible FieldError join its aria-describedby, and `invalid` / `disabled` reach it. `required` on the Field marks the label and makes the control required in one place. FieldError shows its children (app-controlled errors) or, with none, the control\'s native validation message; it is role="alert" and grows the layout open with motion\'s Collapse (height eases from 0 while the text fades in, the Field\'s gap folded into the animated height), then closes over its last message when it clears, so the form below eases instead of jumping. An error rendered with its Field is simply there; one mounted later grows in. FieldSet/FieldLegend give groups a real fieldset name.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Field>

const expiries = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: 'never', label: 'No expiration' },
]

function CreateToken() {
  const [created, setCreated] = useState<string | null>(null)
  return (
    <Form
      className="w-full max-w-[480px]"
      onFormSubmit={(values) => setCreated(String(values.name ?? ''))}
    >
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Create an API token</FieldLegend>
          <FieldDescription>Tokens act as you. Give each one the least access it needs.</FieldDescription>
          <FieldGroup className="gap-5">
            <Field name="name" required>
              <FieldLabel>Token name</FieldLabel>
              <Input placeholder="e.g. CI deploys" minLength={3} />
              <FieldDescription>Only you see this. At least 3 characters.</FieldDescription>
              <FieldError />
            </Field>
            <Field name="expiry">
              <FieldLabel>Expiration</FieldLabel>
              <Select items={expiries} defaultValue="30">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expiries.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </FieldSet>
        <FieldSeparator />
        <FieldSet>
          <FieldLegend variant="label">Scopes</FieldLegend>
          <FieldGroup className="gap-3">
            {[
              { id: 'read', label: 'Read', desc: 'Projects, deployments and logs.', checked: true },
              { id: 'write', label: 'Write', desc: 'Create deployments and change settings.' },
              { id: 'admin', label: 'Admin', desc: 'Members, billing and deletion. Rarely needed.' },
            ].map((scope) => (
              <Field key={scope.id} name={`scope-${scope.id}`} orientation="horizontal">
                <Checkbox defaultChecked={scope.checked} />
                <FieldContent>
                  <FieldLabel>{scope.label}</FieldLabel>
                  <FieldDescription>{scope.desc}</FieldDescription>
                </FieldContent>
              </Field>
            ))}
          </FieldGroup>
        </FieldSet>
        <div className="flex items-center justify-between gap-3">
          <p role="status" className="text-ui-sm text-fg-muted">
            {created ? `Created “${created}”. Copy it now; it won’t be shown again.` : ''}
          </p>
          <Button type="submit">Create token</Button>
        </div>
      </FieldGroup>
    </Form>
  )
}

/** Submit empty: the name's native message slides in and focus lands on the field. */
export const Hero: Story = {
  render: () => <CreateToken />,
}

/** Horizontal fields put a control beside its label and description: the settings-row shape. */
export const Orientations: Story = {
  render: () => (
    <FieldGroup className="w-full max-w-[480px]">
      <Field>
        <FieldLabel>Vertical (default)</FieldLabel>
        <Input placeholder="Label above, description below" />
        <FieldDescription>The shape for forms.</FieldDescription>
      </Field>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel>Horizontal</FieldLabel>
          <FieldDescription>The shape for settings rows.</FieldDescription>
        </FieldContent>
        <Switch defaultChecked />
      </Field>
      <FieldSet>
        <FieldLegend variant="label">In a fieldset</FieldLegend>
        <RadioGroup defaultValue="comfortable">
          {['comfortable', 'compact'].map((v) => (
            <Field key={v} orientation="horizontal">
              <RadioGroupItem value={v} />
              <FieldLabel className="capitalize">{v}</FieldLabel>
            </Field>
          ))}
        </RadioGroup>
      </FieldSet>
    </FieldGroup>
  ),
}

/** Required marks, descriptions, app-controlled errors (deduplicated, listed) and disabled fields. */
export const States: Story = {
  render: () => (
    <FieldGroup className="w-full max-w-[420px]">
      <Field required>
        <FieldLabel>Required</FieldLabel>
        <Input placeholder="The asterisk is decorative; the input is required" />
      </Field>
      <Field invalid>
        <FieldLabel>Invalid, one message</FieldLabel>
        <Input defaultValue="acme" />
        <FieldError errors={[{ message: 'That handle is taken.' }]} />
      </Field>
      <Field invalid>
        <FieldLabel>Invalid, several messages</FieldLabel>
        <Input defaultValue="pw" type="password" />
        <FieldError
          errors={[
            { message: 'At least 12 characters.' },
            { message: 'Include a number or symbol.' },
            { message: 'At least 12 characters.' },
          ]}
        />
      </Field>
      <Field disabled>
        <FieldLabel>Disabled</FieldLabel>
        <Input defaultValue="Managed by SSO" />
        <FieldDescription>Your identity provider controls this.</FieldDescription>
      </Field>
    </FieldGroup>
  ),
}
