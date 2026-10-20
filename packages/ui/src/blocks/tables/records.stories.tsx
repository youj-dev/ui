import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarIcon, MailIcon, MessageIcon, PhoneIcon } from '@youj/icons'
import { RecordsTable } from './records'
import type { RecordsTableActivityKind, RecordsTableOwner, RecordsTableRecord, RecordsTableStage, RecordsTableView } from './records/data'

const meta: Meta<typeof RecordsTable> = {
  title: 'Blocks/Tables/Records',
  component: RecordsTable,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Work a list of people like a CRM: faces and organizations, a stage you change right in its cell, an owner, a score, an amount, the last touch, and tags, with views you define, a panel under each row, and a selection bar to assign, tag, export or delete.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof RecordsTable>

/** The block as it installs: 36 demo contacts across a sales team of four. */
export const Default: Story = { name: 'Sales contacts' }

const TEAM = [
  { id: 'ines', name: 'Ines Moreau' },
  { id: 'tomas', name: 'Tomás Silva' },
]

const PEOPLE: RecordsTableRecord[] = [
  { id: 'c1', name: 'Grace Hopper', email: 'grace@cobol.dev', org: 'Cobol Systems', orgNote: 'cobol.dev', stage: 'qualified', owner: 'ines', score: 82, tags: ['decision-maker'], value: 48000, lastActivity: { kind: 'meeting', at: '2026-09-28T10:00:00Z' } },
  { id: 'c2', name: 'Alan Turing', email: 'alan@enigma.uk', org: 'Enigma Ltd', orgNote: 'enigma.uk', stage: 'customer', owner: 'tomas', score: 95, tags: ['champion'], value: 120000, lastActivity: { kind: 'call', at: '2026-09-27T16:30:00Z' } },
  { id: 'c3', name: 'Ada Lovelace', email: 'ada@engine.io', org: 'Analytical Engines', orgNote: 'engine.io', stage: 'lead', score: 38, tags: ['hot'], value: 0, lastActivity: { kind: 'email', at: '2026-09-24T09:00:00Z' } },
  { id: 'c4', name: 'Edsger Dijkstra', email: 'edsger@paths.nl', org: 'Shortest Paths', orgNote: 'paths.nl', stage: 'churned', owner: 'ines', score: 12, tags: [], value: 0, lastActivity: { kind: 'note', at: '2026-08-02T12:00:00Z' } },
]

/** Your people, owners and tabs: four contacts across two teammates, signed in as Ines, with the strings rewritten. */
export const WithYourData: Story = {
  args: {
    records: PEOPLE,
    owners: TEAM,
    me: 'ines',
    views: [
      { id: 'all', label: 'Everyone' },
      { id: 'mine', label: 'Mine', owner: 'me' },
      { id: 'hot', label: 'Hot', tag: 'hot', byScore: true },
      { id: 'customers', label: 'Paying', stage: 'customer' },
    ],
    copy: { title: 'Pipeline people' },
  },
}

/** Opens on your contacts. */
export const MyContacts: Story = { args: { defaultView: 'mine' } }

/** The first load: skeleton rows in each column's shape. */
export const Loading: Story = { args: { records: [], loading: true } }

/** Nothing yet: the empty state offers an import. */
export const Empty: Story = { args: { records: [] } }

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. */
export const Standalone: Story = { args: { embedded: false } }

const person = (id: string, name: string, org: string, orgNote: string, stage: string, owner: string, score: number, tags: string[], value: number, kind: string, at: string, title: string, location: string): RecordsTableRecord => ({
  id,
  name,
  email: `${name.split(' ')[0]!.toLowerCase()}.${name.split(' ')[1]!.toLowerCase()}@example.mail`,
  org,
  orgNote,
  stage,
  owner,
  score,
  tags,
  value,
  lastActivity: { kind, at },
  title,
  location,
})

const RECRUITERS: RecordsTableOwner[] = [
  { id: 'dana', name: 'Dana Whitfield' },
  { id: 'omar', name: 'Omar Haddad' },
  { id: 'lena', name: 'Lena Fischer' },
]
const HIRING_STAGES: RecordsTableStage[] = [
  { id: 'applied', label: 'Applied', tone: 'neutral' },
  { id: 'screen', label: 'Screen', tone: 'chart-2' },
  { id: 'onsite', label: 'Onsite', tone: 'accent' },
  { id: 'offer', label: 'Offer', tone: 'success' },
  { id: 'declined', label: 'Declined', tone: 'danger' },
]
const HIRING_ACTIVITIES: RecordsTableActivityKind[] = [
  { id: 'email', label: 'Emailed', icon: MailIcon },
  { id: 'call', label: 'Called', icon: PhoneIcon },
  { id: 'interview', label: 'Interviewed', icon: CalendarIcon, accent: true },
  { id: 'note', label: 'Note', icon: MessageIcon },
]
const HIRING_VIEWS: RecordsTableView[] = [
  { id: 'all', label: 'All candidates' },
  { id: 'mine', label: 'My candidates', owner: 'me' },
  { id: 'strong', label: 'Strong fit', tag: 'strong', byScore: true },
  { id: 'offers', label: 'Offers', stage: 'offer' },
]
const CANDIDATES: RecordsTableRecord[] = [
  person('k1', 'Mara Eklund', 'Fjord Software', 'Stockholm', 'onsite', 'dana', 91, ['strong', 'referral'], 142000, 'interview', '2026-09-28T14:00:00Z', 'Staff engineer', 'Stockholm'),
  person('k2', 'Jun Nakamura', 'Tidepool Labs', 'Remote', 'screen', 'omar', 74, ['remote'], 118000, 'call', '2026-09-27T10:30:00Z', 'Backend engineer', 'Osaka'),
  person('k3', 'Tamsin Reilly', 'Greenway Logistics', 'Dublin', 'applied', 'dana', 58, [], 96000, 'email', '2026-09-26T08:15:00Z', 'Data engineer', 'Dublin'),
  person('k4', 'Idris Bello', 'Harbor Pay', 'Lagos', 'offer', 'lena', 95, ['strong'], 150000, 'call', '2026-09-29T09:00:00Z', 'Engineering manager', 'Lagos'),
  person('k5', 'Clara Voss', 'Nimbus Retail', 'Berlin', 'screen', 'lena', 66, ['referral'], 104000, 'email', '2026-09-25T16:45:00Z', 'Frontend engineer', 'Berlin'),
  person('k6', 'Rohan Kapoor', 'Lumen Health', 'Pune', 'declined', 'omar', 41, [], 88000, 'note', '2026-09-20T12:00:00Z', 'QA engineer', 'Pune'),
  person('k7', 'Beatriz Alves', 'Solstice Energy', 'Lisbon', 'onsite', 'omar', 83, ['strong', 'remote'], 126000, 'interview', '2026-09-28T11:00:00Z', 'Platform engineer', 'Lisbon'),
  person('k8', 'Wen Zhao', 'Kite Analytics', 'Vancouver', 'applied', 'dana', 70, [], 112000, 'email', '2026-09-24T13:20:00Z', 'ML engineer', 'Vancouver'),
]

/** Recruiting: five hiring stages, a recruiter per candidate, a fit score, a salary ask, and interviews as the touch that counts. */
export const JobCandidates: Story = {
  name: 'Job candidates',
  args: {
    records: CANDIDATES,
    owners: RECRUITERS,
    me: 'dana',
    stages: HIRING_STAGES,
    activities: HIRING_ACTIVITIES,
    views: HIRING_VIEWS,
    tags: { strong: { label: 'Strong fit', tone: 'success' }, referral: { label: 'Referral', tone: 'accent' }, remote: { label: 'Remote', tone: 'chart-3' } },
    copy: {
      title: 'Candidates',
      description: (people, employers) => `${people} candidates from ${employers} employers`,
      noun: 'candidates',
      search: 'Search candidates…',
      add: 'Add candidate',
      import: 'Import resumes',
      columns: { name: 'Candidate', org: 'Current employer', stage: 'Stage', owner: 'Lead', score: 'Fit', value: 'Ask', lastActivity: 'Last contact', tags: 'Tags', title: 'Role', location: 'Location' },
      people: (count, n) => `${count} ${n === 1 ? 'candidate' : 'candidates'}`,
      actions: { email: 'Email', call: 'Copy phone number', open: 'Open candidate', assign: 'Assign to', tag: 'Add tag', delete: 'Remove' },
      detail: { org: 'Employer', phone: 'Phone', location: 'Location', owner: 'Lead', noOwner: 'Unassigned', email: 'Send email' },
      emptyTitle: 'No candidates yet',
      emptyDescription: 'Import resumes or add the first applicant.',
    },
  },
}

const NURSES: RecordsTableOwner[] = [
  { id: 'rosa', name: 'Rosa Delgado' },
  { id: 'sam', name: 'Sam Okafor' },
  { id: 'hilde', name: 'Hilde Strand' },
]
const CARE_STAGES: RecordsTableStage[] = [
  { id: 'due', label: 'Due', tone: 'warning' },
  { id: 'booked', label: 'Booked', tone: 'accent' },
  { id: 'seen', label: 'Seen', tone: 'success' },
  { id: 'missed', label: 'Missed', tone: 'danger' },
  { id: 'discharged', label: 'Closed', tone: 'neutral' },
]
const CARE_ACTIVITIES: RecordsTableActivityKind[] = [
  { id: 'call', label: 'Called', icon: PhoneIcon },
  { id: 'message', label: 'Messaged', icon: MessageIcon },
  { id: 'visit', label: 'Visited', icon: CalendarIcon, accent: true },
]
const CARE_VIEWS: RecordsTableView[] = [
  { id: 'all', label: 'All patients' },
  { id: 'mine', label: 'My patients', owner: 'me' },
  { id: 'risk', label: 'High risk', tag: 'high-risk', byScore: true },
  { id: 'due', label: 'Follow-up due', stage: 'due' },
]
const PATIENTS: RecordsTableRecord[] = [
  person('p1', 'Walter Pruitt', 'Riverside Clinic', 'Cardiology', 'due', 'rosa', 84, ['high-risk', 'post-op'], 120, 'call', '2026-09-27T15:00:00Z', 'Heart failure review', 'Riverside'),
  person('p2', 'Lucia Ferrara', 'Riverside Clinic', 'Diabetes care', 'booked', 'rosa', 52, ['diabetes'], 0, 'message', '2026-09-28T09:40:00Z', 'Quarterly check', 'Riverside'),
  person('p3', 'Emeka Obi', 'Northgate Health', 'Orthopedics', 'seen', 'sam', 18, ['post-op'], 45, 'visit', '2026-09-26T11:20:00Z', 'Knee replacement, week 6', 'Northgate'),
  person('p4', 'Ingrid Solberg', 'Northgate Health', 'Respiratory', 'missed', 'sam', 77, ['high-risk'], 210, 'call', '2026-09-25T10:05:00Z', 'COPD review', 'Northgate'),
  person('p5', 'Rafael Mendes', 'Riverside Clinic', 'Diabetes care', 'due', 'hilde', 63, ['diabetes', 'high-risk'], 0, 'message', '2026-09-24T14:30:00Z', 'Insulin adjustment', 'Riverside'),
  person('p6', 'Yara Haddad', 'Lakeview Practice', 'General', 'discharged', 'hilde', 9, [], 0, 'visit', '2026-09-19T09:00:00Z', 'Wound check', 'Lakeview'),
  person('p7', 'Tobias Krantz', 'Lakeview Practice', 'Cardiology', 'booked', 'rosa', 71, ['high-risk'], 80, 'call', '2026-09-28T16:10:00Z', 'Blood pressure follow-up', 'Lakeview'),
]

/** A clinic: patients move through follow-up statuses, a nurse owns each, and the score is a risk, so a high one reads as the bad one. */
export const PatientFollowUps: Story = {
  name: 'Patient follow-ups',
  args: {
    records: PATIENTS,
    owners: NURSES,
    me: 'rosa',
    stages: CARE_STAGES,
    activities: CARE_ACTIVITIES,
    views: CARE_VIEWS,
    scoreLowIsBetter: true,
    currency: 'USD',
    tags: { 'high-risk': { label: 'High risk', tone: 'danger' }, diabetes: { label: 'Diabetes', tone: 'chart-2' }, 'post-op': { label: 'Post-op', tone: 'chart-4' } },
    copy: {
      title: 'Follow-ups',
      description: (patients, clinics) => `${patients} patients across ${clinics} clinics`,
      noun: 'patients',
      search: 'Search patients…',
      add: 'Add patient',
      import: 'Import list',
      columns: { name: 'Patient', org: 'Clinic', stage: 'Status', owner: 'Nurse', score: 'Risk', value: 'Balance', lastActivity: 'Last contact', tags: 'Flags', title: 'Reason', location: 'Site' },
      people: (count, n) => `${count} ${n === 1 ? 'patient' : 'patients'}`,
      actions: { email: 'Email', call: 'Copy phone number', open: 'Open chart', assign: 'Assign to', tag: 'Add flag', delete: 'Remove' },
      detail: { org: 'Clinic', phone: 'Phone', location: 'Site', owner: 'Nurse', noOwner: 'Unassigned', email: 'Send email' },
      emptyTitle: 'No patients to follow up',
      emptyDescription: 'Patients show up here after a visit that needs a follow-up.',
    },
  },
}
