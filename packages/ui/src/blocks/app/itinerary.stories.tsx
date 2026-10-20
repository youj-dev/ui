import type { Meta, StoryObj } from '@storybook/react-vite'
import { BuildingIcon, CoffeeIcon, PlaneIcon, PresentationIcon, ClapperboardIcon, PackageIcon } from '@youj/icons'
import { fn } from 'storybook/test'
import { Itinerary } from './itinerary'
import { LEGS } from './itinerary/data'

const meta: Meta<typeof Itinerary> = {
  title: 'Blocks/App/Itinerary',
  component: Itinerary,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Keep a trip together: the next leg as a boarding pass with a countdown, the days with the place each is spent in, and every booking with its confirmation code to copy. City breaks, conference weeks and film shoots read the same way: your stops, legs, kinds of booking and their statuses are props.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof Itinerary>

/** A city break: Lisbon to Barcelona to Rome, the next flight as the pass and today’s plans below it. */
export const Default: Story = { name: 'City trip' }

/** Halfway to Rome: the plane rides the route line and the pass counts down to landing. */
export const InFlight: Story = { name: 'In flight', args: { now: +LEGS[1]!.depart + 55 * 60_000 } }

const local = (day: number, hh: number, mm: number, offset: number) => Date.UTC(2026, 10, day, hh, mm) - offset * 60_000

/** A long weekend from London to Copenhagen, fed through props with its own copy. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { title: 'Copenhagen weekend' },
    stops: [
      { id: 'lhr', code: 'LHR', name: 'London', utcOffset: 0 },
      { id: 'cph', code: 'CPH', name: 'Copenhagen', utcOffset: 60, tone: 'chart-5' },
    ],
    legs: [
      { id: 'out', from: 'lhr', to: 'cph', depart: local(13, 8, 5, 0), arrive: local(13, 10, 55, 60), code: 'SK 502', place: '3A', reference: 'H8WQ2C' },
      { id: 'back', from: 'cph', to: 'lhr', depart: local(15, 19, 30, 60), arrive: local(15, 20, 25, 0), code: 'SK 535', place: '3C', reference: 'H8WQ2C' },
    ],
    stays: [{ id: 'sanders', at: 'cph', start: local(13, 15, 0, 60), end: local(15, 11, 0, 60), name: 'Hotel Sanders' }],
    bookings: [
      { id: 'k1', day: 0, kind: 'flight', title: 'SK 502 to Copenhagen', detail: 'LHR 08:05 → CPH 10:55 · seat 3A', time: '08:05', code: 'H8WQ2C', status: 'checked-in' },
      { id: 'k2', day: 0, kind: 'stay', title: 'Check in at Hotel Sanders', detail: 'Tordenskjoldsgade 15 · 2 nights', time: '15:00', code: 'SAN-4410', status: 'confirmed' },
      { id: 'k3', day: 1, kind: 'table', title: 'Lunch at Barr', detail: 'Table for 2', time: '12:30', code: 'BR-2207', status: 'confirmed' },
      { id: 'k4', day: 2, kind: 'flight', title: 'SK 535 home to London', detail: 'CPH 19:30 → LHR 20:25 · seat 3C', time: '19:30', code: 'H8WQ2C', status: 'opens' },
    ],
    start: local(13, 0, 0, 0),
    days: 3,
    now: local(13, 6, 10, 0),
  },
}

/** A conference week: Denver to Austin, a hotel, sessions with their own kinds and statuses, and dinners. */
export const ConferenceWeek: Story = {
  name: 'Conference week',
  args: {
    copy: { title: 'Austin Dev Summit', share: 'Share schedule', addPlan: 'Add to schedule', footer: 'Session times are local' },
    stops: [
      { id: 'den', code: 'DEN', name: 'Denver', utcOffset: -420, tone: 'chart-4' },
      { id: 'aus', code: 'AUS', name: 'Austin', utcOffset: -360, tone: 'chart-2' },
    ],
    legs: [
      { id: 'out', from: 'den', to: 'aus', depart: local(9, 7, 10, -420), arrive: local(9, 10, 40, -360), code: 'Summit 482', place: '12C', reference: 'K2M9QD' },
      { id: 'back', from: 'aus', to: 'den', depart: local(13, 17, 45, -360), arrive: local(13, 19, 15, -420), code: 'Summit 311', place: '12C', reference: 'R8T5VN' },
    ],
    stays: [{ id: 'lamar', at: 'aus', start: local(9, 14, 0, -360), end: local(13, 11, 0, -360), name: 'Lamar Hotel' }],
    kinds: [
      { id: 'travel', label: 'Travel', icon: PlaneIcon },
      { id: 'hotel', label: 'Hotel', icon: BuildingIcon },
      { id: 'session', label: 'Session', icon: PresentationIcon },
      { id: 'dinner', label: 'Dinner', icon: CoffeeIcon },
    ],
    statuses: [
      { id: 'booked', label: 'Booked' },
      { id: 'speaking', label: 'You’re speaking', tone: 'accent' },
      { id: 'waitlist', label: 'Waitlisted', tone: 'warning' },
      { id: 'attended', label: 'Attended', done: true },
    ],
    bookings: [
      { id: 'c1', day: 0, kind: 'travel', title: 'Summit 482 to Austin', detail: 'DEN 07:10 → AUS 10:40 · seat 12C', time: '07:10', code: 'K2M9QD', status: 'attended' },
      { id: 'c2', day: 0, kind: 'hotel', title: 'Check in at Lamar Hotel', detail: '600 Lamar Blvd · 4 nights', time: '14:00', code: 'LH-30412', status: 'attended' },
      { id: 'c3', day: 0, kind: 'session', title: 'Badge pickup', detail: 'Convention Center, Hall B', time: '16:00', code: 'BDG-4471', status: 'attended' },
      { id: 'c4', day: 0, kind: 'dinner', title: 'Team dinner at Salt & Ember', detail: 'Table for 6', time: '19:30', code: 'SE-8812', status: 'attended' },
      { id: 'c5', day: 1, kind: 'session', title: 'Keynote: The next decade of search', detail: 'Main stage, Hall A', time: '09:00', code: 'KN-5120', status: 'booked' },
      { id: 'c6', day: 1, kind: 'session', title: 'Workshop: Evaluating retrieval', detail: 'Room 12B · bring a laptop', time: '13:30', code: 'WS-2291', status: 'booked' },
      { id: 'c7', day: 1, kind: 'dinner', title: 'Dinner with the partner team', detail: 'Private room for 8', time: '19:00', code: 'PT-6405', status: 'booked' },
      { id: 'c8', day: 2, kind: 'session', title: 'Your talk: Scaling the pipeline', detail: 'Room 5 · speaker check-in at 10:30', time: '11:00', code: 'SP-3317', status: 'speaking' },
      { id: 'c9', day: 2, kind: 'session', title: 'Panel: Open data in practice', detail: 'Room 3', time: '15:00', code: 'PN-7742', status: 'waitlist' },
      { id: 'c10', day: 3, kind: 'session', title: 'Lightning talks', detail: 'Main stage', time: '10:00', code: 'LT-1180', status: 'booked' },
      { id: 'c11', day: 3, kind: 'dinner', title: 'Conference party', detail: 'Rooftop at The Foundry', time: '20:00', code: 'CP-9001', status: 'booked' },
      { id: 'c12', day: 4, kind: 'hotel', title: 'Check out of Lamar Hotel', detail: 'Luggage held until 15:00', time: '11:00', code: 'LH-30412', status: 'booked' },
      { id: 'c13', day: 4, kind: 'travel', title: 'Summit 311 to Denver', detail: 'AUS 17:45 → DEN 19:15 · seat 12C', time: '17:45', code: 'R8T5VN', status: 'booked' },
    ],
    start: local(9, 0, 0, -420),
    days: 5,
    now: local(10, 8, 30, -360),
    onDayChange: fn(),
  },
}

/** A film shoot: Los Angeles to two desert locations, crew calls, equipment pickups and company moves. */
export const FilmShoot: Story = {
  name: 'Film shoot',
  args: {
    copy: {
      title: 'Desert shoot',
      share: 'Share call sheet',
      addPlan: 'Add call',
      legCode: 'Charter',
      legPlace: 'Group',
      legReference: 'Manifest',
    },
    stops: [
      { id: 'lax', code: 'LAX', name: 'Los Angeles', utcOffset: -480, tone: 'chart-4' },
      { id: 'cny', code: 'CNY', name: 'Moab', utcOffset: -420, tone: 'chart-3' },
      { id: 'pga', code: 'PGA', name: 'Page', utcOffset: -420, tone: 'chart-1' },
    ],
    legs: [
      { id: 'in', from: 'lax', to: 'cny', depart: local(16, 6, 0, -480), arrive: local(16, 8, 20, -420), code: 'CH-1127', place: 'Group A', reference: 'MF-0412' },
      { id: 'move', from: 'cny', to: 'pga', depart: local(18, 17, 30, -420), arrive: local(18, 18, 20, -420), code: 'CH-1131', place: 'Group A', reference: 'MF-0418' },
      { id: 'out', from: 'pga', to: 'lax', depart: local(20, 15, 0, -420), arrive: local(20, 15, 35, -480), code: 'CH-1140', place: 'Group A', reference: 'MF-0425' },
    ],
    stays: [
      { id: 'lodge', at: 'cny', start: local(16, 11, 0, -420), end: local(18, 10, 0, -420), name: 'Red Rock Lodge' },
      { id: 'inn', at: 'pga', start: local(18, 19, 30, -420), end: local(20, 9, 30, -420), name: 'Canyon View Inn' },
    ],
    kinds: [
      { id: 'travel', label: 'Travel', icon: PlaneIcon },
      { id: 'call', label: 'Crew call', icon: ClapperboardIcon },
      { id: 'gear', label: 'Equipment', icon: PackageIcon },
      { id: 'hotel', label: 'Hotel', icon: BuildingIcon },
    ],
    statuses: [
      { id: 'confirmed', label: 'Confirmed' },
      { id: 'called', label: 'Crew called', tone: 'success' },
      { id: 'hold', label: 'On hold', tone: 'warning' },
      { id: 'wrapped', label: 'Wrapped', done: true },
    ],
    bookings: [
      { id: 'f1', day: 0, kind: 'travel', title: 'Crew charter to Moab', detail: 'LAX 06:00 → CNY 08:20 · 24 seats', time: '06:00', code: 'MF-0412', status: 'wrapped' },
      { id: 'f2', day: 0, kind: 'gear', title: 'Pick up the grip truck', detail: 'Moab Rentals · Truck 2', time: '09:30', code: 'GT-4402', status: 'wrapped' },
      { id: 'f3', day: 0, kind: 'hotel', title: 'Check in at Red Rock Lodge', detail: 'Crew block · 18 rooms', time: '11:00', code: 'RRL-2208', status: 'wrapped' },
      { id: 'f4', day: 0, kind: 'call', title: 'Crew call: canyon rim scout', detail: 'Call sheet 1 · wrap at 18:00', time: '14:00', code: 'CS-01', status: 'wrapped' },
      { id: 'f5', day: 1, kind: 'call', title: 'Crew call: canyon rim', detail: 'Call sheet 2 · sunrise shots', time: '05:15', code: 'CS-02', status: 'wrapped' },
      { id: 'f6', day: 1, kind: 'gear', title: 'Drone and camera pickup', detail: 'Moab Rentals · cage 4', time: '13:00', code: 'EQ-7781', status: 'wrapped' },
      { id: 'f7', day: 2, kind: 'call', title: 'Crew call: arch interior', detail: 'Call sheet 3 · permit holder on site', time: '06:00', code: 'CS-03', status: 'called' },
      { id: 'f8', day: 2, kind: 'gear', title: 'Return the grip truck', detail: 'Moab Rentals · Truck 2', time: '15:30', code: 'GT-4402', status: 'confirmed' },
      { id: 'f9', day: 2, kind: 'travel', title: 'Company move to Page', detail: 'CNY 17:30 → PGA 18:20 · 24 seats', time: '17:30', code: 'MF-0418', status: 'confirmed' },
      { id: 'f10', day: 2, kind: 'hotel', title: 'Check in at Canyon View Inn', detail: 'Crew block · 18 rooms', time: '19:30', code: 'CVI-5530', status: 'confirmed' },
      { id: 'f11', day: 3, kind: 'call', title: 'Crew call: Horseshoe Bend', detail: 'Call sheet 4 · golden hour', time: '05:45', code: 'CS-04', status: 'confirmed' },
      { id: 'f12', day: 3, kind: 'gear', title: 'Steadicam pickup', detail: 'Page Film Services · waiting on the rental slot', time: '12:00', code: 'EQ-7790', status: 'hold' },
      { id: 'f13', day: 4, kind: 'hotel', title: 'Check out of Canyon View Inn', detail: 'Gear loaded by 09:00', time: '09:30', code: 'CVI-5530', status: 'confirmed' },
      { id: 'f14', day: 4, kind: 'travel', title: 'Crew charter home', detail: 'PGA 15:00 → LAX 15:35 · 24 seats', time: '15:00', code: 'MF-0425', status: 'confirmed' },
    ],
    start: local(16, 0, 0, -480),
    days: 5,
    now: local(18, 11, 0, -420),
  },
}

/** Skeletons hold the pass and the days while the trip loads; the header’s dates turn to a skeleton too. */
export const Loading: Story = { args: { loading: true } }

/** Nothing planned: the empty message in the body’s place. */
export const Empty: Story = { args: { legs: [], stays: [], bookings: [] } }

/** The load failed: the message with Retry in the body’s place. */
export const Error: Story = { args: { error: 'Couldn’t load the trip.', onRetry: fn() } }

/** Drawn as its own page, with the title as the page’s `h1`. */
export const Standalone: Story = { args: { embedded: false } }
