import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyLarge,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
  TypographySmall,
} from './typography'

const meta: Meta<typeof TypographyP> = {
  title: 'UI/Primitives/Typography',
  component: TypographyP,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'shadcn’s typography set as components: H1–H4, P, Lead, Large, Small, Muted, Blockquote, InlineCode and List, in the long-form voice the docs read in. Tight headings in the foreground ink, 15px body at a 1.75 line height, links underlined in a quiet accent tint, square list markers and mono counters. Nothing moves but a link’s underline color.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TypographyP>

/** A release note set end to end: every piece in context. */
export const Hero: Story = {
  render: () => (
    <article className="w-full max-w-[640px] px-2 py-4">
      <TypographyMuted>Changelog · September 2026</TypographyMuted>
      <TypographyH1 className="mt-2">Deploys that explain themselves</TypographyH1>
      <TypographyLead className="mt-3">
        Every deploy now carries its own story: what changed, who approved it, and how to take it back.
      </TypographyLead>
      <TypographyH2>What’s new</TypographyH2>
      <TypographyP>
        The deploy page opens on a timeline. Each step records its duration and its logs, and a failed step expands on its own. Read the{' '}
        <a href="#guide">migration guide</a> if you pinned the old layout.
      </TypographyP>
      <TypographyList>
        <li>Build output streams as it happens, with warnings folded.</li>
        <li>
          Rollbacks keep their environment: <TypographyInlineCode>deploy rollback --keep-env</TypographyInlineCode>.
        </li>
        <li>Approvals show who, when and from where.</li>
      </TypographyList>
      <TypographyH3>Upgrading</TypographyH3>
      <TypographyList ordered>
        <li>Update the CLI to 4.2 or later.</li>
        <li>Run the deploy once from a clean checkout.</li>
        <li>Remove the old status webhook.</li>
      </TypographyList>
      <TypographyBlockquote>“We cut our incident reviews in half. The deploy already told us what happened.”</TypographyBlockquote>
      <TypographyH4>Availability</TypographyH4>
      <TypographyP>Rolling out to every team this week.</TypographyP>
    </article>
  ),
}

/** Each piece on its own, with its component name. */
export const Scale: Story = {
  render: () => (
    <div className="grid w-full max-w-[640px] grid-cols-[8rem_minmax(0,1fr)] items-baseline gap-x-6 gap-y-5">
      {(
        [
          ['H1', <TypographyH1 key="h1">Taxing Laughter</TypographyH1>],
          ['H2', <TypographyH2 key="h2">The People of the Kingdom</TypographyH2>],
          ['H3', <TypographyH3 key="h3">The Joke Tax</TypographyH3>],
          ['H4', <TypographyH4 key="h4">People stopped telling jokes</TypographyH4>],
          ['P', <TypographyP key="p">The king, seeing how much happier his subjects were, realized the error of his ways.</TypographyP>],
          ['Lead', <TypographyLead key="lead">A modal dialog that interrupts the user with important content.</TypographyLead>],
          ['Large', <TypographyLarge key="large">Are you absolutely sure?</TypographyLarge>],
          ['Small', <TypographySmall key="small">Email address</TypographySmall>],
          ['Muted', <TypographyMuted key="muted">Enter your email address.</TypographyMuted>],
          ['InlineCode', <TypographyP key="code"><TypographyInlineCode>@youj/react</TypographyInlineCode></TypographyP>],
        ] as const
      ).map(([name, node]) => (
        <div key={name} className="contents">
          <span className="font-mono text-ui-xs text-fg-muted">{name}</span>
          <div className="min-w-0 [&>*]:mt-0!">{node}</div>
        </div>
      ))}
    </div>
  ),
}
