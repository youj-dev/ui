import type { Meta, StoryObj } from '@storybook/react-vite'
import { CheckIcon, TruckIcon } from '@youj/icons'
import { Badge } from './badge'
import { Button } from './button'
import { RouteMap, type RouteMapProps, type RouteMapRoute, type RouteMapStop } from './route-map'

const STOPS: RouteMapStop[] = [
  { id: 'depot', name: 'Harbor depot', kind: 'origin', x: 12, y: 72, detail: 'Departed 09:14' },
  { id: 'yard', name: 'North yard', x: 29, y: 55, detail: 'Passed 10:41' },
  {
    id: 'truck',
    name: 'Load 4821',
    kind: 'current',
    x: 43,
    y: 45,
    detail: '47 min late',
    icon: <TruckIcon size={14} />,
    cardSide: 'top',
    card: (
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-ui-xs text-fg-muted">LOAD 4821</span>
        <span className="font-medium text-fg">Slowed on Ridge road</span>
        <span className="font-mono text-ui-xs text-danger-text tabular-nums">+47 min · speed −24%</span>
      </div>
    ),
  },
  { id: 'ridge', name: 'Ridge junction', x: 64, y: 29, detail: 'ETA 13:05' },
  { id: 'summit', name: 'Summit DC', kind: 'destination', x: 86, y: 18, detail: 'ETA 15:49' },
]

const ROUTES: RouteMapRoute[] = [
  { id: 'driven', status: 'done', path: ['depot', [20, 65], 'yard', [36, 49], 'truck'] },
  { id: 'late', status: 'delayed', path: ['truck', [53, 36], 'ridge'] },
  { id: 'ahead', status: 'on-time', path: ['ridge', [76, 23], 'summit'] },
  { id: 'reroute', status: 'proposed', label: 'Proposed via river road', path: ['truck', [52, 55], [66, 57], [78, 42], [84, 28], 'summit'] },
]

const meta: Meta<RouteMapProps> = {
  title: 'UI/Data/Route Map',
  component: RouteMap,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A route on a drawn map with no tiles: abstract land, water, parks and roads in the theme’s tones, and routes as smooth lines in their state: driven, on time, delayed (danger) or proposed (a dotted accent line nobody has accepted yet). Stops are markers by kind (origin, stop, destination, and the current position, which pulses) and can carry a card anchored beside them. Markers are buttons in route order: hover or focus shows the stop’s name, pressing picks it. The routes and stops are also written out as lists for screen readers. Motion: the driven line draws from the origin, then the line ahead, the delayed stretch and the proposed route; markers land as their line reaches them and cards rise in after. Reduced motion: drawn in place, no pulse. Geography does not mirror in RTL.',
      },
    },
  },
  args: { stops: STOPS, routes: ROUTES },
  decorators: [(Story) => <div className="w-[52rem] max-w-[calc(100vw-2rem)]">{Story()}</div>],
}
export default meta
type Story = StoryObj<RouteMapProps>

/** A load running late, with a reroute proposed: the summary card is your own overlay, passed as children. */
export const Default: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-ui font-medium text-fg">Harbor depot → Summit DC</span>
          <span className="text-ui-sm text-fg-muted">Load 4821 · 14 pallets · 5 stops</span>
        </div>
        <Badge variant="outline" className="border-danger-line text-danger-text">
          At risk
        </Badge>
      </div>
      <RouteMap {...args}>
        <div className="absolute end-3 bottom-3 z-20 hidden w-60 flex-col gap-2 rounded-xl border border-line bg-overlay p-3 shadow-md sm:flex">
          <span className="font-mono text-ui-xs text-accent-text">REROUTE · LOAD 4821</span>
          <div className="flex items-baseline justify-between rounded-lg bg-band px-2.5 py-1.5">
            <span className="text-ui-sm text-fg-muted">Ridge road</span>
            <span className="font-mono text-ui text-danger-text tabular-nums">15:49</span>
          </div>
          <div className="flex items-baseline justify-between rounded-lg bg-accent-subtle px-2.5 py-1.5">
            <span className="text-ui-sm text-fg">River road</span>
            <span className="font-mono text-ui text-accent-text tabular-nums">15:18</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1">
              <CheckIcon size={14} />
              Approve
            </Button>
            <Button size="sm" variant="secondary">
              Compare
            </Button>
          </div>
        </div>
      </RouteMap>
    </div>
  ),
}

/** The map alone, with a stop picked: its name shows over the marker. */
export const Picked: Story = { args: { defaultValue: 'ridge' } }

/** Delivered: the whole route driven, nothing proposed, no legend. */
export const Delivered: Story = {
  args: {
    legend: false,
    stops: STOPS.map((s) => (s.kind === 'current' ? { ...s, kind: 'stop', card: undefined, icon: undefined, name: 'Ridge road', detail: 'Passed 12:20' } : s)),
    routes: [{ id: 'all', status: 'done', path: ['depot', [20, 65], 'yard', [36, 49], 'truck', [53, 36], 'ridge', [76, 23], 'summit'] }],
  },
}
