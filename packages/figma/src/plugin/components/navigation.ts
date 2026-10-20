import { add, bezel, box, context, rect, style, text, type Ink } from '../draw'
import type { IconBuild } from '../icons'
import { iconInstance } from './button'
import { setLabel } from './panels'
import { instanceOf, ref, type SetSpec, type VariantSpec } from './set'

/* Tables and wayfinding: the table row, Pagination, Breadcrumb and the
 * sidebar's menu button. Where the code slides a raised key under the
 * current item (pagination, sidebar), the key is drawn under the active one. */

export const SOURCES = [
  {
    file: 'packages/ui/src/components/ui/table.tsx',
    classes: [
      "'[tbody>&]:hover:bg-hover has-aria-expanded:bg-hover data-[state=selected]:bg-accent-subtle'",
      "'h-[calc(var(--spacing)*(9_-_var(--ui--compact,0)))] border-b border-line px-3 text-start align-middle text-ui-sm font-medium whitespace-nowrap text-fg-muted'",
      "'border-b border-line px-3 py-[calc(var(--spacing)*(2.5_-_var(--ui--compact,0)))] align-middle whitespace-nowrap'",
      "cn('w-full caption-bottom border-separate border-spacing-0 text-ui text-fg', className)",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/pagination.tsx',
    classes: [
      'className="rounded-md border border-line bg-key shadow-xs"',
      "cn('flex flex-wrap items-center gap-0.5', className)",
      "buttonVariants({ variant: 'ghost', size })",
      "size === 'icon' && 'w-auto min-w-control px-1.5'",
      "isActive && 'text-fg hover:bg-transparent'",
      "disabled && 'pointer-events-none text-fg-subtle'",
      "cn(\"flex size-control items-center justify-center text-fg-muted [&_svg:not([class*='size-'])]:size-4\", className)",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/button.variants.ts',
    classes: ['text-fg-muted hover:bg-hover hover:text-fg', 'h-control gap-1.5 px-3 text-ui'],
  },
  {
    file: 'packages/ui/src/components/ui/breadcrumb.tsx',
    classes: [
      "cn('flex flex-wrap items-center gap-1.5 text-ui text-fg-muted', className)",
      "'rounded-sm transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring'",
      "cn(crumbClass, 'font-medium text-fg', className)",
      'className="block h-3.5 w-px rotate-[20deg] rounded-full bg-line-strong rtl:-rotate-[20deg]"',
      "'flex h-5 w-6 items-center justify-center rounded-sm [&>svg]:size-4'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/sidebar.tsx',
    classes: [
      "'peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-start text-ui text-fg focus-ring'",
      "'hover:bg-hover hover:text-fg'",
      "'data-active:font-medium data-active:text-fg data-active:hover:bg-transparent'",
      "'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50'",
      "default: 'h-[calc(var(--spacing-control-sm)_*_var(--ui--compact,0)_*_(1_-_var(--yj-touch,0))_+_var(--spacing-control)_*_(1_-_var(--ui--compact,0)_*_(1_-_var(--yj-touch,0))))] text-ui'",
      "sm: 'h-control-sm text-ui-sm'",
      "lg: 'h-12 text-ui",
      "raised: 'rounded-md bg-key shadow-xs ring-1 ring-line'",
      "cn('flex w-full min-w-0 flex-col gap-0.5', className)",
    ],
  },
]

const scaleVar = (name: string) => context().vars.get('scale', name)
const themeVar = (name: string) => context().vars.get('theme', name)
const pick = (icons: Map<string, IconBuild>, ...names: string[]) => names.map((n) => icons.get(n)).find(Boolean) ?? [...icons.values()][0]!

/* ── Table row ──────────────────────────────────────────────────────────── */

const COLUMNS = [
  { name: 'Project', w: 200, head: 'Project', cell: 'youj-docs', align: 'LEFT' },
  { name: 'Status', w: 140, head: 'Status', cell: 'Ready', align: 'LEFT' },
  { name: 'Updated', w: 140, head: 'Updated', cell: '2 min ago', align: 'RIGHT' },
] as const

async function drawRow(c: ComponentNode, type: 'header' | 'body', state: 'rest' | 'hover' | 'selected') {
  await style(c, { dir: 'row', fill: state === 'hover' ? 'role/hover' : state === 'selected' ? 'role/accent-subtle' : undefined })
  for (const [i, col] of COLUMNS.entries()) {
    const cell = figma.createFrame()
    const header = type === 'header'
    const bz = bezel()
    // Bezel: 32px mono capital heads, 8px body padding, figures (the end-aligned column) in mono ui-sm.
    const figure = bz && col.align === 'RIGHT'
    await style(cell, {
      name: header ? 'Head' : 'Cell',
      dir: 'row',
      align: 'center',
      justify: col.align === 'RIGHT' ? 'end' : 'start',
      pad: header ? [0, 12] : [10, 12],
      w: col.w,
      // Bezel's mono figures sit on a shorter line, so its body cells hold the row at 36.
      h: header ? (bz ? 32 : 36) : bz ? 36 : 'hug',
      stroke: 'role/line',
      sides: { bottom: 1 },
    })
    cell.strokesIncludedInLayout = true
    cell.setBoundVariable('paddingLeft', scaleVar('space/3'))
    cell.setBoundVariable('paddingRight', scaleVar('space/3'))
    if (!header) {
      cell.setBoundVariable('paddingTop', scaleVar(bz ? 'space/2' : 'space/2-5'))
      cell.setBoundVariable('paddingBottom', scaleVar(bz ? 'space/2' : 'space/2-5'))
    }
    const face = header ? (bz ? 'Bezel/Eyebrow' : 'UI/sm/Medium') : figure ? 'Mono/sm' : 'UI/base/Regular'
    const t = await text(header ? col.head : col.cell, face, header ? 'role/fg-muted' : 'role/fg', { name: col.name })
    add(cell, ref(t, `${header ? 'Head' : 'Cell'} ${i + 1}`))
    add(c, cell)
  }
}

export function tableRowSpec(): SetSpec {
  // Body first, so the default (top-left) variant is a body row.
  const variants: VariantSpec[] = (['rest', 'hover', 'selected'] as const).map((state) => ({ props: { Type: 'body', State: state }, build: (c: ComponentNode) => drawRow(c, 'body', state) }))
  variants.push({ props: { Type: 'header', State: 'rest' }, build: (c) => drawRow(c, 'header', 'rest') })
  return {
    key: 'component:table-row',
    name: 'Table/Row',
    description:
      'TableRow with TableHead or TableCell in packages/ui: 12px inline padding, a hairline under every cell, 36px header cells in muted ui-sm, body cells 10px tall padding. Body rows highlight on hover and wash primary/6 when selected. Stack instances for a table; resize the cells for your columns.',
    variants,
    // Header and body cells hold different text, so each has its own properties.
    properties: COLUMNS.flatMap((col, i) => [
      { name: `Head ${i + 1}`, type: 'TEXT' as const, default: col.head, field: 'characters' as const },
      { name: `Cell ${i + 1}`, type: 'TEXT' as const, default: col.cell, field: 'characters' as const },
    ]),
    columns: 'Type',
    gap: [32, 16],
  }
}

/* ── Pagination ─────────────────────────────────────────────────────────── */

type LinkState = 'rest' | 'hover' | 'active' | 'disabled'

async function drawPageLink(c: ComponentNode, kind: 'page' | 'previous' | 'next', state: LinkState, left: ComponentNode, right: ComponentNode) {
  const ink: Ink = state === 'disabled' ? ['role/fg-muted', 0.5] : state === 'active' ? 'role/fg' : state === 'hover' ? 'role/fg' : 'role/fg-muted'
  await style(c, {
    dir: 'row',
    gap: 'space/1-5',
    align: 'center',
    justify: 'center',
    radius: 'radius/md',
    fill: state === 'hover' ? 'role/hover' : state === 'active' ? 'role/overlay' : undefined,
    stroke: state === 'active' ? 'role/line' : undefined,
    effect: state === 'active' ? 'Shadow/xs' : undefined,
  })
  c.strokesIncludedInLayout = true
  c.layoutSizingVertical = 'FIXED'
  c.setBoundVariable('height', themeVar('control/default'))
  if (kind === 'page') {
    c.setBoundVariable('paddingLeft', scaleVar('space/1-5'))
    c.setBoundVariable('paddingRight', scaleVar('space/1-5'))
    c.setBoundVariable('minWidth', themeVar('control/default'))
    add(c, ref(await text('2', 'UI/base/Medium', ink, { name: 'Page' }), 'Page'))
    return
  }
  c.setBoundVariable('paddingLeft', scaleVar('space/3'))
  c.setBoundVariable('paddingRight', scaleVar('space/3'))
  const label = await text(kind === 'previous' ? 'Previous' : 'Next', 'UI/base/Medium', ink, { name: 'Label' })
  const icon = iconInstance(kind === 'previous' ? left : right, 16, ink as string)
  if (kind === 'previous') add(c, icon, label)
  else add(c, label, icon)
}

export function pageLinkSpec(icons: Map<string, IconBuild>): SetSpec {
  const left = pick(icons, 'chevron-left').rest
  const right = pick(icons, 'chevron-right').rest
  const variants: VariantSpec[] = []
  for (const kind of ['page', 'previous', 'next'] as const)
    for (const state of ['rest', 'hover', 'active', 'disabled'] as const) {
      if (kind !== 'page' && state === 'active') continue
      variants.push({ props: { Kind: kind, State: state }, build: (c) => drawPageLink(c, kind, state, left, right) })
    }
  return {
    key: 'component:pagination-link',
    name: 'Pagination/Link',
    description:
      'PaginationLink, PaginationPrevious and PaginationNext in packages/ui: ghost buttons with tabular numbers. The current page sits on a raised key (role/overlay with a hairline and Shadow/xs), which in code slides between pages; disabled dims the ink, not the box.',
    variants,
    properties: [{ name: 'Page', type: 'TEXT', default: '2', field: 'characters' }],
    columns: 'State',
    gap: [24, 16],
  }
}

export function paginationSpec(link: ComponentSetNode, icons: Map<string, IconBuild>): SetSpec {
  const ellipsis = pick(icons, 'ellipsis', 'more-horizontal').rest
  const layouts: Record<'start' | 'middle', (number | '…')[]> = { start: [1, 2, 3, '…', 10], middle: [1, '…', 4, 5, 6, '…', 10] }
  return {
    key: 'component:pagination',
    name: 'Pagination',
    description: 'Pagination in packages/ui: Previous, the page range with ellipses (paginationRange), Next, 2px apart. The links are exposed instances.',
    variants: (['start', 'middle'] as const).map((at) => ({
      props: { Current: at },
      build: async (c: ComponentNode) => {
        await style(c, { dir: 'row', gap: 'space/0-5', align: 'center' })
        const current = at === 'start' ? 1 : 5
        const prev = instanceOf(link, { Kind: 'previous', State: at === 'start' ? 'disabled' : 'rest' })
        add(c, prev)
        prev.isExposedInstance = true
        for (const item of layouts[at]) {
          if (item === '…') {
            const e = await box({ name: 'Ellipsis', dir: 'row', align: 'center', justify: 'center' }, iconInstance(ellipsis, 16, 'role/fg-muted'))
            e.layoutSizingHorizontal = 'FIXED'
            e.layoutSizingVertical = 'FIXED'
            e.setBoundVariable('width', themeVar('control/default'))
            e.setBoundVariable('height', themeVar('control/default'))
            add(c, e)
            continue
          }
          const page = instanceOf(link, { Kind: 'page', State: item === current ? 'active' : 'rest' })
          add(c, page)
          setLabel(page, String(item), 'Page')
          page.isExposedInstance = true
        }
        const next = instanceOf(link, { Kind: 'next', State: 'rest' })
        add(c, next)
        next.isExposedInstance = true
      },
    })),
    properties: [],
    columns: 'Current',
    gap: [48, 16],
  }
}

/* ── Breadcrumb ─────────────────────────────────────────────────────────── */

/** The separator: a 14px hairline leaning 20°, in the field border colour, centred in 6px. */
async function slash() {
  const holder = await box({ name: 'Separator', dir: 'none', w: 6, h: 14 })
  const line = rect('Slash', 1, 14, 'role/line-control', 'radius/full')
  add(holder, line)
  line.rotation = -20
  line.x = 0.6
  line.y = 0.2
  return holder
}

export function breadcrumbSpec(icons: Map<string, IconBuild>): SetSpec {
  const ellipsis = pick(icons, 'ellipsis', 'more-horizontal').rest
  return {
    key: 'component:breadcrumb',
    name: 'Breadcrumb',
    description:
      'Breadcrumb in packages/ui: muted links 6px apart, the current page in medium foreground, separated by a leaning hairline. Collapsed, the middle crumbs fold into an ellipsis button. Links turn foreground on hover in code.',
    variants: [false, true].map((collapsed) => ({
      props: { Collapsed: String(collapsed) },
      build: async (c: ComponentNode) => {
        await style(c, { dir: 'row', gap: 'space/1-5', align: 'center' })
        add(c, ref(await text('Home', 'UI/base/Regular', 'role/fg-muted', { name: 'Crumb 1' }), 'Crumb 1'), await slash())
        if (collapsed) {
          const e = await box({ name: 'Ellipsis', dir: 'row', align: 'center', justify: 'center', w: 24, h: 20, radius: 'radius/sm' }, iconInstance(ellipsis, 16, 'role/fg-muted'))
          add(c, e, await slash())
        }
        add(
          c,
          ref(await text('Projects', 'UI/base/Regular', 'role/fg-muted', { name: 'Crumb 2' }), 'Crumb 2'),
          await slash(),
          ref(await text('youj-docs', 'UI/base/Medium', 'role/fg', { name: 'Page' }), 'Page'),
        )
      },
    })),
    properties: [
      { name: 'Crumb 1', type: 'TEXT', default: 'Home', field: 'characters' },
      { name: 'Crumb 2', type: 'TEXT', default: 'Projects', field: 'characters' },
      { name: 'Page', type: 'TEXT', default: 'youj-docs', field: 'characters' },
    ],
    columns: 'Collapsed',
    gap: [48, 16],
  }
}

/* ── Sidebar item ───────────────────────────────────────────────────────── */

type SidebarState = 'rest' | 'hover' | 'active' | 'disabled'

async function drawSidebarItem(c: ComponentNode, size: 'default' | 'sm' | 'lg', state: SidebarState, icon: ComponentNode) {
  const ink: Ink = state === 'active' ? 'role/fg' : state === 'hover' ? 'role/fg' : ['role/fg', 0.8]
  await style(c, {
    dir: 'row',
    gap: 'space/2',
    align: 'center',
    pad: [0, 8],
    w: 240,
    radius: 'radius/md',
    fill: state === 'hover' ? ['role/hover', 0.7] : state === 'active' ? 'role/overlay' : undefined,
    stroke: state === 'active' ? 'role/line' : undefined,
    effect: state === 'active' ? 'Shadow/xs' : undefined,
    opacity: state === 'disabled' ? 0.5 : undefined,
  })
  c.setBoundVariable('paddingLeft', scaleVar('space/2'))
  c.setBoundVariable('paddingRight', scaleVar('space/2'))
  // Rows are controls: h-control / h-control-sm follow the theme's density.
  c.layoutSizingVertical = 'FIXED'
  if (size === 'lg') {
    // lg is h-12, for a 32px avatar or logo with a name and a second line (a workspace or account row).
    c.setBoundVariable('height', scaleVar('space/12'))
    const tile = await box({ name: 'Logo', dir: 'row', align: 'center', justify: 'center', w: 32, h: 32, radius: 'radius/md', fill: 'role/fg' }, await text('Y', 'UI/base/Semibold', 'role/canvas', { name: 'Initial' }))
    const lines = await box(
      { name: 'Text', dir: 'col', w: 'fill' },
      ref(await text('Youj', state === 'active' ? 'UI/base/Medium' : 'UI/base/Regular', ink, { name: 'Label', w: 'fill', truncate: true }), 'Label'),
      await text('Pro plan', 'UI/sm/Regular', 'role/fg-muted', { name: 'Detail', w: 'fill', truncate: true }),
    )
    add(c, tile, lines)
    return
  }
  c.setBoundVariable('height', themeVar(size === 'default' ? 'control/default' : 'control/sm'))
  add(
    c,
    ref(iconInstance(icon, 16, Array.isArray(ink) ? 'role/fg-muted' : ink), 'Icon'),
    ref(await text('Inbox', state === 'active' ? (size === 'sm' ? 'UI/sm/Medium' : 'UI/base/Medium') : size === 'sm' ? 'UI/sm/Regular' : 'UI/base/Regular', ink, { name: 'Label', w: 'fill', truncate: true }), 'Label'),
  )
}

export function sidebarItemSpec(icons: Map<string, IconBuild>): SetSpec {
  const inbox = pick(icons, 'inbox')
  const preferred = ['inbox', 'home', 'search', 'settings', 'users', 'folder', 'file', 'bell', 'layout-dashboard']
    .map((n) => icons.get(n))
    .filter((b): b is IconBuild => !!b)
    .map((b) => ({ type: b.node.type === 'COMPONENT_SET' ? ('COMPONENT_SET' as const) : ('COMPONENT' as const), key: b.node.key }))
  const variants: VariantSpec[] = []
  for (const size of ['default', 'sm', 'lg'] as const)
    for (const state of ['rest', 'hover', 'active', 'disabled'] as const) variants.push({ props: { Size: size, State: state }, build: (c) => drawSidebarItem(c, size, state, inbox.rest) })
  return {
    key: 'component:sidebar-item',
    name: 'Sidebar/Item',
    description:
      'SidebarMenuButton in packages/ui: a row in sidebar-foreground at 80% with a 16px icon, 8px padding, as tall as a control (control/default, control/sm); lg is 48 high for a workspace or account row with a 32px logo and a second line. Hover is sidebar-highlight at 70%; the current page is medium foreground on a raised key (role/overlay, Shadow/xs, a sidebar-border ring), which in code slides between items. Collapsed to icons, the label fades out first.',
    variants,
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Inbox', field: 'characters' },
      { name: 'Icon', type: 'INSTANCE_SWAP', default: inbox.rest.id, preferred, field: 'mainComponent' },
    ],
    columns: 'State',
  }
}
