import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { MiniatureChemistryBench, chemistryBench } from './chemistry-bench'
import { Showroom } from './stories/showroom'

const meta = {
  title: 'Miniatures/Chemistry bench',
  component: MiniatureChemistryBench,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureChemistryBench>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={chemistryBench} mode={args.mode} render={(p) => <MiniatureChemistryBench {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** One generation: its progress climbs in uneven steps until it's done. */
function Generation({ again }: { again: () => void }) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => Math.min(1, p + 0.05 + Math.random() * 0.05)), 700)
    return () => clearInterval(timer)
  }, [])
  const done = progress >= 1
  const percent = Math.round(progress * 100)
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <MiniatureChemistryBench interactive={false} size={260} progress={progress} done={done} aria-label={done ? 'Generated' : `Generating, ${percent} percent`} />
      <span aria-live="polite">{done ? 'Generated' : `Generating ${percent}%`}</span>
      <button type="button" onClick={again} style={{ font: 'inherit', padding: '6px 12px', borderRadius: 6, border: '1px solid currentColor', background: 'none', color: 'inherit', cursor: 'pointer' }}>
        Generate again
      </button>
    </div>
  )
}

/** As a progress indicator: a generation drives `progress`, the distillate fills to it, and `done` puts the burner out. A still picture, so it takes no focus from the page. */
function Generations() {
  const [run, setRun] = useState(0)
  return <Generation key={run} again={() => setRun((r) => r + 1)} />
}
export const Progress: Story = { render: () => <Generations /> }
