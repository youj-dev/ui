import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  AlignCenterIcon,
  AlignLeftIcon,
  BoldIcon,
  CodeIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MousePointerIcon,
  MoveIcon,
  PencilIcon,
  RedoIcon,
  StrikethroughIcon,
  TypeIcon,
  UnderlineIcon,
  UndoIcon,
} from '@youj/icons'
import { ThemeScope } from '@youj/core/lib/youj/provider'
import { Button } from './button'
import { Tabs, TabsList, TabsTrigger } from './tabs'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarInput, ToolbarLink, ToolbarSeparator, ToolbarToggle } from './toolbar'

const meta: Meta<typeof Toolbar> = {
  title: 'UI/Primitives/Toolbar',
  component: Toolbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Base UI Toolbar: a row of buttons, toggles, links and inputs that is one tab stop, roved with the arrow keys (wrapping at the ends). A ToggleGroup inside joins the same roving order. Buttons and toggles wear Toggle’s key, a step smaller, with the same precise press. Reduced motion: presses don’t scale.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Toolbar>

/** A writing toolbar: history, marks, alignment, inserts and a quiet status link. */
export const Hero: Story = {
  render: () => (
    <Toolbar aria-label="Formatting">
      <ToolbarGroup aria-label="History">
        <ToolbarButton aria-label="Undo">
          <UndoIcon />
        </ToolbarButton>
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
        <ToolbarButton aria-label="Numbered list">
          <ListOrderedIcon />
        </ToolbarButton>
        <ToolbarButton aria-label="Link">
          <LinkIcon />
        </ToolbarButton>
        <ToolbarButton aria-label="Image">
          <ImageIcon />
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
  ),
}

/** A canvas tool rail: vertical, with a single-choice tool group. The arrow keys follow the orientation. */
export const Vertical: Story = {
  render: () => (
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
  ),
}

/**
 * A theme with `tone: { chrome: 'dark' }`: the toolbar is a chrome tone scope,
 * so on a light page it and the button, field and tabs inside it are their
 * dark-mode selves, with no change to their code. On a dark page it is the
 * page's own mode. (tests/storybook/tone.spec.ts holds the two equal.)
 */
export const ChromeTone: Story = {
  render: () => (
    <ThemeScope theme={{ tone: { chrome: 'dark' } }}>
      <Toolbar aria-label="Editor">
        <ToolbarButton aria-label="Undo">
          <UndoIcon />
        </ToolbarButton>
        <ToolbarSeparator />
        <Button variant="secondary" size="sm">
          Share
        </Button>
        <ToolbarInput aria-label="Search" placeholder="Search" />
        <Tabs defaultValue="edit">
          <TabsList variant="pill">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </Tabs>
      </Toolbar>
    </ThemeScope>
  ),
}
