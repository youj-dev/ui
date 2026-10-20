import { buttonSpec } from '../components/button'
import { alertSpec, avatarSpec, bannerSpec, kbdSpec, separatorSpec, skeletonSpec, tooltipSpec } from '../components/display'
import { badgeSpec, checkboxSpec, inputSpec, switchSpec } from '../components/fields'
import { fieldSpec, progressSpec, radioGroupSpec, radioSpec, selectSpec, sliderSpec, textareaSpec, toggleGroupSpec, toggleSpec } from '../components/forms'
import { dataGridSpec } from '../components/datagrid'
import { breadcrumbSpec, pageLinkSpec, paginationSpec, sidebarItemSpec, tableRowSpec } from '../components/navigation'
import { dialogSpec, dropdownMenuSpec, menuItemSpec, popoverSpec, toastSpec } from '../components/overlays'
import { METERS } from '../components/meters'
import { CATALOG } from '../components/catalog'
import { cardSpec, setLabel, tabsSpec, triggerSpec } from '../components/panels'
import { buildSet, instanceOf, type Grid, type SetSpec } from '../components/set'
import { add, bezel, box, text } from '../draw'
import type { IconBuild } from '../icons'
import type { Pages } from '../pages'
import { CONTENT_W, label, note, section, sheet } from '../sheet'
import { message, pause } from '../steps'
import { keyOf } from '../store'

/* The Components page: every set built the same way. Auto layout
 * everywhere, every colour, size, radius and shadow bound to a token, text
 * and swaps as component properties, values named after the code's props.
 * Sets from an earlier run are lifted out and updated in place. Each section
 * is built on its own: one that fails leaves a note on the sheet, keeps its
 * set from the last run (so your instances stay linked) and the rest are
 * still built. */

interface Doc {
  title: string
  usage: string
  tokens: string
  file: string
}

/** The token line in Bezel, for the sets bezel.css restyles (the rest read the same in both styles). */
const BEZEL_TOKENS: Record<string, string> = {
  'component:button': 'Radius bezel/pill  ·  Default fill role/fg, text role/canvas (hover: role/canvas at 10% over it)  ·  Secondary role/control → bezel/secondary-hover with Bezel/lift  ·  Padding space/2-5–18px  ·  Height control/*  ·  Focus/ring',
  'component:toggle': 'Radius bezel/pill  ·  Segmented track role/well, 3px in, keys 2px apart at bezel/key-radius  ·  Selected key role/key with Bezel/key, label role/fg  ·  Item padding space/3',
  'component:input': 'Well role/field → bezel/field-hover, no edge at rest  ·  Focus role/focus edge with Focus/field  ·  Invalid role/danger  ·  Radius bezel/field-radius  ·  Padding space/3',
  'component:textarea': 'Well role/field → bezel/field-hover  ·  Focus role/focus with Focus/field  ·  Invalid role/danger  ·  Radius bezel/field-area-radius  ·  Padding space/3 × space/2',
  'component:select': 'Input’s well  ·  Open role/focus  ·  Chevron role/fg-muted, 16  ·  Height control/default, control/sm  ·  Padding space/3 → space/2',
  'component:field': 'Label Bezel/Eyebrow role/fg-muted  ·  Description UI/sm/Regular role/fg-muted  ·  Error UI/sm/Medium role/danger  ·  Gap space/2',
  'component:checkbox': 'Box 18, 5px corners, role/well at rest  ·  Edge role/line-control  ·  Checked role/accent with role/on-accent  ·  Focus/ring',
  'component:radio': 'Ring 18, role/well at rest  ·  Edge role/line-control  ·  Checked role/accent with a role/on-accent dot  ·  Focus/ring',
  'component:switch': 'Track 40 × 22 (sm 30 × 18): off role/well edged bezel/edge, on role/accent  ·  Knob off role/fg-subtle, on bezel/knob-on, flat  ·  Focus/ring',
  'component:slider': 'Rail role/well, 6px, edged bezel/rail-edge  ·  Range role/accent  ·  Knob role/fg in a 3px role/canvas ring, ringed bezel/knob-ring  ·  Focus/ring',
  'component:progress': 'Rail role/well, 4px  ·  Fill bezel/meter (neutral ink)  ·  Label Bezel/Eyebrow  ·  Value Mono/sm role/fg',
  'component:badge': 'Tints role/*-subtle  ·  Secondary role/control  ·  Outline role/line-strong  ·  Radius bezel/badge-radius  ·  Height 22  ·  Dot 6px in the ink',
  'component:kbd': 'Fill role/key  ·  Foot bezel/edge  ·  Text Mono/xs role/fg-muted  ·  Height and min width 22  ·  Radius 6',
  'component:tooltip': 'Fill role/fg  ·  Text UI/sm/Medium role/canvas  ·  Radius 8  ·  Padding 4 × 9  ·  Shadow/sm',
  'component:popover': 'Fill bezel/popover  ·  Border role/line  ·  Padding 18  ·  Gap space/3  ·  Radius radius/xl  ·  Shadow/md',
  'component:menu-item': 'Panel bezel/popover, role/line, Shadow/md, radius/xl, 5px in  ·  Rows bezel/menu-row-radius  ·  Label Bezel/Eyebrow  ·  Shortcut Mono/sm  ·  Highlight role/hover',
  'component:dialog': 'Fill bezel/dialog  ·  Radius radius/2xl  ·  Head space/5 on a role/line hairline, title Bezel/Title  ·  Footer band bezel/band, space/3-5 × space/5  ·  Close disc role/well  ·  Shadow/lg',
  'component:card': 'Fill role/surface, sections bezel/section-1…4  ·  Hairlines role/line  ·  Title Bezel/Title, “/ subtitle” role/fg-subtle and role/fg-muted  ·  Disc role/well  ·  Status Bezel/Eyebrow  ·  Spacing space/6 (sm: space/4)  ·  Shadow/sm',
  'component:tabs-trigger': 'Both variants a track: role/well, radius bezel/pill, height control/default, 3px in  ·  Selected key role/key with Bezel/key at bezel/key-radius, label role/fg  ·  Trigger padding space/3',
  'component:table-row': 'Rule role/line under every cell  ·  Head Bezel/Eyebrow role/fg-muted, 32  ·  Cell padding space/3 × space/2  ·  Figures Mono/sm, end-aligned  ·  Hover role/hover',
}

export const DOCS: Record<string, Doc> = {
  ...Object.fromEntries(METERS.map((m) => [m.doc.key, m.doc])),
  ...Object.fromEntries(CATALOG.map((e) => [e.doc.key, e.doc])),
  'component:data-grid': {
    title: 'Data grid',
    usage: '<DataGrid rows={customers} columns={columns} density="comfortable" selectable />',
    tokens: 'Surface role/surface, hairlines role/line, radius/xl  ·  Head Bezel/Eyebrow role/fg-muted  ·  Row heights 40 / 56 / 68 by density  ·  Selected row role/accent at 6% with a 2px role/accent edge  ·  Cells: Checkbox, Badge and Button instances  ·  Figures Mono/sm',
    file: 'packages/ui/src/blocks/tables/data-grid/',
  },
  'component:button': {
    title: 'Button',
    usage: '<Button variant="outline" size="sm">Cancel</Button>',
    tokens: 'Fill role/accent · role/hover · role/danger  ·  Text *-foreground  ·  Border role/line  ·  Height control/*  ·  Radius bezel/pill  ·  Shadow/xs  ·  Focus/ring',
    file: 'packages/ui/src/components/ui/button.tsx',
  },
  'component:toggle': {
    title: 'Toggle',
    usage: '<Toggle aria-label="Bold"><BoldIcon /></Toggle>  ·  <ToggleGroup variant="segmented">…</ToggleGroup>',
    tokens: 'Text role/fg-muted → role/fg  ·  Hover role/hover  ·  Pressed role/fg at 10%  ·  Outline role/line with Shadow/xs  ·  Height and min width control/*  ·  Radius bezel/pill  ·  Segmented track role/band, key role/overlay with Shadow/sm',
    file: 'packages/ui/src/components/ui/toggle.variants.ts · toggle-group.tsx',
  },
  'component:input': {
    title: 'Input',
    usage: '<Input placeholder="Search projects…" />',
    tokens: 'Border role/line-control → role/fg-subtle (hover) → role/focus (focus)  ·  Text role/fg, placeholder role/fg-muted  ·  Height control/default  ·  Radius bezel/field-radius  ·  Focus/field',
    file: 'packages/ui/src/components/ui/input.tsx',
  },
  'component:textarea': {
    title: 'Textarea',
    usage: '<Textarea placeholder="Tell us what happened…" />',
    tokens: 'Border role/line-control → role/fg-subtle (hover) → role/focus (focus)  ·  Invalid role/danger  ·  Min height 72  ·  Radius bezel/field-area-radius  ·  Padding space/2-5 × space/1-5  ·  Focus/field',
    file: 'packages/ui/src/components/ui/textarea.tsx',
  },
  'component:select': {
    title: 'Select',
    usage: '<Select><SelectTrigger><SelectValue placeholder="Select a region" /></SelectTrigger>…</Select>',
    tokens: 'Input’s field control  ·  Open role/focus  ·  Chevron role/fg-muted, 16  ·  Height control/default, control/sm  ·  Padding space/2-5 → space/2',
    file: 'packages/ui/src/components/ui/select.tsx',
  },
  'component:field': {
    title: 'Field',
    usage: '<Field><FieldLabel>Project name</FieldLabel><Input /><FieldDescription>…</FieldDescription><FieldError /></Field>',
    tokens: 'Label UI/base/Medium role/fg  ·  Description UI/sm/Regular role/fg-muted  ·  Error UI/sm/Medium role/danger  ·  Gap space/2',
    file: 'packages/ui/src/components/ui/field.tsx · label.tsx',
  },
  'component:checkbox': {
    title: 'Checkbox',
    usage: '<Checkbox defaultChecked />',
    tokens: 'Border role/line-control (role/fg-muted on hover)  ·  Checked role/accent with role/on-accent  ·  Radius radius/sm  ·  Focus/ring',
    file: 'packages/ui/src/components/ui/checkbox.tsx',
  },
  'component:radio': {
    title: 'Radio group',
    usage: '<RadioGroup defaultValue="starter"><RadioGroupItem value="starter" />…</RadioGroup>',
    tokens: 'Ring role/line-control (role/fg-muted on hover, role/danger invalid)  ·  Checked role/accent with a role/on-accent dot  ·  Radius radius/full  ·  Gap space/2-5  ·  Focus/ring',
    file: 'packages/ui/src/components/ui/radio-group.tsx',
  },
  'component:switch': {
    title: 'Switch',
    usage: '<Switch defaultChecked />',
    tokens: 'Track role/fg-subtle → role/accent  ·  Thumb role/canvas with Shadow/xs  ·  Radius radius/full  ·  Focus/ring',
    file: 'packages/ui/src/components/ui/switch.tsx',
  },
  'component:slider': {
    title: 'Slider',
    usage: '<Slider defaultValue={[40]} aria-label="Volume" />',
    tokens: 'Track role/fg at 12%  ·  Range role/accent  ·  Thumb role/canvas, 2px role/accent ring, Shadow/sm  ·  Halo role/accent at 18%  ·  Focus/ring',
    file: 'packages/ui/src/components/ui/slider.tsx',
  },
  'component:progress': {
    title: 'Progress',
    usage: '<Progress value={60}><ProgressLabel>Uploading assets</ProgressLabel><ProgressValue /></Progress>',
    tokens: 'Track role/fg at 10%, 6px  ·  Indicator role/accent  ·  Label UI/base/Medium  ·  Value UI/sm/Regular role/fg-muted',
    file: 'packages/ui/src/components/ui/progress.tsx',
  },
  'component:badge': {
    title: 'Badge',
    usage: '<Badge variant="success">Live</Badge>',
    tokens: 'Tint palette/<colour> at 10%  ·  Text palette/<colour>-ink  ·  Radius bezel/badge-radius  ·  Height 20',
    file: 'packages/ui/src/components/ui/badge.variants.ts',
  },
  'component:avatar': {
    title: 'Avatar',
    usage: '<Avatar size="lg"><AvatarImage src="…" /><AvatarFallback>LH</AvatarFallback></Avatar>',
    tokens: 'Fill role/band  ·  Edge role/fg at 10%  ·  Initials role/fg-muted  ·  Status role/success ringed in role/canvas  ·  24, 32, 40',
    file: 'packages/ui/src/components/ui/avatar.tsx',
  },
  'component:kbd': {
    title: 'Kbd',
    usage: '<KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>',
    tokens: 'Fill role/band  ·  Border role/line with a 1px inset bottom edge  ·  Text UI/xs/Medium role/fg-muted  ·  Height 20  ·  Radius radius/sm',
    file: 'packages/ui/src/components/ui/kbd.tsx',
  },
  'component:separator': {
    title: 'Separator',
    usage: '<Separator orientation="vertical" />',
    tokens: 'Fill role/line  ·  1px (the theme’s stroke)',
    file: 'packages/ui/src/components/ui/separator.tsx',
  },
  'component:skeleton': {
    title: 'Skeleton',
    usage: '<Skeleton className="h-4 w-[240px]" />',
    tokens: 'Fill role/band  ·  Radius radius/md (radius/full for a circle)',
    file: 'packages/ui/src/components/ui/skeleton.tsx',
  },
  'component:alert': {
    title: 'Alert',
    usage: '<Alert variant="warning"><AlertTitle>…</AlertTitle><AlertDescription>…</AlertDescription></Alert>',
    tokens: 'Wash palette/<tone> at 6–7%  ·  Border palette/<tone> at 25–35%  ·  Icon palette/<tone>  ·  Title UI/base/Medium  ·  Radius radius/lg',
    file: 'packages/ui/src/components/ui/alert.variants.ts',
  },
  'component:banner': {
    title: 'Banner',
    usage: '<Banner variant="accent"><BannerTitle>Youj 0.1 is out</BannerTitle><BannerAction href="/changelog">Read the notes</BannerAction></Banner>',
    tokens: 'Default role/band over a role/line hairline  ·  Inverse role/fg with role/canvas  ·  Accent role/accent with role/on-accent  ·  Warning role/warning at 12% over 35%  ·  Text UI/base/Regular, action UI/base/Medium  ·  Height 40',
    file: 'packages/ui/src/components/ui/banner.variants.ts',
  },
  'component:tooltip': {
    title: 'Tooltip',
    usage: '<Tooltip><TooltipTrigger>…</TooltipTrigger><TooltipContent>Copy link <Kbd>⌘C</Kbd></TooltipContent></Tooltip>',
    tokens: 'Fill role/fg  ·  Text UI/sm/Medium role/canvas  ·  Kbd role/canvas at 12% / 20% / 85%  ·  Radius radius/md  ·  Shadow/sm',
    file: 'packages/ui/src/components/ui/tooltip.tsx',
  },
  'component:popover': {
    title: 'Popover',
    usage: '<Popover><PopoverTrigger>…</PopoverTrigger><PopoverContent><PopoverTitle>…</PopoverTitle></PopoverContent></Popover>',
    tokens: 'Fill role/overlay  ·  Border role/line  ·  Padding space/4  ·  Gap space/3  ·  Radius radius/xl  ·  Shadow/md',
    file: 'packages/ui/src/components/ui/popover.tsx',
  },
  'component:menu-item': {
    title: 'Dropdown menu',
    usage: '<DropdownMenuContent><DropdownMenuItem>Settings<DropdownMenuShortcut>⌘,</DropdownMenuShortcut></DropdownMenuItem></DropdownMenuContent>',
    tokens: 'Panel role/overlay, role/line, Shadow/md, radius/xl, space/1  ·  Rows bezel/menu-row-radius  ·  Highlight role/hover  ·  Destructive role/danger-text on role/danger at 10%  ·  Row height control/sm  ·  Check role/accent',
    file: 'packages/ui/src/components/ui/dropdown-menu.tsx',
  },
  'component:dialog': {
    title: 'Dialog',
    usage: '<Dialog><DialogContent><DialogHeader><DialogTitle>…</DialogTitle></DialogHeader><DialogFooter>…</DialogFooter></DialogContent></Dialog>',
    tokens: 'Fill role/overlay  ·  Border role/line  ·  Padding space/5  ·  Gap space/4  ·  Radius radius/xl  ·  Shadow/lg  ·  Close control/sm',
    file: 'packages/ui/src/components/ui/dialog.tsx',
  },
  'component:toast': {
    title: 'Toast',
    usage: "toast.success('Deployed', { description: '…', action: { label: 'Undo', onClick } })",
    tokens: 'Fill role/overlay  ·  Border role/line  ·  Radius radius/xl  ·  Shadow/lg  ·  Icons role/success, danger, warning  ·  Width 352',
    file: 'packages/ui/src/components/ui/toast.tsx',
  },
  'component:card': {
    title: 'Card',
    usage: '<Card><CardHeader><CardTitle>…</CardTitle></CardHeader>…</Card>',
    tokens: 'Fill role/surface  ·  Border role/line  ·  Footer role/band  ·  Radius radius/xl  ·  Spacing space/5 (sm: space/4)  ·  Shadow/xs',
    file: 'packages/ui/src/components/ui/card.tsx',
  },
  'component:tabs-trigger': {
    title: 'Tabs',
    usage: '<Tabs defaultValue="overview"><TabsList variant="pill">…</TabsList></Tabs>',
    tokens: 'Text role/fg-muted → role/fg  ·  Underline role/fg, 2px  ·  Hover role/hover  ·  Pill track role/band, key role/overlay with Shadow/sm  ·  Height control/lg (underline), control/default (pill)',
    file: 'packages/ui/src/components/ui/tabs.tsx',
  },
  'component:table-row': {
    title: 'Table',
    usage: '<Table><TableHeader><TableRow><TableHead>Project</TableHead>…</TableRow></TableHeader>…</Table>',
    tokens: 'Rule role/line under every cell  ·  Head UI/sm/Medium role/fg-muted, 36  ·  Cell padding space/3 × space/2-5  ·  Hover role/hover  ·  Selected role/accent at 6%',
    file: 'packages/ui/src/components/ui/table.tsx',
  },
  'component:pagination-link': {
    title: 'Pagination',
    usage: '<Pagination><PaginationContent><PaginationItem><PaginationLink isActive>5</PaginationLink></PaginationItem>…</PaginationContent></Pagination>',
    tokens: 'Ghost button  ·  Current key role/overlay, role/line, Shadow/xs  ·  Hover role/hover  ·  Disabled role/fg-muted at 50%  ·  Height and min width control/default',
    file: 'packages/ui/src/components/ui/pagination.tsx',
  },
  'component:breadcrumb': {
    title: 'Breadcrumb',
    usage: '<Breadcrumb items={[{ label: "Home", href: "/" }, …]} />',
    tokens: 'Links role/fg-muted  ·  Page UI/base/Medium role/fg  ·  Separator role/line-control, 14px at 20°  ·  Gap space/1-5',
    file: 'packages/ui/src/components/ui/breadcrumb.tsx',
  },
  'component:sidebar-item': {
    title: 'Sidebar item',
    usage: '<SidebarMenuItem><SidebarMenuButton isActive><InboxIcon /><span>Inbox</span></SidebarMenuButton></SidebarMenuItem>',
    tokens: 'Text role/fg at 80% → role/fg  ·  Hover role/hover at 70%  ·  Current key role/overlay, role/line, Shadow/xs  ·  Height control/default, control/sm  ·  Padding space/2',
    file: 'packages/ui/src/components/ui/sidebar.tsx',
  },
}

export interface ComponentsBuild {
  sets: Map<string, ComponentSetNode>
  /** A small composition of instances, for theme previews. */
  samples: () => Promise<FrameNode>
  summary: string[]
  /** Sections that could not be built, with Figma's message: they're noted on the sheet too. */
  problems: string[]
}

const within = (node: BaseNode, root: BaseNode) => {
  for (let p: BaseNode | null = node; p; p = p.parent) if (p === root) return true
  return false
}

/**
 * Re-lays a one-row set that's wider than the sheet into rows that fit, in
 * the spec's order (so the default variant stays top-left), with room above
 * each row for its labels. Returns where each column's label goes (y 0 for
 * the first row, which is labelled above the set) and the set's new size.
 */
function wrap(set: ComponentSetNode, spec: SetSpec, grid: Grid) {
  const [gap, rowGap] = spec.gap ?? [24, 16]
  const pad = 24
  const labelRoom = 28
  const colW = Math.max(...grid.columns.map((c) => c.w))
  const rowH = grid.height - 2 * pad
  const per = Math.max(1, Math.floor((CONTENT_W - 2 * pad + gap) / (colW + gap)))
  const labels = new Map<string, { x: number; y: number; w: number }>()
  spec.variants.forEach((v, i) => {
    const name = Object.entries(v.props)
      .map(([k, x]) => `${k}=${x}`)
      .join(', ')
    const c = set.children.find((n) => n.name === name)
    if (!c) return
    const row = Math.floor(i / per)
    const x = pad + (i % per) * (colW + gap)
    const y = pad + row * (rowH + labelRoom + rowGap)
    c.x = x + Math.round((colW - c.width) / 2)
    c.y = y
    labels.set(v.props[spec.columns]!, { x, y: row === 0 ? 0 : y, w: colW })
  })
  const rows = Math.ceil(spec.variants.length / per)
  const width = 2 * pad + per * colW + (per - 1) * gap
  const height = 2 * pad + rows * rowH + (rows - 1) * (labelRoom + rowGap)
  set.resizeWithoutConstraints(width, height)
  return { labels, width, height }
}

/** One part of a section: a set (made from the sets built before it) and an optional caption above it. */
interface Part {
  spec: () => SetSpec
  caption?: string
}

export async function componentsSheet(pages: Pages, icons: Map<string, IconBuild>): Promise<ComponentsBuild> {
  const page = pages.page('components')
  await page.loadAsync()
  const rescued = new Map<string, ComponentSetNode>()
  for (const n of page.findAll((n) => n.type === 'COMPONENT_SET' && keyOf(n).startsWith('component:'))) {
    page.appendChild(n)
    rescued.set(keyOf(n), n as ComponentSetNode)
  }

  const frame = await sheet(pages, 'components', {
    title: 'Components',
    lede: `${Object.keys(DOCS).length} components from packages/ui as component sets, drawn in the ${bezel() ? 'Bezel' : 'Classic'} look: auto layout throughout, every colour, size, radius and shadow bound to a variable, text and icons as component properties, and variant values named after the code’s props. Switch a frame’s Theme and Color modes and they re-theme; Plugins → Youj kit → Look redraws them in ${bezel() ? 'Classic' : 'Bezel'}.`,
  })
  add(
    frame,
    await box(
      { name: 'Notes', dir: 'row', gap: 16, w: 'fill' },
      await note('The code is the source', 'Each set mirrors the class strings in packages/ui. A test holds those strings, so when a component changes in code the plugin is updated with it. Re-run the plugin; your instances keep their property values.'),
      await note('Motion lives in code', 'Presses, the sliding tab and menu keys, the switch’s spring, the drawn check, popovers and toasts arriving: none of it plays here. States are drawn at rest, and the docs site and Storybook play the rest.'),
    ),
  )

  const sets = new Map<string, ComponentSetNode>()
  const problems: string[] = []

  /** Builds a set inside a holder that labels its grid: columns above, rows to the left. */
  const annotated = async (spec: SetSpec) => {
    const holder = await box({ name: `${spec.name} (labelled)`, dir: 'none' })
    // Column labels hug their text, and a column is at least as wide as its label, so narrow variants (a badge) don't crowd them.
    const labels = new Map<string, TextNode>()
    for (const v of spec.variants) {
      const value = v.props[spec.columns]!
      if (!labels.has(value)) labels.set(value, await text(`${spec.columns}=${value}`, 'Mono/xs', 'role/fg-subtle'))
    }
    const { set, grid } = await buildSet(
      holder,
      spec,
      rescued.get(spec.key),
      Object.fromEntries([...labels].map(([value, t]) => [value, t.width])),
    )
    rescued.delete(spec.key)
    sets.set(spec.key, set)
    const left = grid.rows.length > 1 ? 200 : 0
    const top = 28
    set.x = left
    set.y = top
    if (!left && grid.width > CONTENT_W) {
      // One row wider than the sheet (five toasts): wrap it, each variant labelled above itself.
      const wrapped = wrap(set, spec, grid)
      for (const [value, t] of labels) {
        const at = wrapped.labels.get(value)!
        add(holder, t)
        t.x = Math.round(at.x + (at.w - t.width) / 2)
        t.y = at.y === 0 ? 0 : top + at.y - 22
      }
      holder.resize(wrapped.width, top + wrapped.height)
      return holder
    }
    for (const c of grid.columns) {
      const t = [...labels.values()].find((l) => l.characters === c.label)!
      add(holder, t)
      t.x = Math.round(left + c.x + (c.w - t.width) / 2)
      t.y = 0
    }
    if (left) {
      const header = await text(grid.rowHeader, 'Mono/xs', 'role/fg-muted', { w: left - 16, align: 'RIGHT' })
      add(holder, header)
      header.x = 0
      header.y = 0
      for (const r of grid.rows) {
        const t = await text(r.label, 'Mono/xs', 'role/fg-subtle', { w: left - 16, align: 'RIGHT' })
        add(holder, t)
        t.x = 0
        t.y = Math.round(top + r.y + r.h / 2 - 8)
      }
    }
    holder.resize(left + grid.width, top + grid.height)
    return holder
  }

  /**
   * One section: its reference line, then each part's labelled set. Built on
   * its own, so a failure leaves a note here and the other sections go on. A
   * set this run couldn't rebuild keeps the node from the last run (moved back
   * to the page), so instances in your designs stay linked.
   */
  const place = async (docKey: string, description: string | null, ...parts: Part[]) => {
    const doc = DOCS[docKey]!
    // Let Figma repaint (the progress panel) between sections.
    await pause()
    const before = new Set(figma.currentPage.children.map((n) => n.id))
    try {
      const children: SceneNode[] = [
        await box(
          { name: 'Reference', dir: 'col', gap: 6, w: 'fill' },
          await text(doc.usage, 'Mono/xs', 'role/fg', { w: 'fill' }),
          await text((bezel() && BEZEL_TOKENS[docKey]) || doc.tokens, 'Mono/xs', 'role/fg-subtle', { w: 'fill' }),
          await label(doc.file),
        ),
      ]
      let first: string | null = null
      for (const part of parts) {
        const spec = part.spec()
        if (first === null) first = spec.description
        if (part.caption) children.push(await text(part.caption, 'UI/base/Semibold', 'role/fg'))
        children.push(await annotated(spec))
      }
      add(frame, await section(doc.title, description ?? first, {}, ...children))
    } catch (error) {
      const why = message(error)
      problems.push(`${doc.title}: ${why}`)
      console.error(`Youj kit: could not build ${doc.title}`, error)
      // What this section made before it failed is loose on the current page. Sets worth keeping (built
      // before the failure, or last run's) go back to the components page; the rest is cleared away.
      const keep = [...sets.values(), ...rescued.values()]
      for (const set of keep) if (set.parent !== page && !within(set, frame)) page.appendChild(set)
      const kept = new Set(keep.map((s) => s.id))
      for (const n of [...figma.currentPage.children]) if (!before.has(n.id) && !kept.has(n.id)) n.remove()
      for (const part of parts) {
        const key = safeKey(part)
        if (key && rescued.has(key)) {
          sets.set(key, rescued.get(key)!)
          rescued.delete(key)
        }
      }
      add(frame, await note(`Could not build ${doc.title}`, `${why} The rest of the kit was built; run the plugin again after an update.`))
    }
  }
  const safeKey = (part: Part) => {
    try {
      return part.spec().key
    } catch {
      return null
    }
  }
  const get = (key: string) => {
    const set = sets.get(`component:${key}`)
    if (!set) throw new Error(`needs ${key}, which wasn’t built`)
    return set
  }

  await place('component:button', null, { spec: () => buttonSpec(icons) })
  await place('component:toggle', null, { spec: () => toggleSpec(icons) }, { spec: () => toggleGroupSpec(get('toggle'), icons), caption: 'Toggle group: default, outline and segmented, composed of Toggles.' })
  await place('component:input', null, { spec: () => inputSpec() })
  await place('component:textarea', null, { spec: () => textareaSpec() })
  await place('component:select', null, { spec: () => selectSpec(icons) })
  await place('component:field', null, { spec: () => fieldSpec(get('input')) })
  await place('component:checkbox', null, { spec: () => checkboxSpec() })
  await place('component:radio', null, { spec: () => radioSpec() }, { spec: () => radioGroupSpec(get('radio')), caption: 'Radio group: three exposed Radio instances.' })
  await place('component:switch', null, { spec: () => switchSpec() })
  await place('component:slider', null, { spec: () => sliderSpec() })
  await place('component:progress', null, { spec: () => progressSpec() })
  await place('component:badge', null, { spec: () => badgeSpec() })
  await place('component:avatar', null, { spec: () => avatarSpec(icons) })
  await place('component:kbd', null, { spec: () => kbdSpec() })
  await place('component:separator', null, { spec: () => separatorSpec() })
  await place('component:skeleton', null, { spec: () => skeletonSpec() })
  await place('component:alert', null, { spec: () => alertSpec(icons) })
  await place('component:banner', null, { spec: () => bannerSpec(icons) })
  await place('component:tooltip', null, { spec: () => tooltipSpec() })
  await place('component:popover', null, { spec: () => popoverSpec(get('input')) })
  await place('component:menu-item', null, { spec: () => menuItemSpec(icons) }, { spec: () => dropdownMenuSpec(get('menu-item'), icons), caption: 'Dropdown menu, open: a label, Menu/Item rows and separators.' })
  await place('component:dialog', null, { spec: () => dialogSpec(get('button'), icons) })
  await place('component:toast', null, { spec: () => toastSpec(get('button'), icons) })
  await place('component:card', null, { spec: () => cardSpec(get('button'), icons) })
  await place('component:tabs-trigger', null, { spec: () => triggerSpec() }, { spec: () => tabsSpec(get('tabs-trigger')), caption: 'Tabs, composed: a TabsList of three exposed trigger instances.' })
  await place('component:table-row', null, { spec: () => tableRowSpec() })
  await place('component:pagination-link', null, { spec: () => pageLinkSpec(icons) }, { spec: () => paginationSpec(get('pagination-link'), icons), caption: 'Pagination: Previous, the page range with ellipses, Next.' })
  await place('component:breadcrumb', null, { spec: () => breadcrumbSpec(icons) })
  await place('component:sidebar-item', null, { spec: () => sidebarItemSpec(icons) })
  await place('component:data-grid', null, { spec: () => dataGridSpec(get, icons) })
  // Meters, charts and the query field.
  for (const m of METERS) await place(m.doc.key, null, { spec: () => m.spec({ icons, get }) })
  // The catalog: every other component, by batch.
  for (const e of CATALOG) await place(e.doc.key, null, { spec: () => e.spec({ icons, get }) })

  // Sets from an earlier run that the code no longer has.
  for (const n of rescued.values()) n.remove()

  /** A small composition of instances, for theme previews: whatever of it was built. */
  const samples = async () => {
    const has = (k: string) => sets.has(`component:${k}`)
    const make = (k: string, props: Record<string, string>, chars?: string) => {
      if (!has(k)) return null
      const i = instanceOf(get(k), props)
      if (chars) setLabel(i, chars)
      return i
    }
    return box(
      { name: 'Sample', dir: 'col', gap: 12, w: 'fill' },
      await box(
        { name: 'Actions', dir: 'row', gap: 8, align: 'center' },
        make('button', { Variant: 'default', Size: 'default', State: 'rest' }, 'Deploy'),
        make('button', { Variant: 'outline', Size: 'default', State: 'rest' }, 'Preview'),
        make('badge', { Variant: 'default' }, 'Beta'),
        make('badge', { Variant: 'success' }, 'Live'),
      ),
      await box(
        { name: 'Controls', dir: 'row', gap: 16, align: 'center', w: 'fill' },
        make('input', { State: 'rest', Content: 'value' }),
        make('switch', { Size: 'default', Checked: 'true', State: 'rest' }),
      ),
      make('checkbox', { Checked: 'true', State: 'rest' }),
    )
  }

  return {
    sets,
    samples,
    summary: [
      `Components: ${sets.size} sets (${[...sets.values()].reduce((n, s) => n + s.children.length, 0)} variants)`,
      ...(problems.length ? [`Components not built this run: ${problems.length}`] : []),
    ],
    problems,
  }
}
