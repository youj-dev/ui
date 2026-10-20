'use client'

import {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyInlineCode,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
} from '@youj/react'

export default function TypographyDemo() {
  return (
    <article className="w-full max-w-xl">
      <TypographyMuted>Changelog · September 2026</TypographyMuted>
      <TypographyH1 className="mt-2">Deploys that explain themselves</TypographyH1>
      <TypographyLead className="mt-3">Every deploy now carries its own story: what changed, who approved it, and how to take it back.</TypographyLead>
      <TypographyH2>What’s new</TypographyH2>
      <TypographyP>
        The deploy page opens on a timeline. Each step records its duration and its logs. Read the <a href="#guide">migration guide</a> if you
        pinned the old layout.
      </TypographyP>
      <TypographyList>
        <li>Build output streams as it happens, with warnings folded.</li>
        <li>
          Rollbacks keep their environment: <TypographyInlineCode>deploy rollback --keep-env</TypographyInlineCode>.
        </li>
      </TypographyList>
      <TypographyH3>Upgrading</TypographyH3>
      <TypographyList ordered>
        <li>Update the CLI to 4.2 or later.</li>
        <li>Run one deploy from a clean checkout.</li>
      </TypographyList>
      <TypographyBlockquote>“We cut our incident reviews in half. The deploy already told us what happened.”</TypographyBlockquote>
    </article>
  )
}
