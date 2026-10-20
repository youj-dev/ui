import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { StageRail, type Stage, type StageRailProps } from './stage-rail'

const meta: Meta<StageRailProps> = {
  title: 'UI/Data/Stage Rail',
  component: StageRail,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A pipeline run as one segmented rail. Each stage is a key in a recessed track with its name, its live duration (mono, ticking while it runs), a run of cells that fill as it progresses, and its state in words: queued, running, passed, failed or skipped. The cells of every stage share one line, so the run reads as a single bar: ink where work is done, the accent where it is under way, the danger tone where it broke, hatched where a stage was skipped. It is one toggle group: arrow keys rove, Home and End jump, and the picked stage’s key glides into place. Stage changes are announced politely. Reduced motion: cells change in place, nothing breathes, the key jumps.',
      },
    },
  },
  argTypes: {
    segments: { control: { type: 'range', min: 4, max: 24, step: 1 } },
  },
  decorators: [(Story) => <div className="w-[36rem] max-w-full">{Story()}</div>],
}
export default meta
type Story = StoryObj<StageRailProps>

const at = (secondsAgo: number) => Date.now() - secondsAgo * 1000

/** A run in flight: build passed, test is running toward its usual time, deploy waits. */
export const Hero: Story = {
  render: function Render(args) {
    const [stages, setStages] = useState<Stage[]>(() => [
      { id: 'build', name: 'Build', status: 'passed', duration: 72_000 },
      { id: 'test', name: 'Test', status: 'running', startedAt: at(38), estimate: 64_000 },
      { id: 'deploy', name: 'Deploy', status: 'queued', estimate: 30_000 },
    ])
    // Test passes when its estimate runs out; deploy starts, then passes.
    useEffect(() => {
      const timer = setInterval(() => {
        setStages((list) => {
          const running = list.find((s) => s.status === 'running')
          if (!running || Date.now() - (running.startedAt ?? 0) < (running.estimate ?? 0)) return list
          const index = list.indexOf(running)
          return list.map((s, i) =>
            i === index ? { ...s, status: 'passed', duration: Date.now() - (s.startedAt ?? 0) } : i === index + 1 ? { ...s, status: 'running', startedAt: Date.now() } : s,
          )
        })
      }, 500)
      return () => clearInterval(timer)
    }, [])
    return <StageRail {...args} stages={stages} />
  },
}

/** Every state at once: passed, failed where it broke, skipped after it, and the ones still waiting. */
export const States: Story = {
  args: {
    stages: [
      { id: 'lint', name: 'Lint', status: 'passed', duration: 14_000 },
      { id: 'build', name: 'Build', status: 'passed', duration: 81_000 },
      { id: 'test', name: 'Test', status: 'failed', duration: 52_000, progress: 0.58 },
      { id: 'deploy', name: 'Deploy', status: 'skipped' },
      { id: 'smoke', name: 'Smoke', status: 'queued' },
    ],
    segments: 8,
  },
  decorators: [(Story) => <div className="w-[48rem] max-w-full">{Story()}</div>],
}

/** Re-run the same stages quickly: each change washes through the cells from the stage's start. */
export const Rerun: Story = {
  render: function Render(args) {
    const [run, setRun] = useState(0)
    const variants: Stage[][] = [
      [
        { id: 'build', name: 'Build', status: 'passed', duration: 64_000 },
        { id: 'test', name: 'Test', status: 'passed', duration: 91_000 },
        { id: 'deploy', name: 'Deploy', status: 'passed', duration: 33_000 },
      ],
      [
        { id: 'build', name: 'Build', status: 'passed', duration: 70_000 },
        { id: 'test', name: 'Test', status: 'failed', duration: 40_000, progress: 0.45 },
        { id: 'deploy', name: 'Deploy', status: 'skipped' },
      ],
      [
        { id: 'build', name: 'Build', status: 'running', startedAt: at(20), estimate: 70_000 },
        { id: 'test', name: 'Test', status: 'queued' },
        { id: 'deploy', name: 'Deploy', status: 'queued' },
      ],
    ]
    return (
      <div className="flex flex-col gap-4">
        <StageRail {...args} stages={variants[run % variants.length]!} />
        <div className="flex gap-2">
          {['Passed', 'Failed', 'Running'].map((name, i) => (
            <Button key={name} size="sm" variant={run === i ? 'secondary' : 'outline'} onClick={() => setRun(i)}>
              {name}
            </Button>
          ))}
        </div>
      </div>
    )
  },
}

/** Reduced motion: the cells change in place, the running cell holds still, and the key jumps. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  args: {
    stages: [
      { id: 'build', name: 'Build', status: 'passed', duration: 72_000 },
      { id: 'test', name: 'Test', status: 'running', startedAt: at(38), estimate: 64_000 },
      { id: 'deploy', name: 'Deploy', status: 'queued' },
    ],
  },
  parameters: { docs: { description: { story: 'Set the toolbar’s Motion to reduced: the rail is drawn in place and the live duration still ticks.' } } },
}
