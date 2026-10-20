import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRightIcon, SparklesIcon } from '@youj/icons'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Alert, AlertAction, AlertDescription, AlertTitle, type AlertProps } from './alert'
import { Button } from './button'

const meta: Meta<AlertProps> = {
  title: 'UI/Layout/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A status message in four severities. Each tints the surface and brings its youj icon, which plays once as the alert appears (info drops its dot, success draws its ring and check, warning rocks, destructive shakes). Warning and destructive interrupt (role="alert"); info and success are polite (role="status"); pass `role` to override. `dismissible` (or `onOpenChange`) adds a dismiss button: the alert collapses through motion\'s Collapse, so what follows glides up, and if focus was inside it moves on to the next tabbable element instead of falling to <body>. Controlled with `open`. Reduced motion shows the icons at rest and removes the alert at once.',
      },
    },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['info', 'success', 'warning', 'danger'] },
    dismissible: { control: 'boolean' },
  },
  args: { variant: 'warning', dismissible: true },
}
export default meta
type Story = StoryObj<AlertProps>

/** A billing page: a dismissible warning with an action above the plan details. Dismiss it and the page below glides up. */
export const Hero: Story = {
  render: () => (
    <div className="flex w-full max-w-[600px] flex-col">
      {/* Spacing as the alert's own margin, so it collapses away with it. */}
      <Alert variant="warning" dismissible className="mb-4">
        <AlertTitle>You’ve used 82% of this month’s bandwidth</AlertTitle>
        <AlertDescription>At 100% we keep serving traffic and bill overage at $0.15 / GB. Raise the limit or upgrade to avoid surprises.</AlertDescription>
        <AlertAction>
          <Button size="sm">Upgrade to Pro</Button>
          <Button size="sm" variant="ghost">
            Set a spend limit
          </Button>
        </AlertAction>
      </Alert>
      <div className="rounded-xl border border-line bg-surface p-5">
        <p className="text-ui-lg font-semibold text-fg">Hobby plan</p>
        <p className="mt-1 text-ui text-fg-muted">100 GB bandwidth · 1 concurrent build · community support</p>
      </div>
    </div>
  ),
}

/**
 * An inline insight: one line under a figure, a sparkle in place of the severity icon, and a link to the
 * reasoning at the row's end. The second sits quieter, on the band, for a panel that already has colour in it.
 */
export const Insight: Story = {
  render: () => (
    <div className="flex w-full max-w-[480px] flex-col gap-3">
      {[
        { text: 'Preview builds are up 18% this week.', quiet: false },
        { text: 'Cache hits fell to 71% after Tuesday’s lockfile change.', quiet: true },
      ].map(({ text, quiet }) => (
        <Alert
          key={text}
          icon={<SparklesIcon />}
          className={quiet ? 'items-center border-line-subtle bg-band [--alert-icon:var(--color-accent)]' : 'items-center'}
        >
          <AlertDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex-1 text-fg">{text}</span>
            <a href="#insight" className="inline-flex items-center gap-1 font-medium no-underline! hover:underline!">
              See why
              <ArrowRightIcon className="size-3.5 rtl:-scale-x-100" />
            </a>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  ),
}

/** The four severities, with and without a title. */
export const Variants: Story = {
  render: () => (
    <div className="flex w-full max-w-[560px] flex-col gap-3">
      <Alert variant="info">
        <AlertTitle>Scheduled maintenance on October 3</AlertTitle>
        <AlertDescription>The dashboard is read-only from 02:00 to 02:20 UTC. Deployments keep serving.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertTitle>acme.com is verified</AlertTitle>
        <AlertDescription>DNS records match. HTTPS certificates are issued automatically.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertDescription>Your API token “CI deploys” expires in 3 days.</AlertDescription>
      </Alert>
      <Alert variant="danger">
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>
          The card ending 4242 was declined. <a href="#billing">Update your payment method</a> to keep deploying.
        </AlertDescription>
      </Alert>
    </div>
  ),
}

const NOTICES = [
  { id: 'maintenance', variant: 'info', title: 'Maintenance on October 3', body: 'Read-only from 02:00 to 02:20 UTC.' },
  { id: 'domain', variant: 'success', title: 'acme.com is verified', body: 'Certificates are issued automatically.' },
  { id: 'token', variant: 'warning', title: 'A token expires in 3 days', body: '“CI deploys” stops working on Friday.' },
  { id: 'payment', variant: 'danger', title: 'Payment failed', body: 'Update the card ending 4242.' },
] as const

/** Dismiss them in any order: each one collapses and the rest glide up. Tab to a dismiss button and press Enter: focus moves to the next one. */
export const Dismissible: Story = {
  render: () => {
    function Notices() {
      const [open, setOpen] = useState<Record<string, boolean>>({})
      return (
        <div className="flex w-full max-w-[520px] flex-col">
          {/* The spacing is each alert's own margin, so it collapses with it: no gap left behind. */}
          {NOTICES.map((n) => (
            <Alert
              key={n.id}
              variant={n.variant}
              className="mb-2"
              open={open[n.id] ?? true}
              onOpenChange={(next) => setOpen((o) => ({ ...o, [n.id]: next }))}
            >
              <AlertTitle>{n.title}</AlertTitle>
              <AlertDescription>{n.body}</AlertDescription>
            </Alert>
          ))}
          <Button variant="outline" size="sm" className="mt-2 self-start" onClick={() => setOpen({})}>
            Bring them back
          </Button>
        </div>
      )
    }
    return <Notices />
  },
}

/** Long content wraps under the title; actions sit under the message; the dismiss button keeps its corner. */
export const LongContent: Story = {
  render: () => (
    <Alert variant="info" dismissible className="w-full max-w-[420px]">
      <AlertTitle>We’re moving builds to a new region on October 12, which may change the IP addresses your firewall allows</AlertTitle>
      <AlertDescription>
        If you allowlist our build IPs for database access, add the new range 203.0.113.0/24 before the 12th. Nothing else changes: build times, caches and environment variables carry over.
      </AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline">
          Copy the new range
        </Button>
      </AlertAction>
    </Alert>
  ),
}

/** Reduced motion: icons appear at rest, and a dismissed alert leaves at once. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <div className="flex w-full max-w-[560px] flex-col gap-3">
        <Alert variant="warning" dismissible>
          <AlertTitle>You’ve used 82% of this month’s bandwidth</AlertTitle>
          <AlertDescription>Raise the limit or upgrade to avoid overage.</AlertDescription>
        </Alert>
        <Alert variant="success" dismissible>
          <AlertTitle>acme.com is verified</AlertTitle>
        </Alert>
      </div>
    </YoujProvider>
  ),
}

export const Playground: Story = {
  render: (args) => (
    <Alert {...args} className="w-full max-w-[520px]">
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>Switch the variant in Controls; the icon plays again each time the alert mounts.</AlertDescription>
    </Alert>
  ),
}
