'use client'

import { Badge, HierarchyChart, type HierarchyNode } from '@youj/react'

interface Team extends HierarchyNode {
  mission: string
  people: number
  children?: Team[]
}

// A product org as teams, read along the line, each card drawn by renderNode.
const TEAMS: Team = {
  id: 'product',
  name: 'Product',
  mission: 'Everything customers touch',
  people: 46,
  children: [
    {
      id: 'core',
      name: 'Core experience',
      mission: 'Editor, sync, offline',
      people: 15,
      children: [
        { id: 'editor', name: 'Editor', mission: 'Blocks and embeds', people: 8 },
        { id: 'sync', name: 'Sync', mission: 'Real-time and conflicts', people: 7 },
      ],
    },
    {
      id: 'growth',
      name: 'Growth',
      mission: 'Activation and billing',
      people: 13,
      children: [
        { id: 'onboarding', name: 'Onboarding', mission: 'First week to aha', people: 6 },
        { id: 'billing', name: 'Billing', mission: 'Plans and invoices', people: 7 },
      ],
    },
    {
      id: 'platform',
      name: 'Platform',
      mission: 'Infrastructure and data',
      people: 18,
      children: [
        { id: 'infra', name: 'Infrastructure', mission: 'Clusters and deploys', people: 10 },
        { id: 'data', name: 'Data', mission: 'Pipelines and warehouse', people: 8 },
      ],
    },
  ],
}

export default function HierarchyChartTeams() {
  return (
    <div className="w-full max-w-5xl">
      <HierarchyChart<Team>
        nodes={TEAMS}
        orientation="horizontal"
        label="Product teams"
        nodeSize={{ width: 220, height: 60 }}
        height={400}
        renderNode={(team, state) => (
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-medium text-fg text-ui leading-tight">{team.name}</span>
              <span className="truncate text-fg-muted text-ui-sm leading-tight">{team.mission}</span>
            </span>
            <Badge variant={state.depth === 0 ? 'default' : 'secondary'} className="shrink-0 tabular-nums">
              {team.people}
            </Badge>
          </span>
        )}
      />
    </div>
  )
}
