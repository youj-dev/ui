import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Sparkline } from '../sparkline'
import { StatCard } from '../stat-card'
import { Whiteboard, type WhiteboardCursor } from './whiteboard'
import type { WhiteboardColor, WhiteboardScene } from './whiteboard-model'

const meta: Meta<typeof Whiteboard> = {
  title: 'UI/Inputs/Whiteboard',
  component: Whiteboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A whiteboard for sketching and arranging: pen, line, arrow, rectangle, ellipse, text, sticky notes that grow to fit, connectors that re-route when the shapes they join move (straight or elbow, with labels), embeds holding any React node, and comment pins that open your thread in a popover. Select with a click or a marquee; moves snap to neighbours’ edges, centers and spacing (guides and gap sizes show why) and, when on, to the grid; Arrange aligns and distributes. Wheel pans, ⌘/Ctrl + wheel or a pinch zooms; the zoom menu fits the board or the selection and turns on the minimap. `cursors` draws other people’s pointers in board coordinates through Live Cursors. Every change is one undo step; the scene is plain JSON (`{ shapes, pins }`), and the ref exports SVG and PNG. Shapes are one tab stop: Tab walks them, arrows nudge, Enter edits; ? lists every shortcut. Reduced motion: fitting the view jumps instead of easing.',
      },
    },
  },
  args: { readOnly: false, height: 520 },
}
export default meta
type Story = StoryObj<typeof Whiteboard>

const frame = 'w-full max-w-[920px]'

/** Every tool on an empty board. Draw, then press V and drag the shapes around. */
export const Playground: Story = {
  render: (args) => (
    <div className={frame}>
      <Whiteboard {...args} />
    </div>
  ),
}

const FLOW: WhiteboardScene = {
  shapes: [
    { id: 'signup', type: 'sticky', color: 'blue', width: 'medium', x: 40, y: 72, w: 168, h: 96, text: 'Sign up\nEmail or Google' },
    { id: 'verify', type: 'sticky', color: 'accent', width: 'medium', x: 304, y: 72, w: 168, h: 96, text: 'Verify email\nLink valid 24h' },
    { id: 'workspace', type: 'sticky', color: 'green', width: 'medium', x: 568, y: 72, w: 168, h: 96, text: 'Create workspace\nName, invite team' },
    { id: 'expired', type: 'sticky', color: 'red', width: 'medium', x: 304, y: 264, w: 168, h: 80, text: 'Link expired\nResend and retry' },
    { id: 'c1', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'signup' }, to: { shape: 'verify' }, route: 'elbow' },
    { id: 'c2', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'verify' }, to: { shape: 'workspace' }, route: 'elbow', label: 'clicked' },
    { id: 'c3', type: 'connector', color: 'red', width: 'thin', from: { shape: 'verify' }, to: { shape: 'expired' }, route: 'elbow', label: 'after 24h' },
    { id: 'c4', type: 'connector', color: 'red', width: 'thin', from: { shape: 'expired' }, to: { shape: 'signup' }, route: 'elbow' },
    { id: 'activation', type: 'embed', x: 568, y: 232, w: 240, h: 172, title: 'Activation, last 30 days' },
    { id: 'note', type: 'text', color: 'amber', width: 'thin', x: 40, y: 380, text: 'Skip verify for SSO?' },
  ],
  pins: [{ id: 'p1', shape: 'verify', x: 160, y: 4, author: 'Mara Lind', text: 'Could the link last 48 hours? Most retries come the next morning.' }],
}

const activation = (
  <StatCard
    label="Activated"
    value={0.64}
    format={{ style: 'percent' }}
    delta={0.04}
    comparison="vs last month"
    chart={<Sparkline data={[52, 55, 54, 58, 57, 61, 60, 63, 62, 64]} className="h-8" />}
  />
)

/** An onboarding flow: notes joined by connectors that follow them, a live stat card embedded beside them, and a comment pinned to a step. */
export const FlowSketch: Story = {
  name: 'Flow sketch',
  render: (args) => (
    <div className={frame}>
      <Whiteboard {...args} defaultValue={FLOW} embeds={{ activation }} />
    </div>
  ),
}

/** Connectors re-route as their shapes move: drag a note and watch. Opens on the Connector tool; drag from one shape to another. */
export const Connectors: Story = {
  render: (args) => (
    <div className={frame}>
      <Whiteboard {...args} defaultValue={{ shapes: FLOW.shapes.filter((s) => s.type === 'sticky' || s.type === 'connector') }} defaultTool="connector" />
    </div>
  ),
}

const COLORS: WhiteboardColor[] = ['amber', 'blue', 'green', 'accent', 'red']

/** 200 notes in eight columns with the minimap on: pan and zoom stay smooth because offscreen shapes aren't drawn. */
export const LargeBoard: Story = {
  name: 'Large board',
  render: (args) => (
    <div className={frame}>
      <Whiteboard
        {...args}
        defaultMinimap
        defaultValue={{
          shapes: Array.from({ length: 200 }, (_, i) => ({
            id: `n${i}`,
            type: 'sticky' as const,
            color: COLORS[i % COLORS.length]!,
            width: 'medium' as const,
            x: (i % 8) * 240,
            y: Math.floor(i / 8) * 112,
            w: 200,
            h: 88,
            text: `Idea ${i + 1}`,
          })),
        }}
      />
    </div>
  ),
}

/** Other people's cursors, in board coordinates: they stay on what they point at as you pan and zoom. */
export const Presence: Story = {
  render: function Render(args) {
    const [t, setT] = useState(0)
    useEffect(() => {
      const id = setInterval(() => setT(performance.now() / 700), 60)
      return () => clearInterval(id)
    }, [])
    const cursors: WhiteboardCursor[] = [
      { id: 'ana', name: 'Ana', x: 240 + Math.cos(t / 2) * 160, y: 200 + Math.sin(t / 3) * 60 },
      { id: 'theo', name: 'Theo', x: 600 + Math.sin(t / 2.5) * 80, y: 40, message: t % 8 < 4 ? 'Moving this here?' : undefined },
    ]
    return (
      <div className={frame}>
        <Whiteboard {...args} defaultValue={FLOW} defaultTool="select" embeds={{ activation }} cursors={cursors} />
      </div>
    )
  },
}

/** A sketch shared for review: read-only keeps pan, zoom and the pins and drops the tools. */
export const ReadOnly: Story = {
  name: 'Read only',
  render: (args) => (
    <div className={frame}>
      <Whiteboard {...args} readOnly value={FLOW} embeds={{ activation }} label="Onboarding flow" />
    </div>
  ),
}

/** A fresh board, opening on the Rectangle tool. Tab to the board and press Enter to place a shape with the keyboard. */
export const Empty: Story = {
  render: (args) => (
    <div className={frame}>
      <Whiteboard {...args} defaultTool="rectangle" />
    </div>
  ),
}
