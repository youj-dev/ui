const DURATIONS = ['15', '30', '45'] as const
type Duration = (typeof DURATIONS)[number]

/** Who the visitor is meeting. */
interface BookingHost {
  name: string
  /** Under the name: their role and company. */
  role?: string
  /** The avatar's letters. Default: from the name. */
  initials?: string
}

/** What the visitor is booking. */
interface BookingMeeting {
  title: string
  description?: string
  /** Where it happens, beside the video icon. */
  location?: string
}

/** A time zone the visitor can read the slots in. */
interface BookingZone {
  value: string
  label: string
  /** Hours from the host's zone (the slots' zone). */
  offset: number
}

/** What `onBook` receives. */
interface BookingRequest {
  /** The day, at local midnight. */
  date: Date
  /** The start, in minutes after midnight in the host's zone. */
  minutes: number
  /** The length, in minutes. */
  duration: number
  /** The visitor's zone (a `BookingZone` value). */
  zone: string
  name: string
  email: string
  notes: string
}

/** Offsets from the host's zone (Lisbon), in hours. */
const ZONES: BookingZone[] = [
  { value: 'lisbon', label: 'Lisbon · WEST', offset: 0 },
  { value: 'new-york', label: 'New York · EDT', offset: -5 },
  { value: 'los-angeles', label: 'Los Angeles · PDT', offset: -8 },
  { value: 'berlin', label: 'Berlin · CEST', offset: 1 },
  { value: 'tokyo', label: 'Tokyo · JST', offset: 8 },
]

const HOST: BookingHost = { name: 'Maya Okafor', role: 'Design lead, Fieldwork', initials: 'MO' }
const MEETING: BookingMeeting = {
  title: 'Portfolio review',
  description: 'Bring two projects you’re proud of. We’ll walk through your process and what to sharpen next.',
  location: 'Video call, link sent on booking',
}

/** The demo's "today", fixed so the server and the browser draw the same calendar. */
const TODAY = new Date(2026, 8, 28)

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** A stable pseudo-random 0–1 for a string. */
function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return ((h >>> 0) % 1000) / 1000
}

const isoDay = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

/** Open for booking: weekdays in the next five weeks, less a few the host has blocked. */
function isOpen(date: Date, today: Date = startOfToday()) {
  const days = (date.getTime() - today.getTime()) / 86_400_000
  if (days < 1 || days > 35) return false
  if (date.getDay() === 0 || date.getDay() === 6) return false
  return hash(isoDay(date)) > 0.22
}

/** The host's free start times that day, in minutes after midnight, host time. */
function slotsFor(date: Date, duration: Duration | number) {
  const step = Number(duration)
  const out: number[] = []
  for (let m = 9 * 60; m + step <= 17 * 60 + 30; m += step >= 30 ? 30 : 15) {
    if (m >= 12 * 60 + 30 && m < 13 * 60 + 30) continue
    if (hash(`${isoDay(date)}-${m}-${duration}`) > 0.42) out.push(m)
  }
  return out
}

function formatTime(minutes: number) {
  const m = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const suffix = h < 12 ? 'am' : 'pm'
  const hour = h % 12 === 0 ? 12 : h % 12
  const shift = minutes >= 1440 ? ' +1' : minutes < 0 ? ' −1' : ''
  return `${hour}:${String(m % 60).padStart(2, '0')}${suffix}${shift}`
}

type Step = 'pick' | 'details' | 'done'

const DEFAULT_COPY = {
  meeting: 'Meeting',
  length: 'Length',
  durationOption: (minutes: number) => `${minutes} min`,
  durationValue: (minutes: number) => `${minutes} minutes`,
  timeZone: 'Time zone',
  when: 'When',
  pickDay: 'Pick a day',
  slotsOpen: (count: number) => `${count} ${count === 1 ? 'time' : 'times'} open`,
  availableTimes: 'Available times',
  noTimes: 'No times left. Try another day.',
  next: 'Next',
  nextLabel: (time: string) => `Next: book ${time}`,
  /** A slot's start, in minutes after midnight (may run past a day either way). */
  formatTime,
  backToTimes: 'Back to times',
  details: 'Your details',
  holding: (when: string) => `Holding ${when} for you`,
  name: 'Name',
  email: 'Email',
  emailPlaceholder: 'you@studio.com',
  notes: (host: string) => `What should ${host} look at?`,
  notesPlaceholder: 'Links to your work, and anything you’d like feedback on.',
  notesHint: (host: string) => `Only ${host} sees this.`,
  nameRequired: (host: string) => `Tell ${host} who’s coming.`,
  emailInvalid: 'Enter an email like you@studio.com.',
  confirm: 'Confirm booking',
  booking: 'Booking…',
  booked: 'Booked',
  checkDetails: 'Check your details',
  /** Shown when booking fails without a message of its own. */
  bookFailed: 'Couldn’t book that time. Try again.',
  done: 'You’re booked',
  doneDetail: (when: string, host: string, email: string) => `${when} with ${host}. The invite and call link are on their way to ${email}.`,
  yourInbox: 'your inbox',
  addToCalendar: 'Add to calendar',
  reschedule: 'Reschedule',
}

type BookingCopy = typeof DEFAULT_COPY & {
  /** The locale dates and times read in (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

export {
  DEFAULT_COPY,
  DURATIONS,
  formatTime,
  HOST,
  isOpen,
  isoDay,
  MEETING,
  slotsFor,
  startOfToday,
  TODAY,
  ZONES,
  type BookingCopy,
  type BookingHost,
  type BookingMeeting,
  type BookingRequest,
  type BookingZone,
  type Duration,
  type Step,
}
