import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { TileBoard } from './tile-board'

const meta: Meta<typeof TileBoard> = {
  title: 'Blocks/App/Tile Board',
  component: TileBoard,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Watch a set of things as tiles in your own statuses and handle the one status that needs someone: a timer, the reason as one choice, who is coming and when, the escalation countdown, then escalate or resolve.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof TileBoard>

/** Eight stations on Line 3; Weld 1 has been stopped for 4:12 and the supervisor is paged in 1:48. */
export const Default: Story = { name: 'Assembly line', args: { demoMarker: false } }

/** A running station selected: the panel keeps its room. */
export const Running: Story = { args: { demoMarker: false, defaultSelected: 'cut' } }

/** Other data: another line, German words, a clock you pass (so it holds still), and the callbacks in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    now: '2026-10-13T06:30:00Z',
    copy: {
      title: 'Stationsübersicht',
      subtitle: (n: number) => `Linie 5 · ${n} Stationen`,
      alertCount: (n: number) => `${n} gestoppt`,
      escalate: 'Eskalieren',
      resolve: 'Beheben',
      escalatesIn: (clock: string) => `Schichtleiter wird in ${clock} gerufen`,
    },
    reasons: [
      { id: 'tool', label: 'Werkzeug' },
      { id: 'part', label: 'Teile' },
    ],
    tiles: [
      { id: 'a', name: 'Stanze', status: 'running', cycleSeconds: 22 },
      { id: 'b', name: 'Presse', status: 'stopped', since: '2026-10-13T06:24:00Z', reason: 'part', responder: { name: 'Lena Roth', detail: 'Logistik · unterwegs', etaMinutes: 4 }, escalateAt: '2026-10-13T06:33:00Z' },
      { id: 'c', name: 'Prüfen', status: 'hold', note: 'Freigabe' },
      { id: 'd', name: 'Pack', status: 'idle', note: 'leer' },
    ],
    onReasonChange: fn(),
    onEscalate: fn(),
    onResolve: fn(),
  },
}

/** Retail: registers as tiles, "Needs help" as the status the board handles, and the floor lead as the responder. */
export const CheckoutLanes: Story = {
  name: 'Checkout lanes',
  args: {
    now: '2026-10-13T16:20:00Z',
    copy: {
      title: 'Checkout lanes',
      subtitle: (n: number) => `Front of store · ${n} registers`,
      allClear: 'All lanes clear',
      alertCount: (n: number) => `${n} ${n === 1 ? 'needs' : 'need'} help`,
      gridLabel: 'Registers',
      alertTitle: (name: string) => `${name} needs help`,
      timerLabel: 'Waiting for',
      reasonLabel: 'Help needed',
      escalatesIn: (clock: string) => `Manager called in ${clock}`,
      paged: 'Manager called',
      escalate: 'Call manager',
      resolve: 'Helped',
      resolved: 'Done',
      announceResolved: (name: string) => `${name} is open again`,
      announceEscalated: (name: string) => `Manager called to ${name}`,
    },
    statuses: [
      { id: 'open', label: 'Open', tone: 'success' },
      { id: 'closed', label: 'Closed', tone: 'neutral' },
      { id: 'paused', label: 'Paused', tone: 'warning' },
      { id: 'help', label: 'Needs help', tone: 'danger', alert: true },
    ],
    reasons: [
      { id: 'price', label: 'Price check' },
      { id: 'age', label: 'ID check' },
      { id: 'payment', label: 'Payment' },
    ],
    tiles: [
      { id: 'r1', name: 'Reg 1', status: 'open', note: '3 in line' },
      { id: 'r2', name: 'Reg 2', status: 'open', note: '1 in line' },
      { id: 'r3', name: 'Reg 3', status: 'closed', note: 'closed' },
      { id: 'r4', name: 'Reg 4', status: 'help', since: '2026-10-13T16:17:40Z', reason: 'age', responder: { name: 'Dana Ruiz', detail: 'floor lead · on the way', etaMinutes: 1 }, escalateAt: '2026-10-13T16:23:00Z' },
      { id: 'r5', name: 'Reg 5', status: 'paused', note: 'back at 4:30' },
      { id: 'r6', name: 'Self 1', status: 'open', note: 'free' },
      { id: 'r7', name: 'Self 2', status: 'open', note: '2 in line' },
      { id: 'r8', name: 'Self 3', status: 'closed', note: 'closed' },
    ],
    onReasonChange: fn(),
    onEscalate: fn(),
    onResolve: fn(),
  },
}

/** Health: beds as tiles, "Call" as the status the board handles, a nurse as the responder, arrival written through `format.eta`. */
export const HospitalBeds: Story = {
  name: 'Hospital beds',
  args: {
    now: '2026-10-13T03:41:00Z',
    format: { eta: (minutes: number) => `${minutes} min away` },
    copy: {
      title: 'Ward 4 beds',
      subtitle: (n: number) => `Night shift · ${n} beds`,
      allClear: 'No calls',
      alertCount: (n: number) => `${n} calling`,
      gridLabel: 'Beds',
      alertTitle: (name: string) => `${name} is calling`,
      timerLabel: 'Calling for',
      reasonLabel: 'Reason for the call',
      escalatesIn: (clock: string) => `Charge nurse paged in ${clock}`,
      paged: 'Charge nurse paged',
      escalate: 'Page charge nurse',
      resolve: 'Answered',
      resolved: 'Done',
      announceResolved: (name: string) => `${name}’s call is answered`,
      announceEscalated: (name: string) => `Charge nurse paged for ${name}`,
    },
    statuses: [
      { id: 'occupied', label: 'Occupied', tone: 'neutral' },
      { id: 'free', label: 'Free', tone: 'success' },
      { id: 'cleaning', label: 'Cleaning', tone: 'warning' },
      { id: 'call', label: 'Call', tone: 'danger', alert: true },
    ],
    reasons: [
      { id: 'pain', label: 'Pain' },
      { id: 'toilet', label: 'Bathroom' },
      { id: 'alarm', label: 'Alarm' },
    ],
    tiles: [
      { id: 'b1', name: 'Bed 1', status: 'occupied', note: 'R. Ames' },
      { id: 'b2', name: 'Bed 2', status: 'occupied', note: 'T. Okoye' },
      { id: 'b3', name: 'Bed 3', status: 'free', note: 'ready' },
      { id: 'b4', name: 'Bed 4', status: 'call', since: '2026-10-13T03:38:50Z', reason: 'pain', responder: { name: 'Priya Nair', detail: 'nurse · down the hall', etaMinutes: 1 }, escalateAt: '2026-10-13T03:43:00Z' },
      { id: 'b5', name: 'Bed 5', status: 'cleaning', note: '5 min left' },
      { id: 'b6', name: 'Bed 6', status: 'occupied', note: 'M. Lindqvist' },
      { id: 'b7', name: 'Bed 7', status: 'free', note: 'ready' },
      { id: 'b8', name: 'Bed 8', status: 'occupied', note: 'H. Cole' },
    ],
    onReasonChange: fn(),
    onEscalate: fn(),
    onResolve: fn(),
  },
}

/** Drawn as its own page, with the card's title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false, demoMarker: false } }
