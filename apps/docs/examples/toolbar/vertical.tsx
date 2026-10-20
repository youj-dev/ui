'use client'

import { MousePointerIcon, MoveIcon, PencilIcon, RedoIcon, TypeIcon, UndoIcon } from '@youj/icons'
import { ToggleGroup, ToggleGroupItem, Toolbar, ToolbarButton, ToolbarSeparator } from '@youj/react'

export default function ToolbarVertical() {
  return (
    <Toolbar aria-label="Tools" orientation="vertical">
      <ToggleGroup aria-label="Tool" orientation="vertical" size="sm" defaultValue={['select']} className="gap-0.5">
        <ToggleGroupItem value="select" aria-label="Select">
          <MousePointerIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="move" aria-label="Move">
          <MoveIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="draw" aria-label="Draw">
          <PencilIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="text" aria-label="Text">
          <TypeIcon />
        </ToggleGroupItem>
      </ToggleGroup>
      <ToolbarSeparator />
      <ToolbarButton aria-label="Undo">
        <UndoIcon />
      </ToolbarButton>
      <ToolbarButton aria-label="Redo">
        <RedoIcon />
      </ToolbarButton>
    </Toolbar>
  )
}
