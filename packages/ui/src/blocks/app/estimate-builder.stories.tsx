import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { EstimateBuilder } from './estimate-builder'

const meta: Meta<typeof EstimateBuilder> = {
  title: 'Blocks/App/Estimate Builder',
  component: EstimateBuilder,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Estimate what anything priced by the amount will cost, from usage pricing to a catering or moving quote: the single-period or twelve-period total with its all-in unit price, a bar and key that split it by line, and a ruler per line in its color with its cost and unit price. Presets set every line at once, the picker in the head scales the prices, and Save estimate sends the lot.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof EstimateBuilder>

/** A log platform's usage pricing: the Startup preset in na-east, billed monthly. */
export const Default: Story = { name: 'Usage pricing' }

/** Annual billing, the discount taken, for the Scale preset in eu-central. */
export const Annual: Story = {
  args: { defaultBilling: 'annual', defaultRegion: 'eu-central', defaultUsage: { ingest: 180, retention: 90, queries: 90, seats: 45 } },
}

/** Other data: an email platform's three lines in euros, two presets, German words and the save in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    annualDiscount: 0.1,
    lines: [
      { id: 'mails', label: 'E-Mails', tone: 'chart-5', unit: 'Tsd. / Tag', min: 0, max: 100, step: 1, price: 0.09, priceUnit: 'Tsd.', perMonth: 30 },
      { id: 'domains', label: 'Domains', tone: 'chart-2', unit: 'Domains', min: 1, max: 20, step: 1, price: 4, priceUnit: 'Domain' },
      { id: 'seats', label: 'Plätze', tone: 'chart-4', unit: 'Plätze', min: 1, max: 30, step: 1, price: 7, priceUnit: 'Platz' },
    ],
    presets: [
      { id: 'small', label: 'Klein', usage: { mails: 8, domains: 2, seats: 3 } },
      { id: 'team', label: 'Team', usage: { mails: 40, domains: 6, seats: 12 } },
    ],
    regions: [
      { id: 'eu', label: 'EU', factor: 1 },
      { id: 'ch', label: 'CH', factor: 1.2 },
    ],
    copy: {
      title: 'Kostenschätzung',
      region: 'Region',
      estimated: 'Geschätzte Kosten',
      monthly: 'Monatlich',
      annual: 'Jährlich',
      perMonth: '/ Monat',
      perYear: '/ Jahr',
      allIn: (price: string, unit: string) => `≈ ${price} je ${unit}, alles inklusive`,
      usage: 'Nutzung',
      preset: (name: string) => `Vorlage ${name}`,
      custom: 'Eigene',
      caption: (currency: string, region: string) => `${currency} · Zzgl. MwSt. · ${region}`,
      reset: 'Zurücksetzen',
      save: 'Schätzung speichern',
      currency: 'EUR',
    },
    onSave: fn(),
  },
}

/** Events: a caterer's quote by guests, courses, staff hours and rentals; Single event or twelve at a discount. */
export const CateringQuote: Story = {
  name: 'Catering quote',
  args: {
    annualDiscount: 0.1,
    lines: [
      { id: 'guests', label: 'Guests', tone: 'chart-1', unit: 'guests', min: 20, max: 400, step: 5, price: 38, priceUnit: 'guest', ticks: 40 },
      { id: 'courses', label: 'Courses', tone: 'chart-2', unit: 'courses', min: 1, max: 7, step: 1, price: 120, priceUnit: 'course', ticks: 7 },
      { id: 'staff', label: 'Staff hours', tone: 'chart-3', unit: 'hours', min: 4, max: 60, step: 1, price: 32, priceUnit: 'hour' },
      { id: 'rentals', label: 'Rentals', tone: 'chart-4', unit: 'tables', min: 0, max: 60, step: 1, price: 14, priceUnit: 'table', ticks: 30 },
    ],
    presets: [
      { id: 'brunch', label: 'Brunch', usage: { guests: 30, courses: 2, staff: 6, rentals: 4 } },
      { id: 'wedding', label: 'Wedding', usage: { guests: 120, courses: 4, staff: 24, rentals: 15 } },
      { id: 'gala', label: 'Gala', usage: { guests: 300, courses: 5, staff: 48, rentals: 40 } },
    ],
    regions: [
      { id: 'downtown', label: 'Downtown', factor: 1 },
      { id: 'suburbs', label: 'Suburbs', factor: 0.94 },
      { id: 'islands', label: 'Outer islands', factor: 1.18 },
    ],
    copy: {
      title: 'Catering quote',
      region: 'Venue area',
      estimated: 'Estimated quote',
      monthly: 'Single event',
      annual: 'Twelve events',
      perMonth: '/ event',
      perYear: '/ 12 events',
      allIn: (price: string, unit: string) => `≈ ${price} per ${unit}, all-in`,
      breakdown: 'Quote by line',
      usage: 'Event',
      presets: 'Event type',
      preset: (name: string) => `${name} package`,
      caption: (currency: string, region: string) => `${currency} · Excl. tax and tip · ${region}`,
      save: 'Save quote',
    },
    onSave: fn(),
  },
}

/** Households: a mover's quote by rooms, miles, packing hours and months in storage. */
export const MovingQuote: Story = {
  name: 'Moving quote',
  args: {
    showBilling: false,
    lines: [
      { id: 'distance', label: 'Distance', tone: 'chart-2', unit: 'miles', min: 5, max: 2500, step: 5, price: 1.35, priceUnit: 'mile', ticks: 50 },
      { id: 'rooms', label: 'Rooms', tone: 'chart-1', unit: 'rooms', min: 1, max: 8, step: 1, price: 180, priceUnit: 'room', ticks: 8 },
      { id: 'packing', label: 'Packing', tone: 'chart-3', unit: 'hours', min: 0, max: 40, step: 1, price: 55, priceUnit: 'hour' },
      { id: 'storage', label: 'Storage', tone: 'chart-5', unit: 'months', min: 0, max: 12, step: 1, price: 120, priceUnit: 'month', ticks: 12 },
    ],
    presets: [
      { id: 'studio', label: 'Studio', usage: { distance: 25, rooms: 1, packing: 3, storage: 0 } },
      { id: 'family', label: 'Family home', usage: { distance: 300, rooms: 5, packing: 16, storage: 2 } },
      { id: 'cross', label: 'Cross-country', usage: { distance: 1900, rooms: 6, packing: 24, storage: 3 } },
    ],
    regions: [
      { id: 'weekday', label: 'Weekday', factor: 1 },
      { id: 'weekend', label: 'Weekend', factor: 1.15 },
      { id: 'month-end', label: 'Month end', factor: 1.3 },
    ],
    copy: {
      title: 'Moving quote',
      region: 'Move day',
      estimated: 'Estimated quote',
      perMonth: '/ move',
      allIn: (price: string, unit: string) => `≈ ${price} per ${unit}, all-in`,
      breakdown: 'Quote by line',
      usage: 'Your move',
      presets: 'Home size',
      preset: (name: string) => `${name} move`,
      caption: (currency: string, region: string) => `${currency} · Excl. tax and tip · ${region}`,
      save: 'Save quote',
    },
    onSave: fn(),
  },
}

/** Skeletons hold the estimate, the bar, the key and the usage lines while the data loads. */
export const Loading: Story = { args: { loading: true } }

/** No lines yet: the empty message over the body's own room. */
export const Empty: Story = { args: { lines: [] } }

/** The load failed: the message with Retry over the body's own room. */
export const Error: Story = { args: { error: 'Couldn’t load the prices.', onRetry: fn() } }

/** Drawn as its own page, with the title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
