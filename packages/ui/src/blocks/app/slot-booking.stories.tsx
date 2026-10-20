import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SlotBooking, type SlotBookingService, type SlotBookingSlot } from './slot-booking'

const meta: Meta<typeof SlotBooking> = {
  title: 'Blocks/App/Slot Booking',
  component: SlotBooking,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Help your users book a time from a calm month calendar and the chosen day’s timetable. `variant="grid"` shows the week as a slot grid instead. Classes, appointments and lessons read the same way: your services, hosts, prices and pass are props.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof SlotBooking>

/** Studio classes: three services, a class pass that counts down, free cancellation. */
export const Default: Story = { name: 'Yoga studio' }

/** The week as a SlotGrid: a column a day, a row a start time, places as pips. */
export const StudioGrid: Story = {
  name: 'Studio grid',
  args: { variant: 'grid' },
}

/** The grid with the Private class: one place a session, so a slot is open or full, nothing between. */
export const OnePlace: Story = {
  name: 'One place a slot',
  args: { variant: 'grid', services: [{ id: 'private', name: 'Private', minutes: 55, price: 75, capacity: 1, host: { name: 'Aiko Tanaka', role: 'Physio', initials: 'AT' } }] },
}

/** Weekdays only: each service offers its start times (minutes after midnight) on a rotating pattern, so some slots are full. */
const weekdays =
  (starts: Record<string, number[]>) =>
  (day: number, services: SlotBookingService[]): SlotBookingSlot[] => {
    const date = new Date(day)
    const dow = date.getDay()
    if (dow === 0 || dow === 6) return []
    return services
      .flatMap((service, i) =>
        (starts[service.id] ?? [])
          .filter((_, t) => (dow + t + i) % 3 !== 0)
          .map((minute) => {
            const start = new Date(date)
            start.setHours(Math.floor(minute / 60), minute % 60)
            const left = service.capacity - ((dow * 2 + minute / 5 + i) % (service.capacity + 1))
            return { id: `${service.id}-${day}-${minute}`, service: service.id, start: start.getTime(), left, capacity: service.capacity }
          }),
      )
      .sort((a, b) => a.start - b.start)
  }

const clinic: SlotBookingService[] = [
  { id: 'checkup', name: 'Check-up', minutes: 20, capacity: 1, host: { name: 'Dr. Amara Okafor', role: 'General practitioner', initials: 'AO' } },
  { id: 'follow-up', name: 'Follow-up', minutes: 15, capacity: 1, host: { name: 'Dr. Hannah Weiss', role: 'Family physician', initials: 'HW' } },
  { id: 'vaccination', name: 'Vaccination', minutes: 10, capacity: 1, host: { name: 'Nina Castillo', role: 'Nurse', initials: 'NC' } },
]

/** Health: visit types with a clinician each, one patient a slot, no price and no pass. */
export const ClinicAppointment: Story = {
  name: 'Clinic appointment',
  args: {
    services: clinic,
    schedule: weekdays({ checkup: [9 * 60, 10 * 60 + 20, 15 * 60 + 40], 'follow-up': [8 * 60 + 30, 13 * 60 + 30], vaccination: [12 * 60, 15 * 60] }),
    pass: null,
    onBook: fn(),
    copy: {
      title: 'Book an appointment',
      subtitle: 'Linden Street Clinic',
      service: 'Visit type',
      allServices: 'All visits',
      places: 'Availability',
      full: 'Booked',
      placesOpen: () => 'Available',
      slotsOn: (day: string) => `Appointments on ${day}`,
      slotCount: (n: number) => (n === 1 ? '1 appointment' : `${n} appointments`),
      noneOfService: (name: string) => `No ${name} appointments this day.`,
      closed: 'The clinic is closed this day.',
      yours: 'Booked',
      openDays: 'Days with openings',
      yourDays: 'Your appointments',
      review: 'Review your appointment',
      book: 'Confirm',
      bookedTitle: 'Appointment booked',
      bookedNote: (email: string) => `A reminder is on its way to ${email}`,
      bookedAnnounce: (when: string) => `Appointment booked for ${when}`,
      bookAnother: 'Book another visit',
      email: 'sam@example.com',
      pickPrompt: 'Pick a time to see the visit and who you will see.',
      status: 'Free to cancel up to 24 hours before',
    },
  },
}

const tutors: SlotBookingService[] = [
  { id: 'algebra', name: 'Algebra', minutes: 50, price: 40, capacity: 1, host: { name: 'Priya Raman', role: 'Math tutor', initials: 'PR' } },
  { id: 'chemistry', name: 'Chemistry', minutes: 50, price: 45, capacity: 1, host: { name: 'Marcus Bell', role: 'Science tutor', initials: 'MB' } },
  { id: 'essays', name: 'Essay workshop', minutes: 60, price: 15, capacity: 6, host: { name: 'Elena Duarte', role: 'Writing coach', initials: 'ED' } },
]

/** Education: subjects with a tutor each, a workshop for six, prices in dollars and lesson credits for a pass. */
export const Tutoring: Story = {
  name: 'Tutoring',
  args: {
    services: tutors,
    schedule: weekdays({ algebra: [15 * 60 + 30, 17 * 60, 18 * 60 + 30], chemistry: [16 * 60, 17 * 60 + 30, 19 * 60], essays: [17 * 60 + 45] }),
    pass: { left: 3, total: 5 },
    onBook: fn(),
    copy: {
      currency: 'USD',
      title: 'Book a lesson',
      subtitle: 'Maple Hill Tutoring',
      service: 'Subject',
      allServices: 'All subjects',
      slotsOn: (day: string) => `Lessons on ${day}`,
      slotCount: (n: number) => (n === 1 ? '1 lesson' : `${n} lessons`),
      places: 'Spots',
      placesOpen: (left: number) => (left === 1 ? 'Open' : `${left} spots left`),
      noneOfService: (name: string) => `No ${name} lessons this day.`,
      closed: 'No lessons are offered this day.',
      openDays: 'Days with lessons',
      yourDays: 'Your lessons',
      review: 'Review your lesson',
      host: 'Tutor',
      bookedTitle: 'Lesson booked',
      bookedAnnounce: (when: string) => `Lesson booked for ${when}`,
      bookAnother: 'Book another lesson',
      pickPrompt: 'Pick a time to see the subject, the price and your tutor.',
      pass: 'Lesson credits',
      topUp: 'Buy credits',
      status: 'Reschedule up to 24 hours before',
    },
  },
}

/** Skeletons hold the body’s place while the timetable loads. */
export const Loading: Story = { args: { loading: true } }

/** Nothing to book: the empty message in the body’s place. */
export const Empty: Story = { args: { services: [] } }

/** The load failed: the message with Retry in the body’s place. */
export const Error: Story = { args: { error: 'Couldn’t load the timetable.', onRetry: fn() } }

/** Drawn as its own page, with the title as the page’s `h1`. */
export const Standalone: Story = { args: { embedded: false } }
