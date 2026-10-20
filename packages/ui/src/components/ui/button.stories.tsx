import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { GitBranchIcon, MoreHorizontalIcon, XIcon } from '@youj/icons'
import { ArrowRightIcon } from '@youj/icons/components/youj/icons/arrow-right'
import { DownloadIcon } from '@youj/icons/components/youj/icons/download'
import { PlusIcon } from '@youj/icons/components/youj/icons/plus'
import { SendIcon } from '@youj/icons/components/youj/icons/send'
import { TrashIcon } from '@youj/icons/components/youj/icons/trash'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Button, type ButtonProps } from './button'
import { AsyncButton } from './async-button'

const meta: Meta<typeof Button> = {
  title: 'UI/Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI button in six variants and eight sizes on the control-height scale (24/28/32/40px, +8px on touch). The press is a 3% scale in on the instant token and out on fast, so it lands before the finger lifts; reduced motion drops the scale. A leading or trailing icon pulls 2px toward its edge (optical inset). `loading` is the width-stable busy state (for work that runs the button itself, see AsyncButton, which runs the work on press and morphs through Saving… → Saved): it swaps the label for motion\'s LoaderRing in place, sets aria-busy, keeps focus on the button (Base UI focusableWhenDisabled) and announces `loadingLabel` through a live region that exists before it speaks. Youj icons inside play when the button is hovered or keyboard-focused.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'secondary', 'outline', 'ghost', 'danger', 'link'] },
    size: { control: 'select', options: ['xs', 'sm', 'default', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: { children: 'Save changes', variant: 'default', size: 'default', loading: false, disabled: false },
}
export default meta
type Story = StoryObj<typeof Button>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function PublishPanel() {
  const [state, setState] = useState<'idle' | 'published'>('idle')
  const publish = async () => {
    await wait(1600)
    setState('published')
  }
  return (
    <div className="w-full max-w-[440px] overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="flex items-start gap-3 px-5 pt-5 pb-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-band text-fg">
          <GitBranchIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-ui-lg font-medium text-fg">Publish 3 changes to production</p>
          <p className="mt-1 text-ui text-fg-muted">
            {state === 'published' ? 'Live on acme.com. Previous version kept for rollback.' : 'Pricing page, new onboarding copy and the updated OG image.'}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="More actions">
          <MoreHorizontalIcon />
        </Button>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-line bg-canvas px-5 py-3">
        <Button variant="ghost" onClick={() => setState('idle')}>
          Discard
        </Button>
        <Button variant="outline">
          <DownloadIcon />
          Export
        </Button>
        <AsyncButton
          onAction={publish}
          pendingLabel="Publishing…"
          successLabel="Published"
          errorLabel="Couldn’t publish"
          disabled={state === 'published'}
        >
          {state === 'published' ? 'Published' : 'Publish'}
          {state !== 'published' && <SendIcon />}
        </AsyncButton>
      </div>
    </div>
  )
}

/** A real moment: discard, export, publish. Publish morphs to Publishing…, lands on a drawn check, then settles as Published. */
export const Hero: Story = {
  render: () => <PublishPanel />,
}

export const Playground: Story = {}

const variants = ['default', 'secondary', 'outline', 'ghost', 'danger', 'link'] as const
const sizes = ['xs', 'sm', 'default', 'lg'] as const

/** Every variant at every text size. */
export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-[auto_repeat(4,auto)] items-center gap-x-4 gap-y-3">
      <span />
      {sizes.map((s) => (
        <span key={s} className="font-mono text-ui-xs text-fg-muted">
          {s}
        </span>
      ))}
      {variants.map((v) => (
        <div key={v} className="contents">
          <span className="font-mono text-ui-xs text-fg-muted">{v}</span>
          {sizes.map((s) => (
            <div key={s}>
              <Button variant={v} size={s}>
                {v === 'danger' ? 'Delete' : 'Continue'}
              </Button>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}

/** Icons at either end pull 2px toward their edge. Hover or tab to a button to play its youj icon. */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <PlusIcon />
        New project
      </Button>
      <Button variant="secondary">
        Continue
        <ArrowRightIcon />
      </Button>
      <Button variant="outline" size="sm">
        <DownloadIcon />
        Export CSV
      </Button>
      <Button variant="danger">
        <TrashIcon />
        Delete
      </Button>
    </div>
  ),
}

/** Icon-only buttons are square on the control scale and always carry an aria-label. */
export const IconOnly: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const).map((size) => (
        <Button key={size} size={size} variant="outline" aria-label="Add item">
          <PlusIcon />
        </Button>
      ))}
      <Button size="icon" aria-label="Send">
        <SendIcon />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Close">
        <XIcon />
      </Button>
    </div>
  ),
}

function LoadingDemo(props: ButtonProps) {
  const [loading, setLoading] = useState(false)
  return (
    <Button
      {...props}
      loading={loading}
      onClick={async () => {
        setLoading(true)
        await wait(1800)
        setLoading(false)
      }}
    />
  )
}

/** Click any: the label hands over to the spinner in place, focus stays put, and "Saving" is announced. */
export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <LoadingDemo loadingLabel="Saving">Save changes</LoadingDemo>
      <LoadingDemo variant="secondary" loadingLabel="Syncing">
        Sync now
      </LoadingDemo>
      <LoadingDemo variant="outline" size="sm" loadingLabel="Exporting">
        <DownloadIcon />
        Export
      </LoadingDemo>
      <Button loading loadingLabel="Deploying">
        Deploy
      </Button>
      <Button size="icon" variant="outline" loading aria-label="Refresh">
        <DownloadIcon />
      </Button>
    </div>
  ),
}

/** No state to keep: `onClick` returns a promise, and the button is busy until it settles. */
export const AsyncClick: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={() => wait(1800)}>Save changes</Button>
      <Button variant="outline" onClick={() => wait(1800)}>
        <DownloadIcon />
        Export
      </Button>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {variants.map((v) => (
        <Button key={v} variant={v} disabled>
          {v}
        </Button>
      ))}
    </div>
  ),
}

/**
 * Reduced motion: no press scale, instant label/spinner swap, and the spinner holds a still quarter arc.
 * An `onAction` button shows its pending label as text instead of a spinner and swaps states instantly, with no shake.
 */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <div className="flex items-center gap-3">
        <LoadingDemo loadingLabel="Saving">Save changes</LoadingDemo>
        <Button loading>Deploy</Button>
        <AsyncButton variant="outline" onAction={() => wait(1400)} pendingLabel="Syncing…" successLabel="Synced">
          Sync
        </AsyncButton>
      </div>
    </YoujProvider>
  ),
}
