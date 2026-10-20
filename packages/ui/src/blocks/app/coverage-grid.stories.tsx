import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CoverageGrid } from './coverage-grid'

const meta: Meta<typeof CoverageGrid> = {
  title: 'Blocks/App/Coverage Grid',
  component: CoverageGrid,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Find where coverage is thin: rows by columns, each cell filled by how deep the coverage goes and hatched where there is none. Pick a row to see its gaps and draft what is missing. Detection rules, test suites and course sessions read the same way.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof CoverageGrid>

/** Lateral movement, the row with the most gaps, is picked: three sources have no rules for it. */
export const Default: Story = { name: 'Detection rules' }

/** A row with no gaps picked: nothing to draft. */
export const NoGaps: Story = { name: 'No gaps', args: { defaultRow: 'credential-access' } }

/** Other data: three columns and four rows, German words, and the actions in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    columns: [
      { id: 'edr', label: 'Geräte', tone: 'chart-1' },
      { id: 'fw', label: 'Firewall', tone: 'chart-2' },
      { id: 'sso', label: 'Anmeldung', tone: 'chart-3' },
    ],
    rows: [
      { id: 'a', label: 'Erstzugriff', depth: [2, 1, 4] },
      { id: 'b', label: 'Ausführung', depth: [4, 0, 1] },
      { id: 'c', label: 'Seitwärtsbewegung', depth: [1, 0, 0] },
      { id: 'd', label: 'Datenabfluss', depth: [1, 3, 0] },
    ],
    copy: {
      title: 'Erkennungsabdeckung',
      subtitle: 'Taktiken nach Quelle',
      depth: (n: number) => `${n} ${n === 1 ? 'Regel' : 'Regeln'}`,
      noDepth: 'Keine Regeln',
      depthLabel: 'Füllung zeigt die Regeltiefe',
      suggestion: (gaps: number, row: string) => `${row}: ${gaps} Lücken. Regeln dafür entwerfen?`,
      draft: (n: number) => `${n} Regeln entwerfen`,
      review: 'Lücken prüfen',
    },
    onDraft: fn(),
    onReview: fn(),
    onRowChange: fn(),
  },
}

/** Development: tests by app area and kind of test. Search has nothing end to end, Admin has nothing but unit tests. */
export const TestCoverage: Story = {
  name: 'Test coverage',
  args: {
    columns: [
      { id: 'unit', label: 'Unit', tone: 'chart-1' },
      { id: 'integration', label: 'Integration', tone: 'chart-2' },
      { id: 'e2e', label: 'E2E', tone: 'chart-3' },
      { id: 'visual', label: 'Visual', tone: 'chart-4' },
    ],
    rows: [
      { id: 'checkout', label: 'Checkout', depth: [42, 18, 9, 4] },
      { id: 'accounts', label: 'Accounts', depth: [35, 14, 6, 2] },
      { id: 'billing', label: 'Billing', depth: [28, 11, 3, 0] },
      { id: 'search', label: 'Search', depth: [31, 9, 0, 3] },
      { id: 'notifications', label: 'Notifications', depth: [17, 0, 2, 0] },
      { id: 'admin', label: 'Admin', depth: [12, 0, 0, 0] },
    ],
    maxDepth: 40,
    copy: {
      title: 'Test coverage',
      subtitle: 'App areas by kind of test',
      matrixLabel: 'Tests by app area and kind',
      depth: (n: number) => `${n} ${n === 1 ? 'test' : 'tests'}`,
      noDepth: 'No tests',
      depthLabel: 'Fill shows the number of tests',
      suggestion: (gaps: number, row: string) => `${row} has ${gaps} untested ${gaps === 1 ? 'kind' : 'kinds'}. Draft test plans for ${gaps === 1 ? 'it' : 'them'}?`,
      noGaps: (row: string) => `${row} has every kind of test.`,
      drafted: (n: number, row: string) => `Drafted ${n} test ${n === 1 ? 'plan' : 'plans'} for ${row}. They go to the team for review.`,
      draft: (n: number) => `Draft ${n} ${n === 1 ? 'plan' : 'plans'}`,
      draftIdle: 'Draft test plans',
      review: 'Review gaps',
    },
  },
}

/** Education: sessions by topic and format. Plan sessions fills the formats a topic is missing. */
export const CourseSyllabus: Story = {
  name: 'Course syllabus',
  args: {
    columns: [
      { id: 'lecture', label: 'Lecture', tone: 'chart-1' },
      { id: 'lab', label: 'Lab', tone: 'chart-5' },
      { id: 'reading', label: 'Reading', tone: 'chart-4' },
      { id: 'quiz', label: 'Quiz', tone: 'chart-2' },
    ],
    rows: [
      { id: 'cells', label: 'Cell structure', depth: [3, 2, 2, 1] },
      { id: 'genetics', label: 'Genetics', depth: [4, 1, 3, 2] },
      { id: 'evolution', label: 'Evolution', depth: [2, 0, 3, 1] },
      { id: 'ecology', label: 'Ecology', depth: [2, 3, 1, 0] },
      { id: 'physiology', label: 'Human physiology', depth: [3, 0, 0, 0] },
    ],
    copy: {
      title: 'Course coverage',
      subtitle: 'Biology 101 · topics by format',
      matrixLabel: 'Sessions by topic and format',
      depth: (n: number) => `${n} ${n === 1 ? 'session' : 'sessions'}`,
      noDepth: 'No sessions',
      depthLabel: 'Fill shows the number of sessions',
      suggestion: (gaps: number, row: string) => `${row} is missing ${gaps} ${gaps === 1 ? 'format' : 'formats'}. Plan sessions to cover ${gaps === 1 ? 'it' : 'them'}?`,
      noGaps: (row: string) => `${row} uses every format.`,
      drafted: (n: number, row: string) => `Planned ${n} ${n === 1 ? 'session' : 'sessions'} for ${row}. They are added once you confirm.`,
      draft: (n: number) => `Plan ${n} ${n === 1 ? 'session' : 'sessions'}`,
      draftIdle: 'Plan sessions',
      drafting: 'Planning',
      draftDone: 'Planned',
      review: 'Review gaps',
    },
  },
}

/** Skeletons hold the matrix’s place while the data loads; the head’s count and the foot’s line wait too. */
export const Loading: Story = { args: { loading: true } }

/** Nothing to cover: the empty message in the matrix’s place. */
export const Empty: Story = { args: { rows: [] } }

/** The load failed: the message with Retry in the matrix’s place. */
export const Error: Story = { args: { error: 'Couldn’t load the coverage.', onRetry: fn() } }

/** Drawn as its own page, with the title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
