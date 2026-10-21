import type { Meta, StoryObj } from '@storybook/react-vite'
import { PlusIcon, SearchIcon, SettingsIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { FilterChips } from '../components/ui/filter-chips'
import { Input } from '../components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../components/ui/input-group'
import { NativeSelect, NativeSelectOption } from '../components/ui/native-select'
import { NumberInput } from '../components/ui/number-input'
import { SegmentedControl, SegmentedControlItem } from '../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Textarea } from '../components/ui/textarea'
import { Toggle } from '../components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'
import { Specimen } from './kit'

/* Every control family side by side, so one look across the presets shows
 * whether a theme's shape reaches all of them: within a preset a button, a
 * field, a tab track and a badge share one corner (ui.css's family tokens). */

const meta: Meta = {
  title: 'Foundations/Shapes',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "Each control family reads one corner from the theme (rounded-button, rounded-field, rounded-choice, rounded-chip, rounded-surface, rounded-overlay), in both looks. Switch the Preset: within one, buttons, fields, tracks and badges share a shape.",
      },
    },
  },
}
export default meta

const FRUIT = { apple: 'Apple', pear: 'Pear', plum: 'Plum' }

function Panel() {
  return (
    <div data-slot="shapes-panel" className="grid w-[56rem] gap-6 bg-canvas p-8 text-fg">
      <Specimen label="Buttons: default, secondary, outline, ghost, danger; xs, sm, default, lg; icons">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Save</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="outline">Share</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="danger">Delete</Button>
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" variant="outline" aria-label="Settings">
            <SettingsIcon />
          </Button>
          <Button size="icon-sm" variant="secondary" aria-label="Add">
            <PlusIcon />
          </Button>
          <Toggle variant="outline" aria-label="Bold" defaultPressed>
            B
          </Toggle>
        </div>
      </Specimen>
      <Specimen label="Fields: input, select, ghost select, native select, number, input group, textarea">
        <div className="grid grid-cols-3 gap-2">
          <Input placeholder="Name" />
          <Select items={FRUIT} defaultValue="apple">
            <SelectTrigger className="w-full" aria-label="Fruit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FRUIT).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select items={FRUIT} defaultValue="pear">
            <SelectTrigger variant="ghost" className="w-full" aria-label="Fruit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FRUIT).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <NativeSelect defaultValue="plum" aria-label="Fruit">
            {Object.entries(FRUIT).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NumberInput defaultValue={12} aria-label="Quantity" />
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search" />
          </InputGroup>
          <Textarea className="col-span-3 min-h-14" placeholder="A note that runs past one line" />
        </div>
      </Specimen>
      <Specimen label="Choices: pill tabs, segmented (sm, default, lg), toggle group">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs defaultValue="a">
            <TabsList variant="pill">
              <TabsTrigger value="a">Overview</TabsTrigger>
              <TabsTrigger value="b">Activity</TabsTrigger>
              <TabsTrigger value="c">Settings</TabsTrigger>
            </TabsList>
          </Tabs>
          {(['sm', 'default', 'lg'] as const).map((size) => (
            <SegmentedControl key={size} variant="pill" size={size} defaultValue="day" aria-label={`Range, ${size}`}>
              <SegmentedControlItem value="day">Day</SegmentedControlItem>
              <SegmentedControlItem value="week">Week</SegmentedControlItem>
            </SegmentedControl>
          ))}
          <ToggleGroup variant="outline" defaultValue={['left']} aria-label="Align">
            <ToggleGroupItem value="left">Left</ToggleGroupItem>
            <ToggleGroupItem value="center">Center</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </Specimen>
      <Specimen label="Chips: badges (sm, default, lg), filter chips">
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm">3</Badge>
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">
            <BadgeDot />
            Live
          </Badge>
          <Badge variant="warning" size="lg">
            Degraded
          </Badge>
          <div className="w-80">
            <FilterChips defaultValue={['status:open', 'owner:me']} aria-label="Filters" />
          </div>
        </div>
      </Specimen>
      <Specimen label="Surface: card">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription>Pro, billed yearly</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Input placeholder="Seats" className="w-24" />
            <Badge variant="success">Active</Badge>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" size="sm">
              Cancel
            </Button>
            <Button size="sm">Upgrade</Button>
          </CardFooter>
        </Card>
      </Specimen>
    </div>
  )
}

/** Every family at once: switch the Preset and Theme to check one shape per preset. */
export const AllFamilies: Story = { render: () => <Panel /> }

type Story = StoryObj
