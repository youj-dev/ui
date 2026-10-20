import type { Meta, StoryObj } from '@storybook/react-vite'
import { DotGrid, IsoGrid, LineGrid, type GridFade } from './grids'

const meta: Meta = {
  title: 'Motion/Graphics/Grid Backdrops',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Drafting paper from the tokens: DotGrid, LineGrid (stronger every `major` cells, with registration crosses where those meet) and IsoGrid (the same rhombi as IsoScene’s floor). Each fills its nearest positioned ancestor behind the content, and fades toward its edges (`fade`: radial, edges or none). Static, so reduced motion changes nothing; decorative (aria-hidden) and transparent to the pointer.',
      },
    },
  },
  args: { gap: 20, fade: 'radial' },
  argTypes: { fade: { control: 'inline-radio', options: ['radial', 'edges', 'none'] } },
}
export default meta
type Story = StoryObj<{ gap: number; fade: GridFade }>

function Panel({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <figure className="relative isolate grid h-56 w-72 place-items-center overflow-hidden rounded-xl border border-line bg-surface">
      {children}
      <figcaption className="font-mono text-xs tracking-[0.12em] text-fg-muted uppercase">{name}</figcaption>
    </figure>
  )
}

export const All: Story = {
  render: ({ gap, fade }) => (
    <div className="flex flex-wrap justify-center gap-4">
      <Panel name="Dot grid">
        <DotGrid gap={gap} fade={fade} />
      </Panel>
      <Panel name="Line grid">
        <LineGrid gap={gap} fade={fade} />
      </Panel>
      <Panel name="Iso grid">
        <IsoGrid gap={gap} fade={fade} />
      </Panel>
    </div>
  ),
}
