import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { BinRack } from './bin-rack'

const meta: Meta<typeof BinRack> = {
  title: 'Blocks/App/Bin Rack',
  component: BinRack,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'See a flow rack’s bins as an isometric drawing colored by part, with low and empty bins marked, a tag for the bin you point at (how many are left and when it runs out), and a switch to auto-call the tugger.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof BinRack>

/** A line-side flow rack: eight bins, one low and one empty; Caps C-12 is tagged: 6 left, empty in about 14 minutes. */
export const Default: Story = { name: 'Line-side bins' }

/** Everything stocked. */
export const AllStocked: Story = {
  name: 'All stocked',
  args: {
    bins: [
      { id: 'a', part: 'housings', label: 'Housings H-04', quantity: 22, capacity: 24, timeLeft: 55 },
      { id: 'b', part: 'brackets', label: 'Brackets B-11', quantity: 20, capacity: 24, timeLeft: 48 },
      { id: 'c', part: 'caps', label: 'Caps C-12', quantity: 18, capacity: 24, timeLeft: 41 },
      { id: 'd', part: 'seals', label: 'Seals S-02', quantity: 21, capacity: 24, timeLeft: 52 },
    ],
  },
}

/** Other data: another rack, German words, auto-call off, and the picks in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    defaultAutoCall: false,
    nextRefill: 11,
    lowBelow: 0.3,
    copy: {
      title: 'Linienbestand',
      rack: 'Durchlaufregal R7',
      subtitle: (rack: string, bins: number) => `${rack} · ${bins} Behälter`,
      lowBadge: (n: number) => `${n} knapp`,
      toRefill: () => 'Behälter nachfüllen',
      nextRefill: () => 'Fahrt in 11 Min.',
      autoCall: 'Routenzug automatisch rufen',
      autoCallHint: (percent: string) => `wenn ein Behälter unter ${percent} fällt`,
    },
    parts: [
      { id: 'a', label: 'Gehäuse', tone: 'chart-5' },
      { id: 'b', label: 'Deckel', tone: 'chart-3' },
    ],
    bins: [
      { id: '1', part: 'a', label: 'Gehäuse G-1', quantity: 20, capacity: 30, timeLeft: 40 },
      { id: '2', part: 'b', label: 'Deckel D-4', quantity: 5, capacity: 30, timeLeft: 12 },
      { id: '3', part: 'a', label: 'Gehäuse G-2', quantity: 0, capacity: 30, timeLeft: 0 },
      { id: '4', part: 'b', label: 'Deckel D-5', quantity: 28, capacity: 30, timeLeft: 70 },
    ],
    onAutoCallChange: fn(),
    onBinSelect: fn(),
  },
}

/** Health: a pharmacy shelf, where the parts are medicines and a refill is the wholesaler's delivery, timed in days. */
export const PharmacyShelf: Story = {
  name: 'Pharmacy shelf',
  args: {
    nextRefill: 2,
    lowBelow: 0.2,
    defaultAutoCall: false,
    format: { time: (days: number) => (days === 1 ? '1 day' : `${days} days`) },
    copy: {
      title: 'Pharmacy shelf',
      rack: 'Dispensary shelf B',
      lowBadge: (n: number) => `${n} to reorder`,
      allStocked: 'All stocked',
      toRefill: () => 'items to reorder',
      nextRefill: (time: string) => `delivery in ${time}`,
      drawingLabel: 'Boxes on the shelf',
      binList: 'Boxes',
      state: { ok: 'in stock', low: 'running low', empty: 'out of stock' },
      isEmpty: 'out of stock',
      emptyIn: (time: string) => `gone in ~${time}`,
      keyLow: 'Running low',
      keyEmpty: 'Out of stock',
      autoCall: 'Reorder automatically',
      autoCallHint: (percent: string) => `when a box drops below ${percent}`,
    },
    parts: [
      { id: 'pain', label: 'Pain relief', tone: 'chart-1' },
      { id: 'allergy', label: 'Allergy', tone: 'chart-3' },
      { id: 'cold', label: 'Cold and flu', tone: 'chart-4' },
    ],
    bins: [
      { id: 'p1', part: 'pain', label: 'Ibuprofen 200 mg', quantity: 36, capacity: 40, timeLeft: 9 },
      { id: 'p2', part: 'pain', label: 'Paracetamol 500 mg', quantity: 7, capacity: 40, timeLeft: 2 },
      { id: 'a1', part: 'allergy', label: 'Cetirizine 10 mg', quantity: 24, capacity: 40, timeLeft: 6 },
      { id: 'a2', part: 'allergy', label: 'Loratadine 10 mg', quantity: 0, capacity: 40, timeLeft: 0 },
      { id: 'c1', part: 'cold', label: 'Nasal spray', quantity: 31, capacity: 40, timeLeft: 8 },
      { id: 'c2', part: 'cold', label: 'Cough syrup', quantity: 18, capacity: 40, timeLeft: 4 },
    ],
  },
}

/** Retail: a vending machine, where the parts are snacks and drinks and a refill is the route driver's visit. */
export const VendingMachine: Story = {
  name: 'Vending machine',
  args: {
    nextRefill: 135,
    lowBelow: 0.3,
    format: { time: (minutes: number) => (minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`) },
    copy: {
      title: 'Vending machine',
      rack: 'Lobby machine 2',
      subtitle: (rack: string, bins: number) => `${rack} · ${bins} spirals`,
      lowBadge: (n: number) => `${n} to restock`,
      toRefill: () => 'spirals to restock',
      nextRefill: (time: string) => `driver in ${time}`,
      drawingLabel: 'Spirals in the machine',
      binList: 'Spirals',
      bin: (label: string, quantity: string, state: string, emptyIn: string) => `${label}, ${quantity} left, ${state}${emptyIn ? `, ${emptyIn}` : ''}`,
      state: { ok: 'stocked', low: 'low', empty: 'sold out' },
      isEmpty: 'sold out',
      emptyIn: (time: string) => `sold out in ~${time}`,
      keyEmpty: 'Sold out',
      autoCall: 'Page the route driver',
      autoCallHint: (percent: string) => `when a spiral drops below ${percent}`,
    },
    parts: [
      { id: 'chips', label: 'Chips', tone: 'chart-3' },
      { id: 'bars', label: 'Snack bars', tone: 'chart-5' },
      { id: 'drinks', label: 'Drinks', tone: 'chart-2' },
    ],
    bins: [
      { id: 'a1', part: 'chips', label: 'Sea salt chips', quantity: 9, capacity: 10, timeLeft: 420 },
      { id: 'a2', part: 'chips', label: 'Salsa chips', quantity: 2, capacity: 10, timeLeft: 85 },
      { id: 'b1', part: 'bars', label: 'Oat bar', quantity: 7, capacity: 10, timeLeft: 300 },
      { id: 'b2', part: 'bars', label: 'Peanut bar', quantity: 0, capacity: 10, timeLeft: 0 },
      { id: 'c1', part: 'drinks', label: 'Sparkling water', quantity: 8, capacity: 12, timeLeft: 240 },
      { id: 'c2', part: 'drinks', label: 'Iced tea', quantity: 5, capacity: 12, timeLeft: 150 },
      { id: 'c3', part: 'drinks', label: 'Cola', quantity: 11, capacity: 12, timeLeft: 510 },
      { id: 'c4', part: 'drinks', label: 'Orange juice', quantity: 3, capacity: 12, timeLeft: 70 },
    ],
  },
}

/** Skeletons hold the drawing's place and every figure while the data loads. */
export const Loading: Story = { args: { loading: true } }

/** No bins: the empty message in the drawing's place. */
export const Empty: Story = { args: { bins: [] } }

/** The load failed: the message with Retry in the drawing's place. */
export const Error: Story = { args: { error: 'Couldn’t load the rack.', onRetry: fn() } }

/** Drawn as its own page, with the card's title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
