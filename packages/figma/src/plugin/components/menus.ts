import { add, bezel, box, rect, solid, style, text, vector } from '../draw'
import type { IconBuild } from '../icons'
import { setLabel } from './panels'
import { button, clear, controlHeight, controlSquare, dialogLook, eyebrow, fieldBox, icon, initials, instance, value, padBlock, padInline, panelLook, pick, scaleVar, spacer, themeVar, type Deps, type Entry, type Source } from './parts'
import { instanceOf, ref, type SetSpec, type VariantSpec } from './set'

/* Catalog batch: menus. Overlays, menus and dialogs, each from its file in
 * packages/ui/src/components/ui, drawn open as the kit's Dialog, Popover and
 * Dropdown menu are. The dialogs share one shell (the Bezel head on a
 * hairline and footer band, or Classic's padded panel), the menus the
 * Menu/Item rows. Motion lives in code. */

export const SOURCES: Source[] = [
  {
    file: 'packages/ui/src/components/ui/accordion.tsx',
    classes: [
      "'border-b border-line last:border-b-0'",
      "'group/accordion-trigger flex flex-1 items-center justify-between gap-4 rounded-md py-3 text-start text-ui font-medium text-fg focus-ring'",
      "'pb-4 [&_a]:text-fg [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-3'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/collapsible.tsx',
    classes: ["className={cn('yj-collapse', className)}", 'strokeWidth={1.75}'],
  },
  {
    file: 'packages/ui/src/components/ui/hover-card.tsx',
    classes: ["'yj-pop flex w-72 max-w-(--available-width) flex-col gap-3 rounded-overlay border border-line bg-overlay p-4 text-fg'", "'text-ui text-fg shadow-md outline-none'"],
  },
  {
    file: 'packages/ui/src/components/ui/alert-dialog.tsx',
    classes: [
      "\"row-span-2 mb-1 inline-grid size-10 place-items-center rounded-lg group-data-[size=sm]/alert-dialog:row-span-1 [&_svg:not([class*='size-'])]:size-5\"",
      "default: 'bg-band text-fg'",
      "danger: 'bg-danger-subtle text-danger-text'",
      "'-mx-5 -mb-5 mt-1 flex flex-col-reverse gap-3 rounded-b-[calc(var(--radius-overlay)-1px)] border-t border-line bg-band px-5 pt-3 pb-4 sm:gap-2 sm:pb-3'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/sheet.tsx',
    classes: [
      "'flex flex-col gap-1.5 border-b border-line p-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))] pe-12'",
      "'mt-auto flex items-center justify-end gap-2 border-t border-line bg-band px-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))] py-[calc(var(--spacing)*(3_-_0.5*var(--ui--compact,0)))]'",
      "'fixed z-50 flex flex-col border-line bg-overlay text-ui text-fg shadow-lg outline-none'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/drawer.tsx',
    classes: [
      "'yj-sheet-bottom -mb-12 max-h-dvh w-full max-w-xl rounded-t-2xl border-x border-t pb-[calc(var(--spacing)*12_+_env(safe-area-inset-bottom))]'",
      "'mx-auto h-1 w-9 shrink-0 rounded-full bg-well'",
      "'relative flex flex-col border-line bg-overlay text-ui text-fg shadow-lg outline-none'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/context-menu.tsx',
    classes: ['<MenuPopup data-slot="context-menu-content" {...props} />', "className={cn('select-none', className)}"],
  },
  {
    file: 'packages/ui/src/components/ui/menubar.tsx',
    classes: [
      "'group/menubar relative isolate flex w-fit items-center gap-0.5 rounded-lg border border-line bg-chrome-float p-0.5 text-fg shadow-xs'",
      "'inline-flex h-control-sm items-center gap-1.5 rounded-md px-2.5 text-ui font-medium text-fg outline-none select-none'",
      'className="rounded-md bg-hover"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/command.tsx',
    classes: [
      "'flex h-10 shrink-0 items-center gap-2 border-b border-line px-3'",
      "'group/command-item relative flex min-h-control cursor-default items-center gap-2.5 rounded-md px-2 text-ui outline-none select-none'",
      "'**:[[cmdk-group-heading]]:text-ui-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:tracking-wide'",
      "'-mx-1.5 my-1 h-px bg-line'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/command-palette.tsx',
    classes: [
      'wrapperClassName="h-13 gap-2.5 px-4"',
      "'[--command-list-max:min(24rem,55dvh)] [&>[cmdk-list-sizer]]:p-2 **:data-[slot=command-item]:min-h-10 **:data-[slot=command-item]:gap-3 **:data-[slot=command-item]:px-2.5'",
      'className="flex h-10 shrink-0 items-center gap-4 border-t border-line bg-band px-4 text-ui-xs text-fg-muted touch:hidden"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/navigation-menu.tsx',
    classes: [
      "'relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) overflow-hidden rounded-xl border border-line bg-overlay text-fg shadow-lg outline-none'",
      "'flex items-start gap-3 rounded-lg p-2.5 text-ui text-fg'",
      '<CollapsibleChevron size={14} className="text-fg-subtle" />',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/navigation-menu.variants.ts',
    classes: ["'inline-flex h-control w-max items-center justify-center gap-1 rounded-md px-3 text-ui font-medium text-fg-muted select-none'"],
  },
  {
    file: 'packages/ui/src/components/ui/mega-menu.tsx',
    classes: [
      "'grid size-8 shrink-0 place-items-center rounded-md border border-line bg-surface text-fg-muted shadow-xs'",
      'className="flex min-w-0 shrink-0 sm:w-60"',
      'className="flex flex-col gap-1 border-t border-line bg-overlay p-3 max-sm:border-t-0"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/notification-center.tsx',
    classes: [
      "'pointer-events-none absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1'",
      "'group/item relative flex gap-3 rounded-lg px-2.5 py-2.5 transition-colors yj-duration-fast ease-standard hover:bg-hover'",
      'className="w-95 gap-0 overflow-hidden p-0"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/account-menu.tsx',
    classes: ['data-slot="account-menu" className="w-64"', 'className="flex items-center gap-2.5 px-2 pt-1.5 pb-2"'],
  },
  {
    file: 'packages/ui/src/components/ui/workspace-switcher.tsx',
    classes: [
      "'group/workspace-trigger flex h-control-lg min-w-0 items-center gap-2 rounded-md px-1.5 text-start text-ui text-fg focus-ring'",
      'className="max-h-(--available-height) w-64 gap-0 overflow-hidden p-0"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/share-dialog.tsx',
    classes: [
      "const rowClass = 'flex min-h-12 items-center gap-3 py-1'",
      'className="grid size-8 shrink-0 place-items-center rounded-lg bg-band text-fg-muted [&_svg]:size-4"',
      'className="flex flex-col gap-1 border-t border-line pt-4"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/export-dialog/export-dialog.tsx',
    classes: [
      "const listClass = 'flex flex-col divide-y divide-line-subtle overflow-hidden rounded-lg bg-well'",
      "const rowClass = 'flex min-h-12 items-center justify-between gap-3 px-3'",
      "const headingClass = 'text-ui-sm font-medium text-fg-muted'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/session-timeout.tsx',
    classes: [
      'className="block text-fg tabular-nums"',
      'className="mx-auto flex w-full max-w-md flex-1 flex-col items-start justify-center gap-4 px-6 py-12"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/tour.tsx',
    classes: [
      "'yj-pop flex w-80 max-w-(--available-width) flex-col gap-3 rounded-xl border border-line bg-overlay p-4 text-ui text-fg shadow-md outline-none'",
      'className="h-1.5 w-1.5 rounded-full bg-line-strong transition-[width,background-color] yj-duration-base ease-standard data-[state=active]:w-4 data-[state=active]:bg-accent"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/radial-menu.tsx',
    classes: [
      'const SLOT = 44',
      'radius = 84,',
      "'focus-ring grid size-11 place-items-center rounded-full border border-line bg-overlay text-fg shadow-md transition-colors yj-duration-fast ease-standard'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/action-island.tsx',
    classes: [
      "'group/island flex w-fit max-w-full items-center gap-1 rounded-control border border-line bg-chrome-float p-1 text-fg shadow-lg data-[size=lg]:gap-1.5 data-[size=lg]:p-1.5'",
      "'border-line-subtle bg-transparent text-fg-muted hover:bg-hover hover:text-fg'",
      "const primary = 'border-transparent bg-accent text-on-accent yj-solid-hover'",
    ],
  },
]

/* ── Shared pieces ─────────────────────────────────────────────────────── */

/** Sets an instance's component property by name, whatever its #id. */
function setProp(instance: InstanceNode, name: string, value: string | boolean) {
  const key = Object.keys(instance.componentProperties).find((k) => k.split('#')[0] === name)
  if (key) instance.setProperties({ [key]: value })
}

/** A square ghost icon button for a panel's corner: a recessed disc in Bezel (bezel.css, dialog and sheet closes). */
async function closeButton(icons: Map<string, IconBuild>) {
  const b = await box({ name: 'Close', dir: 'row', align: 'center', justify: 'center', radius: 'bezel/pill', fill: bezel() ? 'role/well' : undefined })
  controlSquare(b, 'control/sm')
  add(b, icon(icons, 'x', 16, 'role/fg-muted'))
  return b
}

/** Pins a child to its parent's top end, out of the flow. */
function pinTopEnd(parent: FrameNode | ComponentNode, child: FrameNode, inset: number) {
  add(parent, child)
  child.layoutPositioning = 'ABSOLUTE'
  child.x = parent.width - inset - child.width
  child.y = inset
  child.constraints = { horizontal: 'MAX', vertical: 'MIN' }
}

/** A panel title: Bezel's panel title (Bezel/Title), or text-base semibold (UI/lg/Semibold stands in) in Classic. */
const panelTitle = (chars: string) => text(chars, bezel() ? 'Bezel/Title' : 'UI/lg/Semibold', 'role/fg', { name: 'Title', w: 'fill' })

/** The menu panel (MenuPopup): the overlay surface 5px in (4 in Classic). */
async function menuPanel(name: string, w: number | 'hug' = 'hug') {
  return box({ name, dir: 'col', w, ...panelLook() })
}

interface Row {
  label: string
  icon?: string
  shortcut?: string
  checked?: boolean
  on?: boolean
  danger?: boolean
  disabled?: boolean
}

/** Menu/Item instances for a group of rows, set up through their properties. */
function menuRows(get: Deps['get'], icons: Map<string, IconBuild>, rows: Row[]) {
  return rows.map((row) => {
    const inst = instanceOf(get('menu-item'), { Variant: row.danger ? 'danger' : 'default', State: row.disabled ? 'disabled' : row.on ? 'highlighted' : 'rest' })
    setLabel(inst, row.label)
    if (row.icon && icons.get(row.icon)) {
      setProp(inst, 'Show icon', true)
      setProp(inst, 'Icon', icons.get(row.icon)!.rest.id)
    }
    if (row.shortcut) {
      setProp(inst, 'Show shortcut', true)
      setProp(inst, 'Shortcut', row.shortcut)
    }
    if (row.checked) setProp(inst, 'Checked', true)
    return inst
  })
}

/** A menu separator: a hairline 4px above and below. */
async function menuSeparator() {
  const line = rect('Line', 100, 1, 'role/line')
  const sep = await box({ name: 'Separator', dir: 'col', pad: [4, 0], w: 'fill' }, line)
  line.layoutSizingHorizontal = 'FILL'
  return sep
}

/** A menu label: Bezel's mono capital, Classic's small caps. */
const menuLabel = async (chars: string) => box({ name: 'Label', dir: 'row', pad: [8, 8, 4, 8], w: 'fill' }, await text(chars, bezel() ? 'Bezel/Eyebrow' : 'UI/xs/Caps', 'role/fg-muted', { name: 'Label' }))

/** Fills a menu panel with groups of rows, separators between. */
async function fillMenu(panel: FrameNode | ComponentNode, get: Deps['get'], icons: Map<string, IconBuild>, groups: Row[][], label?: string) {
  if (label) add(panel, await menuLabel(label))
  for (const [g, group] of groups.entries()) {
    if (g > 0) add(panel, await menuSeparator())
    for (const inst of menuRows(get, icons, group)) {
      add(panel, inst)
      inst.layoutSizingHorizontal = 'FILL'
    }
  }
}

/**
 * The dialog shell (dialog.tsx's dialogPopupClass, which the alert dialog and
 * the composed dialogs share). Bezel: the head padded 20 (56 at the end for
 * the close disc) on a hairline, the body padded 20, the footer a band on a
 * hairline. Classic: one panel padded 20 with 16 between parts, the footer
 * a recessed band across the bottom edge.
 */
async function dialogShell(
  c: ComponentNode,
  p: { w: number; title: string; description?: string; media?: FrameNode; center?: boolean; body?: SceneNode[]; footer?: SceneNode[]; footerStart?: SceneNode; footerGrid?: boolean; close?: FrameNode },
) {
  const bz = bezel()
  await style(c, { dir: 'col', gap: 0, pad: 0, w: p.w, ...dialogLook() })
  const head = await box({ name: 'Header', dir: p.media && !p.center ? 'row' : 'col', gap: p.media && !p.center ? 'space/3-5' : 'space/1-5', pad: 20, w: 'fill', align: p.center ? 'center' : 'start' })
  padBlock(head, 'space/5', p.body && !bz ? 'space/0' : 'space/5')
  padInline(head, 'space/5', p.close ? 'space/14' : 'space/5')
  const words = await box({ name: 'Text', dir: 'col', gap: 'space/1-5', w: 'fill', align: p.center ? 'center' : 'start' })
  const title = ref(await panelTitle(p.title), 'Title')
  if (p.center) title.textAlignHorizontal = 'CENTER'
  add(words, title)
  if (p.description) {
    const d = ref(await text(p.description, 'UI/base/Regular', 'role/fg-muted', { name: 'Description', w: 'fill' }), 'Description')
    if (p.center) d.textAlignHorizontal = 'CENTER'
    add(words, d)
  }
  if (p.media) add(head, p.media)
  add(head, words)
  add(c, head)
  if (p.body) {
    const body = await box({ name: 'Body', dir: 'col', gap: 'space/4', pad: 20, w: 'fill' })
    padInline(body, 'space/5')
    padBlock(body, bz ? 'space/5' : 'space/4', 'space/5')
    if (bz) {
      // Bezel: the head sits on a hairline over the body.
      const line = rect('Rule', p.w, 1, 'role/line')
      add(c, line)
      line.layoutSizingHorizontal = 'FILL'
    }
    add(body, ...p.body)
    add(c, body)
  }
  if (p.footer) {
    const f = await box({ name: 'Footer', dir: 'row', gap: 'space/2', align: 'center', justify: 'end', pad: [14, 20], w: 'fill', fill: bz ? 'bezel/band' : 'role/band', stroke: 'role/line', sides: { top: 1 } })
    f.strokesIncludedInLayout = true
    padInline(f, 'space/5')
    padBlock(f, bz ? 'space/3-5' : 'space/3')
    if (p.footerStart) add(f, p.footerStart, await spacer())
    add(f, ...p.footer)
    add(c, f)
    if (p.footerGrid) for (const b of p.footer) (b as InstanceNode).layoutSizingHorizontal = 'FILL'
  }
  if (p.close) pinTopEnd(c, p.close, 16)
}

/** Cancel and a confirm, as Button instances: Bezel's raised secondary or Classic's outline, then the action. */
function actions(get: Deps['get'], cancel: string, confirm: string, variant = 'default') {
  const a = button(get, cancel, { Variant: bezel() ? 'secondary' : 'outline' })
  const b = button(get, confirm, { Variant: variant })
  return [a, b]
}

/* ── Accordion ─────────────────────────────────────────────────────────── */

const FAQ = [
  ['Is it accessible?', 'Yes. It follows the WAI-ARIA disclosure pattern: each header is a button, and the panels are announced as regions.'],
  ['Can I open more than one?', 'Pass multiple to let several panels stay open at once.'],
  ['Does it animate?', 'Panels open on the CSS spring and settle into place; reduced motion opens them at once.'],
] as const

function accordionSpec({ icons }: Deps): SetSpec {
  return {
    key: 'component:accordion',
    name: 'Accordion',
    description:
      'Accordion in packages/ui: items on role/line hairlines (none after the last), each a full-width trigger (text-ui medium, 12px above and below) with a 16px chevron that turns from muted to ink on hover, and a panel of muted text with 16px under it. Open shows the first item expanded. In code the panel opens on the CSS spring and its content rises 6px out of a 2px blur.',
    variants: (['false', 'true'] as const).map((open) => ({
      props: { Open: open },
      build: async (c: ComponentNode) => {
        await style(c, { dir: 'col', w: 400 })
        for (const [i, [q, a]] of FAQ.entries()) {
          const expanded = open === 'true' && i === 0
          const item = await box({ name: 'Item', dir: 'col', w: 'fill', stroke: i < FAQ.length - 1 ? 'role/line' : undefined, sides: i < FAQ.length - 1 ? { bottom: 1 } : undefined })
          item.strokesIncludedInLayout = true
          const trigger = await box({ name: 'Trigger', dir: 'row', gap: 'space/4', align: 'center', pad: [12, 0], w: 'fill', radius: 'radius/md' })
          padBlock(trigger, 'space/3')
          const label = await text(q, 'UI/base/Medium', 'role/fg', { name: 'Label', w: 'fill' })
          add(trigger, i === 0 ? ref(label, 'Title') : label, icon(icons, expanded ? 'chevron-up' : 'chevron-down', 16, 'role/fg-muted'))
          add(item, trigger)
          if (expanded) {
            const panel = await box({ name: 'Content', dir: 'col', pad: [0, 0, 16, 0], w: 'fill' })
            padBlock(panel, 'space/0', 'space/4')
            add(panel, ref(await text(a, 'UI/base/Regular', 'role/fg-muted', { name: 'Body', w: 'fill' }), 'Body'))
            add(item, panel)
          }
          add(c, item)
        }
      },
    })),
    properties: [
      { name: 'Title', type: 'TEXT', default: FAQ[0][0], field: 'characters' },
      { name: 'Body', type: 'TEXT', default: FAQ[0][1], field: 'characters' },
    ],
    columns: 'Open',
    gap: [48, 16],
  }
}

/* ── Collapsible ───────────────────────────────────────────────────────── */

function collapsibleSpec({ icons, get }: Deps): SetSpec {
  const repos = ['@youj/react', '@youj/motion', '@youj/icons']
  return {
    key: 'component:collapsible',
    name: 'Collapsible',
    description:
      'Collapsible in packages/ui: an unstyled disclosure. Drawn here as the usual composition: a heading with a ghost icon button as the trigger (the 16px chevrons), one row always shown and the rest in the panel. In code the panel opens on the CSS spring (yj-collapse) and CollapsibleChevron turns with aria-expanded.',
    variants: (['false', 'true'] as const).map((open) => ({
      props: { Open: open },
      build: async (c: ComponentNode) => {
        await style(c, { dir: 'col', gap: 'space/2', w: 320 })
        const trigger = button(get, '', { Variant: 'ghost', Size: 'icon-sm' })
        setProp(trigger, 'Icon', pick(icons, 'chevrons-up-down').rest.id)
        const head = await box({ name: 'Header', dir: 'row', gap: 'space/4', align: 'center', pad: [0, 0, 0, 16], w: 'fill' })
        padInline(head, 'space/4', 'space/0')
        add(head, ref(await text('3 packages pinned', 'UI/base/Semibold', 'role/fg', { name: 'Title', w: 'fill' }), 'Title'), trigger)
        add(c, head)
        for (const [i, name] of repos.entries()) {
          if (i > 0 && open === 'false') break
          const row = await box({ name: 'Row', dir: 'row', align: 'center', pad: [8, 16], w: 'fill', radius: 'radius/md', stroke: 'role/line' })
          padInline(row, 'space/4')
          padBlock(row, 'space/2')
          add(row, await text(name, 'Mono/sm', 'role/fg', { name: 'Name' }))
          add(c, row)
        }
      },
    })),
    properties: [{ name: 'Title', type: 'TEXT', default: '3 packages pinned', field: 'characters' }],
    columns: 'Open',
    gap: [48, 16],
  }
}

/* ── Hover card ────────────────────────────────────────────────────────── */

function hoverCardSpec({ icons }: Deps): SetSpec {
  return {
    key: 'component:hover-card',
    name: 'Hover card',
    description:
      'HoverCardContent in packages/ui, open: a 288px role/overlay surface on a hairline with 16px padding, 12px between parts and Shadow/md, previewing what its link points at (a person here). It opens after 500ms over the trigger and closes 250ms after leaving; on touch a tap toggles it. In code it pops from the trigger on the snappy spring.',
    variants: [
      {
        props: { Content: 'person' },
        build: async (c: ComponentNode) => {
          await style(c, { dir: 'row', gap: 'space/3', pad: 16, w: 288, radius: 'radius/xl', fill: bezel() ? 'bezel/popover' : 'role/overlay', stroke: 'role/line', effect: 'Shadow/md' })
          for (const side of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const) c.setBoundVariable(side, scaleVar('space/4'))
          const words = await box({ name: 'Text', dir: 'col', gap: 'space/1', w: 'fill' })
          add(
            words,
            ref(await text('@youj', 'UI/base/Semibold', 'role/fg', { name: 'Name' }), 'Name'),
            ref(await text('Interfaces that move with intent. Components, motion and icons on one design language.', 'UI/base/Regular', 'role/fg-muted', { name: 'Bio', w: 'fill' }), 'Bio'),
            await box({ name: 'Joined', dir: 'row', gap: 'space/1-5', align: 'center', pad: [4, 0, 0, 0] }, icon(icons, 'calendar', 14, 'role/fg-muted'), await text('Joined September 2026', 'UI/sm/Regular', 'role/fg-muted', { name: 'Meta' })),
          )
          add(c, await initials('YJ', 40, 'UI/base/Medium'), words)
        },
      },
    ],
    properties: [
      { name: 'Name', type: 'TEXT', default: '@youj', field: 'characters' },
      { name: 'Bio', type: 'TEXT', default: 'Interfaces that move with intent. Components, motion and icons on one design language.', field: 'characters' },
    ],
    columns: 'Content',
  }
}

/* ── Alert dialog ──────────────────────────────────────────────────────── */

function alertDialogSpec({ icons, get }: Deps): SetSpec {
  const variants: VariantSpec[] = []
  for (const size of ['default', 'sm'] as const)
    for (const variant of ['default', 'danger'] as const)
      variants.push({
        props: { Size: size, Variant: variant },
        build: async (c) => {
          const danger = variant === 'danger'
          const media = await box({ name: 'Media', dir: 'row', align: 'center', justify: 'center', w: 40, h: 40, radius: 'radius/lg', fill: danger ? 'role/danger-subtle' : 'role/band' })
          add(media, icon(icons, danger ? 'trash' : 'info', 20, danger ? 'role/danger-text' : 'role/fg'))
          await dialogShell(c, {
            w: size === 'sm' ? 320 : 448,
            title: danger ? 'Delete this project?' : 'Publish to production?',
            description: danger ? 'youj-docs and its 48 deployments will be removed. This can’t be undone.' : 'The build goes live on www.youj.dev for everyone.',
            media,
            center: size === 'sm',
            footer: actions(get, 'Cancel', danger ? 'Delete' : 'Publish', danger ? 'danger' : 'default'),
            footerGrid: size === 'sm',
          })
        },
      })
  return {
    key: 'component:alert-dialog',
    name: 'Alert dialog',
    description:
      'AlertDialogContent in packages/ui: the dialog surface (448px, 320px in the sm size) asking to confirm. The media is a 40px icon tile (role/band, or role/danger-subtle with danger ink) beside the title and description, or stacked and centred in sm. The footer is a recessed band across the bottom edge, Cancel before the action (a two-column grid in sm). It has no close button and ignores a press outside. In code it rises in over a scrim.',
    variants,
    properties: [
      { name: 'Title', type: 'TEXT', default: 'Publish to production?', field: 'characters' },
      { name: 'Description', type: 'TEXT', default: 'The build goes live on www.youj.dev for everyone.', field: 'characters' },
    ],
    columns: 'Variant',
    gap: [48, 32],
  }
}

/* ── Sheet ─────────────────────────────────────────────────────────────── */

function sheetSpec({ icons, get }: Deps): SetSpec {
  const build = async (c: ComponentNode, side: 'end' | 'bottom') => {
    const bz = bezel()
    const w = side === 'end' ? 384 : 640
    await style(c, { dir: 'col', w, h: side === 'end' ? 560 : 'hug', fill: 'role/overlay', stroke: 'role/line', sides: side === 'end' ? { left: 1 } : { top: 1 }, effect: 'Shadow/lg', clip: true })
    c.strokesIncludedInLayout = true
    const head = await box({ name: 'Header', dir: 'col', gap: 'space/1-5', pad: 20, w: 'fill', stroke: 'role/line', sides: { bottom: 1 } })
    head.strokesIncludedInLayout = true
    padBlock(head, 'space/5')
    padInline(head, 'space/5', 'space/12')
    add(
      head,
      ref(await panelTitle('Edit profile'), 'Title'),
      ref(await text('Changes are saved when you press Save.', 'UI/base/Regular', 'role/fg-muted', { name: 'Description', w: 'fill' }), 'Description'),
    )
    const body = await box({ name: 'Body', dir: 'col', gap: 'space/5', pad: 20, w: 'fill', h: side === 'end' ? 'fill' : 'hug' })
    padBlock(body, 'space/5')
    padInline(body, 'space/5')
    for (const [label, val] of [
      ['Name', 'Lena Hart'],
      ['Username', '@lena'],
    ]) {
      const input = instanceOf(get('input'), { State: 'rest', Content: 'value' })
      setProp(input, 'Value', val!)
      add(body, await box({ name: 'Field', dir: 'col', gap: 'space/2', w: 'fill' }, bz ? await eyebrow(label!) : await text(label!, 'UI/base/Medium', 'role/fg', { name: 'Label' }), input))
      input.layoutSizingHorizontal = 'FILL'
    }
    const foot = await box({ name: 'Footer', dir: 'row', gap: 'space/2', align: 'center', justify: 'end', pad: [12, 20], w: 'fill', fill: 'role/band', stroke: 'role/line', sides: { top: 1 } })
    foot.strokesIncludedInLayout = true
    padInline(foot, 'space/5')
    padBlock(foot, 'space/3')
    add(foot, ...actions(get, 'Cancel', 'Save'))
    add(c, head, body, foot)
    pinTopEnd(c, await closeButton(icons), 16)
  }
  return {
    key: 'component:sheet',
    name: 'Sheet',
    description:
      'SheetContent in packages/ui, open: a role/overlay panel against an edge (`end` by default, 384px wide and the viewport tall; top and bottom take the width), on a hairline toward the page with Shadow/lg. SheetHeader sits on a hairline (room at the end for the close button), SheetBody pads 20, SheetFooter is a role/band strip of actions. `floating` insets it 12px and rounds it; on touch a side sheet takes the whole phone width. In code it slides in from its edge over a scrim.',
    variants: (['end', 'bottom'] as const).map((side) => ({ props: { Side: side }, build: (c: ComponentNode) => build(c, side) })),
    properties: [
      { name: 'Title', type: 'TEXT', default: 'Edit profile', field: 'characters' },
      { name: 'Description', type: 'TEXT', default: 'Changes are saved when you press Save.', field: 'characters' },
    ],
    columns: 'Side',
    gap: [48, 16],
  }
}

/* ── Drawer ────────────────────────────────────────────────────────────── */

function drawerSpec({ icons, get }: Deps): SetSpec {
  const build = async (c: ComponentNode, direction: 'down' | 'right') => {
    const down = direction === 'down'
    await style(c, { dir: 'col', w: down ? 480 : 352, h: down ? 'hug' : 520, fill: 'role/overlay', stroke: 'role/line', effect: 'Shadow/lg', clip: true })
    c.strokesIncludedInLayout = true
    // rounded-t-2xl (down) or rounded-l-2xl (right), the edge it hangs from square.
    for (const corner of down ? (['topLeftRadius', 'topRightRadius'] as const) : (['topLeftRadius', 'bottomLeftRadius'] as const)) c.setBoundVariable(corner, themeVar('radius/2xl'))
    c.strokeTopWeight = 1
    c.strokeBottomWeight = 0
    c.strokeLeftWeight = 1
    c.strokeRightWeight = down ? 1 : 0
    if (down) add(c, await box({ name: 'Handle row', dir: 'row', justify: 'center', pad: [10, 0, 0, 0], w: 'fill' }, rect('Handle', 36, 4, 'role/well', 'radius/full')))
    const head = await box({ name: 'Header', dir: 'col', gap: 'space/1-5', pad: [16, 20, 12, 20], w: 'fill' })
    padInline(head, 'space/5')
    padBlock(head, 'space/4', 'space/3')
    add(
      head,
      ref(await text('Move goal', 'UI/lg/Semibold', 'role/fg', { name: 'Title', w: 'fill' }), 'Title'),
      ref(await text('Set your daily activity goal.', 'UI/base/Regular', 'role/fg-muted', { name: 'Description', w: 'fill' }), 'Description'),
    )
    const body = await box({ name: 'Body', dir: 'row', align: 'center', justify: 'center', gap: 'space/4', pad: [16, 20], w: 'fill', h: down ? 'hug' : 'fill' })
    const minus = button(get, '', { Variant: 'outline', Size: 'icon' })
    setProp(minus, 'Icon', pick(icons, 'minus').rest.id)
    const plus = button(get, '', { Variant: 'outline', Size: 'icon' })
    const goal = await box({ name: 'Goal', dir: 'col', align: 'center' }, ref(await text('350', 'Heading/5xl', 'role/fg', { name: 'Value' }), 'Value'), await eyebrow('Calories / day'))
    add(body, minus, goal, plus)
    const foot = await box({ name: 'Footer', dir: 'col', gap: 'space/2', pad: [12, 20, 20, 20], w: 'fill' })
    padInline(foot, 'space/5')
    padBlock(foot, 'space/3', 'space/5')
    const [cancel, submit] = actions(get, 'Cancel', 'Submit')
    add(foot, submit!, cancel!)
    for (const b of [submit!, cancel!]) b.layoutSizingHorizontal = 'FILL'
    add(c, head, body, foot)
  }
  return {
    key: 'component:drawer',
    name: 'Drawer',
    description:
      'DrawerContent in packages/ui, open: a role/overlay panel you swipe away, against an edge (`down` by default: up to 576px wide, rounded-2xl at the top with a 36 × 4 role/well handle). The header pads 16 / 20 / 12, the footer stacks full-width actions, primary first. Left and right drawers are up to 352px wide and rounded on their inner edge. In code it follows the finger and settles on the spring.',
    variants: (['down', 'right'] as const).map((direction) => ({ props: { Direction: direction }, build: (c: ComponentNode) => build(c, direction) })),
    properties: [
      { name: 'Title', type: 'TEXT', default: 'Move goal', field: 'characters' },
      { name: 'Description', type: 'TEXT', default: 'Set your daily activity goal.', field: 'characters' },
      { name: 'Value', type: 'TEXT', default: '350', field: 'characters' },
    ],
    columns: 'Direction',
    gap: [48, 16],
  }
}

/* ── Context menu ──────────────────────────────────────────────────────── */

function contextMenuSpec({ icons, get }: Deps): SetSpec {
  return {
    key: 'component:context-menu',
    name: 'Context menu',
    description:
      'ContextMenuContent in packages/ui, open at the pointer: the same menu panel and Menu/Item rows as the dropdown menu (the overlay surface, 5px in, Shadow/md), opened by a right click or a long press; on touch it presents as a sheet. A sub-menu trigger ends in a chevron.',
    variants: [
      {
        props: { Content: 'actions' },
        build: async (c: ComponentNode) => {
          await style(c, { dir: 'col', w: 224, ...panelLook() })
          await fillMenu(c, get, icons, [
            [
              { label: 'Back', icon: 'arrow-left', shortcut: '⌘[' },
              { label: 'Reload', icon: 'corner-up-left', shortcut: '⌘R', on: true },
            ],
            [
              { label: 'Copy link', icon: 'link' },
              { label: 'Save as…', icon: 'download', shortcut: '⇧⌘S' },
            ],
          ])
          add(c, await menuSeparator())
          const s = await box({ name: 'Sub trigger', dir: 'row', gap: 'space/2', align: 'center', pad: [4, 8], w: 'fill', radius: 'bezel/menu-row-radius' })
          padInline(s, 'space/2')
          s.setBoundVariable('minHeight', themeVar('control/sm'))
          add(s, icon(icons, 'share', 16, 'role/fg-muted'), await text('Share', 'UI/base/Regular', 'role/fg', { name: 'Label', w: 'fill' }), icon(icons, 'chevron-right', 16, 'role/fg-muted'))
          add(c, s)
          await fillMenu(c, get, icons, [[{ label: 'Delete', icon: 'trash', danger: true }]])
        },
      },
    ],
    properties: [],
    columns: 'Content',
  }
}

/* ── Menubar ───────────────────────────────────────────────────────────── */

function menubarSpec({ icons, get }: Deps): SetSpec {
  const menus = ['File', 'Edit', 'View', 'Help']
  return {
    key: 'component:menubar',
    name: 'Menubar',
    description:
      'Menubar in packages/ui: a floating bar (role/chrome-float, a hairline, radius/lg, 2px in, Shadow/xs) of menu triggers, each a small control (control/sm, text-ui medium, 10px in). The open menu’s trigger sits on a role/hover key, which in code slides between triggers; its menu is the dropdown menu panel. Open shows Edit open.',
    variants: (['false', 'true'] as const).map((open) => ({
      props: { Open: open },
      build: async (c: ComponentNode) => {
        await style(c, { dir: 'col', gap: 'space/1' })
        const bar = await box({ name: 'Bar', dir: 'row', gap: 'space/0-5', align: 'center', pad: 2, radius: 'radius/lg', fill: 'role/chrome-float', stroke: 'role/line', effect: 'Shadow/xs' })
        for (const m of menus) {
          const on = open === 'true' && m === 'Edit'
          const t = await box({ name: 'Trigger', dir: 'row', gap: 'space/1-5', align: 'center', radius: 'radius/md', fill: on ? 'role/hover' : undefined })
          padInline(t, 'space/2-5')
          add(t, await text(m, 'UI/base/Medium', 'role/fg', { name: 'Label' }))
          controlHeight(t, 'control/sm')
          add(bar, t)
        }
        add(c, bar)
        if (open === 'true') {
          const panel = await menuPanel('Menu', 224)
          await fillMenu(panel, get, icons, [
            [
              { label: 'Undo', shortcut: '⌘Z' },
              { label: 'Redo', shortcut: '⇧⌘Z', disabled: true },
            ],
            [
              { label: 'Cut', shortcut: '⌘X', on: true },
              { label: 'Copy', shortcut: '⌘C' },
              { label: 'Paste', shortcut: '⌘V' },
            ],
          ])
          const row = await box({ name: 'Menu row', dir: 'row', pad: [0, 0, 0, 44], w: 'hug' }, panel)
          add(c, row)
        }
      },
    })),
    properties: [],
    columns: 'Open',
    gap: [48, 16],
  }
}

/* ── Command rows (command.tsx), shared by Command, the palette and the switcher ── */

interface CommandRowSpec {
  label: string
  icon?: string
  lead?: SceneNode
  detail?: string
  shortcut?: string
  on?: boolean
  checked?: boolean
}

/** A command item: min-h-control, 10px between parts, the cursor key when selected, a trailing check when checked. */
async function commandRow(icons: Map<string, IconBuild>, r: CommandRowSpec, p: { gap?: string; px?: string; height?: string } = {}) {
  const row = await box({ name: 'Item', dir: 'row', gap: p.gap ?? 'space/2-5', align: 'center', pad: [6, 8], w: 'fill', radius: 'radius/md', fill: r.on ? 'role/cursor' : undefined })
  padInline(row, p.px ?? 'space/2')
  row.setBoundVariable('minHeight', themeVar(p.height ?? 'control/default'))
  if (r.lead) add(row, r.lead)
  else if (r.icon) add(row, icon(icons, r.icon, 16, r.on ? 'role/fg' : 'role/fg-muted'))
  const words = await box({ name: 'Text', dir: 'col', w: 'fill' }, await text(r.label, 'UI/base/Regular', 'role/fg', { name: 'Label', w: 'fill', truncate: true }))
  if (r.detail) add(words, await text(r.detail, 'UI/xs/Regular', 'role/fg-muted', { name: 'Detail', w: 'fill', truncate: true }))
  add(row, words)
  if (r.shortcut) add(row, await text(r.shortcut, 'UI/sm/Regular', 'role/fg-muted', { name: 'Shortcut' }))
  if (r.checked) add(row, icon(icons, 'check', 16, 'role/accent'))
  return row
}

/** A command group's heading: small capitals in muted ink, 8px in. */
const commandHeading = async (chars: string) => box({ name: 'Heading', dir: 'row', pad: [8, 8, 4, 8], w: 'fill' }, await text(chars, 'UI/xs/Caps', 'role/fg-muted', { name: 'Heading' }))

/** The command search row: a 16px search icon and the field, on a hairline. */
async function commandInput(icons: Map<string, IconBuild>, placeholder: string, p: { h?: number; px?: string; styleName?: string; property?: boolean } = {}) {
  const row = await box({ name: 'Input', dir: 'row', gap: 'space/2-5', align: 'center', w: 'fill', h: p.h ?? 40, stroke: 'role/line', sides: { bottom: 1 } })
  row.strokesIncludedInLayout = true
  padInline(row, p.px ?? 'space/3')
  const t = await text(placeholder, p.styleName ?? 'UI/base/Regular', 'role/fg-muted', { name: 'Placeholder', w: 'fill', truncate: true })
  add(row, icon(icons, 'search', 16, 'role/fg-muted'), p.property === false ? t : ref(t, 'Placeholder'))
  return row
}

/** The command list: groups of rows, 6px in, a full-bleed hairline between groups. */
async function commandList(icons: Map<string, IconBuild>, groups: { heading?: string; rows: CommandRowSpec[] }[], p: { pad?: number; gap?: string; px?: string; height?: string } = {}) {
  const list = await box({ name: 'List', dir: 'col', pad: p.pad ?? 6, w: 'fill' })
  for (const [i, g] of groups.entries()) {
    if (i > 0) {
      const line = rect('Separator', 100, 1, 'role/line')
      add(list, await box({ name: 'Separator', dir: 'col', pad: [4, 0], w: 'fill' }, line))
      line.layoutSizingHorizontal = 'FILL'
    }
    if (g.heading) add(list, await commandHeading(g.heading))
    for (const r of g.rows) add(list, await commandRow(icons, r, p))
  }
  return list
}

/** A logo tile (Avatar with rounded-md corners): initials in the accent on its tint. */
async function logoTile(chars: string, px: number, radius = 'radius/md') {
  return box({ name: 'Logo', dir: 'row', align: 'center', justify: 'center', w: px, h: px, radius, fill: 'role/accent-subtle' }, await text(chars, px >= 32 ? 'UI/sm/Semibold' : 'UI/xs/Medium', 'role/accent-text', { name: 'Initials' }))
}

/** A Kbd instance showing a key. */
function kbd(get: Deps['get'], chars: string) {
  const k = instanceOf(get('kbd'), { Content: 'symbol' })
  setProp(k, 'Symbol', chars)
  return k
}

/* ── Command ───────────────────────────────────────────────────────────── */

function commandSpec({ icons }: Deps): SetSpec {
  return {
    key: 'component:command',
    name: 'Command',
    description:
      'Command in packages/ui (cmdk): a search row on a hairline (40 high, a 16px search icon), then a list 6px in of groups under small-capital headings, hairlines between them. Items are control-height rows, 10px between icon and label, the selected one on the cursor key (which slides between rows in code); shortcuts trail in muted ui-sm. Drawn here in a popover; inside a dialog it is the command palette.',
    variants: (['results', 'empty'] as const).map((content) => ({
      props: { Content: content },
      build: async (c: ComponentNode) => {
        await style(c, { dir: 'col', w: 360, ...panelLook({ pad: 0 }), clip: true })
        add(c, await commandInput(icons, content === 'empty' ? 'zebra' : 'Type a command or search…'))
        if (content === 'empty') {
          add(c, await box({ name: 'Empty', dir: 'row', justify: 'center', pad: [32, 16], w: 'fill' }, await text('No results found.', 'UI/base/Regular', 'role/fg-muted', { name: 'Empty' })))
          return
        }
        add(
          c,
          await commandList(icons, [
            {
              heading: 'Suggestions',
              rows: [
                { label: 'Calendar', icon: 'calendar', on: true },
                { label: 'Search emoji', icon: 'smile' },
                { label: 'Calculator', icon: 'calculator' },
              ],
            },
            {
              heading: 'Settings',
              rows: [
                { label: 'Profile', icon: 'user', shortcut: '⌘P' },
                { label: 'Billing', icon: 'credit-card', shortcut: '⌘B' },
                { label: 'Settings', icon: 'settings', shortcut: '⌘S' },
              ],
            },
          ]),
        )
      },
    })),
    properties: [{ name: 'Placeholder', type: 'TEXT', default: 'Type a command or search…', field: 'characters' }],
    columns: 'Content',
    gap: [48, 16],
  }
}

/* ── Command palette ───────────────────────────────────────────────────── */

function commandPaletteSpec({ icons, get }: Deps): SetSpec {
  return {
    key: 'component:command-palette',
    name: 'Command palette',
    description:
      'CommandPalette in packages/ui, open: Command in a dialog up to 672px wide, 12vh from the top. The search row is 52 high in ui-lg; rows are at least 40 high with 12px between icon and label; a page trail sits under the search when you drill in (Nested); the footer spells out the keys on role/band. On touch it is a sheet and the footer goes. In code the list’s height eases as results change.',
    variants: (['false', 'true'] as const).map((nested) => ({
      props: { Nested: nested },
      build: async (c: ComponentNode) => {
        await style(c, { dir: 'col', w: 640, ...dialogLook() })
        add(c, await commandInput(icons, nested === 'true' ? 'Search projects…' : 'Search or jump to…', { h: 52, px: 'space/4', styleName: 'UI/lg/Regular' }))
        if (nested === 'true') {
          const trail = await box({ name: 'Breadcrumb', dir: 'row', gap: 'space/1', align: 'center', w: 'fill', h: 36, stroke: 'role/line', sides: { bottom: 1 } })
          trail.strokesIncludedInLayout = true
          padInline(trail, 'space/3')
          const crumb = async (chars: string, current: boolean) => box({ name: 'Crumb', dir: 'row', pad: [2, 6], radius: 'radius/sm' }, await text(chars, current ? 'UI/sm/Medium' : 'UI/sm/Regular', current ? 'role/fg' : 'role/fg-muted', { name: 'Label' }))
          add(trail, await crumb('Home', false), icon(icons, 'chevron-right', 14, 'role/fg-subtle'), await crumb('Projects', true))
          add(c, trail)
        }
        const groups =
          nested === 'true'
            ? [{ rows: [{ label: 'youj-docs', icon: 'folder', on: true }, { label: 'youj-promo', icon: 'folder' }, { label: 'youj-mcp', icon: 'folder' }] }]
            : [
                { heading: 'Navigation', rows: [{ label: 'Projects', icon: 'folder', on: true, shortcut: 'G P' }, { label: 'Deployments', icon: 'rocket', shortcut: 'G D' }] },
                { heading: 'Actions', rows: [{ label: 'New project', icon: 'plus' }, { label: 'Invite people', icon: 'user-plus' }, { label: 'Toggle theme', icon: 'moon' }] },
              ]
        add(c, await commandList(icons, groups, { pad: 8, gap: 'space/3', px: 'space/2-5', height: 'control/lg' }))
        const foot = await box({ name: 'Footer', dir: 'row', gap: 'space/4', align: 'center', w: 'fill', h: 40, fill: 'role/band', stroke: 'role/line', sides: { top: 1 } })
        foot.strokesIncludedInLayout = true
        padInline(foot, 'space/4')
        const key = async (keys: string[], chars: string) => {
          const g = await box({ name: 'Hint', dir: 'row', gap: 'space/1-5', align: 'center' })
          add(g, await box({ name: 'Keys', dir: 'row', gap: 'space/1', align: 'center' }, ...keys.map((k) => kbd(get, k))), await text(chars, 'UI/xs/Regular', 'role/fg-muted', { name: 'Hint' }))
          return g
        }
        add(foot, await key(['↑', '↓'], 'Navigate'), await key(['↵'], 'Open'), await key(['esc'], nested === 'true' ? 'Back' : 'Close'))
        if (nested === 'true') add(foot, await key(['⌫'], 'Back'))
        add(c, foot)
      },
    })),
    properties: [{ name: 'Placeholder', type: 'TEXT', default: 'Search or jump to…', field: 'characters' }],
    columns: 'Nested',
    gap: [48, 16],
  }
}

/* ── Navigation menu ───────────────────────────────────────────────────── */

const NAV_LINKS = [
  ['Components', 'Accessible parts on shadcn and Base UI.', 'layers'],
  ['Motion', 'Primitives, transitions and effects.', 'sparkles'],
  ['Icons', 'Animated icons on one engine.', 'smile'],
  ['Blocks', 'Cards, sections and screens to copy in.', 'layout-grid'],
] as const

/** A top-level trigger (navigationMenuTriggerStyle): control height, 12px in (8 at the end before the chevron), medium muted text. */
async function navTrigger(icons: Map<string, IconBuild>, chars: string, p: { open?: boolean; chevron?: boolean; hover?: boolean } = {}) {
  const t = await box({ name: 'Trigger', dir: 'row', gap: 'space/1', align: 'center', radius: 'radius/md', fill: p.hover ? 'role/hover' : undefined })
  padInline(t, 'space/3', p.chevron ? 'space/2' : 'space/3')
  controlHeight(t)
  add(t, await text(chars, 'UI/base/Medium', p.open ? 'role/fg' : 'role/fg-muted', { name: 'Label' }))
  if (p.chevron) add(t, icon(icons, p.open ? 'chevron-up' : 'chevron-down', 14, 'role/fg-subtle'))
  return t
}

/** The navigation popup: role/overlay on a hairline, radius/xl, Shadow/lg. */
const navPopup = (pad: number) => box({ name: 'Popup', dir: 'row', ...panelLook(), pad, effect: 'Shadow/lg', fill: 'role/overlay' })

/** A popup link: an icon and a title with its description, 10px in, radius/lg. */
async function navLink(icons: Map<string, IconBuild>, title: string, description: string, ic: string, on = false) {
  const l = await box({ name: 'Link', dir: 'row', gap: 'space/3', align: 'start', pad: 10, w: 'fill', radius: 'radius/lg', fill: on ? 'role/hover' : undefined })
  add(
    l,
    icon(icons, ic, 16, 'role/fg-muted'),
    await box({ name: 'Text', dir: 'col', gap: 'space/0-5', w: 'fill' }, await text(title, 'UI/base/Medium', 'role/fg', { name: 'Title' }), await text(description, 'UI/sm/Regular', 'role/fg-muted', { name: 'Description', w: 'fill' })),
  )
  return l
}

function navigationMenuSpec({ icons }: Deps): SetSpec {
  return {
    key: 'component:navigation-menu',
    name: 'Navigation menu',
    description:
      'NavigationMenu in packages/ui: a row of top-level triggers (control height, medium muted text, a 14px chevron) under a role/hover pill that follows the pointer in code; the open trigger reads in ink. Its popup (Open) is role/overlay on a hairline with Shadow/lg, holding links: an icon and a title with a muted description, 10px in. In code the popup grows from its trigger and morphs between panels.',
    variants: (['false', 'true'] as const).map((open) => ({
      props: { Open: open },
      build: async (c: ComponentNode) => {
        await style(c, { dir: 'col', gap: 'space/2' })
        const list = await box({ name: 'List', dir: 'row', gap: 'space/0-5', align: 'center' })
        add(
          list,
          await navTrigger(icons, 'Product', { chevron: true, open: open === 'true', hover: open === 'true' }),
          await navTrigger(icons, 'Resources', { chevron: true }),
          await navTrigger(icons, 'Docs'),
          await navTrigger(icons, 'Pricing'),
        )
        add(c, list)
        if (open === 'true') {
          const popup = await navPopup(6)
          for (const half of [0, 1]) {
            const col = await box({ name: 'Column', dir: 'col', gap: 'space/0-5', w: 232 })
            for (const [i, [t, d, ic]] of NAV_LINKS.entries()) if (i % 2 === half) add(col, await navLink(icons, t, d, ic, i === 0))
            add(popup, col)
          }
          add(c, popup)
        }
      },
    })),
    properties: [],
    columns: 'Open',
    gap: [48, 16],
  }
}

/* ── Mega menu ─────────────────────────────────────────────────────────── */

function megaMenuSpec({ icons }: Deps): SetSpec {
  const sections = [
    { heading: 'Build', links: [['Components', 'Accessible, animated parts.', 'layers'], ['Motion', 'Transitions and effects.', 'sparkles'], ['Icons', 'Animated icon set.', 'smile']] },
    { heading: 'Ship', links: [['Blocks', 'Whole pages to start from.', 'layout-dashboard'], ['CLI', 'npx @youj/cli add, and more.', 'terminal'], ['MCP', 'Youj in your AI tools.', 'cpu']] },
  ]
  return {
    key: 'component:mega-menu',
    name: 'Mega menu',
    description:
      'MegaMenu in packages/ui, open: the navigation popup laid out in columns (each up to 248px) of sections under small-capital headings, each link a 32px icon tile (role/surface, a hairline, Shadow/xs) with a title and a muted description, and a 240px featured card at the end (a role/band card with a media wash and a role/overlay caption under an accent eyebrow). On phones the columns stack.',
    variants: [
      {
        props: { Content: 'featured' },
        build: async (c: ComponentNode) => {
          await style(c, { dir: 'row', gap: 'space/1-5', ...panelLook(), pad: 8, effect: 'Shadow/lg', fill: 'role/overlay' })
          for (const s of sections) {
            const col = await box({ name: 'Section', dir: 'col', gap: 'space/0-5', w: 248 })
            add(col, await box({ name: 'Heading', dir: 'row', pad: [8, 10, 4, 10], w: 'fill' }, await text(s.heading, 'UI/xs/Caps', 'role/fg-muted', { name: 'Heading' })))
            for (const [i, [t, d, ic]] of s.links.entries()) {
              const l = await box({ name: 'Link', dir: 'row', gap: 'space/3', align: 'start', pad: 10, w: 'fill', radius: 'radius/lg', fill: s === sections[0] && i === 0 ? 'role/hover' : undefined })
              const tile = await box({ name: 'Icon', dir: 'row', align: 'center', justify: 'center', w: 32, h: 32, radius: 'radius/md', fill: 'role/surface', stroke: 'role/line', effect: 'Shadow/xs' }, icon(icons, ic!, 16, 'role/fg-muted'))
              add(l, tile, await box({ name: 'Text', dir: 'col', gap: 'space/0-5', w: 'fill' }, await text(t!, 'UI/base/Medium', 'role/fg', { name: 'Title' }), await text(d!, 'UI/sm/Regular', 'role/fg-muted', { name: 'Description', w: 'fill' })))
              add(col, l)
            }
            add(c, col)
          }
          const card = await box({ name: 'Featured', dir: 'col', w: 240, h: 'fill', radius: 'radius/lg', fill: 'role/band', stroke: 'role/line', clip: true })
          const media = await box({ name: 'Media', dir: 'col', w: 'fill', h: 'fill', fill: ['role/accent', 0.15] })
          media.minHeight = 112
          const cap = await box({ name: 'Caption', dir: 'col', gap: 'space/1', pad: 12, w: 'fill', fill: 'role/overlay', stroke: 'role/line', sides: { top: 1 } })
          add(
            cap,
            await text('New', 'UI/xs/Caps', 'role/accent-text', { name: 'Eyebrow' }),
            ref(await text('Youj 0.1 is out', 'UI/base/Medium', 'role/fg', { name: 'Title' }), 'Featured title'),
            await text('What shipped, and what is next.', 'UI/sm/Regular', 'role/fg-muted', { name: 'Description', w: 'fill' }),
          )
          add(card, media, cap)
          add(c, card)
        },
      },
    ],
    properties: [{ name: 'Featured title', type: 'TEXT', default: 'Youj 0.1 is out', field: 'characters' }],
    columns: 'Content',
  }
}

/* ── Notification center ───────────────────────────────────────────────── */

function notificationCenterSpec({ icons, get }: Deps): SetSpec {
  const items = [
    { who: 'Mara', what: 'commented on Launch plan', body: 'Can we move the release to Thursday?', time: '2m ago', unread: true, actions: true },
    { who: 'Ilan', what: 'invited you to youj-docs', time: '1h ago', unread: true },
    { who: '', what: 'Deploy finished on production', time: 'Yesterday', unread: false },
  ]
  const trigger = async (c: ComponentNode) => {
    await style(c, { dir: 'row' })
    const b = button(get, '', { Variant: 'ghost', Size: 'icon' })
    setProp(b, 'Icon', pick(icons, 'bell').rest.id)
    const count = await box({ name: 'Count', dir: 'row', align: 'center', justify: 'center', pad: [0, 4], h: 16, radius: 'radius/full', fill: 'role/accent', stroke: 'role/canvas', strokeWidth: 2, strokeAlign: 'OUTSIDE' }, ref(await text('2', 'UI/xs/Medium', 'role/on-accent', { name: 'Count' }), 'Count'))
    count.minWidth = 16
    add(c, b, count)
    count.layoutPositioning = 'ABSOLUTE'
    count.x = b.width - count.width + 2
    count.y = -2
  }
  const panel = async (c: ComponentNode) => {
    await style(c, { dir: 'col', w: 380, ...panelLook({ pad: 0 }), clip: true })
    const head = await box({ name: 'Header', dir: 'row', gap: 'space/3', align: 'center', justify: 'between', pad: [14, 16, 4, 16], w: 'fill' })
    add(head, ref(await text('Notifications', 'UI/lg/Semibold', 'role/fg', { name: 'Title' }), 'Title'), button(get, 'Mark all read', { Variant: 'ghost', Size: 'xs' }))
    const tabs = await box({ name: 'Tabs', dir: 'row', gap: 'space/1', align: 'center', pad: [0, 16], w: 'fill', stroke: 'role/line', sides: { bottom: 1 } })
    tabs.strokesIncludedInLayout = true
    const all = instanceOf(get('tabs-trigger'), { Variant: 'underline', State: 'active' })
    setLabel(all, 'All')
    const unread = instanceOf(get('tabs-trigger'), { Variant: 'underline', State: 'rest' })
    setLabel(unread, 'Unread · 2')
    add(tabs, all, unread)
    const list = await box({ name: 'List', dir: 'col', gap: 'space/1', pad: [8, 6], w: 'fill' })
    add(list, await box({ name: 'Group', dir: 'row', pad: [4, 10], w: 'fill' }, await text('Today', 'UI/xs/Medium', 'role/fg-muted', { name: 'Group' })))
    for (const it of items) {
      const row = await box({ name: 'Item', dir: 'row', gap: 'space/3', align: 'start', pad: 10, w: 'fill', radius: 'radius/lg' })
      const lead = it.who
        ? await initials(it.who.slice(0, 1), 24, 'UI/xs/Medium')
        : await box({ name: 'Icon', dir: 'row', align: 'center', justify: 'center', w: 24, h: 24, radius: 'radius/full', fill: 'role/surface', stroke: 'role/line' }, icon(icons, 'rocket', 12, 'role/fg-muted'))
      const words = await box({ name: 'Text', dir: 'col', gap: 'space/0-5', w: 'fill' })
      add(words, await text(it.who ? `${it.who} ${it.what}` : it.what, it.unread ? 'UI/base/Medium' : 'UI/base/Regular', it.unread ? 'role/fg' : 'role/fg-muted', { name: 'Title', w: 'fill' }))
      if (it.body) add(words, await text(it.body, 'UI/sm/Regular', 'role/fg-muted', { name: 'Body', w: 'fill' }))
      add(words, await text(it.time, 'UI/xs/Regular', 'role/fg-muted', { name: 'Time' }))
      if (it.actions) add(words, await box({ name: 'Actions', dir: 'row', gap: 'space/1-5', pad: [6, 0, 0, 0] }, button(get, 'Reply', { Variant: 'outline', Size: 'xs' }), button(get, 'View', { Variant: 'outline', Size: 'xs' })))
      add(row, lead, words)
      if (it.unread) {
        const dot = rect('Unread', 6, 6, 'role/accent', 'radius/full')
        add(row, dot)
        dot.layoutPositioning = 'ABSOLUTE'
        dot.x = 2
        dot.y = 16
      }
      add(list, row)
    }
    add(c, head, tabs, list)
  }
  return {
    key: 'component:notification-center',
    name: 'Notification center',
    description:
      'NotificationCenter in packages/ui: a ghost bell button with an unread count (a 16px role/accent pill ringed in the page colour), and its 380px popover (a bottom sheet on touch): a title with Mark all read, All and Unread tabs, then items grouped by day. An item is an avatar (or an icon disc), the line in ink while unread with a role/accent dot in the gutter, the body clamped to two lines, the time, and optional xs actions. In code new items arrive through PresenceList and the dot shrinks away when read.',
    variants: [
      { props: { Part: 'trigger' }, build: trigger },
      { props: { Part: 'panel' }, build: panel },
    ],
    properties: [
      { name: 'Count', type: 'TEXT', default: '2', field: 'characters' },
      { name: 'Title', type: 'TEXT', default: 'Notifications', field: 'characters' },
    ],
    columns: 'Part',
    gap: [48, 16],
  }
}

/* ── Account menu ──────────────────────────────────────────────────────── */

function accountMenuSpec({ icons, get }: Deps): SetSpec {
  const trigger = async (c: ComponentNode) => {
    await style(c, { dir: 'row', radius: 'radius/full' })
    add(c, ref(await initials('LH', 32), 'Show initials'))
  }
  const menu = async (c: ComponentNode) => {
    await style(c, { dir: 'col', w: 256, ...panelLook() })
    const profile = await box({ name: 'Profile', dir: 'row', gap: 'space/2-5', align: 'center', pad: [6, 8, 8, 8], w: 'fill' })
    add(
      profile,
      await initials('LH', 40, 'UI/base/Medium'),
      await box(
        { name: 'Text', dir: 'col', w: 'fill' },
        ref(await text('Lena Hart', 'UI/base/Medium', 'role/fg', { name: 'Name', w: 'fill', truncate: true }), 'Name'),
        ref(await text('lena@youj.dev', 'UI/sm/Regular', 'role/fg-muted', { name: 'Email', w: 'fill', truncate: true }), 'Email'),
      ),
    )
    add(c, profile, await menuSeparator(), await menuLabel('Workspaces'))
    for (const [name, on] of [
      ['Youj', true],
      ['Acme', false],
    ] as const) {
      const row = await box({ name: 'Radio item', dir: 'row', gap: 'space/2', align: 'center', pad: [4, 8], w: 'fill', radius: 'bezel/menu-row-radius' })
      padInline(row, 'space/2')
      row.setBoundVariable('minHeight', themeVar('control/sm'))
      add(row, await logoTile(name.slice(0, 1), 24, 'radius/sm'), await text(name, 'UI/base/Regular', 'role/fg', { name: 'Label', w: 'fill' }))
      if (on) add(row, icon(icons, 'check', 16, 'role/accent'))
      add(c, row)
    }
    add(c, await menuSeparator())
    const theme = await box({ name: 'Sub trigger', dir: 'row', gap: 'space/2', align: 'center', pad: [4, 8], w: 'fill', radius: 'bezel/menu-row-radius' })
    padInline(theme, 'space/2')
    theme.setBoundVariable('minHeight', themeVar('control/sm'))
    add(theme, icon(icons, 'sun', 16, 'role/fg-muted'), await text('Theme', 'UI/base/Regular', 'role/fg', { name: 'Label', w: 'fill' }), await text('Basalt', 'UI/sm/Regular', 'role/fg-muted', { name: 'Preset' }), icon(icons, 'chevron-right', 16, 'role/fg-muted'))
    add(c, theme, await menuSeparator())
    await fillMenu(c, get, icons, [[{ label: 'Sign out', icon: 'log-out' }]])
  }
  return {
    key: 'component:account-menu',
    name: 'Account menu',
    description:
      'AccountMenu in packages/ui: an avatar button that opens a 256px dropdown menu: the profile (a 40px avatar, the name and email), the workspaces as radio rows with small square logos, a Theme sub-menu naming the preset, and Sign out. Rows are the menu’s own (the overlay panel, 5px in).',
    variants: [
      { props: { Part: 'trigger' }, build: trigger },
      { props: { Part: 'menu' }, build: menu },
    ],
    properties: [
      { name: 'Name', type: 'TEXT', default: 'Lena Hart', field: 'characters' },
      { name: 'Email', type: 'TEXT', default: 'lena@youj.dev', field: 'characters' },
      { name: 'Show initials', type: 'BOOLEAN', default: true, field: 'visible' },
    ],
    columns: 'Part',
    gap: [48, 16],
  }
}

/* ── Workspace switcher ────────────────────────────────────────────────── */

function workspaceSwitcherSpec({ icons }: Deps): SetSpec {
  const trigger = async (open: boolean) => {
    const t = await box({ name: 'Trigger', dir: 'row', gap: 'space/2', align: 'center', w: 224, radius: 'radius/md', fill: open ? 'role/hover' : undefined })
    padInline(t, 'space/1-5')
    controlHeight(t, 'control/lg')
    add(
      t,
      await logoTile('Y', 32),
      await box(
        { name: 'Text', dir: 'col', w: 'fill' },
        ref(await text('Youj', 'UI/base/Medium', 'role/fg', { name: 'Name', w: 'fill', truncate: true }), 'Name'),
        ref(await text('Pro · 12 members', 'UI/sm/Regular', 'role/fg-muted', { name: 'Detail', w: 'fill', truncate: true }), 'Detail'),
      ),
      icon(icons, 'chevrons-up-down', 14, 'role/fg-muted'),
    )
    return t
  }
  return {
    key: 'component:workspace-switcher',
    name: 'Workspace switcher',
    description:
      'WorkspaceSwitcher in packages/ui: a large-control trigger (a 32px square logo, the name and a detail line, a 14px up-down chevron) that opens a 256px popover holding Command: a search, the workspaces with their logos and a check on the current one, and Create workspace after a hairline. Compact, the trigger is just the logo.',
    variants: [
      { props: { Open: 'false' }, build: async (c: ComponentNode) => {
        await style(c, { dir: 'col' })
        add(c, await trigger(false))
      } },
      {
        props: { Open: 'true' },
        build: async (c: ComponentNode) => {
          await style(c, { dir: 'col', gap: 'space/1' })
          const pop = await box({ name: 'Popover', dir: 'col', w: 256, ...panelLook({ pad: 0 }), clip: true })
          add(pop, await commandInput(icons, 'Find a workspace…', { property: false }))
          const rows: CommandRowSpec[] = [
            { label: 'Youj', detail: 'Pro · 12 members', lead: await logoTile('Y', 24), checked: true, on: true },
            { label: 'Acme', detail: 'Free', lead: await logoTile('A', 24) },
          ]
          add(pop, await commandList(icons, [{ heading: 'Workspaces', rows }, { rows: [{ label: 'Create workspace', icon: 'plus' }] }]))
          add(c, await trigger(true), pop)
        },
      },
    ],
    properties: [
      { name: 'Name', type: 'TEXT', default: 'Youj', field: 'characters' },
      { name: 'Detail', type: 'TEXT', default: 'Pro · 12 members', field: 'characters' },
    ],
    columns: 'Open',
    gap: [48, 16],
  }
}

/* ── Share dialog ──────────────────────────────────────────────────────── */

/** A Select trigger instance showing a value, at a width. */
function selectValue(get: Deps['get'], chars: string, w: number) {
  const s = instanceOf(get('select'), { Content: 'value', Size: 'default', State: 'rest' })
  setProp(s, 'Value', chars)
  s.resize(w, s.height)
  return s
}

/** A person row (min-h-12): avatar, name over email, the role at the end. */
async function personRow(name: string, email: string, role: SceneNode) {
  const row = await box({ name: 'Person', dir: 'row', gap: 'space/3', align: 'center', pad: [4, 0], w: 'fill' })
  row.minHeight = 48
  add(
    row,
    await initials(name.split(' ').map((p) => p[0]).join(''), 32),
    await box({ name: 'Text', dir: 'col', w: 'fill' }, await text(name, 'UI/base/Medium', 'role/fg', { name: 'Name', w: 'fill', truncate: true }), await text(email, 'UI/sm/Regular', 'role/fg-muted', { name: 'Email', w: 'fill', truncate: true })),
    role,
  )
  return row
}

/** A muted role word at a row's end (px-2). */
const roleWord = async (chars: string) => box({ name: 'Role', dir: 'row', pad: [0, 8] }, await text(chars, 'UI/base/Regular', 'role/fg-muted', { name: 'Role' }))

function shareDialogSpec({ icons, get }: Deps): SetSpec {
  return {
    key: 'component:share-dialog',
    name: 'Share dialog',
    description:
      'ShareDialog in packages/ui, open: a dialog (up to 576px) to share a resource. Invite: a recipient field of chips with a role Select, then a message Input and Send. People: 48px rows of an avatar, the name over the email and their role. General access on a hairline: a 32px role/band tile, the scope and its hint, the link’s role. The footer copies the link (an AsyncButton) and closes with Done. In code people arrive and leave through PresenceList.',
    variants: [
      {
        props: { Content: 'default' },
        build: async (c: ComponentNode) => {
          const recipients = await fieldBox('Recipients', { w: 'fill', gap: 'space/1', px: 'space/1-5' })
          const chip = instance(get, 'badge', { Variant: 'secondary' })
          setLabel(chip, 'Mara Ito')
          add(recipients, chip, await text('Add people…', 'UI/base/Regular', 'role/fg-muted', { name: 'Placeholder', w: 'fill', truncate: true }))
          const invite = await box({ name: 'Invite', dir: 'row', gap: 'space/2', align: 'center', w: 'fill' }, recipients, selectValue(get, 'Can edit', 128))
          const message = instanceOf(get('input'), { State: 'rest', Content: 'placeholder' })
          setProp(message, 'Placeholder', 'Add a message')
          const msgRow = await box({ name: 'Message', dir: 'row', gap: 'space/2', align: 'center', w: 'fill' }, message, button(get, 'Send'))
          message.layoutSizingHorizontal = 'FILL'
          const people = await box({ name: 'People', dir: 'col', gap: 'space/1', w: 'fill' }, await text('People with access', 'UI/base/Medium', 'role/fg', { name: 'Heading' }))
          add(people, await personRow('Lena Hart', 'lena@youj.dev', await roleWord('Owner')), await personRow('Ilan Ross', 'ilan@youj.dev', await roleWord('Can edit')))
          const access = await box({ name: 'General access', dir: 'col', gap: 'space/1', pad: [16, 0, 0, 0], w: 'fill', stroke: 'role/line', sides: { top: 1 } })
          access.strokesIncludedInLayout = true
          const tile = await box({ name: 'Tile', dir: 'row', align: 'center', justify: 'center', w: 32, h: 32, radius: 'radius/lg', fill: 'role/band' }, icon(icons, 'globe', 16, 'role/fg-muted'))
          const scope = await box({ name: 'Scope', dir: 'row', gap: 'space/3', align: 'center', w: 'fill' })
          scope.minHeight = 48
          add(
            scope,
            tile,
            await box({ name: 'Text', dir: 'col', w: 'fill' }, await text('Anyone with the link', 'UI/base/Medium', 'role/fg', { name: 'Label' }), await text('Anyone on the internet with the link can view', 'UI/sm/Regular', 'role/fg-muted', { name: 'Hint', w: 'fill', truncate: true })),
            selectValue(get, 'Can view', 128),
          )
          add(access, await text('General access', 'UI/base/Medium', 'role/fg', { name: 'Heading' }), scope)
          const copy = button(get, 'Copy link', { Variant: 'outline' })
          setProp(copy, 'Leading icon', true)
          setProp(copy, 'Icon', pick(icons, 'link').rest.id)
          await dialogShell(c, {
            w: 576,
            title: 'Share “Launch plan”',
            body: [await box({ name: 'Invite', dir: 'col', gap: 'space/2', w: 'fill' }, invite, msgRow), people, access],
            footerStart: copy,
            footer: [button(get, 'Done')],
            close: await closeButton(icons),
          })
        },
      },
    ],
    properties: [{ name: 'Title', type: 'TEXT', default: 'Share “Launch plan”', field: 'characters' }],
    columns: 'Content',
  }
}

/* ── Export dialog ─────────────────────────────────────────────────────── */

function exportDialogSpec({ get }: Deps): SetSpec {
  /** A list in a well (listClass): rounded-lg, hairlines between 48px rows, 12px in. */
  const list = async (rows: [string, string | null, SceneNode][]) => {
    const l = await box({ name: 'List', dir: 'col', w: 'fill', radius: 'radius/lg', fill: 'role/well', clip: true })
    for (const [i, [name, detail, end]] of rows.entries()) {
      const row = await box({ name: 'Row', dir: 'row', gap: 'space/3', align: 'center', justify: 'between', pad: [0, 12], w: 'fill', stroke: i < rows.length - 1 ? 'role/line-subtle' : undefined, sides: i < rows.length - 1 ? { bottom: 1 } : undefined })
      padInline(row, 'space/3')
      const words = await box({ name: 'Text', dir: 'row', gap: 'space/2', align: 'baseline', w: 'fill' }, await text(name, 'UI/base/Regular', 'role/fg', { name: 'Name' }))
      if (detail) add(words, await text(detail, 'UI/sm/Regular', 'role/fg-muted', { name: 'Detail', w: 'fill', truncate: true }))
      add(row, words, end)
      // min-h-12: a 48px row whatever it ends in (an 18px radio, a control-height Select).
      const pad = Math.max(0, Math.round((48 - Math.max(20, (end as FrameNode).height)) / 2))
      row.paddingTop = pad
      row.paddingBottom = pad
      add(l, row)
    }
    return l
  }
  const radio = (on: boolean) => {
    const r = instanceOf(get('radio'), { Checked: String(on), State: 'rest' })
    setProp(r, 'Show label', false)
    return r
  }
  const heading = (chars: string) => text(chars, 'UI/sm/Medium', 'role/fg-muted', { name: 'Heading' })
  return {
    key: 'component:export-dialog',
    name: 'Export dialog',
    description:
      'ExportDialog in packages/ui, open: what will be exported and how. A summary in the well (the count in ui-lg semibold, the total and the range under it), the period as radio rows in a well list, then the options (format, time zone, columns) as rows with Selects. The footer cancels or exports through an AsyncButton that names the format; the result or the error grows in above it. No close button.',
    variants: [
      {
        props: { Content: 'default' },
        build: async (c: ComponentNode) => {
          const summary = await box({ name: 'Summary', dir: 'col', gap: 'space/0-5', pad: 12, w: 'fill', radius: 'radius/lg', fill: 'role/well' })
          add(summary, ref(await value('1,284 orders', 'UI/lg/Semibold', 'role/fg', 'Count'), 'Count'), await text('4,920 total · Oct 6 – Oct 13', 'UI/sm/Regular', 'role/fg-muted', { name: 'Range' }))
          const period = await box({ name: 'Period', dir: 'col', gap: 'space/2', w: 'fill' }, await heading('Date range'), await list([
            ['Last 7 days', 'Oct 6 – Oct 13', radio(true)],
            ['This month', 'Oct 1 – Oct 13', radio(false)],
            ['Custom', 'Pick the dates', radio(false)],
          ]))
          const options = await box({ name: 'Options', dir: 'col', gap: 'space/2', w: 'fill' }, await heading('Options'), await list([
            ['Format', null, selectValue(get, 'CSV', 112)],
            ['Time zone', null, selectValue(get, 'UTC', 112)],
            ['Columns', null, selectValue(get, 'All 8', 112)],
          ]))
          await dialogShell(c, {
            w: 448,
            title: 'Export orders',
            description: 'A file of the orders in the range you pick.',
            body: [summary, period, options],
            footer: [button(get, 'Cancel', { Variant: 'secondary' }), button(get, 'Export CSV')],
          })
        },
      },
    ],
    properties: [
      { name: 'Title', type: 'TEXT', default: 'Export orders', field: 'characters' },
      { name: 'Description', type: 'TEXT', default: 'A file of the orders in the range you pick.', field: 'characters' },
      { name: 'Count', type: 'TEXT', default: '1,284 orders', field: 'characters' },
    ],
    columns: 'Content',
  }
}

/* ── Session timeout ───────────────────────────────────────────────────── */

function sessionTimeoutSpec({ get }: Deps): SetSpec {
  const warning = async (c: ComponentNode) => {
    const words = await box({ name: 'Body', dir: 'col', gap: 'space/1', w: 'fill' })
    add(
      words,
      ref(await value('You’ll be signed out in 1:42', 'UI/base/Regular', 'role/fg', 'Countdown'), 'Countdown'),
      await text('You’ve been inactive for a while. Stay signed in to keep your work.', 'UI/base/Regular', 'role/fg-muted', { name: 'Reason', w: 'fill' }),
    )
    await dialogShell(c, {
      w: 448,
      title: 'Are you still there?',
      body: [words],
      footer: [button(get, 'Sign out', { Variant: bezel() ? 'secondary' : 'outline' }), button(get, 'Stay signed in')],
    })
  }
  const signedOut = async (c: ComponentNode) => {
    await style(c, { dir: 'col', w: 640, h: 360, fill: 'role/canvas', stroke: 'role/line', clip: true })
    const banner = instanceOf(get('banner'), { Variant: 'warning' })
    setProp(banner, 'Title', 'You’ve been signed out')
    setProp(banner, 'Show action', false)
    const body = await box({ name: 'Content', dir: 'col', gap: 'space/4', pad: [48, 24], w: 448, h: 'fill', justify: 'center' })
    add(
      body,
      await text('You’ve been signed out', 'Heading/xl', 'role/fg', { name: 'Heading' }),
      await text('For your security we signed you out after a period of inactivity. Sign in again to pick up where you left off.', 'UI/base/Regular', 'role/fg-muted', { name: 'Body', w: 'fill' }),
      button(get, 'Sign in again'),
    )
    add(c, banner, await box({ name: 'Page', dir: 'row', justify: 'center', w: 'fill', h: 'fill' }, body))
    banner.layoutSizingHorizontal = 'FILL'
  }
  return {
    key: 'component:session-timeout',
    name: 'Session timeout',
    description:
      'SessionTimeout in packages/ui: after a stretch of inactivity an alert dialog counts down (the countdown in ink, tabular, then the reason) with Sign out and Stay signed in; Escape means stay. When the session ends the app is replaced by SessionSignedOut: a warning Banner over a centred heading, a line and Sign in again. In code the countdown ticks every second and is announced only at a few steps.',
    variants: [
      { props: { Part: 'warning' }, build: warning },
      { props: { Part: 'signed-out' }, build: signedOut },
    ],
    properties: [
      { name: 'Title', type: 'TEXT', default: 'Are you still there?', field: 'characters' },
      { name: 'Countdown', type: 'TEXT', default: 'You’ll be signed out in 1:42', field: 'characters' },
    ],
    columns: 'Part',
    gap: [48, 16],
  }
}

/* ── Tour ──────────────────────────────────────────────────────────────── */

function tourSpec({ get }: Deps): SetSpec {
  const steps = 4
  const build = async (c: ComponentNode, step: number) => {
    await style(c, { dir: 'col', gap: 'space/3', pad: 16, w: 320, radius: 'radius/xl', fill: 'role/overlay', stroke: 'role/line', effect: 'Shadow/md' })
    for (const side of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const) c.setBoundVariable(side, scaleVar('space/4'))
    const head = await box({ name: 'Header', dir: 'row', gap: 'space/2', align: 'center', justify: 'between', w: 'fill' })
    add(head, await value(`${step} of ${steps}`, 'UI/sm/Regular', 'role/fg-subtle', 'Count'), button(get, 'Skip', { Variant: 'ghost', Size: 'xs' }))
    const words = await box({ name: 'Text', dir: 'col', gap: 'space/1-5', w: 'fill' })
    add(
      words,
      head,
      ref(await text('Filter your view', 'UI/lg/Semibold', 'role/fg', { name: 'Title', w: 'fill' }), 'Title'),
      ref(await text('Narrow the list to what matters: pick a status, an owner or a date.', 'UI/base/Regular', 'role/fg-muted', { name: 'Body', w: 'fill' }), 'Body'),
    )
    const dots = await box({ name: 'Dots', dir: 'row', gap: 'space/1', align: 'center' })
    for (let i = 1; i <= steps; i++) add(dots, rect(i === step ? 'Dot active' : 'Dot', i === step ? 16 : 6, 6, i === step ? 'role/accent' : 'role/line-strong', 'radius/full'))
    const nav = await box({ name: 'Buttons', dir: 'row', gap: 'space/2', align: 'center' })
    if (step > 1) add(nav, button(get, 'Back', { Variant: 'outline', Size: 'sm' }))
    add(nav, button(get, step === steps ? 'Done' : 'Next', { Size: 'sm' }))
    add(c, words, await box({ name: 'Footer', dir: 'row', gap: 'space/3', align: 'center', justify: 'between', pad: [4, 0, 0, 0], w: 'fill' }, dots, nav))
  }
  return {
    key: 'component:tour',
    name: 'Tour',
    description:
      'Tour in packages/ui: a guided walk through the UI. Each step is a 320px popover (role/overlay, a hairline, 16px in, Shadow/md) beside its target: the count and Skip, the title and body, then the progress dots (the current one a 16px role/accent pill) and Back and Next (Done on the last). In code a scrim dims the page with a role/accent ring around the target, and the popover moves between targets on the spring.',
    variants: ([1, 2, 4] as const).map((step) => ({ props: { Step: step === 1 ? 'first' : step === steps ? 'last' : 'middle' }, build: (c: ComponentNode) => build(c, step) })),
    properties: [
      { name: 'Title', type: 'TEXT', default: 'Filter your view', field: 'characters' },
      { name: 'Body', type: 'TEXT', default: 'Narrow the list to what matters: pick a status, an owner or a date.', field: 'characters' },
    ],
    columns: 'Step',
    gap: [40, 16],
  }
}

/* ── Radial menu ───────────────────────────────────────────────────────── */

const RADIAL = { radius: 84, slot: 44, hub: 96 }

function radialMenuSpec({ icons }: Deps): SetSpec {
  const items: [string, string][] = [
    ['Copy', 'copy'],
    ['Share', 'share'],
    ['Edit', 'pencil'],
    ['Pin', 'bookmark'],
    ['Download', 'download'],
    ['Delete', 'trash'],
  ]
  return {
    key: 'component:radial-menu',
    name: 'Radial menu',
    description:
      'RadialMenu in packages/ui, open: actions on a ring around the pointer (radius 84), each a 44px round key (role/overlay, a hairline, Shadow/md) on a role/band track, and a hub in the middle naming the highlighted one with a short role/accent arc pointing at it. It opens on a right click, a long press or a key; you flick toward an action. In code the keys fan out on the snappy spring.',
    variants: [
      {
        props: { Content: 'ring' },
        build: async (c: ComponentNode) => {
          const { radius, slot, hub } = RADIAL
          const reach = radius + slot / 2 + 6
          const size = reach * 2
          await style(c, { dir: 'none', w: size, h: size })
          const outer = radius + slot / 2 + 6
          const inner = radius - slot / 2 - 6
          const circle = (r: number) => `M${reach - r},${reach} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z`
          vector(c, `${circle(outer)} ${circle(inner)}`, { fill: solid('role/band'), evenOdd: true }, 'Track')
          const h = await box({ name: 'Hub', dir: 'row', align: 'center', justify: 'center', w: hub, h: hub, radius: 'radius/full', fill: 'role/overlay', stroke: 'role/line', effect: 'Shadow/md' })
          add(h, ref(await text('Copy', 'UI/sm/Medium', 'role/fg', { name: 'Label' }), 'Label'))
          add(c, h)
          h.x = reach - hub / 2
          h.y = reach - hub / 2
          // The arc on the hub's rim toward the highlighted key (top), 36° wide.
          const r = hub / 2 + 2.5
          const a = (deg: number) => [reach + Math.sin((deg * Math.PI) / 180) * r, reach - Math.cos((deg * Math.PI) / 180) * r]
          const [x1, y1] = a(-18)
          const [x2, y2] = a(18)
          vector(c, `M${x1!.toFixed(2)},${y1!.toFixed(2)} A${r},${r} 0 0,1 ${x2!.toFixed(2)},${y2!.toFixed(2)}`, { stroke: solid('role/accent'), strokeWidth: 3 }, 'Pointer')
          for (const [i, [label, ic]] of items.entries()) {
            const deg = (i * 360) / items.length
            const key = await box({ name: label, dir: 'row', align: 'center', justify: 'center', w: slot, h: slot, radius: 'radius/full', fill: i === 0 ? 'role/hover' : 'role/overlay', stroke: 'role/line', effect: 'Shadow/md' })
            add(key, icon(icons, ic, 16, i === 0 ? 'role/fg' : 'role/fg-muted'))
            add(c, key)
            key.x = Math.round(reach + Math.sin((deg * Math.PI) / 180) * radius - slot / 2)
            key.y = Math.round(reach - Math.cos((deg * Math.PI) / 180) * radius - slot / 2)
          }
        },
      },
    ],
    properties: [{ name: 'Label', type: 'TEXT', default: 'Copy', field: 'characters' }],
    columns: 'Content',
  }
}

/* ── Action island ─────────────────────────────────────────────────────── */

function actionIslandSpec({ icons }: Deps): SetSpec {
  const build = async (c: ComponentNode, size: 'default' | 'lg') => {
    const lg = size === 'lg'
    await style(c, { dir: 'row', gap: lg ? 'space/1-5' : 'space/1', align: 'center', pad: lg ? 6 : 4, radius: 'bezel/pill', fill: 'role/chrome-float', stroke: 'role/line', effect: 'Shadow/lg' })
    /** A tile: control/sm high (44 in lg), the control corner, a hairline. */
    const tile = async (p: { icon?: string; label?: string; look: 'quiet' | 'pressed' | 'primary' | 'mark' }) => {
      const look = {
        quiet: { fill: undefined, stroke: 'role/line-subtle', ink: 'role/fg-muted' },
        pressed: { fill: 'role/accent-subtle', stroke: 'role/accent', ink: 'role/accent-text' },
        primary: { fill: 'role/accent', stroke: clear(), ink: 'role/on-accent' },
        mark: { fill: 'role/hover', stroke: undefined, ink: 'role/fg' },
      }[p.look]
      const t = await box({ name: p.look === 'mark' ? 'Mark' : 'Tile', dir: 'row', gap: 'space/1-5', align: 'center', justify: 'center', radius: 'bezel/pill', fill: look.fill, stroke: look.stroke })
      t.strokesIncludedInLayout = true
      padInline(t, p.label ? (p.look === 'mark' ? 'space/2' : 'space/2-5') : lg ? 'space/2-5' : 'space/1-5')
      if (lg) {
        t.layoutSizingVertical = 'FIXED'
        t.setBoundVariable('height', scaleVar('space/11'))
        t.minWidth = 44
      } else {
        controlHeight(t, 'control/sm')
        t.setBoundVariable('minWidth', themeVar('control/sm'))
      }
      if (p.icon) add(t, icon(icons, p.icon, 16, look.ink))
      if (p.label) add(t, await text(p.label, 'UI/sm/Medium', look.ink, { name: 'Label' }))
      return t
    }
    const sep = () => rect('Separator', 1, 16, 'role/line')
    add(
      c,
      await tile({ label: 'Preview', look: 'mark' }),
      sep(),
      await tile({ icon: 'monitor', look: 'pressed' }),
      await tile({ icon: 'layout-grid', look: 'quiet' }),
      await tile({ icon: 'eye', look: 'quiet' }),
      sep(),
      await tile({ icon: 'share', label: 'Publish', look: 'primary' }),
    )
  }
  return {
    key: 'component:action-island',
    name: 'Action island',
    description:
      'ActionIsland in packages/ui: a floating tray of actions over a canvas (role/chrome-float, a hairline, the control corner, Shadow/lg, 4px in). A mark names what it acts on; quiet tiles sit on a role/line-subtle hairline, a pressed one takes a role/accent outline and accent ink; one primary tile is filled with the accent. Tiles are control/sm (44 in lg). In code its width glides as tiles come and go, and presses scale to 0.96.',
    variants: (['default', 'lg'] as const).map((size) => ({ props: { Size: size }, build: (c: ComponentNode) => build(c, size) })),
    properties: [],
    columns: 'Size',
    gap: [48, 16],
  }
}

export const ENTRIES: Entry[] = [
  {
    doc: {
      key: 'component:accordion',
      title: 'Accordion',
      usage: '<Accordion><AccordionItem value="a11y"><AccordionTrigger>Is it accessible?</AccordionTrigger><AccordionContent>…</AccordionContent></AccordionItem></Accordion>',
      tokens: 'Items on role/line hairlines  ·  Trigger UI/base/Medium role/fg, space/3 above and below  ·  Chevron 16 role/fg-muted  ·  Panel UI/base/Regular role/fg-muted, space/4 under',
      file: 'packages/ui/src/components/ui/accordion.tsx',
    },
    spec: accordionSpec,
  },
  {
    doc: {
      key: 'component:collapsible',
      title: 'Collapsible',
      usage: '<Collapsible><CollapsibleTrigger render={<Button variant="ghost" size="icon-sm" />}>…</CollapsibleTrigger><CollapsibleContent>…</CollapsibleContent></Collapsible>',
      tokens: 'Unstyled: the trigger is a ghost icon Button  ·  Rows here role/line, radius/md, Mono/sm  ·  Chevron 16, stroke 1.75',
      file: 'packages/ui/src/components/ui/collapsible.tsx',
    },
    spec: collapsibleSpec,
  },
  {
    doc: {
      key: 'component:hover-card',
      title: 'Hover card',
      usage: '<HoverCard><HoverCardTrigger>@youj</HoverCardTrigger><HoverCardContent>…</HoverCardContent></HoverCard>',
      tokens: 'Fill role/overlay (Bezel: bezel/popover)  ·  Border role/line  ·  Padding space/4  ·  Gap space/3  ·  Radius radius/xl  ·  Shadow/md  ·  Width 288',
      file: 'packages/ui/src/components/ui/hover-card.tsx',
    },
    spec: hoverCardSpec,
  },
  {
    doc: {
      key: 'component:alert-dialog',
      title: 'Alert dialog',
      usage: '<AlertDialog><AlertDialogContent size="sm"><AlertDialogHeader><AlertDialogMedia variant="danger"><TrashIcon /></AlertDialogMedia><AlertDialogTitle>…</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter>…</AlertDialogFooter></AlertDialogContent></AlertDialog>',
      tokens: 'Dialog surface (Bezel: bezel/dialog, radius/2xl; Classic: role/overlay, radius/xl), Shadow/lg  ·  Media 40, radius/lg, role/band or role/danger-subtle  ·  Footer band (bezel/band, role/band) on a role/line hairline  ·  Padding space/5',
      file: 'packages/ui/src/components/ui/alert-dialog.tsx',
    },
    spec: alertDialogSpec,
  },
  {
    doc: {
      key: 'component:sheet',
      title: 'Sheet',
      usage: '<Sheet><SheetContent side="end"><SheetHeader><SheetTitle>…</SheetTitle></SheetHeader><SheetBody>…</SheetBody><SheetFooter>…</SheetFooter></SheetContent></Sheet>',
      tokens: 'Fill role/overlay  ·  Edge role/line toward the page  ·  Shadow/lg  ·  Header on a role/line hairline, space/5 (space/12 at the end)  ·  Footer role/band  ·  Width 384 (side)',
      file: 'packages/ui/src/components/ui/sheet.tsx',
    },
    spec: sheetSpec,
  },
  {
    doc: {
      key: 'component:drawer',
      title: 'Drawer',
      usage: '<Drawer><DrawerContent direction="down"><DrawerHeader><DrawerTitle>…</DrawerTitle></DrawerHeader><DrawerFooter>…</DrawerFooter></DrawerContent></Drawer>',
      tokens: 'Fill role/overlay  ·  Border role/line  ·  Radius radius/2xl on the free edge  ·  Handle 36 × 4 role/well  ·  Header space/4 · space/5 · space/3  ·  Footer actions full width, space/2 apart  ·  Shadow/lg',
      file: 'packages/ui/src/components/ui/drawer.tsx',
    },
    spec: drawerSpec,
  },
  {
    doc: {
      key: 'component:context-menu',
      title: 'Context menu',
      usage: '<ContextMenu><ContextMenuTrigger>…</ContextMenuTrigger><ContextMenuContent><ContextMenuItem>Reload<ContextMenuShortcut>⌘R</ContextMenuShortcut></ContextMenuItem></ContextMenuContent></ContextMenu>',
      tokens: 'Panel role/overlay (Bezel: bezel/popover), role/line, Shadow/md, radius/xl, 5px in  ·  Rows Menu/Item  ·  Highlight role/cursor  ·  Shortcut Mono/sm (Bezel)',
      file: 'packages/ui/src/components/ui/context-menu.tsx',
    },
    spec: contextMenuSpec,
  },
  {
    doc: {
      key: 'component:menubar',
      title: 'Menubar',
      usage: '<Menubar><MenubarMenu><MenubarTrigger>File</MenubarTrigger><MenubarContent>…</MenubarContent></MenubarMenu></Menubar>',
      tokens: 'Bar role/chrome-float, role/line, radius/lg, 2px in, Shadow/xs  ·  Triggers control/sm, UI/base/Medium, space/2-5, radius/md  ·  Open key role/hover  ·  Menu the dropdown panel',
      file: 'packages/ui/src/components/ui/menubar.tsx',
    },
    spec: menubarSpec,
  },
  {
    doc: {
      key: 'component:command',
      title: 'Command',
      usage: '<Command><CommandInput placeholder="Type a command…" /><CommandList><CommandGroup heading="Suggestions"><CommandItem>Calendar</CommandItem></CommandGroup></CommandList></Command>',
      tokens: 'Search row 40 on a role/line hairline, space/3 in  ·  List 6 in  ·  Items control/default, space/2-5 gap, radius/md, selected role/cursor  ·  Headings UI/xs/Caps role/fg-muted  ·  Shortcuts UI/sm muted',
      file: 'packages/ui/src/components/ui/command.tsx',
    },
    spec: commandSpec,
  },
  {
    doc: {
      key: 'component:command-palette',
      title: 'Command palette',
      usage: '<CommandPalette open={open} onOpenChange={setOpen}>{(state) => …}</CommandPalette>',
      tokens: 'Dialog surface, up to 672 wide  ·  Search 52, UI/lg, space/4 in  ·  Rows control/lg, space/3 gap  ·  Trail 36 on a hairline  ·  Footer 40, role/band, Kbd keys, UI/xs muted',
      file: 'packages/ui/src/components/ui/command-palette.tsx',
    },
    spec: commandPaletteSpec,
  },
  {
    doc: {
      key: 'component:navigation-menu',
      title: 'Navigation menu',
      usage: '<NavigationMenu><NavigationMenuList><NavigationMenuItem><NavigationMenuTrigger>Product</NavigationMenuTrigger><NavigationMenuContent>…</NavigationMenuContent></NavigationMenuItem></NavigationMenuList></NavigationMenu>',
      tokens: 'Triggers control/default, space/3, UI/base/Medium role/fg-muted → role/fg  ·  Hover pill role/hover  ·  Popup role/overlay, role/line, radius/xl, Shadow/lg  ·  Links space/2-5 in, radius/lg',
      file: 'packages/ui/src/components/ui/navigation-menu.tsx · navigation-menu.variants.ts',
    },
    spec: navigationMenuSpec,
  },
  {
    doc: {
      key: 'component:mega-menu',
      title: 'Mega menu',
      usage: '<MegaMenu featured={<MegaMenuFeatured title="Youj 0.1 is out" … />}><MegaMenuSection heading="Build"><MegaMenuLink icon={<LayersIcon />} title="Components" … /></MegaMenuSection></MegaMenu>',
      tokens: 'Navigation popup, 8 in  ·  Sections 248 wide, headings UI/xs/Caps  ·  Icon tiles 32, role/surface, role/line, Shadow/xs, radius/md  ·  Featured 240, role/band, caption role/overlay, eyebrow role/accent-text',
      file: 'packages/ui/src/components/ui/mega-menu.tsx',
    },
    spec: megaMenuSpec,
  },
  {
    doc: {
      key: 'component:notification-center',
      title: 'Notification center',
      usage: '<NotificationCenter items={items} onMarkRead={markRead} onMarkAllRead={markAll} />',
      tokens: 'Trigger ghost icon Button, count 16 role/accent ringed role/canvas  ·  Panel 380, the overlay panel  ·  Items radius/lg, space/2-5 in, unread dot 6 role/accent  ·  Title UI/lg/Semibold  ·  Time UI/xs muted',
      file: 'packages/ui/src/components/ui/notification-center.tsx',
    },
    spec: notificationCenterSpec,
  },
  {
    doc: {
      key: 'component:account-menu',
      title: 'Account menu',
      usage: '<AccountMenu user={{ name: "Lena Hart", email: "lena@youj.dev" }} workspaces={workspaces} onSignOut={signOut} />',
      tokens: 'Trigger a 32 avatar  ·  Menu 256, the overlay panel 5 in  ·  Profile avatar 40, UI/base/Medium, UI/sm muted  ·  Workspace logos 24, radius/sm  ·  Rows control/sm, bezel/menu-row-radius',
      file: 'packages/ui/src/components/ui/account-menu.tsx',
    },
    spec: accountMenuSpec,
  },
  {
    doc: {
      key: 'component:workspace-switcher',
      title: 'Workspace switcher',
      usage: '<WorkspaceSwitcher workspaces={workspaces} value={id} onValueChange={setId} onCreate={create} />',
      tokens: 'Trigger control/lg, space/1-5 in, radius/md, open role/hover  ·  Logo 32 (24 in the list), role/accent-subtle with role/accent-text  ·  Popover 256 holding Command  ·  Check role/accent',
      file: 'packages/ui/src/components/ui/workspace-switcher.tsx',
    },
    spec: workspaceSwitcherSpec,
  },
  {
    doc: {
      key: 'component:share-dialog',
      title: 'Share dialog',
      usage: '<ShareDialog resource="Launch plan" people={people} roles={roles} access={access} onInvite={invite} onCopyLink={copy} />',
      tokens: 'Dialog surface, 576 wide  ·  Recipient field (the field well) with Badge chips, role Select 128  ·  People rows 48, avatar 32, UI/base/Medium over UI/sm muted  ·  Access tile 32 role/band, radius/lg, on a role/line hairline',
      file: 'packages/ui/src/components/ui/share-dialog.tsx',
    },
    spec: shareDialogSpec,
  },
  {
    doc: {
      key: 'component:export-dialog',
      title: 'Export dialog',
      usage: '<ExportDialog formats={[{ value: "csv", label: "CSV" }]} onExport={run} total={4920} />',
      tokens: 'Dialog surface, 448 wide, no close  ·  Summary role/well, radius/lg, space/3 in, UI/lg/Semibold  ·  Lists role/well, radius/lg, role/line-subtle between 48 rows  ·  Headings UI/sm/Medium muted  ·  Radio and Select instances',
      file: 'packages/ui/src/components/ui/export-dialog/',
    },
    spec: exportDialogSpec,
  },
  {
    doc: {
      key: 'component:session-timeout',
      title: 'Session timeout',
      usage: '<SessionTimeout idle={15 * 60_000} warning={120_000} onExtend={refresh} onSignOut={signOut}>{app}</SessionTimeout>',
      tokens: 'Warning: the alert dialog, countdown role/fg (mono in Bezel), reason role/fg-muted  ·  Signed out: role/canvas, a warning Banner, Heading/xl, UI/base muted, a Button',
      file: 'packages/ui/src/components/ui/session-timeout.tsx',
    },
    spec: sessionTimeoutSpec,
  },
  {
    doc: {
      key: 'component:tour',
      title: 'Tour',
      usage: '<Tour steps={[{ target: "#filters", title: "Filter your view", body: "…" }]} open={open} onOpenChange={setOpen} />',
      tokens: 'Popover 320, role/overlay, role/line, radius/xl, space/4, Shadow/md  ·  Count UI/sm role/fg-subtle  ·  Title UI/lg/Semibold  ·  Dots 6 role/line-strong, current 16 role/accent  ·  Buttons sm',
      file: 'packages/ui/src/components/ui/tour.tsx',
    },
    spec: tourSpec,
  },
  {
    doc: {
      key: 'component:radial-menu',
      title: 'Radial menu',
      usage: '<RadialMenu items={[{ label: "Copy", icon: <CopyIcon />, onSelect: copy }, …]}><Canvas /></RadialMenu>',
      tokens: 'Ring radius 84  ·  Keys 44, role/overlay, role/line, Shadow/md, highlighted role/hover  ·  Track role/band, 56 wide  ·  Hub 96, UI/sm/Medium  ·  Pointer arc role/accent, 3',
      file: 'packages/ui/src/components/ui/radial-menu.tsx',
    },
    spec: radialMenuSpec,
  },
  {
    doc: {
      key: 'component:action-island',
      title: 'Action island',
      usage: '<ActionIsland><ActionIslandMark>Preview</ActionIslandMark><ActionIslandTile label="Desktop" pressed>…</ActionIslandTile><ActionIslandTile variant="primary" label="Publish" showLabel /></ActionIsland>',
      tokens: 'Tray role/chrome-float, role/line, bezel/pill, Shadow/lg, 4 in (6 lg)  ·  Tiles control/sm (44 lg), quiet role/line-subtle, pressed role/accent on role/accent-subtle, primary role/accent  ·  Mark role/hover  ·  Separators 16 role/line',
      file: 'packages/ui/src/components/ui/action-island.tsx',
    },
    spec: actionIslandSpec,
  },
]
