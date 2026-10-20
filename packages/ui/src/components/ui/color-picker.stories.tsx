import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Field, FieldDescription, FieldLabel } from './field'
import { ColorPicker } from './color-picker'

const meta: Meta<typeof ColorPicker> = {
  title: 'UI/Inputs/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A color picked in a Popover: a saturation/brightness area, a hue Slider on a spectrum, hex and OKLCH fields, swatches (the theme presets’ accents by default) and the browser’s eyedropper where it exists. The area is one focusable thumb (arrows step saturation and brightness, Shift for 10) that tracks the pointer 1:1 and glides on the fast token when the color changes from elsewhere; the selected swatch is ringed by a SlidingIndicator that glides between swatches. Fields commit on Enter or blur and put back anything unreadable. The color is held as HSV so the hue survives grays. Reduced motion: the thumb and ring jump.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ColorPicker>

function Brand() {
  const [color, setColor] = useState('#3554fc')
  return (
    <div className="flex w-72 flex-col gap-4">
      <Field>
        <FieldLabel>Brand color</FieldLabel>
        <ColorPicker value={color} onValueChange={setColor} aria-label="Brand color" />
        <FieldDescription>Used for buttons, links and focus rings.</FieldDescription>
      </Field>
      <div className="flex items-center gap-2 rounded-lg border border-line p-3">
        <span className="rounded-md px-3 py-1.5 text-ui font-medium text-[white]" style={{ backgroundColor: color }}>
          Preview
        </span>
        <span className="text-ui" style={{ color }}>
          A link in your color
        </span>
      </div>
    </div>
  )
}

/** A brand color, previewed live. */
export const Hero: Story = {
  render: () => <Brand />,
}

/** Opened, to see the panel. */
export const Open: Story = {
  render: () => <ColorPicker defaultValue="oklch(0.62 0.21 330)" />,
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>('[data-slot=color-picker-trigger]')?.click()
  },
}

/** `format="oklch"` reports OKLCH strings; custom swatches replace the presets. */
export const OklchAndSwatches: Story = {
  render: () => {
    function Custom() {
      const [value, setValue] = useState('oklch(0.72 0.15 158)')
      return (
        <div className="flex flex-col gap-3">
          <ColorPicker
            value={value}
            onValueChange={setValue}
            format="oklch"
            swatches={[
              { value: 'oklch(0.72 0.15 158)', label: 'Mint' },
              { value: 'oklch(0.79 0.14 72)', label: 'Amber' },
              { value: 'oklch(0.68 0.18 24)', label: 'Coral' },
              { value: '#111111', label: 'Ink' },
            ]}
          />
          <code className="font-mono text-ui-sm text-fg-muted">{value}</code>
        </div>
      )
    }
    return <Custom />
  },
}

export const Disabled: Story = {
  render: () => <ColorPicker disabled defaultValue="#e5484d" />,
}

/** Reduced motion: the area thumb and the swatch ring jump. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <Brand />
    </YoujProvider>
  ),
}

/**
 * Touch (`YoujProvider device="touch"`, a phone's width): the picker is a bottom sheet with a taller area,
 * a bigger thumb and 44px swatches. Dragging in the area or on the hue slider changes the color and never
 * pulls the sheet; the handle and the space around the controls do.
 */
export const Touch: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  decorators: [
    // A provider resets Speed and Reduced motion to its defaults: the toolbar's are passed on.
    (Story, { globals }) => (
      <YoujProvider device="touch" reducedMotion={globals.reducedMotion} timeScale={Number(globals.timeScale) || 1}>
        <Story />
      </YoujProvider>
    ),
  ],
  render: () => <Brand />,
}
