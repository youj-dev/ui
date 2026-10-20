import { add, bezel, box, context, rect, style, text } from '../draw'
import type { IconBuild } from '../icons'
import { iconInstance } from './button'
import { setLabel } from './panels'
import { instanceOf, type SetSpec, type VariantSpec } from './set'

/* DataGrid: a representative frame, not the whole block. The grid is a
 * virtualised, sortable, filterable table with pinned columns, grouping, detail
 * rows and cards; what's drawn is what every grid shares: the toolbar (view
 * tabs with counts, search, Filter, the density switch), the head row in the
 * table's voice, body rows at the density's height with a selected one, and the
 * pager. One variant per density (its row and head heights). Cells are
 * instances of the Checkbox, Badge and Button sets, so they follow those. */

export const SOURCES = [
  {
    file: 'packages/ui/src/blocks/tables/data-grid/model.ts',
    classes: ['{ compact: 40, comfortable: 56, spacious: 68 }', '{ compact: 34, comfortable: 38, spacious: 42 }'],
  },
  {
    file: 'packages/ui/src/blocks/tables/data-grid/body.tsx',
    classes: ["'relative h-(--dg-row-h) border-b border-(--dg-line) bg-(--dg-row-bg) px-3 align-middle text-ui first:ps-4 last:pe-4'", "'data-selected:[--dg-row-bg:var(--dg-row-selected)] data-selected:hover:[--dg-row-bg:var(--dg-row-selected-hover)]'"],
  },
  {
    file: 'packages/ui/src/blocks/tables/data-grid/head.tsx',
    classes: ["'group/head sticky top-0 z-3 h-(--dg-head-h) border-b border-line bg-(--dg-head-bg) px-3 align-middle first:ps-4 last:pe-4'", "'text-ui-sm font-medium whitespace-nowrap text-fg-muted'"],
  },
  {
    file: 'packages/ui/src/blocks/tables/data-grid/parts.tsx',
    classes: ['flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-(--dg-line) px-4 py-2.5 text-ui-sm text-fg-muted'],
  },
]

const DENSITIES = [
  { id: 'compact', row: 40, head: 34 },
  { id: 'comfortable', row: 56, head: 38 },
  { id: 'spacious', row: 68, head: 42 },
] as const

const COLS = [
  { head: 'Customer', w: 260, align: 'start' },
  { head: 'Health', w: 130, align: 'start' },
  { head: 'MRR', w: 130, align: 'end' },
  { head: 'Seats', w: 130, align: 'end' },
] as const
const CHECK_W = 44
const WIDTH = CHECK_W + COLS.reduce((n, c) => n + c.w, 0) + 60

const ROWS = [
  { name: 'Northwind Traders', health: 'danger', label: 'Churning', mrr: '$2,950', seats: '44 / 120', selected: false },
  { name: 'Brightline Health', health: 'success', label: 'Healthy', mrr: '$2,340', seats: '60 / 60', selected: true },
  { name: 'Fathom Analytics', health: 'success', label: 'Healthy', mrr: '$790', seats: '24 / 40', selected: false },
  { name: 'Juniper Robotics', health: 'warning', label: 'At risk', mrr: '$60', seats: '5 / 5', selected: false },
] as const

const scaleVar = (name: string) => context().vars.get('scale', name)

/** A cell: padded like the grid's (12 each side), its content aligned start or end, a hairline below. */
async function cell(w: number, h: number | 'hug', align: 'start' | 'end', bottom: boolean, ...children: (SceneNode | null)[]) {
  const c = await box({ name: 'Cell', dir: 'row', align: 'center', justify: align, pad: [0, 12], w, h, stroke: bottom ? 'role/line' : undefined, sides: bottom ? { bottom: 1 } : undefined }, ...children)
  c.strokesIncludedInLayout = true
  c.setBoundVariable('paddingLeft', scaleVar('space/3'))
  c.setBoundVariable('paddingRight', scaleVar('space/3'))
  return c
}

async function draw(c: ComponentNode, d: (typeof DENSITIES)[number], get: (k: string) => ComponentSetNode, chevrons: [ComponentNode, ComponentNode], search: ComponentNode) {
  const bz = bezel()
  await style(c, { dir: 'col', w: WIDTH, h: 'hug', fill: 'role/surface', stroke: 'role/line', radius: 'radius/xl', clip: true })

  // Toolbar: view tabs (a pill track in Bezel), search well, Filter, then the density switch at the end.
  const tab = async (label: string, count: string, on: boolean) =>
    box(
      { name: `View ${label}`, dir: 'row', gap: 6, align: 'center', pad: [0, 10], h: 28, radius: 'bezel/key-radius', fill: on ? (bz ? 'role/key' : 'role/overlay') : undefined, effect: on ? (bz ? 'Bezel/key' : 'Shadow/xs') : undefined, stroke: on && !bz ? 'ui/key-edge' : undefined },
      await text(label, bz ? 'Bezel/Eyebrow' : 'UI/sm/Medium', on ? (bz ? 'role/fg' : 'role/fg') : 'role/fg-muted'),
      await text(count, 'Mono/xs', 'role/fg-subtle'),
    )
  const tabs = await box(
    { name: 'Views', dir: 'row', gap: 2, pad: 3, radius: 'bezel/pill', fill: bz ? 'role/well' : 'role/band' },
    await tab('All', '64', true),
    await tab('At risk', '30', false),
    await tab('Renewing', '12', false),
  )
  const field = await box(
    { name: 'Search', dir: 'row', gap: 8, align: 'center', pad: [0, 10], w: 220, h: 28, radius: 'bezel/field-radius', fill: bz ? 'role/field' : undefined, stroke: bz ? undefined : 'role/line-control' },
    iconInstance(search, 16, 'role/fg-muted'),
    await text('Search…', 'UI/sm/Regular', 'role/fg-muted'),
  )
  const filter = instanceOf(get('button'), { Variant: 'outline', Size: 'sm', State: 'rest' })
  setLabel(filter, 'Filter')
  const spacer = await box({ name: 'Spacer', w: 'fill', h: 1 })
  const toolbar = await box({ name: 'Toolbar', dir: 'row', gap: 6, align: 'center', pad: [10, 12], w: 'fill' }, tabs, field, filter, spacer, await text(d.id, 'Mono/xs', 'role/fg-subtle'))
  add(c, toolbar)

  // Head row.
  const headText = (chars: string) => text(chars, bz ? 'Bezel/Eyebrow' : 'UI/sm/Medium', 'role/fg-muted')
  const head = await box({ name: 'Head', dir: 'row', w: 'fill', fill: 'role/surface' })
  add(head, await cell(CHECK_W, d.head, 'start', true))
  for (const col of COLS) add(head, await cell(col.w, d.head, col.align, true, await headText(col.head)))
  add(head, await cell(60, d.head, 'end', true))
  add(c, head)

  // Body rows: selected wash primary/6 with a 2px primary edge, as the row's data-selected.
  for (const r of ROWS) {
    const row = await box({ name: r.selected ? 'Row (selected)' : 'Row', dir: 'row', w: 'fill', fill: r.selected ? 'role/accent-subtle' : undefined })
    const check = instanceOf(get('checkbox'), { Checked: r.selected ? 'true' : 'false', State: 'rest' })
    const showLabel = Object.keys(check.componentProperties).find((k) => k.split('#')[0] === 'Show label')
    if (showLabel) check.setProperties({ [showLabel]: false })
    const box0 = await cell(CHECK_W, d.row, 'start', true, check)
    add(row, box0)
    const name = await text(r.name, 'UI/base/Medium', 'role/fg')
    add(row, await cell(COLS[0].w, d.row, 'start', true, name))
    const badge = instanceOf(get('badge'), { Variant: r.health })
    setLabel(badge, r.label)
    add(row, await cell(COLS[1].w, d.row, 'start', true, badge))
    add(row, await cell(COLS[2].w, d.row, 'end', true, await text(`${r.mrr} /mo`, bz ? 'Mono/sm' : 'UI/base/Regular', 'role/fg')))
    add(row, await cell(COLS[3].w, d.row, 'end', true, await text(r.seats, bz ? 'Mono/sm' : 'UI/base/Regular', 'role/fg-muted')))
    const actions = await cell(60, d.row, 'end', true, await text('···', 'UI/base/Regular', 'role/fg-subtle'))
    add(row, actions)
    if (r.selected) {
      const edge = rect('Selected edge', 2, d.row, 'role/accent')
      add(row, edge)
      edge.layoutPositioning = 'ABSOLUTE'
      edge.x = 0
      edge.y = 0
    }
    add(c, row)
  }

  // Footer: the range and the pager.
  const pager = await box(
    { name: 'Pager', dir: 'row', gap: 4, align: 'center' },
    iconInstance(chevrons[0], 16, 'role/fg-muted'),
    await text('1', 'UI/sm/Medium', 'role/fg'),
    await text('2', 'UI/sm/Regular', 'role/fg-muted'),
    await text('3', 'UI/sm/Regular', 'role/fg-muted'),
    iconInstance(chevrons[1], 16, 'role/fg-muted'),
  )
  add(
    c,
    await box(
      { name: 'Footer', dir: 'row', align: 'center', justify: 'between', pad: [10, 16], w: 'fill', stroke: 'role/line', sides: { top: 1 } },
      await text('1–4 of 64 customers', 'UI/sm/Regular', 'role/fg-muted'),
      pager,
    ),
  )
}

export function dataGridSpec(get: (k: string) => ComponentSetNode, icons: Map<string, IconBuild>): SetSpec {
  const pick = (...names: string[]) => (names.map((n) => icons.get(n)).find(Boolean) ?? [...icons.values()][0]!).rest
  const left = pick('chevron-left')
  const right = pick('chevron-right')
  const search = pick('search')
  const variants: VariantSpec[] = DENSITIES.map((d) => ({ props: { Density: d.id }, build: (c) => draw(c, d, get, [left, right], search) }))
  return {
    key: 'component:data-grid',
    name: 'Data grid',
    description:
      'DataGrid in packages/ui, as a representative frame: toolbar (views with counts, search, Filter), a head row in the table’s voice, rows at the density’s height (compact 40, comfortable 56, spacious 68) with a selected row and pinned selection column, and the pager. Its checkbox, badge and button cells are instances of those sets. Sorting, grouping, pinned and resizable columns, detail rows, cards and virtual scrolling live in code.',
    variants,
    properties: [],
    columns: 'Density',
    gap: [32, 16],
  }
}
