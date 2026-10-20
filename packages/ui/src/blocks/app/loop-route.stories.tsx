import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { LoopRoute } from './loop-route'

const meta: Meta<typeof LoopRoute> = {
  title: 'Blocks/App/Loop Route',
  component: LoopRoute,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Follow a tugger round the plant: a loop map with the stops (done, next, ahead) and the tugger, the bins on board, the stops still to come with their bins and arrival times, and Skip stop and Rush delivery.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof LoopRoute>

/** A plant's milk run, loop 3 of 8: three stops done, Weld 2 next in 3 minutes, seven bins on board. */
export const Default: Story = { name: 'Plant milk run' }

/** The tugger near the end of the loop: one stop left, and the list keeps its room. */
export const LastStop: Story = { name: 'Last stop', args: { progress: 0.78 } }

/** Other data: another plant's route, German words, and the actions in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    progress: 0.3,
    loop: { number: 1, of: 4 },
    loopTime: 12,
    format: { time: (minutes: number) => `${minutes} Min.` },
    copy: {
      title: 'Materialrunde',
      vehicle: 'Zug 1',
      onRoute: 'Unterwegs',
      skip: 'Halt überspringen',
      rushDelivery: 'Eilfahrt',
      upNext: 'Als Nächstes',
      loop: (n: number, of: number) => `Runde ${n} von ${of}`,
      subtitle: (vehicle: string) => `${vehicle} · 12 min loop`,
      onBoard: (n: string) => `${n} Behälter an Bord`,
      cargo: (n: string) => `${n} Behälter`,
    },
    stops: [
      { id: 'a', name: 'Lager', position: 0.05, cargo: 0, eta: 0, depot: true },
      { id: 'b', name: 'Stanze', position: 0.25, cargo: 2, eta: 0 },
      { id: 'c', name: 'Presse', position: 0.5, cargo: 3, eta: 4 },
      { id: 'd', name: 'Montage', position: 0.78, cargo: 1, eta: 9 },
    ],
    onSkip: fn(),
    onRush: fn(),
  },
}

/** Education: a school bus loop, where the stops are bus stops and the cargo is the students who get on there. */
export const SchoolBusLoop: Story = {
  name: 'School bus loop',
  args: {
    progress: 0.4,
    loop: { number: 1, of: 2 },
    loopTime: 42,
    format: { time: (minutes: number) => (minutes === 0 ? 'now' : `${minutes} min`) },
    copy: {
      title: 'Morning route',
      vehicle: 'Bus 14',
      onRoute: 'Rolling',
      mapLabel: (done: number, total: number, cargo: number) => `Route map: ${done} of ${total} stops done, ${cargo} students to pick up`,
      loop: (n: number, of: number) => `Run ${n} of ${of}`,
      onBoard: (n: string) => `${n} students to pick up`,
      upNext: 'Next stops',
      cargo: (n: string, count: number) => `${n} ${count === 1 ? 'student' : 'students'}`,
      skip: 'Skip stop',
      rushDelivery: 'Notify school',
      rushingNow: 'Notifying',
      rushed: 'School notified',
      announceSkipped: (name: string) => `${name} skipped`,
      announceRushed: (name: string) => `Told the school the bus is running late at ${name}`,
      none: 'No stops left on this run.',
    },
    stops: [
      { id: 'depot', name: 'Depot', position: 0.03, cargo: 0, eta: 0, depot: true },
      { id: 'oak', name: 'Oak St', position: 0.18, cargo: 4, eta: 0 },
      { id: 'maple', name: 'Maple', position: 0.34, cargo: 6, eta: 0 },
      { id: 'park', name: 'Park Rd', position: 0.5, cargo: 3, eta: 5 },
      { id: 'library', name: 'Library', position: 0.64, cargo: 7, eta: 9 },
      { id: 'school', name: 'School', position: 0.77, cargo: 0, eta: 16 },
    ],
  },
}

/** Operations: a campus shuttle, where the stops are buildings and the cargo is the riders waiting. */
export const CampusShuttle: Story = {
  name: 'Campus shuttle',
  args: {
    progress: 0.62,
    loop: null,
    loopTime: 20,
    copy: {
      title: 'Campus shuttle',
      vehicle: 'Shuttle A',
      onRoute: 'In service',
      mapLabel: (done: number, total: number, cargo: number) => `Route map: ${done} of ${total} stops done, ${cargo} riders waiting ahead`,
      onBoard: (n: string) => `${n} riders waiting`,
      upNext: 'Coming up',
      cargo: (n: string, count: number) => `${n} ${count === 1 ? 'rider' : 'riders'}`,
      skip: 'Skip building',
      rushDelivery: 'Express run',
      rushingNow: 'Switching',
      rushed: 'Running express',
      announceSkipped: (name: string) => `${name} skipped`,
      announceRushed: (name: string) => `Running express to ${name}`,
      none: 'No buildings left on this loop.',
    },
    stops: [
      { id: 'gate', name: 'Main Gate', position: 0.04, cargo: 0, eta: 0, depot: true },
      { id: 'science', name: 'Science Hall', position: 0.22, cargo: 5, eta: 0 },
      { id: 'quad', name: 'Quad', position: 0.4, cargo: 8, eta: 0 },
      { id: 'gym', name: 'Gym', position: 0.62, cargo: 2, eta: 0 },
      { id: 'library', name: 'Library', position: 0.76, cargo: 6, eta: 4 },
      { id: 'union', name: 'Union', position: 0.9, cargo: 3, eta: 8 },
    ],
  },
}

/** Skeletons hold the map's place and the stop list while the data loads. */
export const Loading: Story = { args: { loading: true } }

/** No stops: the empty message in the map's place. */
export const Empty: Story = { args: { stops: [] } }

/** The load failed: the message with Retry in the map's place. */
export const Error: Story = { args: { error: 'Couldn’t load the route.', onRetry: fn() } }

/** Drawn as its own page, with the card's title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
