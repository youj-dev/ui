import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  ArchiveIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  GitMergeIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
} from '@youj/icons'
import { Button } from './button'
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from './button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { Input } from './input'

const meta: Meta<typeof ButtonGroup> = {
  title: 'UI/Primitives/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'shadcn’s button group: buttons, inputs and menus joined into one strip (role="group"). Joined edges drop their inner corners and doubled borders; a focused member rises so its ring isn’t clipped. Corners are logical, so it mirrors in RTL. Nest groups to cluster them. Members keep their own press.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ButtonGroup>

/** The common shapes: a message toolbar of clusters, a split button, a search field and an address prefix. */
export const Hero: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
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

      <ButtonGroup aria-label="Search" className="w-80">
        <Input placeholder="Search issues…" aria-label="Search issues" />
        <Button variant="outline" aria-label="Search">
          <SearchIcon />
        </Button>
      </ButtonGroup>

      <ButtonGroup className="w-80">
        <ButtonGroupText render={<label htmlFor="bg-url" />}>https://</ButtonGroupText>
        <Input id="bg-url" defaultValue="acme.dev" />
      </ButtonGroup>
    </div>
  ),
}

/** Stacked: a zoom control. */
export const Vertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical" aria-label="Zoom">
      <Button variant="outline" size="icon" aria-label="Zoom in">
        <PlusIcon />
      </Button>
      <Button variant="outline" size="icon" aria-label="Zoom out">
        <MinusIcon />
      </Button>
    </ButtonGroup>
  ),
}
