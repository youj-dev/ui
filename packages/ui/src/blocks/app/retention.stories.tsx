import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Retention, type RetentionCohort } from './retention'

const meta: Meta<typeof Retention> = {
  title: 'Blocks/App/Retention',
  component: Retention,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Who stays: the cohort triangle under its curve. Point at a cell or walk the grid with the arrow keys and the curve draws that cohort over the average, with how far above or below it sits.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Retention>

export const Default: Story = {}

/** Six monthly cohorts, counted in people. */
export const Monthly: Story = { args: { defaultGranularity: 'month', defaultMeasure: 'people' } }

export const Loading: Story = { args: { loading: true } }

export const LoadError: Story = { name: 'Error', args: { error: "Retention couldn't be loaded.", onRetry: fn() } }

export const Empty: Story = { args: { cohorts: [] } }

/* A mobile app's four monthly cohorts, in French, with no granularity switch. */
const COHORTS: RetentionCohort[] = [
  { id: 'jun', start: '2026-06-01', size: 18_200, active: [18_200, 7_100, 5_400, 4_700, 4_400] },
  { id: 'jul', start: '2026-07-01', size: 21_900, active: [21_900, 8_900, 6_600, 5_900] },
  { id: 'aug', start: '2026-08-01', size: 26_400, active: [26_400, 11_700, 8_800] },
  { id: 'sep', start: '2026-09-01', size: 24_100, active: [24_100, 10_900] },
]

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    cohorts: COHORTS,
    defaultGranularity: 'month',
    granularities: ['month'],
    locale: 'fr-FR',
    copy: { title: 'Rétention', average: 'Moyenne', cohort: 'Cohorte', people: 'Personnes', keyPeriods: { week: [1, 4, 8], month: [1, 2, 3] } },
    onMeasureChange: fn(),
  },
}

/* A gym's monthly cohorts of new members, counted by who still visited that month. */
const GYM: RetentionCohort[] = [
  { id: 'apr', start: '2026-04-01', size: 310, active: [310, 214, 176, 158, 149, 144] },
  { id: 'may', start: '2026-05-01', size: 285, active: [285, 196, 160, 143, 137] },
  { id: 'jun', start: '2026-06-01', size: 240, active: [240, 160, 126, 112] },
  { id: 'jul', start: '2026-07-01', size: 205, active: [205, 131, 101] },
  { id: 'aug', start: '2026-08-01', size: 260, active: [260, 170] },
  { id: 'sep', start: '2026-09-01', size: 395, active: [395] },
]

export const GymMembers: Story = {
  name: 'Gym members',
  args: {
    cohorts: GYM,
    defaultGranularity: 'month',
    granularities: ['month'],
    copy: {
      title: 'Member retention',
      description: (per, span) => `New members by join ${per} · ${span}`,
      people: 'Members',
      measures: { percent: '%', people: 'Members' },
      measureNames: { percent: 'Percent', people: 'Members' },
      cell: (cohort, period, share, count, size, partial) => `${cohort}, ${period}: ${share}, ${count} of ${size} members still visiting${partial ? ', in progress' : ''}`,
      summary: (cohorts, members, keys) => `${cohorts} cohorts, ${members} members. Average retention: ${keys}.`,
      empty: 'No members yet',
      emptyDescription: 'A cohort appears once members join.',
    },
  },
}

/* A newsletter's weekly cohorts of new subscribers, counted by who still opened that week. */
const READERS: RetentionCohort[] = [
  { id: 'aug-17', start: '2026-08-17', size: 2840, active: [2840, 1650, 1390, 1250, 1165, 1110, 1050, 1020] },
  { id: 'aug-24', start: '2026-08-24', size: 2610, active: [2610, 1500, 1270, 1150, 1070, 1010, 960] },
  { id: 'aug-31', start: '2026-08-31', size: 2950, active: [2950, 1720, 1440, 1290, 1190, 1140] },
  { id: 'sep-07', start: '2026-09-07', size: 3120, active: [3120, 1800, 1520, 1360, 1270] },
  { id: 'sep-14', start: '2026-09-14', size: 2760, active: [2760, 1580, 1330, 1190] },
  { id: 'sep-21', start: '2026-09-21', size: 2480, active: [2480, 1450, 1210] },
  { id: 'sep-28', start: '2026-09-28', size: 3340, active: [3340, 1930] },
  { id: 'oct-05', start: '2026-10-05', size: 2910, active: [2910] },
]

export const NewsletterReaders: Story = {
  name: 'Newsletter readers',
  args: {
    cohorts: READERS,
    granularities: ['week'],
    defaultMeasure: 'people',
    copy: {
      title: 'Reader retention',
      description: (per, span) => `Subscribers by signup ${per} · ${span}`,
      people: 'Readers',
      measures: { percent: '%', people: 'Readers' },
      measureNames: { percent: 'Percent', people: 'Readers' },
      keyPeriods: { week: [1, 3, 6], month: [1, 3, 5] },
      cell: (cohort, period, share, count, size, partial) => `${cohort}, ${period}: ${share}, ${count} of ${size} readers still opening${partial ? ', in progress' : ''}`,
      readout: (cohort, period, share, count, size) => `${cohort} · ${period}: ${share} (${count} of ${size} readers)`,
      summary: (cohorts, readers, keys) => `${cohorts} cohorts, ${readers} readers. Average retention: ${keys}.`,
      empty: 'No subscribers yet',
      emptyDescription: 'A cohort appears once people subscribe.',
    },
  },
}

export const Standalone: Story = { args: { embedded: false } }
