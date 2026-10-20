import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { HeroTerminal } from './hero-terminal'

const meta: Meta<typeof HeroTerminal> = {
  title: 'Blocks/Marketing/Hero terminal',
  component: HeroTerminal,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', preset: 'terminal' },
    docs: {
      description: {
        component:
          'Introduce your command-line tool with a copyable install command and an animated terminal demo.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof HeroTerminal>

export const Default: Story = {}

/** Inside another page: a section named by an h2, laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="sr-only">Northwind CLI</h1>
      <HeroTerminal {...args} />
    </main>
  ),
}

/** A finance product's CLI: its own command, transcript, install line, copy and calls to action. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: {
      eyebrow: 'New in 1.4: bank feeds',
      headline: 'Reconcile the month from your terminal',
      description: 'Run ledgerly sync in your books folder. It pulls every bank feed, matches each payment to its invoice and tells you what is left to review.',
      note: 'macOS and Linux · works with any bank Ledgerly supports',
      cwd: '~/fernhill/books',
    },
    command: 'ledgerly sync --month 2026-11',
    transcript: [
      { wait: 'slow', tone: 'muted', text: 'Ledgerly CLI 1.4.0' },
      { wait: 'slow', tone: 'ok', text: 'Signed in as Fernhill Bakery' },
      { wait: 'base', tone: 'plain', text: 'Pulling 3 bank feeds', busy: true },
      { wait: 'deliberate', times: 3, tone: 'ok', text: '2,418 transactions in November' },
      { wait: 'base', tone: 'plain', text: 'Matching payments to invoices', busy: true },
      { wait: 'deliberate', times: 3, tone: 'ok', text: '2,370 matched · 48 to review' },
    ],
    // What the sync leaves behind, landing on the terminal once it's done.
    preview: (
      <div className="flex flex-col gap-3 p-4">
        <span className="text-ui-sm font-semibold text-fg">November books</span>
        <span className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-fg tabular-nums">2,370</span>
          <span className="text-ui-sm text-fg-muted">payments matched</span>
        </span>
        <span className="h-1.5 overflow-hidden rounded-full bg-well">
          <span className="block h-full w-[98%] rounded-full bg-accent" />
        </span>
        <span className="text-ui-xs text-fg-muted">48 left to review · closes on Friday</span>
      </div>
    ),
    install: 'brew install ledgerly',
    onCopyCommand: fn(),
    primaryCta: { label: 'Install the CLI', href: '/cli', onClick: fn() },
    secondaryCta: { label: 'Read the CLI guide', href: '/docs/cli', onClick: fn() },
  },
}
