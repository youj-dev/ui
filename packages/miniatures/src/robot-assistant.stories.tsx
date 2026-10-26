import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { MiniatureRobotAssistant, robotAssistant } from './robot-assistant'
import { Showroom } from './stories/showroom'

const meta = {
  title: 'Miniatures/Robot assistant',
  component: MiniatureRobotAssistant,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureRobotAssistant>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={robotAssistant} mode={args.mode} render={(p) => <MiniatureRobotAssistant {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** As a progress indicator: a streamed answer drives `progress` while it thinks, and `done` ends it with a smile. A still picture, so it takes no focus from the page. */
function Answer({ onAgain }: { onAgain: () => void }) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => Math.min(1, p + 0.06 + Math.random() * 0.06)), 500)
    return () => clearInterval(timer)
  }, [])
  const done = progress >= 1
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <MiniatureRobotAssistant interactive={false} size={220} progress={progress} done={done} aria-label={done ? 'Answer ready' : `Writing the answer, ${Math.round(progress * 100)} percent`} />
      <span aria-live="polite">{done ? 'Answer ready' : `Writing the answer ${Math.round(progress * 100)}%`}</span>
      <button type="button" onClick={onAgain} style={{ font: 'inherit', padding: '6px 12px', borderRadius: 6, border: '1px solid currentColor', background: 'none', color: 'inherit', cursor: 'pointer' }}>
        Ask again
      </button>
    </div>
  )
}
function Streaming() {
  const [run, setRun] = useState(0)
  return <Answer key={run} onAgain={() => setRun((r) => r + 1)} />
}
export const Progress: Story = { render: () => <Streaming /> }
