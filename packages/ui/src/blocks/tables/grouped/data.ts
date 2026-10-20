/* The grouped table's types, its English and its demo: a software company's
 * quarter, line by line, across four departments. */

/** One budget line, the leaf of the tree. */
export interface GroupedTableLine {
  id: string
  /** What the money is for: "Figma seats". */
  name: string
  /** The first level of the tree under the default grouping: "Engineering". */
  group: string
  /** The second level: "Platform". */
  subgroup: string
  category: string
  /** Who answers for it. */
  owner: string
  /** Planned for the period. */
  budget: number
  /** Spent so far. */
  actual: number
}

/** A line field a grouping can nest by. */
export type GroupedTableField = 'group' | 'subgroup' | 'category' | 'owner'

/** One way to gather the lines: the fields it nests by, outermost first (none: a flat list). */
export interface GroupedTableGrouping {
  id: string
  /** Its choice in the header. */
  label: string
  by: GroupedTableField[]
  /** Its first level starts open on the subtotals below it; `'all'` opens every level down to the lines. */
  open?: boolean | 'all'
}

export const GROUPINGS: GroupedTableGrouping[] = [
  { id: 'department', label: 'Team', by: ['group', 'subgroup'], open: true },
  { id: 'category', label: 'Category', by: ['category'] },
  { id: 'owner', label: 'Owner', by: ['owner'] },
  { id: 'none', label: 'None', by: [] },
]

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  title: 'Operating budget',
  period: 'Q4 2026',
  description: (period: string, planned: string, spent: string) => `${period} · ${spent} of ${planned} spent`,
  columns: { name: 'Line', owner: 'Owner', category: 'Category', budget: 'Budget', actual: 'Actual', variance: 'Variance', used: 'Used' },
  groupBy: 'Group by',
  expandAll: 'Expand all',
  collapseAll: 'Collapse all',
  lines: (count: string, n: number) => `${count} ${plural(n, 'line', 'lines')}`,
  total: 'Total',
  over: 'over budget',
  under: 'under budget',
  sortBy: (column: string) => `Sort by ${column}`,
  expanded: (group: string) => `${group} expanded`,
  collapsed: (group: string) => `${group} collapsed`,
  treeHint: 'Arrow keys move between lines. Right and Left open and close a group; Enter opens a line.',
  retry: 'Try again',
  emptyTitle: 'No budget lines yet',
  emptyHint: 'Lines show up here once the quarter’s plan is in.',
}

export type GroupedTableCopy = typeof DEFAULT_COPY

const L = (
  id: number,
  name: string,
  department: string,
  team: string,
  category: string,
  owner: string,
  budget: number,
  actual: number,
): GroupedTableLine => ({ id: `line_${id}`, name, group: department, subgroup: team, category, owner, budget, actual })

export const LINES: GroupedTableLine[] = [
  L(1, 'AWS compute', 'Engineering', 'Platform', 'Cloud', 'Maya Chen', 180_000, 196_400),
  L(2, 'Observability', 'Engineering', 'Platform', 'Software', 'Maya Chen', 42_000, 39_800),
  L(3, 'Database replicas', 'Engineering', 'Platform', 'Cloud', 'Noah Fischer', 36_000, 34_100),
  L(4, 'On-call contractors', 'Engineering', 'Platform', 'Contractors', 'Noah Fischer', 24_000, 27_500),
  L(5, 'Device lab', 'Engineering', 'Mobile', 'Hardware', 'Yuki Tanaka', 18_000, 12_600),
  L(6, 'Crash reporting', 'Engineering', 'Mobile', 'Software', 'Yuki Tanaka', 9_600, 9_600),
  L(7, 'Release contractors', 'Engineering', 'Mobile', 'Contractors', 'Yuki Tanaka', 30_000, 21_400),
  L(8, 'Warehouse credits', 'Engineering', 'Data', 'Cloud', 'Rafael Silva', 64_000, 71_800),
  L(9, 'BI seats', 'Engineering', 'Data', 'Software', 'Rafael Silva', 14_400, 13_200),
  L(10, 'Data contractors', 'Engineering', 'Data', 'Contractors', 'Rafael Silva', 20_000, 8_800),
  L(11, 'Type licenses', 'Design', 'Brand', 'Software', 'Ines Moreau', 7_200, 7_200),
  L(12, 'Photo shoots', 'Design', 'Brand', 'Contractors', 'Ines Moreau', 16_000, 18_900),
  L(13, 'Print', 'Design', 'Brand', 'Events', 'Ines Moreau', 5_000, 2_300),
  L(14, 'Design seats', 'Design', 'Product design', 'Software', 'Leila Haddad', 21_600, 21_600),
  L(15, 'Research panel', 'Design', 'Product design', 'Contractors', 'Leila Haddad', 12_000, 9_400),
  L(16, 'Field research travel', 'Design', 'Product design', 'Travel', 'Leila Haddad', 8_000, 5_100),
  L(17, 'Search ads', 'Marketing', 'Growth', 'Ads', 'Theo Adeyemi', 90_000, 97_200),
  L(18, 'Social ads', 'Marketing', 'Growth', 'Ads', 'Theo Adeyemi', 60_000, 48_300),
  L(19, 'Attribution', 'Marketing', 'Growth', 'Software', 'Theo Adeyemi', 12_000, 12_000),
  L(20, 'Conference booth', 'Marketing', 'Events', 'Events', 'Zara Okoye', 45_000, 52_800),
  L(21, 'Event travel', 'Marketing', 'Events', 'Travel', 'Zara Okoye', 22_000, 19_600),
  L(22, 'Merchandise', 'Marketing', 'Events', 'Events', 'Zara Okoye', 9_000, 11_200),
  L(23, 'Recruiting platform', 'Operations', 'People', 'Software', 'Noah Fischer', 15_600, 15_600),
  L(24, 'Company offsite', 'Operations', 'People', 'Travel', 'Zara Okoye', 38_000, 31_200),
  L(25, 'Laptops', 'Operations', 'IT', 'Hardware', 'Rafael Silva', 72_000, 68_400),
  L(26, 'Identity and SSO', 'Operations', 'IT', 'Software', 'Rafael Silva', 10_800, 10_800),
  L(27, 'Annual audit', 'Operations', 'Finance', 'Contractors', 'Maya Chen', 28_000, 28_000),
  L(28, 'Spend management', 'Operations', 'Finance', 'Software', 'Maya Chen', 6_000, 5_400),
]
