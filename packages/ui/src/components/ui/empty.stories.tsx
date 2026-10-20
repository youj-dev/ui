import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlertTriangleIcon } from '@youj/icons/components/youj/icons/alert-triangle'
import { InboxIcon } from '@youj/icons/components/youj/icons/inbox'
import { PlusIcon } from '@youj/icons/components/youj/icons/plus'
import { SearchIcon } from '@youj/icons/components/youj/icons/search'
import { UploadIcon } from '@youj/icons/components/youj/icons/upload'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Button } from './button'
import { AsyncButton } from './async-button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './empty'
import { Kbd } from './kbd'

const meta: Meta<typeof Empty> = {
  title: 'UI/Layout/EmptyState',
  component: Empty,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'An empty state: what isn\'t here yet, why, and what to do next. `EmptyMedia variant="icon"` sets the icon on a tile over two plates that fan out when it appears (a neat stack opening to 8° either side on the emphasized curve, via @starting-style) and open a little further while the header is hovered. The header is the youj icon\'s trigger group, so an animated icon inside plays on hover too (an inbox catches a message, a lens glints). Actions stay out of the header, so their own icons play only with their buttons. Reduced motion shows the plates fanned and still, and plays nothing.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Empty>

/** No deployments yet, in the frame where they would be. Hover the header: the plates open and the icon plays. */
export const Hero: Story = {
  render: () => (
    <div className="w-full max-w-[640px] rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-ui font-medium text-fg">Deployments</p>
        <p className="text-ui-sm text-fg-muted">acme / web</p>
      </div>
      <Empty className="py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UploadIcon />
          </EmptyMedia>
          <EmptyTitle>No deployments yet</EmptyTitle>
          <EmptyDescription>Push to a connected branch, or deploy from your machine with the CLI. Previews appear here as they build.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>
            <PlusIcon />
            Import project
          </Button>
          <Button variant="outline">Read the docs</Button>
        </EmptyContent>
      </Empty>
    </div>
  ),
}

/** No results: the query is echoed back, with a way out. */
export const NoResults: Story = {
  render: () => (
    <Empty className="w-full max-w-[480px] border border-dashed border-line">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon />
        </EmptyMedia>
        <EmptyTitle>No issues match “billing webhook retries”</EmptyTitle>
        <EmptyDescription>
          Check the spelling, or search all teams with <Kbd>⌘</Kbd> <Kbd>K</Kbd>.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          Clear filters
        </Button>
      </EmptyContent>
    </Empty>
  ),
}

/** Inbox zero: a quiet, positive empty state with no call to action. */
export const Caught: Story = {
  name: 'All caught up',
  render: () => (
    <Empty className="w-full max-w-[420px]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>You're all caught up</EmptyTitle>
        <EmptyDescription>New mentions and assignments will land here.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
}

/** An error state with a retry that runs itself: the Button's onAction shows Retrying…, then the outcome. */
export const LoadError: Story = {
  render: () => {
    function Failed() {
      const [attempts, setAttempts] = useState(0)
      return (
        <Empty className="w-full max-w-[480px] border border-line bg-surface">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertTriangleIcon className="text-warning" />
            </EmptyMedia>
            <EmptyTitle>Couldn’t load deployments</EmptyTitle>
            <EmptyDescription>The API timed out after 10 seconds. Your deployments are fine; this is only the list.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <AsyncButton
              variant="outline"
              onAction={async () => {
                await new Promise((r) => setTimeout(r, 1200))
                setAttempts((a) => a + 1)
                if (attempts === 0) throw new Error('still down')
              }}
              pendingLabel="Retrying…"
              successLabel="Loaded"
              errorLabel="Still failing"
            >
              Try again
            </AsyncButton>
          </EmptyContent>
        </Empty>
      )
    }
    return <Failed />
  },
}

/** Reduced motion: the plates rest fanned and still; nothing plays on hover. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <Empty className="w-full max-w-[420px] border border-dashed border-line">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>You're all caught up</EmptyTitle>
          <EmptyDescription>New mentions and assignments will land here.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </YoujProvider>
  ),
}
