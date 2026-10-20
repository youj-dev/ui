import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CalendarIcon, ClockIcon, MapPinIcon } from '@youj/icons'
import { PreviewList } from './preview-list'

const meta: Meta<typeof PreviewList> = {
  title: 'Blocks/App/Preview List',
  component: PreviewList,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'List things with a picture of each, its status, where to find it, who made it, its latest activity and a button for the details, with search, sort and a create button above. The demo lists a workspace’s projects.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof PreviewList>

/** Seven projects, the latest activity first. Search looks through names, domains, branches, hashes, messages and creators. */
export const Default: Story = { name: 'Projects' }

/** Sorted by name. */
export const ByName: Story = { name: 'By name', args: { defaultSort: 'name' } }

/** The list while it loads: skeleton rows in the same room. */
export const Loading: Story = { args: { loading: true } }

/** A failed load, with a way to try again. */
export const Failed: Story = { args: { error: 'Couldn’t load your projects.', onRetry: fn() } }

/** No projects yet. */
export const Empty: Story = { args: { items: [] } }

/** Other data: another product's projects, German times and words, and the checks in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    now: '2026-10-13T12:00:00Z',
    copy: { title: 'Projekte', create: 'Projekt erstellen', details: 'Projektdetails', searchPlaceholder: 'Projekte suchen' },
    items: [
      {
        id: 'p1',
        name: 'Linden Shop',
        status: 'live',
        locations: ['linden-shop.de', 'api.linden-shop.de', 'admin.linden-shop.de'],
        createdBy: { name: 'Mia Becker' },
        createdAt: '2026-05-04T08:00:00Z',
        latest: { label: 'main', ref: 'b71c4e2', message: 'Preise inklusive Versand anzeigen', at: '2026-10-13T09:10:00Z' },
        look: 'store',
        tone: 'chart-3',
      },
      {
        id: 'p2',
        name: 'Linden Hilfe',
        status: 'building',
        locations: ['hilfe.linden-shop.de'],
        createdBy: { name: 'Jonas Weber' },
        createdAt: '2026-09-01T10:30:00Z',
        latest: { label: 'artikel/rueckgabe', ref: '3fa90d1', message: 'Rückgabe-Seite überarbeitet', at: '2026-10-12T15:45:00Z' },
        look: 'docs',
        tone: 'chart-5',
      },
    ],
    onCreate: fn(),
    onOpen: fn(),
    onSortChange: fn(),
  },
}

/** Drawn as its own page, with the card's title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }

const KEY_CLASS = 'fill-(--thumb-tone)'

/** Real estate: a drawn photo placeholder for each listing, and for sale, pending and sold in place of live, building and failed. */
export const Listings: Story = {
  args: {
    locationIcon: <MapPinIcon aria-hidden size={16} className="shrink-0" />,
    latestIcon: <ClockIcon aria-hidden size={16} className="shrink-0" />,
    looks: [
      {
        id: 'photo',
        page: (
          <>
            <circle cx="138" cy="30" r="9" className="fill-hover" />
            <rect x="14" y="76" width="148" height="14" rx="4" className="fill-hover" />
            <rect x="46" y="44" width="84" height="40" rx="3" className={`${KEY_CLASS} opacity-30`} />
            <polygon points="40,46 88,22 136,46" className={KEY_CLASS} />
            <rect x="80" y="58" width="16" height="26" rx="2" className="fill-fg-subtle" />
            <rect x="54" y="54" width="14" height="12" rx="2" className="fill-surface" />
            <rect x="108" y="54" width="14" height="12" rx="2" className="fill-surface" />
          </>
        ),
      },
    ],
    statuses: [
      { id: 'for-sale', label: 'For sale', tone: 'success' },
      { id: 'pending', label: 'Sale pending', tone: 'warning' },
      { id: 'sold', label: 'Sold', tone: 'neutral' },
    ],
    now: '2026-10-13T12:00:00Z',
    copy: {
      title: 'Listings',
      searchLabel: 'Search listings',
      searchPlaceholder: 'Search listings',
      sortLabel: 'Sort listings',
      sortActivity: 'Latest change',
      sortCreated: 'Newest listing',
      create: 'Add listing',
      details: 'Listing details',
      visit: (name) => `View ${name} online`,
      activity: (name) => `Price history of ${name}`,
      settings: (name) => `Edit ${name}`,
      createdBy: (name, when) => `Listed by ${name} ${when}`,
      emptyTitle: 'No listings yet',
      emptyDescription: 'Add a listing to start showing it.',
      noMatchTitle: 'No listings match',
      noMatchDescription: (query) => `Nothing matches “${query}”. Try an address, a neighborhood or an agent.`,
      loading: 'Loading listings',
      error: 'Couldn’t load your listings.',
      count: (shown, total) => (shown === total ? `${total}` : `${shown} of ${total}`),
    },
    items: [
      { id: 'l1', name: '12 Linden Street', status: 'for-sale', locations: ['Lakeside', '3 bed · 2 bath'], href: 'https://example.com/listings/12-linden-street', createdBy: { name: 'Priya Raman' }, createdAt: '2026-09-02T09:00:00Z', latest: { label: 'Lakeside', ref: 'MLS 4417', message: 'Price reduced to $489,000', at: '2026-10-12T15:20:00Z' }, look: 'photo', tone: 'chart-1' },
      { id: 'l2', name: '88 Harbor Road', status: 'pending', locations: ['Old Harbor', '2 bed · 1 bath'], href: 'https://example.com/listings/88-harbor-road', createdBy: { name: 'Tomás Reyes' }, createdAt: '2026-08-18T11:30:00Z', latest: { label: 'Old Harbor', ref: 'MLS 4392', message: 'Offer accepted, inspection on Friday', at: '2026-10-13T08:05:00Z' }, look: 'photo', tone: 'chart-3' },
      { id: 'l3', name: '5 Orchard Close', status: 'sold', locations: ['Greenfield', '4 bed · 3 bath'], href: 'https://example.com/listings/5-orchard-close', createdBy: { name: 'Priya Raman' }, createdAt: '2026-06-24T10:15:00Z', latest: { label: 'Greenfield', ref: 'MLS 4301', message: 'Closed at $612,500', at: '2026-10-06T16:40:00Z' }, look: 'photo', tone: 'chart-4' },
      { id: 'l4', name: '301 Mill Lane, Unit 4', status: 'for-sale', locations: ['Mill District', '1 bed · 1 bath'], href: 'https://example.com/listings/301-mill-lane', createdBy: { name: 'Amara Okoye' }, createdAt: '2026-10-01T13:45:00Z', latest: { label: 'Mill District', ref: 'MLS 4431', message: 'Open house this Sunday, 1–4 pm', at: '2026-10-11T10:00:00Z' }, look: 'photo', tone: 'chart-2' },
    ],
  },
}

/** Education: a course catalog, with open, full and closed in place of the statuses and a drawn book for each course. */
export const CourseCatalog: Story = {
  name: 'Course catalog',
  args: {
    locationIcon: <MapPinIcon aria-hidden size={16} className="shrink-0" />,
    latestIcon: <CalendarIcon aria-hidden size={16} className="shrink-0" />,
    looks: [
      {
        id: 'course',
        page: (
          <>
            <rect x="14" y="14" width="26" height="5" rx="2.5" className={KEY_CLASS} />
            <rect x="48" y="26" width="80" height="62" rx="5" className={`${KEY_CLASS} opacity-30`} />
            <rect x="48" y="26" width="8" height="62" rx="3" className={KEY_CLASS} />
            <rect x="66" y="40" width="48" height="7" rx="3.5" className="fill-fg-subtle" />
            <rect x="66" y="53" width="38" height="5" rx="2.5" className="fill-hover" />
            <rect x="66" y="64" width="42" height="5" rx="2.5" className="fill-hover" />
            <rect x="136" y="40" width="26" height="26" rx="13" className="fill-hover" />
          </>
        ),
      },
    ],
    statuses: [
      { id: 'open', label: 'Open', tone: 'success' },
      { id: 'full', label: 'Full', tone: 'warning' },
      { id: 'closed', label: 'Closed', tone: 'neutral' },
    ],
    now: '2026-10-13T12:00:00Z',
    copy: {
      title: 'Courses',
      searchLabel: 'Search courses',
      searchPlaceholder: 'Search courses',
      sortLabel: 'Sort courses',
      sortActivity: 'Latest update',
      sortCreated: 'Newest course',
      create: 'Add course',
      details: 'Course details',
      visit: (name) => `Open the page of ${name}`,
      activity: (name) => `Roster of ${name}`,
      settings: (name) => `Edit ${name}`,
      createdBy: (name, when) => `Taught by ${name}, added ${when}`,
      emptyTitle: 'No courses yet',
      emptyDescription: 'Add a course to open enrollment.',
      noMatchTitle: 'No courses match',
      noMatchDescription: (query) => `Nothing matches “${query}”. Try a title, a room or an instructor.`,
      loading: 'Loading courses',
      error: 'Couldn’t load the catalog.',
    },
    items: [
      { id: 'c1', name: 'Intro to Data Structures', status: 'open', locations: ['Room B14', 'Mon and Wed, 10:00'], href: 'https://example.com/courses/cs-201', createdBy: { name: 'Dr. Lena Fischer' }, createdAt: '2026-05-12T09:00:00Z', latest: { label: 'Fall 2026', ref: 'CS-201', message: '3 seats left', at: '2026-10-12T13:10:00Z' }, look: 'course', tone: 'chart-1' },
      { id: 'c2', name: 'Organic Chemistry II', status: 'full', locations: ['Lab 3', 'Tue and Thu, 13:30'], href: 'https://example.com/courses/chem-302', createdBy: { name: 'Prof. Idris Bello' }, createdAt: '2026-04-30T15:20:00Z', latest: { label: 'Fall 2026', ref: 'CHEM-302', message: 'Waitlist of 11 students', at: '2026-10-13T07:45:00Z' }, look: 'course', tone: 'chart-5' },
      { id: 'c3', name: 'Modern Poetry', status: 'open', locations: ['Hall A2', 'Fri, 09:00'], href: 'https://example.com/courses/eng-214', createdBy: { name: 'Dr. Mei Tanaka' }, createdAt: '2026-06-02T11:00:00Z', latest: { label: 'Fall 2026', ref: 'ENG-214', message: '12 seats left', at: '2026-10-09T10:30:00Z' }, look: 'course', tone: 'chart-3' },
      { id: 'c4', name: 'Statistics for Biologists', status: 'closed', locations: ['Room C7', 'Mon, 14:00'], href: 'https://example.com/courses/bio-150', createdBy: { name: 'Dr. Tomas Weber' }, createdAt: '2026-03-18T08:40:00Z', latest: { label: 'Spring 2026', ref: 'BIO-150', message: 'Ended with 28 students', at: '2026-06-20T17:00:00Z' }, look: 'course', tone: 'chart-4' },
    ],
  },
}
