'use client'

import type { ReactNode } from 'react'
import { initials } from '../../../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '../avatar'
import { Badge } from '../badge'

export interface HierarchyNode {
  id: string
  /** The node's name: shown on the default card and its accessible name. */
  name: string
  /** A line under the name: a job title, a team's purpose. */
  role?: string
  /** An image URL for the avatar; without one it shows the name's initials. */
  avatar?: string
  /** A short tag beside the name: "Hiring", "12 reports". */
  badge?: ReactNode
  children?: readonly HierarchyNode[]
}

/** What a node is in the chart right now, for `renderNode`. */
export interface HierarchyNodeState {
  /** 0 for a root. */
  depth: number
  selected: boolean
  /** On the path from a root to the selected node. */
  onPath: boolean
  /** Has children in the data. */
  branch: boolean
  open: boolean
  /** Everyone below it, all levels down. */
  descendants: number
}

/** The default card: avatar, name, role and badge. */
export function HierarchyNodeCard({ node }: { node: HierarchyNode }) {
  return (
    <>
      <Avatar aria-hidden size="default" className="pointer-events-none">
        {node.avatar && <AvatarImage src={node.avatar} alt="" draggable={false} />}
        <AvatarFallback>{initials(node.name)}</AvatarFallback>
      </Avatar>
      <span className="own:flex min-w-0 flex-1 flex-col gap-0.5">
        <span data-slot="hierarchy-chart-name" className="truncate own:text-ui own:font-medium own:leading-tight own:text-fg">
          {node.name}
        </span>{' '}
        {node.role && (
          <span data-slot="hierarchy-chart-role" className="truncate own:text-ui-sm own:leading-tight own:text-fg-muted">
            {node.role}
          </span>
        )}
      </span>{' '}
      {node.badge !== undefined && node.badge !== null && (
        <Badge variant="outline" className="absolute -top-2.5 end-3 own:bg-surface">
          {node.badge}
        </Badge>
      )}
    </>
  )
}
