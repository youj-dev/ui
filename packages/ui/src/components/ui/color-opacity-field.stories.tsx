import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ColorOpacityField, type ColorOpacityValue } from './color-opacity-field'

const meta: Meta<typeof ColorOpacityField> = {
  title: 'UI/Pickers & inputs/Color Opacity Field',
  component: ColorOpacityField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A color and its opacity as one grouped control: a swatch that opens the Color Picker, a hex field that reads 3, 4, 6 or 8 digits (pasted or typed), and an opacity percentage you can drag.',
      },
    },
  },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'default'] }, disabled: { control: 'boolean' } },
  args: { defaultValue: { color: '#4c6fff', opacity: 80 }, size: 'default', disabled: false },
  decorators: [(Story) => <div className="w-72"><Story /></div>],
}
export default meta
type Story = StoryObj<typeof ColorOpacityField>

/** Every prop as a control. */
export const Playground: Story = {}

/** The size that fits a dense panel. */
export const Small: Story = { args: { size: 'sm' } }

/** Held by the app, which can use both numbers: here the swatch below is the color at its opacity. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState<ColorOpacityValue>({ color: '#ff7a45', opacity: 60 })
    return (
      <div className="flex flex-col gap-3">
        <ColorOpacityField {...args} value={value} onValueChange={setValue} />
        <div
          className="h-12 rounded-lg"
          style={{ background: `color-mix(in srgb, ${value.color} ${value.opacity}%, transparent)` }}
        />
        <span className="font-mono text-ui-sm text-fg-muted">
          {value.color} · {value.opacity}%
        </span>
      </div>
    )
  },
}

export const Disabled: Story = { args: { disabled: true } }
