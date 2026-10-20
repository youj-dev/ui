import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlertTriangleIcon, SparklesIcon } from '@youj/icons'
import { Badge } from './badge'
import { Banner, BannerAction, BannerTitle } from './banner'
import { Button } from './button'

const meta: Meta<typeof Banner> = {
  title: 'UI/Layout/Banner',
  component: Banner,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'An announcement bar across the top of a page or app: a launch, a maintenance window, a trial running out. A named region, full bleed, its message centered. The action’s arrow nudges out and back on hover or focus; dismissing collapses the bar (motion’s Collapse) so the page glides up, and focus moves on. Reduced motion: it is removed at once.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Banner>

function PageBehind() {
  return (
    <div className="flex h-12 items-center justify-between border-b border-line px-5">
      <span className="text-ui font-semibold text-fg">Northwind</span>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">
          Docs
        </Button>
        <Button size="sm">Sign in</Button>
      </div>
    </div>
  )
}

/** A launch over a site header: dismiss it and the header glides up. Bring it back to see it open. */
export const Hero: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div className="min-h-[320px] bg-canvas">
        <Banner variant="inverse" open={open} onOpenChange={setOpen}>
          <Badge variant="outline" className="hidden border-current/30 text-current sm:inline-flex">
            New
          </Badge>
          <BannerTitle>
            <strong>Deploy previews</strong> <span>now comment on every pull request.</span>
          </BannerTitle>
          <BannerAction href="#changelog">Read the changelog</BannerAction>
        </Banner>
        <PageBehind />
        <div className="p-5">
          <Button variant="outline" size="sm" disabled={open} onClick={() => setOpen(true)}>
            Show the banner again
          </Button>
        </div>
      </div>
    )
  },
}

/** The four looks. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 bg-canvas py-4">
      <Banner aria-label="Default announcement" dismissible>
        <BannerTitle>
          <strong>Youj 1.0</strong> <span>is here, with 90 components.</span>
        </BannerTitle>
        <BannerAction href="#notes">See what’s new</BannerAction>
      </Banner>
      <Banner aria-label="Inverse announcement" variant="inverse" dismissible>
        <BannerTitle>Join us for Ship Week, October 6–10.</BannerTitle>
        <BannerAction href="#register">Register</BannerAction>
      </Banner>
      <Banner aria-label="Accent announcement" variant="accent" icon={<SparklesIcon trigger="mount" />} dismissible>
        <BannerTitle>
          <strong>Pro trial:</strong> <span>12 days left.</span>
        </BannerTitle>
        <BannerAction href="#upgrade">Upgrade</BannerAction>
      </Banner>
      <Banner aria-label="Maintenance" variant="warning" icon={<AlertTriangleIcon trigger="mount" className="text-warning-text" />}>
        <BannerTitle>
          <strong>Scheduled maintenance</strong> <span>Sunday 02:00–02:30 UTC. Deploys will queue.</span>
        </BannerTitle>
      </Banner>
    </div>
  ),
}

/** A long message wraps and stays centered; the dismiss button keeps its corner. */
export const LongContent: Story = {
  render: () => (
    <div className="mx-auto max-w-[420px] bg-canvas py-4">
      <Banner dismissible>
        <BannerTitle>
          <strong>We’ve updated our terms.</strong>{' '}
          <span>The changes take effect on November 1 and cover data residency, sub-processors and the new AI features.</span>
        </BannerTitle>
        <BannerAction href="#terms">Review the changes</BannerAction>
      </Banner>
    </div>
  ),
}
