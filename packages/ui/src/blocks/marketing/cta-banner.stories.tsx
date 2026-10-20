import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CtaBanner } from './cta-banner'
import { MarketingFooter } from './footer'
import { MarketingMetrics } from './metrics'

const meta: Meta<typeof CtaBanner> = {
  title: 'Blocks/Marketing/CTA banner',
  component: CtaBanner,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', preset: 'graphite' },
    docs: {
      description: {
        component:
          'Give visitors a next step between sections with a slim call-to-action banner.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CtaBanner>

/** Between two sections of a landing page: the metrics above, the footer below, with no rules running behind the panel. */
export const Default: Story = {
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <MarketingMetrics className="border-b-0" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <CtaBanner {...args} embedded />
      </div>
      <MarketingFooter className="border-t-0" />
    </div>
  ),
}

/** Inside a docs or changelog page: a rounded panel in the host's column. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 bg-canvas p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-fg">Changelog</h1>
      <p className="text-ui-lg text-fg-muted">Preview comments now thread, resolve and sync to the pull request.</p>
      <CtaBanner {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    primaryCta: { label: 'Choose your recipes', href: '#trial', onClick: fn() },
    secondaryCta: { label: 'See this week’s menu', href: '#menu' },
    copy: {
      title: 'Your first box ships on Friday.',
      description: 'Pick three recipes, skip any week, cancel whenever. The first box is half price.',
    },
  },
}
