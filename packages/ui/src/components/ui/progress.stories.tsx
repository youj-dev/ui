import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileTextIcon, ImageIcon } from '@youj/icons'
import { YoujProvider, ThemeScope } from '@youj/core/lib/youj/provider'
import { Specimen } from '../../stories/kit'
import { Button } from './button'
import { Progress, ProgressLabel, ProgressValue } from './progress'

const meta: Meta<typeof Progress> = {
  title: 'UI/Primitives/Progress',
  component: Progress,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI progress (role="progressbar" with a formatted aria-valuetext). The bar is full width and scales on X (transform only) with k.spring(\'smooth\'): updates glide, and a burst of updates retargets the spring with its velocity intact rather than restarting. It fills from the inline start, so RTL fills right to left. `value={null}` is indeterminate: a band sweeps the track on an emphasized loop. Reduced motion: values jump, and the indeterminate band becomes still stripes.',
      },
    },
  },
  args: { value: 64 },
}
export default meta
type Story = StoryObj<typeof Progress>

const files = [
  { name: 'brand-guidelines.pdf', size: '4.2 MB', icon: FileTextIcon, rate: 9 },
  { name: 'hero@2x.png', size: '1.8 MB', icon: ImageIcon, rate: 17 },
  { name: 'pitch-deck.key', size: '38 MB', icon: FileTextIcon, rate: 3 },
]

function Uploads() {
  const [progress, setProgress] = useState(() => files.map(() => 0))
  const [run, setRun] = useState(0)
  useEffect(() => {
    setProgress(files.map(() => 0))
    // Irregular chunks, like a real network: the spring smooths the steps.
    const id = setInterval(() => {
      setProgress((cur) => cur.map((v, i) => Math.min(100, v + Math.random() * files[i]!.rate)))
    }, 420)
    return () => clearInterval(id)
  }, [run])
  const done = progress.every((v) => v >= 100)
  return (
    <div className="w-full max-w-[440px] rounded-xl border border-line bg-surface p-2">
      {files.map((f, i) => (
        <div key={f.name} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-band text-fg-muted">
            <f.icon className="size-4" aria-hidden />
          </div>
          <Progress value={Math.round(progress[i]!)} className="gap-y-1.5">
            <ProgressLabel className="truncate">{f.name}</ProgressLabel>
            <ProgressValue />
          </Progress>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-line px-3 pt-2.5 pb-1">
        <p role="status" className="text-ui-sm text-fg-muted">
          {done ? 'All files uploaded.' : ''}
        </p>
        <Button size="sm" variant="ghost" onClick={() => setRun((r) => r + 1)}>
          Restart
        </Button>
      </div>
    </div>
  )
}

/** Uploads arriving in irregular chunks; the spring turns the steps into a glide. */
export const Hero: Story = {
  render: () => <Uploads />,
}

export const Playground: Story = {
  render: (args) => (
    <Progress {...args} className="w-80">
      <ProgressLabel>Storage</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
}

export const States: Story = {
  render: () => (
    <div className="grid w-80 gap-6">
      <Specimen label="empty">
        <Progress value={0} aria-label="Empty" />
      </Specimen>
      <Specimen label="partial">
        <Progress value={37} aria-label="Partial" />
      </Specimen>
      <Specimen label="complete">
        <Progress value={100} aria-label="Complete" />
      </Specimen>
      <Specimen label="indeterminate">
        <Progress value={null} aria-label="Preparing" />
      </Specimen>
      <Specimen label="formatted (GB of 10 GB)">
        <Progress value={7.4} max={10} format={{ style: 'unit', unit: 'gigabyte', maximumFractionDigits: 1 }}>
          <ProgressLabel>Storage</ProgressLabel>
          <ProgressValue />
        </Progress>
      </Specimen>
    </div>
  ),
}

export const RightToLeft: Story = {
  render: () => (
    <ThemeScope dir="rtl">
      <div dir="rtl" className="w-80">
        <Progress value={64}>
          <ProgressLabel>تحميل</ProgressLabel>
          <ProgressValue />
        </Progress>
      </div>
    </ThemeScope>
  ),
}

function TicksDemo() {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setValue((v) => (v >= 100 ? 0 : Math.min(100, v + Math.random() * 9))), 520)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="grid w-96 gap-6 rounded-xl border border-line bg-surface p-5">
      <Progress variant="ticks" value={Math.round(value)}>
        <ProgressLabel>Rendering frames</ProgressLabel>
        <ProgressValue />
      </Progress>
      <Progress variant="ticks" value={null}>
        <ProgressLabel>Preparing export</ProgressLabel>
      </Progress>
    </div>
  )
}

/** variant="ticks": fine ticks light from the start, the next few warming up; indeterminate, a wave travels. */
export const Ticks: Story = {
  render: () => <TicksDemo />,
}

export const TicksSizesAndTones: Story = {
  render: () => (
    <div className="grid w-80 gap-6">
      <Specimen label="sm · 60 ticks">
        <Progress variant="ticks" size="sm" ticks={60} value={42} aria-label="Small" />
      </Specimen>
      <Specimen label="default · neutral">
        <Progress variant="ticks" tone="neutral" value={58} aria-label="Neutral" />
      </Specimen>
      <Specimen label="lg · 24 ticks · warning">
        <Progress variant="ticks" size="lg" ticks={24} tone="warning" value={81} aria-label="Large" />
      </Specimen>
      <Specimen label="complete · success">
        <Progress variant="ticks" tone="success" value={100} aria-label="Done" />
      </Specimen>
      <Specimen label="right to left">
        <ThemeScope dir="rtl">
          <div dir="rtl">
            <Progress variant="ticks" value={35} aria-label="RTL" />
          </div>
        </ThemeScope>
      </Specimen>
      <Specimen label="reduced motion · indeterminate">
        <YoujProvider reducedMotion="always">
          <Progress variant="ticks" value={null} aria-label="Still" />
        </YoujProvider>
      </Specimen>
    </div>
  ),
}

/** Reduced motion: values jump; indeterminate is still stripes. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <div className="grid w-80 gap-6">
        <Uploads />
        <Progress value={null} aria-label="Preparing" />
      </div>
    </YoujProvider>
  ),
}
