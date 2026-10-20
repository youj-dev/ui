import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from './checkbox'
import { Input } from './input'
import { Label } from './label'

const meta: Meta<typeof Label> = {
  title: 'UI/Primitives/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A plain `<label>` for use outside a Field (inside one, use FieldLabel, which wires itself). `required` adds a muted asterisk that is hidden from the accessible name: the control\'s own `required` is what a screen reader announces. A peer control that is disabled dims its label.',
      },
    },
  },
  args: { children: 'Display name' },
}
export default meta
type Story = StoryObj<typeof Label>

export const Playground: Story = {}

export const WithControls: Story = {
  render: () => (
    <div className="grid w-72 gap-6">
      <div className="grid gap-2">
        <Label htmlFor="label-name" required>
          Display name
        </Label>
        <Input id="label-name" required defaultValue="Ada" />
      </div>
      <div className="flex items-center gap-2.5">
        <Checkbox id="label-terms" />
        <Label htmlFor="label-terms">Accept the terms</Label>
      </div>
      <div className="flex items-center gap-2.5">
        <Checkbox id="label-locked" disabled />
        <Label htmlFor="label-locked">Locked by your admin</Label>
      </div>
    </div>
  ),
}
