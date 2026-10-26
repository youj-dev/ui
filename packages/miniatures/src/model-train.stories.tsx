import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { MiniatureModelTrain, modelTrain } from './model-train'
import { Showroom } from './stories/showroom'

const meta = {
  title: 'Miniatures/Model train',
  component: MiniatureModelTrain,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureModelTrain>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={modelTrain} mode={args.mode} render={(p) => <MiniatureModelTrain {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** As a progress indicator: a deploy pipeline drives `progress`, the train runs its trip from one station to the next with it, and `done` brings it in with the platform lamps turning green. A still picture, so it takes no focus from the page. */
function Deploy({ again }: { again: () => void }) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => Math.min(1, p + 0.06 + Math.random() * 0.06)), 900)
    return () => clearInterval(timer)
  }, [])
  const done = progress >= 1
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <MiniatureModelTrain interactive={false} size={320} progress={progress} done={done} aria-label={`Deploying, ${Math.round(progress * 100)} percent`} />
      <span aria-live="polite">{done ? 'Deployed' : `Deploying ${Math.round(progress * 100)}%`}</span>
      <button type="button" onClick={again} style={{ font: 'inherit', padding: '6px 12px', borderRadius: 6, border: '1px solid currentColor', background: 'none', color: 'inherit', cursor: 'pointer' }}>
        Deploy again
      </button>
    </div>
  )
}
function Deploys() {
  const [run, setRun] = useState(0)
  return <Deploy key={run} again={() => setRun((r) => r + 1)} />
}
export const Pipeline: Story = { render: () => <Deploys /> }
