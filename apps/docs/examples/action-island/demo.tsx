'use client'

import { CodeIcon, CopyIcon, EyeIcon, InfoIcon, LayersIcon, LinkIcon, MoreHorizontalIcon, ShareIcon, SparklesIcon } from '@youj/icons'
import {
  ActionIsland,
  ActionIslandGroup,
  ActionIslandMark,
  ActionIslandSeparator,
  ActionIslandTile,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@youj/react'

export default function ActionIslandDemo() {
  return (
    <ActionIsland aria-label="Preview actions">
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
        <ActionIslandTile label="Info" pressed={false}>
          <InfoIcon />
        </ActionIslandTile>
      </ActionIslandGroup>
      <ActionIslandSeparator />
      <ActionIslandTile label="Copy link">
        <LinkIcon />
      </ActionIslandTile>
      <DropdownMenu>
        <ActionIslandTile label="More" render={<DropdownMenuTrigger />}>
          <MoreHorizontalIcon />
        </ActionIslandTile>
        <DropdownMenuContent side="top">
          <DropdownMenuItem>
            <CopyIcon />
            Copy code
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ShareIcon />
            Share
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ActionIslandTile label="Open" variant="primary" showLabel>
        <SparklesIcon />
      </ActionIslandTile>
    </ActionIsland>
  )
}
