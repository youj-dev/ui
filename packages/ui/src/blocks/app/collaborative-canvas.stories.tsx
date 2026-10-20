import type { Meta, StoryObj } from '@storybook/react-vite'
import { CollaborativeCanvas } from './collaborative-canvas'

const meta: Meta<typeof CollaborativeCanvas> = {
  title: 'Blocks/App/Collaborative canvas',
  component: CollaborativeCanvas,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'A team’s board: breadcrumbs, who is here and Share over a Whiteboard with a live sign-ups chart and an activation card among sticky notes and connectors, two people’s cursors moving with the board, and comment pins that open a thread to answer and resolve. Demo content — edit after adding.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CollaborativeCanvas>

/** The growth team’s review: open Mara’s pin on the chart, drag a note and watch its connector follow, or press ? for the shortcuts. */
export const Default: Story = { args: { demoMarker: false } }

/** Its own page, for an app without the frame: the breadcrumbs bar over a board that fills the viewport. */
export const Standalone: Story = { args: { embedded: false, demoMarker: false } }

/** With your data: another path, a board of your own and people from your realtime layer (here, standing still). */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    path: [{ label: 'Northwind', href: '#' }, { label: 'Ops' }, { label: 'Incident 482 retro' }],
    defaultValue: {
      shapes: [
        { id: 'what', type: 'sticky', color: 'red', width: 'medium', x: 0, y: 0, w: 240, h: 88, text: 'Queue backed up at 09:12' },
        { id: 'why', type: 'sticky', color: 'amber', width: 'medium', x: 320, y: 0, w: 240, h: 88, text: 'Retry storm after a deploy' },
        { id: 'fix', type: 'sticky', color: 'green', width: 'medium', x: 640, y: 0, w: 240, h: 88, text: 'Add jitter to retries' },
        { id: 'k1', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'what' }, to: { shape: 'why' } },
        { id: 'k2', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'why' }, to: { shape: 'fix' } },
      ],
    },
    people: [{ id: 'sam', name: 'Sam', x: 420, y: 140 }],
    threads: {},
  },
}
