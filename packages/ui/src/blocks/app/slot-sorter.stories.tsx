import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageIcon, ReceiptIcon } from '@youj/icons'
import { fn } from 'storybook/test'
import { SlotSorter } from './slot-sorter'

const meta: Meta<typeof SlotSorter> = {
  title: 'Blocks/App/Slot Sorter',
  component: SlotSorter,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A setup step that sorts a stream of items into slots: the day’s split as one bar, and the latest items with the slot each went to and how sure the sorting was, which you correct by dragging an item onto another slot or from its slot menu. Mail, expenses and support tickets read the same way.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof SlotSorter>

/** Four slots, one of them off and hatched. Drag Dana’s message onto Needs you, or focus its slot button and press 2: the counts and the bar follow. */
export const Default: Story = { name: 'Split inbox', args: { onMove: fn(), onBack: fn() } }

/** Dana’s message already moved to Needs you. */
export const Corrected: Story = { args: { defaultValue: { dana: 'needs-you' } } }

/** Other data: German copy and numbers, three slots and Back and Turn on wired. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    step: 1,
    copy: {
      title: 'Posteingang aufteilen',
      step: (current, total) => `Schritt ${current} von ${total}`,
      heading: 'Sortiert, sobald Post eintrifft',
      splitLabel: 'Aufteilung heute',
      total: (items, off) => `${items} Threads · ${off} aus`,
      sortingLive: 'Live sortiert',
      correctHint: 'Zum Korrigieren ziehen',
      back: 'Zurück',
      turnOn: 'Einschalten',
      throughput: (items, seconds) => `${items} Threads · ${seconds} s`,
    },
    slots: [
      { id: 'inbox', label: 'Wichtig', tone: 'chart-3', count: 1860 },
      { id: 'later', label: 'Später', tone: 'chart-4', count: 420 },
      { id: 'news', label: 'Newsletter', tone: 'neutral', count: 90, off: true },
    ],
    items: [
      { id: 'a', name: 'Mia Becker', detail: 'Angebot bis Freitag', slot: 'inbox', confidence: 'high' },
      { id: 'b', name: 'Jonas Weber', detail: 'Rückfrage zur Rechnung', slot: 'later', confidence: 'low' },
      { id: 'c', name: 'Linden Shop', detail: 'Neu im Sortiment', slot: 'news', confidence: 'high' },
    ],
    throughput: { items: 4200, seconds: 55 },
    onBack: fn(),
    onTurnOn: fn(),
    onMove: fn(),
    onValueChange: fn(),
  },
}

/** Drawn as its own page, with the card’s title as the page’s `h1`. */
export const Standalone: Story = { args: { embedded: false } }

/** Finance: card transactions sorted into categories. The grocery run is the one the sorting is least sure of; Reimbursable is off, so nothing can be moved into it. */
export const ExpenseCategorizer: Story = {
  name: 'Expense categorizer',
  args: {
    icon: <ReceiptIcon aria-hidden size={16} className="text-accent-text" />,
    illustration: 'wallet',
    copy: {
      title: 'Categorize expenses',
      step: (current, total) => `Rule ${current} of ${total}`,
      heading: 'Sorted into categories as charges post',
      splitLabel: 'This month’s spend',
      total: (items, off) => `${items} charges · ${off} excluded`,
      splitAria: 'Charges by category',
      sortingLive: 'Categorizing live',
      correctHint: 'Drag to recategorize',
      moveTo: 'Recategorize as',
      row: (name, detail, slot, confidence) => `${name}, ${detail}. Filed under ${slot}. ${confidence}.`,
      dragInstructions: (keys) => `Drag a charge onto a category above, or choose its category: press ${keys} on the category button, or open its menu.`,
      moved: (name, slot, counts) => `Moved the ${name} charge to ${slot}. ${counts}`,
      throughput: (items, seconds) => `${items} charges · ${seconds} s`,
      turnOn: 'Apply rules',
      turningOn: 'Applying',
    },
    slots: [
      { id: 'travel', label: 'Travel', tone: 'chart-2', count: 38 },
      { id: 'software', label: 'Software', tone: 'chart-1', count: 52 },
      { id: 'meals', label: 'Meals', tone: 'chart-4', count: 71 },
      { id: 'personal', label: 'Reimbursable', tone: 'neutral', count: 9, off: true },
    ],
    items: [
      { id: 'sw', name: 'Figment', detail: 'Annual team plan · $1,188.00', slot: 'software', confidence: 'high' },
      { id: 'air', name: 'Northwind Air', detail: 'SFO to JFK · $412.60', slot: 'travel', confidence: 'high' },
      { id: 'cafe', name: 'Juniper Café', detail: 'Client lunch · $86.40', slot: 'meals', confidence: 'medium' },
      { id: 'mkt', name: 'Corner Market', detail: 'Office snacks · $54.15', slot: 'meals', confidence: 'low' },
    ],
    throughput: { items: 1200, seconds: 18 },
    onBack: fn(),
    onMove: fn(),
  },
}

/** Support: tickets sorted into queues by topic. Billing is paused, so tickets can't be sent to it, and the charged-twice ticket sits under Bugs with low confidence. */
export const SupportTriage: Story = {
  name: 'Support triage',
  args: {
    icon: <MessageIcon aria-hidden size={16} className="text-accent-text" />,
    illustration: 'chat',
    copy: {
      title: 'Route tickets',
      step: (current, total) => `Routing ${current} of ${total}`,
      heading: 'Routed to a queue as tickets arrive',
      splitLabel: 'Today’s queues',
      total: (items, off) => `${items} tickets · ${off} paused`,
      splitAria: 'Tickets by queue',
      slotOff: 'paused',
      sortingLive: 'Routing live',
      correctHint: 'Drag to reroute',
      moveTo: 'Reroute to',
      row: (name, detail, slot, confidence) => `${name}, ${detail}. In the ${slot} queue. ${confidence}.`,
      dragInstructions: (keys) => `Drag a ticket onto a queue above, or choose its queue: press ${keys} on the queue button, or open its menu.`,
      moved: (name, slot, counts) => `Rerouted ${name}’s ticket to ${slot}. ${counts}`,
      throughput: (items, seconds) => `${items} tickets · ${seconds} s`,
      turnOn: 'Start routing',
      turningOn: 'Starting',
      turnedOn: 'Routing',
    },
    slots: [
      { id: 'urgent', label: 'Urgent', tone: 'chart-3', count: 7 },
      { id: 'how-to', label: 'How-to', tone: 'accent', count: 44 },
      { id: 'bugs', label: 'Bugs', tone: 'chart-5', count: 19 },
      { id: 'billing', label: 'Billing', tone: 'neutral', count: 23, off: true },
    ],
    items: [
      { id: 't1', name: 'Priya Nair', detail: 'Exports fail since this morning', slot: 'urgent', confidence: 'high' },
      { id: 't2', name: 'Tomás Rivera', detail: 'How do I add a teammate?', slot: 'how-to', confidence: 'high' },
      { id: 't3', name: 'Lena Fischer', detail: 'Charged twice for May', slot: 'bugs', confidence: 'low' },
      { id: 't4', name: 'Sam Whitfield', detail: 'Dark mode flickers on load', slot: 'bugs', confidence: 'medium' },
    ],
    throughput: { items: 90, seconds: 60 },
    onBack: fn(),
    onMove: fn(),
  },
}
