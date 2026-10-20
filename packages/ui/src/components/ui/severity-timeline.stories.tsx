import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { SeverityTimeline, type SeverityEvent, type SeverityTimelineProps } from './severity-timeline'

const MIN = 60_000
/** Minutes before now, so the open incident's clock lines up with the story's. */
const ago = (minutes: number) => Date.now() - minutes * MIN

function incident(): SeverityEvent[] {
  return [
    { id: 'alert', at: ago(23), severity: 2, title: 'Error rate above 5% on checkout-api', detail: '5xx at 7.4% over 5 min, from 0.3%', actor: 'pagerbot', ongoing: true },
    { id: 'page', at: ago(22), title: 'Paged the payments on-call', actor: 'pagerbot' },
    { id: 'ack', at: ago(20), milestone: 'acknowledged', title: 'M. Oyelaran took command', actor: 'm.oyelaran' },
    { id: 'sev1', at: ago(17), severity: 1, title: 'Card payments failing in eu-west', detail: 'Authorisations time out after 30 s', actor: 'pagerbot', duration: 9 * MIN },
    { id: 'deploy', at: ago(14), severity: 3, title: 'Rolled back checkout-api to v2.14.3', actor: 'deploybot', duration: 4 * MIN },
    { id: 'mitigated', at: ago(8), milestone: 'mitigated', title: 'Authorisations recovering', actor: 'm.oyelaran' },
    { id: 'lag', at: ago(6), severity: 4, title: 'Webhook backlog draining', detail: '1,204 deliveries queued', actor: 'queue-watch', ongoing: true },
  ]
}

const meta: Meta<SeverityTimelineProps> = {
  title: 'UI/Data/Severity Timeline',
  component: SeverityTimeline,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'An incident, event by event (`ol`): each row has its clock time and how long after the start it came, a node on a rail (a dot in its severity’s tone, a diamond for a milestone), a soft SEV chip, the title and the detail. Beside it runs the ribbon: a thin track spanning the incident on every row with the event’s own bar at its offset and length, and every milestone drawn as a dashed rule on every row, so acknowledged, mitigated and resolved line up down the list like a gantt. While the incident is open its window auto-ranges in whole steps and a solid edge marks now; ongoing bars run to it. Events arrive through PresenceList, their node landing and their bar growing from its start. Under 34rem of its own width the ribbon drops under each row. Reduced motion: drawn in place.',
      },
    },
  },
  args: { events: incident() },
  decorators: [(Story) => <div className="w-[46rem] max-w-full rounded-xl border border-line bg-surface p-4 sm:p-5">{Story()}</div>],
}
export default meta
type Story = StoryObj<SeverityTimelineProps>

/** An open incident: two milestones reached, one alert still firing and a backlog draining. */
export const Hero: Story = { render: () => <SeverityTimeline events={incident()} /> }

export const Playground: Story = {}

/** Events arrive while you watch: each draws in, its node lands and its bar grows from its start. */
export const Live: Story = {
  name: 'Live',
  render: function Render() {
    const [events, setEvents] = useState<SeverityEvent[]>(() => incident().slice(0, 3))
    const add = () =>
      setEvents((list) => {
        const n = list.length
        const next: SeverityEvent =
          n % 3 === 0
            ? { id: `e${n}`, at: Date.now(), severity: 2, title: 'Latency p95 above 2 s on edge-gateway', actor: 'pagerbot', ongoing: true }
            : n % 3 === 1
              ? { id: `e${n}`, at: Date.now(), severity: 3, title: 'Scaled payments-worker to 12 replicas', actor: 'autoscaler', duration: 2 * MIN }
              : { id: `e${n}`, at: Date.now(), title: 'Status page updated', actor: 'm.oyelaran' }
        return [...list, next]
      })
    useEffect(() => {
      const id = setInterval(add, 6000)
      return () => clearInterval(id)
    }, [])
    return (
      <div className="flex flex-col gap-4">
        <SeverityTimeline events={events} />
        <div>
          <Button size="sm" variant="secondary" onClick={add}>
            Add an event
          </Button>
        </div>
      </div>
    )
  },
}

/** A closed incident: every phase reached, the window fixed from the first alert to the resolution. */
export const Milestones: Story = {
  render: () => {
    const events = incident().map((e) => (e.ongoing ? { ...e, ongoing: false, duration: e.id === 'alert' ? 17 * MIN : 5 * MIN } : e))
    return <SeverityTimeline events={[...events, { id: 'resolved', at: ago(1), milestone: 'resolved', title: 'Error rate back under 0.5% for 5 min', actor: 'm.oyelaran' }]} />
  },
}

/** Nothing has happened yet. */
export const Empty: Story = { args: { events: [] } }

/** Its own width decides: under 34rem the ribbon drops under each row. */
export const Narrow: Story = {
  decorators: [(Story) => <div className="w-[22rem] max-w-full">{Story()}</div>],
  render: () => <SeverityTimeline events={incident()} />,
}

/** Reduced motion draws everything in place and holds the live end still; the text says what the ribbon shows. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: { docs: { description: { story: 'Set the toolbar’s Motion to reduced: rows, nodes and bars appear in place.' } } },
  render: () => <SeverityTimeline events={incident()} />,
}
