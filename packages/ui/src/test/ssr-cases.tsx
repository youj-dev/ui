import type { ReactElement } from 'react'
import { YoujProvider } from '@youj/core'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { AsyncButton } from '../components/ui/async-button'
import { ChartDataTable } from '../components/ui/chart'
import { Calendar } from '../components/ui/calendar'
import { ChatMessage } from '../components/ui/chat/chat-message'
import { Checkbox } from '../components/ui/checkbox'
import { DateRangePicker } from '../components/ui/date-range-picker'
import { TasksTable, makeTasks } from '../components/ui/data-table/data-table.fixtures'
import { Field, FieldDescription, FieldLabel } from '../components/ui/field'
import { Input } from '../components/ui/input'
import { NumberInput } from '../components/ui/number-input'
import { Progress } from '../components/ui/progress'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import { Slider } from '../components/ui/slider'
import { Spinner } from '../components/ui/spinner'
import { StatCard, StatDelta } from '../components/ui/stat-card'
import { Switch } from '../components/ui/switch'
import { TimePicker } from '../components/ui/time-picker'
import { Timeline, type TimelineEvent } from '../components/ui/timeline'
import { Toggle } from '../components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'

/* Anchored to midday UTC of today, so the server process and jsdom build the
 * same events and "Today" never depends on when the suite runs. The hydration
 * test runs jsdom's clock 90 minutes after this anchor. */
export const HOUR = Math.floor(Date.now() / 86_400_000) * 86_400_000 + 12 * 3_600_000
const EVENTS: TimelineEvent[] = [
  { id: 'e1', type: 'deploy', title: 'Deployed orion', time: HOUR - 5 * 60_000 },
  { id: 'e2', type: 'commit', title: 'Fix checkout copy', time: HOUR - 3 * 3_600_000 },
  { id: 'e3', type: 'comment', title: 'Reviewed the plan', time: HOUR - 2 * 86_400_000 },
]
const REVENUE = [
  { month: 'Jan', revenue: 18_420.5 },
  { month: 'Feb', revenue: 21_904.25 },
]

/* Rendered on a server by scripts/ssr-render.mjs and hydrated in jsdom by
 * ssr.test.tsx. Most of these mark themselves data-reduced-motion or swap a
 * loop for a still frame under reduced motion, so they're the ones that can
 * mismatch. The data table kit's case is a table composed from its parts
 * (the Data table block's own SSR test covers the complete table). */
export const cases: Record<string, () => ReactElement> = {
  'Data table kit': () => <TasksTable rows={makeTasks(6)} />,
  Button: () => <Button>Deploy</Button>,
  'Button loading': () => <Button loading>Deploying</Button>,
  'Button onAction': () => <AsyncButton onAction={() => {}}>Publish</AsyncButton>,
  Switch: () => <Switch defaultChecked aria-label="Notifications" />,
  Checkbox: () => <Checkbox defaultChecked aria-label="Accept" />,
  'Checkbox indeterminate': () => <Checkbox indeterminate aria-label="Select all" />,
  'Progress determinate': () => <Progress value={42} aria-label="Upload" />,
  'Progress indeterminate': () => <Progress value={null} aria-label="Loading" />,
  Skeleton: () => <Skeleton className="h-4 w-32" />,
  Spinner: () => <Spinner />,
  Toggle: () => <Toggle aria-label="Bold">B</Toggle>,
  ToggleGroup: () => (
    <ToggleGroup variant="segmented" defaultValue={['day']}>
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
    </ToggleGroup>
  ),
  Slider: () => <Slider defaultValue={[40]} aria-label="Volume" />,
  Avatar: () => (
    <Avatar>
      <AvatarFallback>LH</AvatarFallback>
    </Avatar>
  ),
  RadioGroup: () => (
    <RadioGroup defaultValue="a" aria-label="Plan">
      <RadioGroupItem value="a" aria-label="Hobby" />
      <RadioGroupItem value="b" aria-label="Pro" />
    </RadioGroup>
  ),
  Field: () => (
    <Field>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input id="email" type="email" />
      <FieldDescription>We never share it.</FieldDescription>
    </Field>
  ),
  Select: () => (
    <Select defaultValue="apple">
      <SelectTrigger aria-label="Fruit">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="pear">Pear</SelectItem>
      </SelectContent>
    </Select>
  ),
  Badge: () => <Badge>New</Badge>,
  // Formatted text: the server runs in another locale and time zone (see scripts/ssr-render.mjs).
  TimePicker: () => <TimePicker defaultValue="14:30" aria-label="Start" />,
  StatCard: () => <StatCard label="Revenue" value={1_234_567.89} format={{ style: 'currency', currency: 'USD' }} previous={1_100_000} />,
  StatDelta: () => <StatDelta value={0.1234} />,
  NumberInput: () => <NumberInput defaultValue={1234.5} aria-label="Amount" />,
  Timeline: () => <Timeline events={EVENTS} />,
  'Chart data table': () => <ChartDataTable data={REVENUE} config={{ revenue: { label: 'Revenue' } }} labelKey="month" caption="Revenue by month" />,
  // Today is the browser's: the server's clock and time zone can't decide the month or the today mark.
  Calendar: () => <Calendar mode="single" />,
  'Calendar with a month': () => <Calendar mode="range" defaultMonth={new Date(2026, 8, 1)} selected={{ from: new Date(2026, 8, 3), to: new Date(2026, 8, 6) }} />,
  DateRangePicker: () => <DateRangePicker defaultValue={{ from: new Date(2026, 8, 3), to: new Date(2026, 8, 6) }} />,
  'Chat timestamp': () => <ChatMessage role="user" name="Ada" content="Ship it" timestamp={new Date(HOUR - 5 * 60_000)} />,
  'Provider locale': () => (
    <YoujProvider locale="de-DE">
      <StatCard label="Umsatz" value={1_234_567.89} format={{ style: 'currency', currency: 'EUR' }} />
      <Timeline events={EVENTS} />
    </YoujProvider>
  ),
  'Forced reduced motion': () => (
    <YoujProvider reducedMotion="always">
      <Switch aria-label="Reduced" />
      <Progress value={null} aria-label="Loading" />
      <Spinner />
    </YoujProvider>
  ),
}
