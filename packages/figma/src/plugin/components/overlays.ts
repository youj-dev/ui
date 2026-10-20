import { add, bezel, box, context, rect, style, text, type Ink } from '../draw'
import type { IconBuild } from '../icons'
import { iconInstance } from './button'
import { setLabel } from './panels'
import { instanceOf, ref, type SetSpec, type VariantSpec } from './set'

/* The floating surfaces, drawn open and static: Popover, the menu row and
 * an open Dropdown menu, Dialog and Toast. Their entrances (the pop, the
 * dialog's rise, the toast's slide and swipe) are motion and live in code. */

export const SOURCES = [
  {
    file: 'packages/ui/src/components/ui/popover.tsx',
    classes: [
      "'yj-pop flex w-72 max-w-(--available-width) flex-col gap-[calc(var(--spacing)*(3_-_0.5*var(--ui--compact,0)))] rounded-overlay border border-line bg-overlay p-[calc(var(--spacing)*(4_-_var(--ui--compact,0)))] text-fg'",
      "'text-ui text-fg shadow-md outline-none'",
      "cn('text-ui-lg font-semibold tracking-tight text-fg', className)",
      "cn('text-ui text-fg-muted', className)",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/dropdown-menu.tsx',
    classes: [
      'className="rounded-[max(0px,calc(var(--radius-overlay)-var(--spacing)))] bg-cursor"',
      "'rounded-overlay border border-line bg-overlay p-1 text-fg shadow-md outline-none'",
      "min-w-[max(var(--anchor-width),var(--spacing)*44)]",
      "'group/menu-item relative flex min-h-control-sm w-full cursor-default items-center gap-2 rounded-[max(0px,calc(var(--radius-overlay)-var(--spacing)))] px-2 py-1 text-ui outline-none select-none'",
      "'[&>svg]:text-fg-muted data-highlighted:[&>svg]:text-fg'",
      "'data-[variant=danger]:text-danger-text data-[variant=danger]:[&>svg]:text-danger-text'",
      'data-[variant=danger]:data-highlighted:[background:linear-gradient(var(--color-danger-subtle),var(--color-danger-subtle)),linear-gradient(var(--color-hover),var(--color-hover)),var(--color-overlay)]',
      "'px-2 pt-2 pb-1 text-ui-xs font-medium tracking-wide text-fg-muted uppercase select-none data-inset:ps-8'",
      "cn('pointer-events-none -mx-1 my-1 h-px bg-line', className)",
      "'ms-auto ps-4 font-sans text-ui-sm tracking-wider text-fg-muted group-data-highlighted/menu-item:text-fg-muted touch:hidden'",
      'className="yj-fade pointer-events-none absolute end-2 flex size-4 items-center justify-center text-accent"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/dialog.tsx',
    classes: [
      "'yj-dialog relative m-auto flex w-full max-w-md flex-col gap-[calc(var(--spacing)*(4_-_var(--ui--compact,0)))] outline-none'",
      "'rounded-overlay border border-line bg-overlay p-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))] text-ui text-fg shadow-lg'",
      'render={<Button variant="ghost" size="icon-sm" className={closeButtonClass} />}',
      "const closeButtonClass = 'absolute end-3 top-3 touch:after:absolute touch:after:-inset-1'",
      "cn('flex flex-col gap-1.5 pe-8', className)",
      "cn('mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-2', sheetFooterClass, className)",
      "cn('text-base leading-6 font-semibold tracking-tight text-fg', className)",
      "'text-ui text-fg-muted *:[a]:text-fg",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/toast.tsx',
    classes: [
      "'rounded-xl border border-line bg-overlay text-fg shadow-lg select-none'",
      "'yj-toast-content flex gap-3 overflow-hidden pe-2.5'",
      "'items-start py-3 ps-3.5'",
      'className="flex min-w-0 flex-1 flex-col gap-0.5 py-0.5"',
      'className="flex items-start gap-1.5 text-ui font-medium text-fg',
      "cn('text-ui-sm text-fg-muted', hasIcon(item) && !hasMedia(item) && 'ps-5.5')",
      'render={<Button size="xs" variant="secondary" className="shrink-0" />}',
      'render={<Button size="icon-xs" variant="ghost" className="shrink-0" />}',
      "const iconProps = { trigger: 'mount', size: 16, strokeWidth: 2 } as const",
      '<CheckCircleIcon {...iconProps} className="text-success" />',
      '<CircleXIcon {...iconProps} className="text-danger" />',
      '<AlertTriangleIcon {...iconProps} className="text-warning" />',
      '<InfoIcon {...iconProps} className="text-fg-muted" />',
      "'fixed z-100 w-88 max-w-[calc(100vw_-_var(--spacing)*8)] outline-none'",
    ],
  },
]

const scaleVar = (name: string) => context().vars.get('scale', name)
const themeVar = (name: string) => context().vars.get('theme', name)
const pick = (icons: Map<string, IconBuild>, ...names: string[]) => names.map((n) => icons.get(n)).find(Boolean) ?? [...icons.values()][0]!

/** Sets an instance's component property by name, whatever its #id. */
function setProp(instance: InstanceNode, name: string, value: string | boolean) {
  const key = Object.keys(instance.componentProperties).find((k) => k.split('#')[0] === name)
  if (key) instance.setProperties({ [key]: value })
}

/** A square ghost icon button (Button size icon-xs / icon-sm), drawn in place: the close control on dialogs and toasts. */
async function closeButton(x: ComponentNode, size: 'xs' | 'sm') {
  const b = figma.createFrame()
  // Bezel: a dialog's corner button is a recessed disc.
  const disc = bezel() && size === 'sm'
  await style(b, { name: 'Close', dir: 'row', align: 'center', justify: 'center', radius: 'bezel/pill', fill: disc ? 'role/well' : undefined })
  const token = size === 'xs' ? 'control/xs' : 'control/sm'
  b.layoutSizingHorizontal = 'FIXED'
  b.layoutSizingVertical = 'FIXED'
  b.setBoundVariable('width', themeVar(token))
  b.setBoundVariable('height', themeVar(token))
  add(b, iconInstance(x, size === 'xs' ? 14 : 16, disc ? 'role/fg-muted' : 'role/fg-muted'))
  return b
}

/* ── Popover ────────────────────────────────────────────────────────────── */

export function popoverSpec(input: ComponentSetNode): SetSpec {
  return {
    key: 'component:popover',
    name: 'Popover',
    description:
      'PopoverContent in packages/ui: a 288px role/overlay surface with a hairline, 16px padding and Shadow/md; PopoverTitle and PopoverDescription on top. In code it pops from its trigger on the snappy spring (a fade under reduced motion).',
    variants: (['text', 'field'] as const).map((content) => ({
      props: { Content: content },
      build: async (c: ComponentNode) => {
        const bz = bezel()
        await style(c, { dir: 'col', gap: 'space/3', pad: 16, w: 288, radius: 'radius/xl', fill: bz ? 'bezel/popover' : 'role/overlay', stroke: 'role/line', effect: 'Shadow/md' })
        // Bezel pads 18px (spacing × 4.5), between the tokens.
        for (const side of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const) {
          c.setBoundVariable(side, bz ? null : scaleVar('space/4'))
          if (bz) c[side] = 18
        }
        const head = figma.createFrame()
        await style(head, { name: 'Header', dir: 'col', gap: 'space/1', w: 'fill' })
        add(
          head,
          ref(await text('Share preview', 'UI/lg/Semibold', 'role/fg', { name: 'Title', w: 'fill' }), 'Title'),
          ref(await text('Anyone with the link can view this deployment.', 'UI/base/Regular', 'role/fg-muted', { name: 'Description', w: 'fill' }), 'Description'),
        )
        add(c, head)
        if (content === 'field') {
          const field = instanceOf(input, { State: 'rest', Content: 'value' })
          add(c, field)
          field.isExposedInstance = true
          field.layoutSizingHorizontal = 'FILL'
        }
      },
    })),
    properties: [
      { name: 'Title', type: 'TEXT', default: 'Share preview', field: 'characters' },
      { name: 'Description', type: 'TEXT', default: 'Anyone with the link can view this deployment.', field: 'characters' },
    ],
    columns: 'Content',
    gap: [40, 16],
  }
}

/* ── Menu row and Dropdown menu ─────────────────────────────────────────── */

const MENU_W = 216

async function drawMenuItem(c: ComponentNode, variant: 'default' | 'danger', state: 'rest' | 'highlighted' | 'disabled', icon: ComponentNode, check: ComponentNode) {
  const on = state === 'highlighted'
  const danger = variant === 'danger'
  const ink = danger ? 'role/danger-text' : 'role/fg'
  await style(c, {
    dir: 'row',
    gap: 'space/2',
    align: 'center',
    pad: [4, 8],
    w: MENU_W,
    radius: 'bezel/menu-row-radius',
    fill: on ? (danger ? 'role/danger-subtle' : 'role/cursor') : undefined,
    opacity: state === 'disabled' ? 0.5 : undefined,
  })
  c.setBoundVariable('paddingLeft', scaleVar('space/2'))
  c.setBoundVariable('paddingRight', scaleVar('space/2'))
  c.setBoundVariable('minHeight', themeVar('control/sm'))
  const leading = iconInstance(icon, 16, danger ? 'role/danger-text' : on ? 'role/fg' : 'role/fg-muted')
  leading.visible = false
  const shortcut = await text('⌘K', bezel() ? 'Mono/sm' : 'UI/sm/Regular', on ? ['role/fg', 0.7] : 'role/fg-muted', { name: 'Shortcut' })
  shortcut.visible = false
  const tick = iconInstance(check, 16, 'role/accent')
  tick.name = 'Check'
  tick.visible = false
  add(
    c,
    ref(leading, 'Icon', 'Show icon'),
    ref(await text('Settings', 'UI/base/Regular', ink, { name: 'Label', w: 'fill', truncate: true }), 'Label'),
    ref(shortcut, 'Shortcut', 'Show shortcut'),
    ref(tick, 'Checked'),
  )
}

export function menuItemSpec(icons: Map<string, IconBuild>): SetSpec {
  const settings = pick(icons, 'settings')
  const check = pick(icons, 'check').rest
  const variants: VariantSpec[] = []
  for (const variant of ['default', 'danger'] as const)
    for (const state of ['rest', 'highlighted', 'disabled'] as const) variants.push({ props: { Variant: variant, State: state }, build: (c) => drawMenuItem(c, variant, state, settings.rest, check) })
  const preferred = ['settings', 'user', 'copy', 'trash', 'log-out', 'plus', 'search', 'bell', 'folder', 'file']
    .map((n) => icons.get(n))
    .filter((b): b is IconBuild => !!b)
    .map((b) => ({ type: b.node.type === 'COMPONENT_SET' ? ('COMPONENT_SET' as const) : ('COMPONENT' as const), key: b.node.key }))
  return {
    key: 'component:menu-item',
    name: 'Menu/Item',
    description:
      'DropdownMenuItem in packages/ui (the row Select, Context menu and Menubar share). Highlighted is the role/hover key, which in code slides between rows and lingers; the leading icon turns from muted to ink with it. Destructive rows are danger-ink with a destructive/10 wash. Checked shows the checkbox item’s tick.',
    variants,
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Settings', field: 'characters' },
      { name: 'Show icon', type: 'BOOLEAN', default: false, field: 'visible' },
      { name: 'Icon', type: 'INSTANCE_SWAP', default: settings.rest.id, preferred, field: 'mainComponent' },
      { name: 'Shortcut', type: 'TEXT', default: '⌘K', field: 'characters' },
      { name: 'Show shortcut', type: 'BOOLEAN', default: false, field: 'visible' },
      { name: 'Checked', type: 'BOOLEAN', default: false, field: 'visible' },
    ],
    columns: 'State',
  }
}

interface Row {
  label: string
  icon?: string
  shortcut?: string
  checked?: boolean
  state?: 'rest' | 'highlighted'
  destructive?: boolean
}

export function dropdownMenuSpec(item: ComponentSetNode, icons: Map<string, IconBuild>): SetSpec {
  const menus: Record<'actions' | 'options', { label: string; groups: Row[][] }> = {
    actions: {
      label: 'My account',
      groups: [
        [
          { label: 'Profile', icon: 'user', shortcut: '⇧⌘P' },
          { label: 'Settings', icon: 'settings', shortcut: '⌘,', state: 'highlighted' },
          { label: 'Invite people', icon: 'user-plus' },
        ],
        [{ label: 'Log out', icon: 'log-out', destructive: true }],
      ],
    },
    options: {
      label: 'View',
      groups: [[{ label: 'Show sidebar', checked: true }, { label: 'Show status bar', checked: true, state: 'highlighted' }, { label: 'Compact rows' }]],
    },
  }
  return {
    key: 'component:dropdown-menu',
    name: 'Dropdown menu',
    description:
      'DropdownMenuContent in packages/ui, open: a role/overlay panel with a hairline, 4px padding and Shadow/md, holding a label, Menu/Item rows and separators. The rows are exposed instances. In code the panel pops from its trigger on the snappy spring.',
    variants: (['actions', 'options'] as const).map((content) => ({
      props: { Content: content },
      build: async (c: ComponentNode) => {
        const menu = menus[content]
        // Both looks: the overlay corner (radius-xl). Bezel: 5px in, a step lifted in dark, and the label a mono capital.
        const bz = bezel()
        await style(c, { dir: 'col', pad: 4, radius: 'radius/xl', fill: bz ? 'bezel/popover' : 'role/overlay', stroke: 'role/line', effect: 'Shadow/md' })
        for (const side of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const) {
          c.setBoundVariable(side, bz ? null : scaleVar('space/1'))
          if (bz) c[side] = 5
        }
        const label = await box({ name: 'Label', dir: 'row', pad: [8, 8, 4, 8], w: 'fill' }, await text(menu.label, bz ? 'Bezel/Eyebrow' : 'UI/xs/Caps', 'role/fg-muted', { name: 'Label' }))
        add(c, label)
        for (const [g, group] of menu.groups.entries()) {
          if (g > 0) {
            const sep = await box({ name: 'Separator', dir: 'col', pad: [4, 0], w: 'fill' }, rect('Line', MENU_W, 1, 'role/line'))
            add(c, sep)
          }
          for (const row of group) {
            const inst = instanceOf(item, { Variant: row.destructive ? 'danger' : 'default', State: row.state ?? 'rest' })
            add(c, inst)
            inst.isExposedInstance = true
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
          }
        }
      },
    })),
    properties: [],
    columns: 'Content',
    gap: [48, 16],
  }
}

/* ── Dialog ─────────────────────────────────────────────────────────────── */

/** Bezel's dialog (bezel.css): a larger radius; a head on a hairline, padded 20 with room for the close disc; a footer band of actions on a hairline. */
async function drawBezelDialog(c: ComponentNode, footer: boolean, button: ComponentSetNode, x: ComponentNode) {
  await style(c, { dir: 'col', gap: 0, pad: 0, w: 448, radius: 'radius/2xl', fill: 'bezel/dialog', stroke: 'role/line', effect: 'Shadow/lg', clip: true })
  const head = await box({ name: 'Header', dir: 'col', gap: 'space/1-5', pad: [20, 56, 20, 20], w: 'fill', stroke: 'role/line', sides: footer ? { bottom: 1 } : {} })
  head.strokesIncludedInLayout = true
  for (const side of ['paddingTop', 'paddingBottom', 'paddingLeft'] as const) head.setBoundVariable(side, scaleVar('space/5'))
  head.setBoundVariable('paddingRight', scaleVar('space/14'))
  add(
    head,
    ref(await text('Delete this project?', 'Bezel/Title', 'role/fg', { name: 'Title', w: 'fill' }), 'Title'),
    ref(await text('youj-docs and its 48 deployments will be removed. This can’t be undone.', 'UI/base/Regular', 'role/fg-muted', { name: 'Description', w: 'fill' }), 'Description'),
  )
  add(c, head)
  if (footer) {
    const f = await box({ name: 'Footer', dir: 'row', gap: 'space/2', align: 'center', justify: 'end', pad: [14, 20], w: 'fill', fill: 'bezel/band', stroke: 'role/line', sides: { top: 1 } })
    f.strokesIncludedInLayout = true
    f.setBoundVariable('paddingTop', scaleVar('space/3-5'))
    f.setBoundVariable('paddingBottom', scaleVar('space/3-5'))
    f.setBoundVariable('paddingLeft', scaleVar('space/5'))
    f.setBoundVariable('paddingRight', scaleVar('space/5'))
    const cancel = instanceOf(button, { Variant: 'secondary', Size: 'default', State: 'rest' })
    const confirm = instanceOf(button, { Variant: 'danger', Size: 'default', State: 'rest' })
    add(f, cancel, confirm)
    setLabel(cancel, 'Cancel')
    setLabel(confirm, 'Delete project')
    add(c, f)
    for (const i of [cancel, confirm]) i.isExposedInstance = true
  }
  const close = await closeButton(x, 'sm')
  add(c, close)
  close.layoutPositioning = 'ABSOLUTE'
  close.x = 448 - 16 - close.width
  close.y = 16
  close.constraints = { horizontal: 'MAX', vertical: 'MIN' }
}

export function dialogSpec(button: ComponentSetNode, icons: Map<string, IconBuild>): SetSpec {
  const x = pick(icons, 'x').rest
  return {
    key: 'component:dialog',
    name: 'Dialog',
    description:
      'DialogContent in packages/ui: up to 448px wide, a role/overlay surface with a hairline, 20px padding and Shadow/lg; the header, then the footer’s actions at the end (stacked, primary first, on narrow screens). The close button is a ghost icon button at the top end. The title is text-base semibold in code; UI/lg/Semibold stands in. In code it rises in on the smooth spring over a scrim.',
    variants: [true, false].map((footer) => ({
      props: { Footer: String(footer) },
      build: async (c: ComponentNode) => {
        if (bezel()) return drawBezelDialog(c, footer, button, x)
        await style(c, { dir: 'col', gap: 'space/4', pad: 20, w: 448, radius: 'radius/xl', fill: 'role/overlay', stroke: 'role/line', effect: 'Shadow/lg' })
        for (const side of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const) c.setBoundVariable(side, scaleVar('space/5'))
        const head = figma.createFrame()
        await style(head, { name: 'Header', dir: 'col', gap: 'space/1-5', pad: [0, 32, 0, 0], w: 'fill' })
        head.setBoundVariable('paddingRight', scaleVar('space/8'))
        add(
          head,
          ref(await text('Delete this project?', 'UI/lg/Semibold', 'role/fg', { name: 'Title', w: 'fill' }), 'Title'),
          ref(await text('youj-docs and its 48 deployments will be removed. This can’t be undone.', 'UI/base/Regular', 'role/fg-muted', { name: 'Description', w: 'fill' }), 'Description'),
        )
        add(c, head)
        if (footer) {
          const f = await box({ name: 'Footer', dir: 'row', gap: 'space/2', align: 'center', justify: 'end', pad: [4, 0, 0, 0], w: 'fill' })
          const cancel = instanceOf(button, { Variant: 'outline', Size: 'default', State: 'rest' })
          const confirm = instanceOf(button, { Variant: 'danger', Size: 'default', State: 'rest' })
          add(f, cancel, confirm)
          setLabel(cancel, 'Cancel')
          setLabel(confirm, 'Delete project')
          add(c, f)
          for (const i of [cancel, confirm]) i.isExposedInstance = true
        }
        const close = await closeButton(x, 'sm')
        add(c, close)
        close.layoutPositioning = 'ABSOLUTE'
        close.x = 448 - 12 - close.width
        close.y = 12
        close.constraints = { horizontal: 'MAX', vertical: 'MIN' }
      },
    })),
    properties: [
      { name: 'Title', type: 'TEXT', default: 'Delete this project?', field: 'characters' },
      { name: 'Description', type: 'TEXT', default: 'youj-docs and its 48 deployments will be removed. This can’t be undone.', field: 'characters' },
    ],
    columns: 'Footer',
    gap: [48, 16],
  }
}

/* ── Toast ──────────────────────────────────────────────────────────────── */

// One Title and one Description property across the set, so every type shows the same copy.
const TOAST_TITLE = 'Event created'
const TOAST_BODY = 'Sunday, October 5 at 9:00. We’ll remind you the day before.'

const TOAST: Record<string, { icon?: string; tone?: Ink }> = {
  default: {},
  success: { icon: 'check-circle', tone: 'role/success' },
  error: { icon: 'circle-x', tone: 'role/danger' },
  warning: { icon: 'alert-triangle', tone: 'role/warning' },
  info: { icon: 'info', tone: 'role/fg-muted' },
}

export function toastSpec(button: ComponentSetNode, icons: Map<string, IconBuild>): SetSpec {
  const x = pick(icons, 'x').rest
  return {
    key: 'component:toast',
    name: 'Toast',
    description:
      'Toast in packages/ui: a 352px role/overlay card with a hairline and Shadow/lg; the type’s icon beside a medium title, the description indented to the title, then an action (Button xs secondary) and a close. In code toasts slide in from their corner and stack, swipe to dismiss, and the icon plays once.',
    variants: Object.keys(TOAST).map((type) => ({
      props: { Type: type },
      build: async (c: ComponentNode) => {
        const t = TOAST[type]!
        await style(c, { dir: 'row', gap: 'space/3', align: 'start', pad: [12, 10, 12, 14], w: 352, radius: 'radius/xl', fill: 'role/overlay', stroke: 'role/line', effect: 'Shadow/lg', clip: true })
        c.setBoundVariable('paddingLeft', scaleVar('space/3-5'))
        c.setBoundVariable('paddingRight', scaleVar('space/2-5'))
        c.setBoundVariable('paddingTop', scaleVar('space/3'))
        c.setBoundVariable('paddingBottom', scaleVar('space/3'))
        const body = await box({ name: 'Content', dir: 'col', gap: 'space/0-5', pad: [2, 0], w: 'fill' })
        const title = await box({ name: 'Title', dir: 'row', gap: 'space/1-5', align: 'start', w: 'fill' })
        const icon = t.icon ? icons.get(t.icon) : undefined
        if (icon) add(title, await box({ name: 'Icon', dir: 'row', pad: [2, 0, 0, 0] }, iconInstance(icon.rest, 16, t.tone as string)))
        add(title, ref(await text(TOAST_TITLE, 'UI/base/Medium', 'role/fg', { name: 'Title', w: 'fill' }), 'Title'))
        const description = await box({ name: 'Description', dir: 'col', pad: [0, 0, 0, icon ? 22 : 0], w: 'fill' }, ref(await text(TOAST_BODY, 'UI/sm/Regular', 'role/fg-muted', { name: 'Text', w: 'fill' }), 'Description'))
        add(body, title, description)
        const action = instanceOf(button, { Variant: 'secondary', Size: 'xs', State: 'rest' })
        const close = await closeButton(x, 'xs')
        add(c, body, action, close)
        setLabel(action, 'Undo')
        action.isExposedInstance = true
        ref(action, 'Show action')
      },
    })),
    properties: [
      { name: 'Title', type: 'TEXT', default: TOAST_TITLE, field: 'characters' },
      { name: 'Description', type: 'TEXT', default: TOAST_BODY, field: 'characters' },
      { name: 'Show action', type: 'BOOLEAN', default: true, field: 'visible' },
    ],
    columns: 'Type',
    gap: [32, 24],
  }
}
