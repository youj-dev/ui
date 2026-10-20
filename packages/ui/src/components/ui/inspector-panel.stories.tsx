import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ColorOpacityField } from './color-opacity-field'
import { InspectorPanel, InspectorRow } from './inspector-panel'
import { ScrubNumberField } from './scrub-number-field'

const meta: Meta<typeof InspectorPanel> = {
  title: 'UI/Layout/Inspector Panel',
  component: InspectorPanel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'One property group of a design tool’s side panel. The header takes an enable checkbox, a title that can be a type menu, and a visibility eye, plus and trash; the body is rows of a label and one or two fields. The chevron collapses it.',
      },
    },
  },
  args: { title: 'Drop shadow', enabled: true, visible: true, defaultOpen: true },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
}
export default meta
type Story = StoryObj<typeof InspectorPanel>

function ShadowRows() {
  return (
    <>
      <InspectorRow label="Position">
        <ScrubNumberField size="sm" aria-label="X" label="X" defaultValue={0} />
        <ScrubNumberField size="sm" aria-label="Y" label="Y" defaultValue={8} />
      </InspectorRow>
      <InspectorRow label="Blur">
        <ScrubNumberField size="sm" aria-label="Blur" label="B" defaultValue={24} min={0} />
      </InspectorRow>
      <InspectorRow label="Color">
        <ColorOpacityField size="sm" aria-label="Color" defaultValue={{ color: '#1d2a6b', opacity: 45 }} />
      </InspectorRow>
    </>
  )
}

/** Every prop as a control. */
export const Playground: Story = {
  args: { onAdd: () => {}, onRemove: () => {} },
  render: (args) => (
    <InspectorPanel {...args}>
      <ShadowRows />
    </InspectorPanel>
  ),
}

/** The title is a menu of kinds. */
export const TypeMenu: Story = {
  name: 'Type menu',
  render: (args) => {
    const [type, setType] = useState('drop')
    const types = [
      { value: 'drop', label: 'Drop shadow' },
      { value: 'inner', label: 'Inner shadow' },
    ]
    return (
      <InspectorPanel {...args} title={types.find((t) => t.value === type)!.label} types={types} type={type} onTypeChange={setType}>
        <ShadowRows />
      </InspectorPanel>
    )
  },
}

/** Switched off: dimmed, and its fields disabled. */
export const Off: Story = {
  args: { enabled: false },
  render: (args) => (
    <InspectorPanel {...args}>
      <ShadowRows />
    </InspectorPanel>
  ),
}

/** A bare panel: a title and a body. */
export const Plain: Story = {
  args: { title: 'Size', enabled: undefined, visible: undefined },
  render: (args) => (
    <InspectorPanel {...args}>
      <InspectorRow label="Width">
        <ScrubNumberField size="sm" aria-label="Width" label="W" defaultValue={320} unit="px" />
      </InspectorRow>
    </InspectorPanel>
  ),
}
