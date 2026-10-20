'use client'

import { CodeIcon, EyeIcon, LayersIcon, LinkIcon, SparklesIcon } from '@youj/icons'
import { ActionIsland, ActionIslandGroup, ActionIslandMark, ActionIslandSeparator, ActionIslandTile } from '@youj/react'

export default function ActionIslandFloating() {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl border border-line bg-transparent">
      <div className="absolute inset-0 grid place-items-center text-ui-sm text-fg-muted">Canvas</div>
      <div className="absolute inset-x-0 bottom-4 flex justify-center">
        <ActionIsland aria-label="Canvas actions">
          <ActionIslandMark aria-hidden>
            <LayersIcon />
          </ActionIslandMark>
          <ActionIslandGroup aria-label="View">
            <ActionIslandTile label="Preview" pressed>
              <EyeIcon />
            </ActionIslandTile>
            <ActionIslandTile label="Code" pressed={false}>
              <CodeIcon />
            </ActionIslandTile>
          </ActionIslandGroup>
          <ActionIslandSeparator />
          <ActionIslandTile label="Copy link">
            <LinkIcon />
          </ActionIslandTile>
          <ActionIslandTile label="Open" variant="primary" showLabel>
            <SparklesIcon />
          </ActionIslandTile>
        </ActionIsland>
      </div>
    </div>
  )
}
