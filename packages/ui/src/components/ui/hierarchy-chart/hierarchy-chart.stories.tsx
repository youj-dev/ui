import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMemo, useRef, useState } from 'react'
import { Badge } from '../badge'
import { Input } from '../input'
import { HierarchyChart, type HierarchyChartHandle, type HierarchyChartProps, type HierarchyNode } from '.'

/** A 30-person company, four levels deep. */
const COMPANY: HierarchyNode = {
  id: 'maya',
  name: 'Maya Lindqvist',
  role: 'Chief Executive Officer',
  children: [
    {
      id: 'jonas',
      name: 'Jonas Okafor',
      role: 'VP Engineering',
      badge: 'Hiring',
      children: [
        {
          id: 'priya',
          name: 'Priya Raman',
          role: 'Platform Lead',
          children: [
            { id: 'leo', name: 'Leo Brandt', role: 'Staff Engineer' },
            { id: 'ines', name: 'Inês Carvalho', role: 'Site Reliability' },
            { id: 'tomas', name: 'Tomás Rivera', role: 'Backend Engineer' },
          ],
        },
        {
          id: 'ken',
          name: 'Ken Watanabe',
          role: 'Product Engineering Lead',
          children: [
            { id: 'amara', name: 'Amara Nwosu', role: 'Frontend Engineer' },
            { id: 'felix', name: 'Felix Wagner', role: 'Frontend Engineer' },
            { id: 'sofia', name: 'Sofia Rossi', role: 'Mobile Engineer' },
            { id: 'omar', name: 'Omar Haddad', role: 'Design Engineer' },
          ],
        },
      ],
    },
    {
      id: 'elena',
      name: 'Elena Petrova',
      role: 'VP Product',
      children: [
        { id: 'noah', name: 'Noah Kim', role: 'Product Manager, Growth' },
        { id: 'clara', name: 'Clara Dubois', role: 'Product Manager, Core' },
        {
          id: 'hana',
          name: 'Hana Sato',
          role: 'Design Lead',
          children: [
            { id: 'luca', name: 'Luca Moretti', role: 'Product Designer' },
            { id: 'zara', name: 'Zara Ahmed', role: 'Product Designer' },
          ],
        },
      ],
    },
    {
      id: 'david',
      name: 'David Mensah',
      role: 'Chief Financial Officer',
      children: [
        { id: 'olivia', name: 'Olivia Hart', role: 'Controller' },
        { id: 'raj', name: 'Raj Patel', role: 'FP&A Analyst' },
      ],
    },
    {
      id: 'sara',
      name: 'Sara Nilsson',
      role: 'VP People',
      children: [
        { id: 'mateo', name: 'Mateo García', role: 'Recruiter', badge: '6 open' },
        { id: 'ava', name: 'Ava Thompson', role: 'People Partner' },
      ],
    },
  ],
}

/** A product org as teams, read along the line. */
interface Team extends HierarchyNode {
  people: number
  mission: string
  children?: Team[]
}
const TEAMS: Team = {
  id: 'product',
  name: 'Product',
  mission: 'Everything customers touch',
  people: 64,
  children: [
    {
      id: 'core',
      name: 'Core experience',
      mission: 'Editor, sync, offline',
      people: 22,
      children: [
        { id: 'editor', name: 'Editor', mission: 'Blocks, text, embeds', people: 8 },
        { id: 'sync', name: 'Sync', mission: 'Real-time and conflicts', people: 7 },
        { id: 'offline', name: 'Offline', mission: 'Local-first storage', people: 7 },
      ],
    },
    {
      id: 'growth',
      name: 'Growth',
      mission: 'Activation and billing',
      people: 18,
      children: [
        { id: 'onboarding', name: 'Onboarding', mission: 'First week to aha', people: 6 },
        { id: 'billing', name: 'Billing', mission: 'Plans, invoices, tax', people: 7 },
        { id: 'lifecycle', name: 'Lifecycle', mission: 'Email and nudges', people: 5 },
      ],
    },
    {
      id: 'platform',
      name: 'Platform',
      mission: 'The ground everything stands on',
      people: 24,
      children: [
        { id: 'infra', name: 'Infrastructure', mission: 'Clusters and deploys', people: 9 },
        { id: 'data', name: 'Data', mission: 'Pipelines and warehouse', people: 8 },
        { id: 'security', name: 'Security', mission: 'Identity and audit', people: 7 },
      ],
    },
  ],
}

const FIRST = ['Ada', 'Ben', 'Chloé', 'Dmitri', 'Eun-ji', 'Farah', 'Gabriel', 'Hiro', 'Ivy', 'Jamal', 'Kirsten', 'Luis', 'Mina', 'Nils', 'Oona', 'Pavel', 'Quinn', 'Rosa', 'Sven', 'Tariq', 'Uma', 'Victor', 'Wen', 'Ximena', 'Yusuf', 'Zoe']
const LAST = ['Abara', 'Berg', 'Castro', 'Dahl', 'Eze', 'Fischer', 'Gupta', 'Holm', 'Ito', 'Jansen', 'Kowalski', 'Larsen', 'Moreau', 'Nakamura', 'Ortiz', 'Park', 'Quist', 'Reyes', 'Silva', 'Tan', 'Ueda', 'Vance', 'Weiss', 'Yilmaz', 'Zhou']
const ROLES = [['Chief Executive Officer'], ['VP Engineering', 'VP Sales', 'VP Operations', 'VP Marketing'], ['Director', 'Head of Region'], ['Manager', 'Team Lead'], ['Engineer', 'Account Executive', 'Analyst', 'Specialist', 'Designer']]

/** About 200 people, generated the same way every time. */
function largeOrg(): HierarchyNode {
  let n = 0
  const person = (depth: number): HierarchyNode => {
    const i = n++
    const roles = ROLES[Math.min(depth, ROLES.length - 1)]!
    const fanout = depth === 0 ? 4 : depth === 1 ? 3 : depth === 2 ? 4 : depth === 3 ? 3 + (i % 2) : 0
    return {
      id: `p${i}`,
      name: `${FIRST[(i * 7) % FIRST.length]} ${LAST[(i * 11) % LAST.length]}`,
      role: roles[i % roles.length],
      children: fanout ? Array.from({ length: fanout }, () => person(depth + 1)) : undefined,
    }
  }
  return person(0)
}

const meta: Meta<HierarchyChartProps> = {
  title: 'UI/Data Display/Hierarchy Chart',
  component: HierarchyChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A hierarchy drawn as a tidy tree (Reingold–Tilford): an org chart, a team of teams, any parent-and-children structure. Cards are joined by elbow connectors with rounded corners. Branches open and close from the chip on a card’s foot, Enter or the arrow keys; the node you toggle stays put while the rest glide around it on the kit’s spring and the lines redraw. Drag anywhere to pan, Ctrl/⌘ and the wheel (or a pinch), the corner buttons or +/− to zoom, 0 to fit. Selecting a node lights the path down to it. It is a WAI-ARIA tree: one Tab stop, arrows like Tree View, and focus brings its node into view. Reduced motion lands every change in place; RTL mirrors the chart.',
      },
    },
  },
  args: { nodes: COMPANY },
}
export default meta
type Story = StoryObj<HierarchyChartProps>

export const Playground: Story = {
  args: { orientation: 'vertical', height: 480 },
  render: (args) => (
    <div className="w-[64rem] max-w-full">
      <HierarchyChart {...args} />
    </div>
  ),
}

/** A company's org, four levels deep: select a person to light their reporting line, close a branch to fold it into a count. */
export const CompanyOrg: Story = {
  name: 'Company org',
  render: function Render() {
    const [selected, setSelected] = useState<string | null>('amara')
    const [expanded, setExpanded] = useState<string[]>(['maya', 'jonas', 'ken', 'elena'])
    return (
      <div className="flex w-[64rem] max-w-full flex-col gap-3">
        <HierarchyChart nodes={COMPANY} label="Company org chart" selected={selected} onSelectedChange={setSelected} expanded={expanded} onExpandedChange={setExpanded} height={520} />
        <p className="min-h-5 text-ui-sm text-fg-muted">{selected ? `Selected: ${selected}` : 'Select someone to see their reporting line.'}</p>
      </div>
    )
  },
}

/** Teams read along the line, each card drawn by `renderNode`: the team, its mission and its headcount. */
export const TeamOfTeams: Story = {
  name: 'Team of teams',
  render: () => (
    <div className="w-[64rem] max-w-full">
      <HierarchyChart<Team>
        nodes={TEAMS}
        orientation="horizontal"
        label="Product teams"
        nodeSize={{ width: 220, height: 60 }}
        height={460}
        renderNode={(team, state) => (
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-medium text-fg text-ui leading-tight">{team.name}</span>
              <span className="truncate text-fg-muted text-ui-sm leading-tight">{team.mission}</span>
            </span>
            <Badge variant={state.depth === 0 ? 'default' : 'secondary'} className="shrink-0 tabular-nums">
              {team.people}
            </Badge>
          </span>
        )}
      />
    </div>
  ),
}

/** About 200 people, opened two levels deep. Search for someone: the chart opens the branches above them, focuses and centers them. */
export const LargeOrgWithSearch: Story = {
  name: 'Large org with search',
  render: function Render() {
    const org = useMemo(largeOrg, [])
    const chart = useRef<HierarchyChartHandle>(null)
    const [query, setQuery] = useState('')
    const [selected, setSelected] = useState<string | null>(null)
    const people = useMemo(() => {
      const out: HierarchyNode[] = []
      const walk = (n: HierarchyNode) => {
        out.push(n)
        n.children?.forEach(walk)
      }
      walk(org)
      return out
    }, [org])
    const matches = query.trim() ? people.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6) : []
    const go = (id: string) => {
      setSelected(id)
      chart.current?.focusNode(id)
    }
    return (
      <div className="flex w-[64rem] max-w-full flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            aria-label="Find a person"
            placeholder="Find a person…"
            className="w-64"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches[0]) go(matches[0].id)
            }}
          />
          {matches.map((p) => (
            <button key={p.id} type="button" onClick={() => go(p.id)} className="rounded-full border border-line px-2.5 py-0.5 text-fg-muted text-ui-sm hover:bg-hover hover:text-fg focus-ring">
              {p.name}
            </button>
          ))}
          <span className="ms-auto text-fg-subtle text-ui-sm tabular-nums">{people.length} people</span>
        </div>
        <HierarchyChart ref={chart} nodes={org} label="Company directory" defaultExpanded={[org.id, ...(org.children ?? []).map((c) => c.id)]} selected={selected} onSelectedChange={setSelected} height={560} />
      </div>
    )
  },
}

export const ReducedMotion: Story = {
  name: 'Reduced motion',
  globals: { reducedMotion: 'always' },
  parameters: { docs: { description: { story: 'Motion is set to reduced for this story: branches open and close in place, nothing glides, and zoom and fit land at once.' } } },
  render: () => (
    <div className="w-[64rem] max-w-full">
      <HierarchyChart nodes={COMPANY} label="Company org chart" defaultSelected="raj" height={480} />
    </div>
  ),
}
