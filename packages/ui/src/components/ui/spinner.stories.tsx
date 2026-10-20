import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Specimen } from '../../stories/kit'
import { Button } from './button'
import { Spinner } from './spinner'

const meta: Meta<typeof Spinner> = {
  title: 'UI/Primitives/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'youj\'s LoaderRingIcon: a constant-rate turn with an arc that breathes on a different period, so the loop never visibly repeats. It pauses offscreen and in hidden tabs, and the Speed toolbar scales it. Stroke stays 1.5px at every size. It announces `label` (default "Loading") through role="status"; pass `label={null}` inside something that already announces the wait. Reduced motion holds a still quarter arc on a faint track.',
      },
    },
  },
  args: { size: 16 },
}
export default meta
type Story = StoryObj<typeof Spinner>

export const Hero: Story = {
  render: () => (
    <div className="flex w-full max-w-[360px] items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      <Spinner label={null} className="text-fg-muted" />
      <div className="flex-1">
        <p className="text-ui font-medium text-fg">Syncing 1,204 issues</p>
        <p className="text-ui-sm text-fg-muted">From Linear · about a minute left</p>
      </div>
      <Button variant="ghost" size="sm">
        Cancel
      </Button>
      <span role="status" className="sr-only">
        Syncing issues
      </span>
    </div>
  ),
}

export const Playground: Story = {}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      {[12, 16, 20, 24, 32].map((size) => (
        <Specimen key={size} label={`${size}px`}>
          <Spinner size={size} label={null} />
        </Specimen>
      ))}
      <Specimen label="on accent">
        <span className="grid size-8 place-items-center rounded-md bg-accent text-on-accent">
          <Spinner label={null} />
        </span>
      </Specimen>
      <Specimen label="muted">
        <Spinner label={null} className="text-fg-muted" />
      </Specimen>
    </div>
  ),
}

/** Reduced motion: a still quarter arc on a faint track, still announced. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <div className="flex items-center gap-2 text-ui text-fg-muted">
        <Spinner />
        Loading…
      </div>
    </YoujProvider>
  ),
}
