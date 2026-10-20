import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { loaderArgTypes, loaderArgs, InContext, SizeRow, Stage } from '../story-kit'
import { LoaderNacre, meta as about } from './nacre'

const meta = {
  title: 'Visuals/Loaders/Geometry/Nacre',
  component: LoaderNacre,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: about.description } } },
  argTypes: loaderArgTypes,
  args: { ...loaderArgs, size: 320 },
} satisfies Meta<typeof LoaderNacre>
export default meta
type Story = StoryObj<typeof meta>

/** Preparing a workspace, with the articulated shell at product scale. */
export const Hero: Story = { render: (args) => <InContext Loader={LoaderNacre} {...args} /> }

/** Study the folded facets and the delayed response of their radial links. */
export const Playground: Story = {
  render: (args) => <Stage><LoaderNacre {...args} /></Stage>,
}

/** The shell sheds its middle course at the smallest size. */
export const Sizes: Story = { render: () => <SizeRow Loader={LoaderNacre} /> }

/** Reduced motion preserves the fully open shell and its accent seam. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Stage><LoaderNacre {...args} /></Stage>
    </YoujProvider>
  ),
}
