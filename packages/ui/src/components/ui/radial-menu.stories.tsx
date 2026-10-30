import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CodeIcon, CopyIcon, FrameIcon, LinkIcon, PenToolIcon, PencilIcon, ScissorsIcon, ShapesIcon, ShareIcon, StarIcon, TrashIcon, TypeIcon } from '@youj/icons'
import { YoujProvider } from '@youj/core'
import { RadialMenu, type RadialMenuItem } from './radial-menu'

const meta: Meta<typeof RadialMenu> = {
  title: 'UI/Overlays/RadialMenu',
  component: RadialMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A pie menu: a ring of actions that fans out around the pointer, one icon per circular slot, with a hub that names the highlighted one. `trigger="hold"` opens on a held press, so dragging toward a slot and letting go picks it in one gesture (a release in the hub leaves it open to click); `click` opens on a click and `contextmenu` on a right-click. The slot is picked by the pointer’s angle from the center. `startAngle` and `sweep` make a full ring or an arc, `radius` sets its size, and near an edge the ring shifts inward or turns into a half ring facing away. It is a menu of menuitems: Enter, Space or Shift+F10 open it on the trigger, the arrow keys go round, Enter chooses, Escape closes and the choice is announced. Reduced motion: it opens and closes at once.',
      },
    },
  },
  args: { trigger: 'hold', radius: 84, startAngle: 0, sweep: 360, sound: true, disabled: false },
  argTypes: {
    trigger: { control: 'inline-radio', options: ['hold', 'click', 'contextmenu'] },
    radius: { control: { type: 'range', min: 56, max: 140, step: 4 } },
    startAngle: { control: { type: 'range', min: -180, max: 180, step: 15 } },
    sweep: { control: { type: 'range', min: 90, max: 360, step: 15 } },
    items: { control: false },
  },
}
export default meta
type Story = StoryObj<typeof RadialMenu>

const edit: RadialMenuItem[] = [
  { id: 'copy', label: 'Copy', icon: <CopyIcon /> },
  { id: 'cut', label: 'Cut', icon: <ScissorsIcon /> },
  { id: 'link', label: 'Copy link', icon: <LinkIcon /> },
  { id: 'share', label: 'Share', icon: <ShareIcon /> },
  { id: 'star', label: 'Favorite', icon: <StarIcon /> },
  { id: 'rename', label: 'Rename', icon: <PencilIcon /> },
  { id: 'delete', label: 'Delete', icon: <TrashIcon /> },
]

/** The last choice, under the surface, so the stories show what was picked. */
function Picked({ value, hint }: { value: string | null; hint: string }) {
  return (
    <p className="pointer-events-none text-center text-ui text-fg-muted" aria-hidden>
      {value ? (
        <>
          Picked <span className="font-medium text-fg">{value}</span>
        </>
      ) : (
        hint
      )}
    </p>
  )
}

export const Playground: Story = {
  render: (args) => {
    const [picked, setPicked] = useState<string | null>(null)
    const hint = args.trigger === 'click' ? 'Click anywhere in the box' : args.trigger === 'contextmenu' ? 'Right-click anywhere in the box' : 'Press and hold anywhere in the box, drag to a slot, let go'
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas p-6 text-fg">
        <RadialMenu
          {...args}
          items={edit}
          onSelect={(item) => setPicked(item.label)}
          aria-label={`Selection. ${hint}`}
          className="grid h-80 w-full max-w-xl place-items-center rounded-xl border border-dashed border-line-strong bg-surface"
        >
          <Picked value={picked} hint={hint} />
        </RadialMenu>
      </div>
    )
  },
}

const tools: RadialMenuItem[] = [
  { id: 'frame', label: 'Frame', icon: <FrameIcon /> },
  { id: 'text', label: 'Text', icon: <TypeIcon /> },
  { id: 'shape', label: 'Shape', icon: <ShapesIcon /> },
  { id: 'pen', label: 'Pen', icon: <PenToolIcon /> },
  { id: 'code', label: 'Code', icon: <CodeIcon /> },
]

/** Hold anywhere on a design canvas to pick a tool: drag toward it and let go. */
export const CanvasTools: Story = {
  name: 'Canvas tools',
  render: (args) => {
    const [tool, setTool] = useState<RadialMenuItem>(tools[0] as RadialMenuItem)
    return (
      <div className="flex min-h-dvh flex-col bg-canvas text-fg">
        <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5 text-ui">
          <span className="font-semibold">Landing page</span>
          <span className="ms-auto flex items-center gap-2 text-fg-muted">
            <span className="grid size-6 place-items-center rounded-md bg-selected text-fg [&_svg]:size-4">{tool.icon}</span>
            {tool.label}
          </span>
        </header>
        <RadialMenu
          {...args}
          items={tools}
          onSelect={setTool}
          label="Tools"
          aria-label="Canvas. Press and hold anywhere on the canvas, or press Enter, to pick a tool."
          className="relative flex-1 bg-well"
        >
          <div className="pointer-events-none absolute inset-0 m-auto h-40 w-64 rounded-lg border border-line bg-surface shadow-sm" aria-hidden />
          <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-ui-sm text-fg-subtle" aria-hidden>
            Press and hold anywhere on the canvas
          </p>
        </RadialMenu>
      </div>
    )
  },
  args: { trigger: 'hold', startAngle: -72 },
}

/** Right-click a file for its actions; with the button held, let go on one to pick it. */
export const ContextMenu: Story = {
  name: 'Context menu',
  render: (args) => {
    const [picked, setPicked] = useState<string | null>(null)
    const files = ['Q3 report.pdf', 'Brand guide.fig', 'Roadmap.md', 'Invoices.csv']
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas p-6 text-fg">
        <div className="flex w-full max-w-md flex-col gap-3">
          <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {files.map((file) => (
              <li key={file}>
                <RadialMenu
                  {...args}
                  items={edit}
                  label={file}
                  onSelect={(item) => setPicked(`${item.label} · ${file}`)}
                  aria-label={`${file}. Right-click, or press Shift+F10, for actions.`}
                  className="flex items-center gap-3 px-4 py-3 text-ui hover:bg-hover"
                >
                  <span className="size-2 rounded-full bg-accent" aria-hidden />
                  {file}
                </RadialMenu>
              </li>
            ))}
          </ul>
          <Picked value={picked} hint="Right-click a file" />
        </div>
      </div>
    )
  },
  args: { trigger: 'contextmenu', radius: 80 },
}

/** A half ring along the bottom edge: the actions fan upward from a button in a bottom bar. */
export const Arc: Story = {
  render: (args) => {
    const [picked, setPicked] = useState<string | null>(null)
    return (
      <div className="flex min-h-dvh flex-col bg-canvas text-fg">
        <div className="grid flex-1 place-items-center p-6">
          <Picked value={picked} hint="Click + in the bar below" />
        </div>
        <footer className="flex justify-center border-t border-line bg-surface py-3">
          <RadialMenu
            {...args}
            items={edit.slice(0, 5)}
            onSelect={(item) => setPicked(item.label)}
            label="Create"
            aria-label="Create"
            className="grid size-12 place-items-center rounded-full bg-accent text-ui-lg font-semibold text-on-accent shadow-md"
          >
            +
          </RadialMenu>
        </footer>
      </div>
    )
  },
  args: { trigger: 'click', startAngle: -90, sweep: 180, radius: 96 },
}

/** With reduced motion the ring is there at once and gone at once; choosing works the same. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  render: (args) => {
    const [picked, setPicked] = useState<string | null>(null)
    return (
      <YoujProvider reducedMotion="always">
        <div className="grid min-h-dvh place-items-center bg-canvas p-6 text-fg">
          <RadialMenu
            {...args}
            items={tools}
            onSelect={(item) => setPicked(item.label)}
            label="Tools"
            aria-label="Tools. Click anywhere in the box"
            className="grid h-72 w-full max-w-lg place-items-center rounded-xl border border-dashed border-line-strong bg-surface"
          >
            <Picked value={picked} hint="Click anywhere in the box" />
          </RadialMenu>
        </div>
      </YoujProvider>
    )
  },
  args: { trigger: 'click' },
}
