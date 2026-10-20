import type { Meta, StoryObj } from '@storybook/react-vite'
import { CodeIcon, CopyIcon, EyeIcon, InfoIcon, LayersIcon, LinkIcon, MoreHorizontalIcon, ShareIcon, SparklesIcon } from '@youj/icons'
import { ThemeScope } from '@youj/core/lib/youj/provider'
import { ActionIsland, ActionIslandGroup, ActionIslandMark, ActionIslandSeparator, ActionIslandTile } from './action-island'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'

const meta: Meta<typeof ActionIsland> = {
  title: 'UI/Primitives/Action Island',
  component: ActionIsland,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A floating tray of actions over a canvas. Base UI Toolbar: one tab stop, roved with the arrow keys (mirrored in RTL). Each action is a tile; a pressed one takes an accent outline, one primary tile is filled, and a mark names what the island acts on. A tile’s tooltip is its accessible name unless it shows its label, and `render` turns a tile into a menu’s trigger or a link. Reduced motion: presses don’t scale.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ActionIsland>

function ViewerIsland() {
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

/** A viewer's island: the mark, the views (Preview pressed), quiet tiles, a menu and the one primary tile. */
export const Hero: Story = { render: () => <ViewerIsland /> }

/** Floating at the foot of a canvas, as it's meant to be used. */
export const Floating: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="relative h-96 overflow-hidden bg-transparent">
      <div className="absolute inset-0 grid place-items-center text-ui-sm text-fg-muted">Canvas</div>
      <div className="absolute inset-x-0 bottom-4 flex justify-center">
        <ViewerIsland />
      </div>
    </div>
  ),
}

/** dir="rtl": the tiles run from the right, and the arrows rove the other way. */
export const RightToLeft: Story = {
  render: () => (
    <ThemeScope dir="rtl">
      <div dir="rtl">
        <ViewerIsland />
      </div>
    </ThemeScope>
  ),
}
