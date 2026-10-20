'use client'

import { ArrowUpRightIcon, DatabaseIcon, GitBranchIcon, LineChartIcon, MessagesIcon, ShieldCheckIcon, WebhookIcon } from '@youj/icons'
import { SpotlightCard, SpotlightGrid } from '@youj/motion/interactions'

const INTEGRATIONS = [
  { slug: 'git', Icon: GitBranchIcon, name: 'Git provider', body: 'Preview every branch. Checks land on the pull request.', installed: true },
  { slug: 'chat', Icon: MessagesIcon, name: 'Chat alerts', body: 'Send deploy and incident alerts to the channel that owns them.', installed: true },
  { slug: 'postgres', Icon: DatabaseIcon, name: 'Postgres', body: 'Branch the database with every preview, seeded and isolated.' },
  { slug: 'analytics', Icon: LineChartIcon, name: 'Analytics', body: 'Core Web Vitals per route and per deploy.' },
  { slug: 'sso', Icon: ShieldCheckIcon, name: 'SSO', body: 'SAML and SCIM, with roles mapped from your identity provider.' },
  { slug: 'webhooks', Icon: WebhookIcon, name: 'Webhooks', body: 'Signed events for deploys and domains, retried for 24 hours.' },
]

export default function SpotlightCardDemo() {
  return (
    <div className="@container w-full max-w-2xl">
      <p className="text-sm font-medium text-fg">Integrations</p>
      <p className="mt-0.5 mb-4 text-sm text-fg-muted">Connect the tools your team already uses.</p>
      {/* The grid tracks the pointer once and lights every card in its own coordinates. */}
      <SpotlightGrid className="grid-cols-1 gap-3 @md:grid-cols-2 @xl:grid-cols-3">
        {INTEGRATIONS.map(({ slug, Icon, name, body, installed }) => (
          <SpotlightCard key={slug}>
            <a
              href={`#integration-${slug}`}
              className="block h-full rounded-xl p-4 outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="flex items-start justify-between">
                <span className="grid size-9 place-items-center rounded-lg border border-line bg-raised text-fg">
                  <Icon size={16} />
                </span>
                {installed ? (
                  <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-fg-muted">Installed</span>
                ) : (
                  <ArrowUpRightIcon size={15} className="text-fg-muted" />
                )}
              </span>
              <span className="mt-4 block text-sm font-medium text-fg">{name}</span>
              <span className="mt-1 block text-[13px] leading-5 text-fg-muted">{body}</span>
            </a>
          </SpotlightCard>
        ))}
      </SpotlightGrid>
    </div>
  )
}
