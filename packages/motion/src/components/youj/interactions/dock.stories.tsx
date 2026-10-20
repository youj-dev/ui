import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Calendar, Compass, Folder, Image, Mail, MessageCircle, Music, Settings, SquareTerminal } from 'lucide-react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Dock, type DockItem, type DockProps } from './dock'

type Args = Pick<DockProps, 'size' | 'magnification' | 'distance'>

const meta: Meta<Args> = {
  title: 'Motion/Interactions/Dock',
  component: Dock as never,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A macOS-style magnifying dock. One spring smooths the pointer and one fades the effect; every icon’s scale and offset is a pure function of those, so the row stays coherent and the backplate widens with it through a clip-path. Transform-only. It is a `toolbar` with a roving tab stop: arrow keys, Home and End move focus, and focus magnifies like hover. Tooltips show on hover and focus; the active item carries a dot that travels between items. Reduced motion: no magnification, instant tooltips and indicator.',
      },
    },
  },
  argTypes: {
    size: { control: { type: 'range', min: 32, max: 72, step: 4 } },
    magnification: { control: { type: 'range', min: 1, max: 2.4, step: 0.1 } },
    distance: { control: { type: 'range', min: 60, max: 280, step: 10 } },
  },
  args: { size: 48, magnification: 1.6, distance: 140 },
}
export default meta
type Story = StoryObj<Args>

const APPS: DockItem[] = [
  { id: 'files', label: 'Files', icon: <Folder /> },
  { id: 'browser', label: 'Browser', icon: <Compass /> },
  { id: 'mail', label: 'Mail', icon: <Mail /> },
  { id: 'messages', label: 'Messages', icon: <MessageCircle /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar /> },
  { id: 'photos', label: 'Photos', icon: <Image /> },
  { id: 'music', label: 'Music', icon: <Music /> },
  { id: 'terminal', label: 'Terminal', icon: <SquareTerminal /> },
  { id: 'settings', label: 'Settings', icon: <Settings /> },
]

function Desktop(args: Args) {
  const [app, setApp] = useState('mail')
  const current = APPS.find((a) => a.id === app)!
  const [narrow] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches)
  return (
    <div className="relative flex h-screen min-h-[560px] flex-col items-center overflow-hidden bg-canvas bg-[radial-gradient(90%_70%_at_50%_0%,color-mix(in_oklch,var(--color-accent)_18%,transparent),transparent)]">
      <div className="mx-4 mt-16 w-[calc(100%-2rem)] max-w-[560px] overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex h-9 items-center gap-1.5 border-b border-line px-3">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="ml-3 text-xs text-fg-muted">{current.label}</span>
        </div>
        <div className="grid h-52 place-items-center text-sm text-fg-subtle">
          <span className="inline-flex items-center gap-2 [&>svg]:size-4">
            {current.icon}
            {current.label} is open
          </span>
        </div>
      </div>
      <div className="absolute bottom-6">
        <Dock {...args} items={narrow ? APPS.slice(0, 6) : APPS} value={app} onValueChange={setApp} label="Applications" />
      </div>
    </div>
  )
}

/** A desktop. Sweep across the dock, click to switch apps, or Tab in and use the arrow keys. */
export const Hero: Story = {
  render: (args) => <Desktop {...args} />,
}

export const Playground: Story = {
  parameters: { layout: 'centered' },
  render: function Render(args) {
    const [value, setValue] = useState('files')
    return (
      <div className="pt-24">
        <Dock {...args} items={APPS.slice(0, 6)} value={value} onValueChange={setValue} />
      </div>
    )
  },
}

/** Reduced motion: icons stay at rest size; tooltips and the indicator change instantly. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Desktop {...args} />
    </YoujProvider>
  ),
}
