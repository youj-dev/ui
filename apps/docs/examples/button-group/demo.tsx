'use client'

import { ArchiveIcon, ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon, GitMergeIcon } from '@youj/icons'
import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@youj/react'

export default function ButtonGroupDemo() {
  return (
    <div className="flex flex-col items-start gap-6">
      {/* Groups nest: each inner group is a joined cluster, spaced from the next. */}
      <ButtonGroup aria-label="Message actions">
        <ButtonGroup>
          <Button variant="outline" size="icon" aria-label="Previous">
            <ArrowLeftIcon />
          </Button>
          <Button variant="outline" size="icon" aria-label="Next">
            <ArrowRightIcon />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="outline">
            <ArchiveIcon /> Archive
          </Button>
          <Button variant="outline">Report</Button>
          <Button variant="outline">Snooze</Button>
        </ButtonGroup>
      </ButtonGroup>

      {/* A split button: filled buttons have no border, so a separator draws the seam. */}
      <ButtonGroup aria-label="Merge">
        <Button>
          <GitMergeIcon /> Merge pull request
        </Button>
        <ButtonGroupSeparator className="bg-on-accent/25 youj-allow-tint" />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="icon" aria-label="Merge options" />}>
            <ChevronDownIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Create a merge commit</DropdownMenuItem>
            <DropdownMenuItem>Squash and merge</DropdownMenuItem>
            <DropdownMenuItem>Rebase and merge</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
    </div>
  )
}
