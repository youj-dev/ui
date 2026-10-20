import type { Meta, StoryObj } from '@storybook/react-vite'
import { ThemePlayground } from './theme-playground'

const meta: Meta<typeof ThemePlayground> = {
  title: 'Blocks/Marketing/Theme playground',
  component: ThemePlayground,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component: 'Let visitors re-theme a small landing page live, with a preset, accent, corners, control size and style. Demo content — edit after adding.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof ThemePlayground>

export const Default: Story = {}

/** Starting on the Cinnabar palette in the Brutal style, in light mode, whatever the page wears. */
export const Brutal: Story = { args: { defaultPalette: 'cinnabar', defaultStyle: 'brutal', defaultMode: 'light' } }

/** Inside a landing page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="sr-only">Youj</h1>
      <ThemePlayground {...args} />
    </main>
  ),
}
