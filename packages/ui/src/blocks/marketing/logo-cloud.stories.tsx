import type { Meta, StoryObj } from '@storybook/react-vite'
import { LogoCloud } from './logo-cloud'

const meta: Meta<typeof LogoCloud> = {
  title: 'Blocks/Marketing/Logo cloud',
  component: LogoCloud,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Show who uses the product under one quiet line: a grid that trades its logos in place, one cell at a time, or a row that drifts with no seam. It rests while pointed at, off screen and in a hidden tab, a small button pauses it, and screen readers get every customer once.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof LogoCloud>

export const Default: Story = {}

/** A row that drifts with no seam, faded at both ends. */
export const Marquee: Story = { args: { variant: 'marquee' } }

/** Standing still, as under reduced motion. */
export const Still: Story = { args: { autoplay: false } }

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="sr-only">Customers</h1>
      <LogoCloud {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { title: 'Poured in 600 cafés across Europe' },
    cells: 4,
    logos: [
      { name: 'Café Linden', mark: <circle cx="12" cy="12" r="7" /> },
      { name: 'Bar Nord', mark: <path d="M4 19 12 5l8 14z" /> },
      { name: 'Brot & Co', mark: <rect x="4" y="4" width="16" height="16" rx="4" /> },
      { name: 'Marlowe', mark: <path d="M4 5h16l-8 14z" /> },
      { name: 'Tidewater', mark: <path d="M3 12c4-6 10-6 18 0-8 6-14 6-18 0z" /> },
      { name: 'Kornhaus', mark: <path d="M12 3c5 3 7 8 0 18C5 11 7 6 12 3z" /> },
    ],
  },
}
