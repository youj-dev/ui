import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, BoldIcon, ColumnsIcon, ItalicIcon, ListIcon, RowsIcon, UnderlineIcon } from '@youj/icons'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Specimen } from '../../stories/kit'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

const meta: Meta<typeof ToggleGroup> = {
  title: 'UI/Primitives/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI toggle group: one tab stop, arrow keys rove (and wrap), Home/End jump, Space/Enter press. Single-select by default; `multiple` for independent toggles. Three looks: spaced toggles, joined outline keys (`spacing={0}`), and `segmented`, plain labels on a hairline at control height with a 2px accent bar under the pressed one (`pill` is the recessed-track alternative, with the pressed key raised out of it). In a single-select segmented group the bar is motion\'s SlidingIndicator: it glides to the pressed item on the `smooth` spring, retargets mid-glide, follows resizes without animating, and jumps under reduced motion. With `multiple`, each pressed item draws its own bar.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ToggleGroup>

function ViewSwitcher() {
  const [view, setView] = useState(['board'])
  return (
    <div className="flex w-full max-w-[440px] items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
      <p className="text-ui font-medium text-fg">Issues</p>
      <ToggleGroup
        variant="segmented"
        value={view}
        onValueChange={(next) => next.length > 0 && setView(next)}
        aria-label="View"
      >
        <ToggleGroupItem value="list">
          <ListIcon />
          List
        </ToggleGroupItem>
        <ToggleGroupItem value="board">
          <ColumnsIcon />
          Board
        </ToggleGroupItem>
        <ToggleGroupItem value="timeline">
          <RowsIcon />
          Timeline
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

/** A segmented view switcher that can't be emptied. Tab in, then use ← →. */
export const Hero: Story = {
  render: () => <ViewSwitcher />,
}

export const Looks: Story = {
  render: () => (
    <div className="grid gap-6">
      <Specimen label="default, single">
        <ToggleGroup defaultValue={['left']} aria-label="Alignment">
          <ToggleGroupItem value="left" aria-label="Align left">
            <AlignLeftIcon trigger="none" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenterIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <AlignRightIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </Specimen>
      <Specimen label="outline, joined, multiple">
        <ToggleGroup multiple variant="outline" spacing={0} defaultValue={['bold', 'italic']} aria-label="Formatting">
          <ToggleGroupItem value="bold" aria-label="Bold">
            <BoldIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <ItalicIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">
            <UnderlineIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </Specimen>
      <Specimen label="segmented, small">
        <ToggleGroup variant="segmented" size="sm" defaultValue={['7d']} aria-label="Range">
          {['24h', '7d', '30d', '90d'].map((r) => (
            <ToggleGroupItem key={r} value={r} className="px-2.5 tabular-nums">
              {r}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Specimen>
      <Specimen label="segmented, multiple (each pressed item draws its own bar)">
        <ToggleGroup variant="segmented" multiple defaultValue={['bold', 'underline']} aria-label="Text style">
          <ToggleGroupItem value="bold" aria-label="Bold">
            <BoldIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <ItalicIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">
            <UnderlineIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </Specimen>
      <Specimen label="pill (a raised key in a recessed track)">
        <ToggleGroup variant="pill" defaultValue={['week']} aria-label="Group by, pill">
          {['Day', 'Week', 'Month'].map((p) => (
            <ToggleGroupItem key={p} value={p.toLowerCase()} className="px-2.5">
              {p}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Specimen>
      <Specimen label="segmented, vertical">
        <ToggleGroup variant="segmented" orientation="vertical" defaultValue={['week']} aria-label="Group by" className="w-36">
          {['Day', 'Week', 'Month'].map((p) => (
            <ToggleGroupItem key={p} value={p.toLowerCase()} className="h-control-sm justify-start px-2.5">
              {p}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Specimen>
      <Specimen label="vertical">
        <ToggleGroup orientation="vertical" variant="outline" spacing={0} defaultValue={['top']} aria-label="Position">
          {['Top', 'Middle', 'Bottom'].map((p) => (
            <ToggleGroupItem key={p} value={p.toLowerCase()} className="justify-start px-3">
              {p}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Specimen>
      <Specimen label="disabled">
        <ToggleGroup variant="segmented" defaultValue={['list']} disabled aria-label="View (locked)">
          <ToggleGroupItem value="list">List</ToggleGroupItem>
          <ToggleGroupItem value="board">Board</ToggleGroupItem>
        </ToggleGroup>
      </Specimen>
    </div>
  ),
}

/** Reduced motion: the indicator jumps to the pressed item instead of gliding. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <ViewSwitcher />
    </YoujProvider>
  ),
}
