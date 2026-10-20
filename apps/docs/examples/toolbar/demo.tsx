'use client'

import {
  AlignCenterIcon,
  AlignLeftIcon,
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  RedoIcon,
  StrikethroughIcon,
  UnderlineIcon,
  UndoIcon,
} from '@youj/icons'
import {
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarToggle,
} from '@youj/react'

export default function ToolbarDemo() {
  return (
    <Toolbar aria-label="Formatting">
      <ToolbarGroup aria-label="History">
        <ToolbarButton aria-label="Undo">
          <UndoIcon />
        </ToolbarButton>
        {/* Nothing to redo yet: disabled, but still in the arrow-key order. */}
        <ToolbarButton aria-label="Redo" disabled focusableWhenDisabled>
          <RedoIcon />
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup aria-label="Marks">
        <ToolbarToggle aria-label="Bold" defaultPressed>
          <BoldIcon />
        </ToolbarToggle>
        <ToolbarToggle aria-label="Italic">
          <ItalicIcon />
        </ToolbarToggle>
        <ToolbarToggle aria-label="Underline">
          <UnderlineIcon />
        </ToolbarToggle>
        <ToolbarToggle aria-label="Strikethrough">
          <StrikethroughIcon />
        </ToolbarToggle>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToggleGroup aria-label="Alignment" size="sm" defaultValue={['left']} className="gap-0.5">
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeftIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenterIcon />
        </ToggleGroupItem>
      </ToggleGroup>
      <ToolbarSeparator />
      <ToolbarGroup aria-label="Insert">
        <ToolbarButton aria-label="Bulleted list">
          <ListIcon />
        </ToolbarButton>
        <ToolbarButton aria-label="Link">
          <LinkIcon />
        </ToolbarButton>
        <ToolbarButton aria-label="Code block">
          <CodeIcon />
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarLink href="#history" className="text-ui-sm">
        Edited 2m ago
      </ToolbarLink>
    </Toolbar>
  )
}
