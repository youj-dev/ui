import { add, bezel, box, context, rect, solid, style, text, vector, type Ink } from '../draw'
import type { IconBuild } from '../icons'
import {
  controlHeight,
  controlSquare,
  field,
  fieldBox,
  icon,
  padInline,
  panelLook,
  themeVar,
  type Deps,
  type Entry,
  type FieldState,
  type Source,
} from './parts'
import { instanceOf, ref, type SetSpec, type VariantSpec } from './set'

/* Catalog batch: pickers. The choosers that open something (a calendar, a
 * list, a wheel, a colour) and the fields that pick a file, a currency or a
 * signature, each from its file in packages/ui/src/components/ui. Pickers are
 * drawn closed and, where the popup is the component's own, open. Motion lives
 * in code. */

export const SOURCES: Source[] = [
  {
    file: 'packages/ui/src/components/ui/calendar.tsx',
    classes: [
      "month_caption: 'flex h-control items-center justify-center px-9 touch:h-11 touch:px-12'",
      "weekday: 'h-7 w-control p-0 text-center text-ui-xs font-normal text-fg-muted touch:w-11'",
      "range_start: 'rounded-s-md bg-accent-subtle'",
      "'data-selected-single:bg-accent data-selected-single:text-on-accent data-selected-single:yj-solid-hover'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/date-picker.tsx',
    classes: [
      'data-slot="date-picker" className={cn(\'has-data-popup-open:border-focus\', className)}',
      "render={<InputGroupButton size=\"icon-xs\" aria-label={labels.chooseDate} className={cn('text-fg-muted', touchHitClass)} />}",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/date-range-picker.tsx',
    classes: [
      "className={cn(inputClass, 'w-[calc(11.5ch_+_var(--spacing)*4)] flex-none pe-1')}",
      "'w-0 min-w-full flex-wrap border-b p-2 md:w-36 md:min-w-0 md:flex-col md:flex-nowrap md:border-e md:border-b-0'",
      '<SlidingIndicator match=\'[aria-pressed="true"]\' className="rounded-md bg-hover" />',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/time-picker.tsx',
    classes: [
      "'h-6 w-[calc(2ch_+_var(--spacing)*2)] flex-none rounded-sm px-1 text-center tabular-nums caret-transparent'",
      "className={cn('w-fit min-w-36 cursor-text', className)}",
      '<ClockIcon size={16} strokeWidth={1.75} aria-hidden />',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/combobox.tsx',
    classes: [
      "'flex h-control cursor-default items-center gap-2 ps-2.5 pe-2 text-start select-none'",
      "cn('max-h-(--available-height) w-(--anchor-width) min-w-56 gap-0 overflow-hidden p-0', contentClassName)",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/command.tsx',
    classes: [
      "'flex h-10 shrink-0 items-center gap-2 border-b border-line px-3'",
      "'group/command-item relative flex min-h-control cursor-default items-center gap-2.5 rounded-md px-2 text-ui outline-none select-none'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/multi-select.tsx',
    classes: [
      "const chipClass = 'max-w-40 min-w-0 shrink gap-1 ps-2 pe-1 text-fg focus-ring-within'",
      "className={cn('relative cursor-default gap-0 rounded-field-area has-data-popup-open:border-focus', className)}",
      '<Badge variant="outline" className="px-1.5 text-fg tabular-nums">',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/tag-input.tsx',
    classes: [
      'className="h-auto min-h-control rounded-field-area cursor-text py-1 ps-1.5 pe-1.5 data-invalid:border-danger"',
      "'max-w-full min-w-0 gap-1 ps-2 pe-1 text-fg focus-ring-within'",
      'className="pt-1.5 text-ui-sm font-medium text-danger"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/wheel-picker.tsx',
    classes: [
      "sm: 'var(--spacing-control-sm)',",
      'className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-(--ui--wheel-row) -translate-y-1/2 rounded-control bg-selected"',
      "'text-fg data-selected:font-medium data-disabled:text-fg-muted'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/scrub-number-field.tsx',
    classes: ["'min-w-6 cursor-ew-resize touch-none ps-2 pe-0 text-ui-sm font-medium'", 'className="pe-2.5 ps-0"'],
  },
  {
    file: 'packages/ui/src/components/ui/color-opacity-field.tsx',
    classes: ["className={cn('flex w-full min-w-0 items-center gap-1.5', className)}", 'className="ps-1.5 font-mono text-ui-sm uppercase"', 'className="w-24 shrink-0"'],
  },
  {
    file: 'packages/ui/src/components/ui/color-picker.tsx',
    classes: [
      "[fieldControlClass, 'inline-flex h-control w-40 items-center gap-2 ps-1.5 pe-2 text-start data-popup-open:border-focus']",
      "className={sheet ? 'gap-4' : 'w-72 gap-3 p-3'}",
      'className="grid size-7 place-items-center rounded-md focus-ring touch:size-11"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/gradient-slider.tsx',
    classes: [
      "spectrum: ['var(--color-chart-5)', 'var(--color-chart-3)', 'var(--color-chart-2)'],",
      "'group/thumb isolate grid h-7.5 w-(--gs-thumb) place-items-center rounded-full select-none focus-ring-within data-disabled:pointer-events-none'",
      "major ? 'h-2 bg-fg-subtle' : 'h-1 bg-line-strong'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/file-upload.tsx',
    classes: [
      "'group/dropzone relative flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-control text-center'",
      "'data-dragging:border-accent data-dragging:bg-accent-subtle'",
      "className={cn('relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-md bg-band text-fg-muted', className)}",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/avatar-upload.tsx',
    classes: [
      "'data-dragging:outline-2 data-dragging:outline-offset-2 data-dragging:outline-accent data-dragging:outline-dashed'",
      '<AvatarFallback className="text-ui-lg">{fallback}</AvatarFallback>',
      '<Button variant="outline" size="sm" disabled={disabled} onClick={() => input.current?.click()}>',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/signature-pad.tsx',
    classes: [
      "'[--signature-inset:--spacing(5)]',",
      "'border border-line-control bg-surface text-fg shadow-xs'",
      "'pointer-events-none absolute inset-x-(--signature-inset) bottom-[24%] border-b'",
      'aspectRatio = 3,',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/currency-swap.tsx',
    classes: [
      "const panel = 'flex flex-col gap-1.5 rounded-lg border border-transparent bg-well px-4 py-3.5'",
      "className={cn('flex w-full max-w-sm flex-col gap-3 rounded-xl border border-line bg-surface p-2 text-fg', className)}",
      'className="pointer-events-auto bg-surface ring-4 ring-surface"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/multi-language-input/multi-language-input.tsx',
    classes: [
      'className="cursor-default border-b border-line px-1.5 pt-1.5 pb-1.5"',
      'className="relative h-1 w-8 overflow-hidden rounded-full bg-well"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/multi-language-input/multi-language-input-status.tsx',
    classes: ['<path d="M6 1.5a4.5 4.5 0 0 0 0 9z" className="origin-center fill-warning rtl:-scale-x-100" />'],
  },
]

/* ── Shared pieces ──────────────────────────────────────────────────────── */

const clear = (): SolidPaint => ({ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 })

/** The field's own start padding: px-2.5 in Classic, Bezel's 12px. */
const fieldStart = () => (bezel() ? 'space/3' : 'space/2-5')

/** InputGroupButton size icon-xs: a ghost square at the xs control height with a 16px icon. */
async function groupButton(icons: Map<string, IconBuild>, name: string) {
  const b = await box({ name: 'Button', dir: 'row', align: 'center', justify: 'center', radius: 'bezel/field-radius' })
  controlSquare(b, 'control/xs')
  add(b, icon(icons, name, 16, 'role/fg-muted'))
  return b
}

/** An input group (date, time and the multi-value fields): the field look, the text from its start, an addon at its end. */
async function group(name: string, state: FieldState, w: number | 'hug') {
  const g = await fieldBox(name, { state, w, gap: 'space/1' })
  padInline(g, fieldStart(), 'space/1-5')
  return g
}

/** A removable chip (Badge variant secondary with BadgeRemove): ps-2 pe-1, the label in fg, a 12px x at 60%. */
async function chip(icons: Map<string, IconBuild>, label: string) {
  const bz = bezel()
  const c = await box({ name: 'Chip', dir: 'row', align: 'center', gap: 'space/1', pad: [0, 4, 0, 8], h: bz ? 22 : 20, radius: 'bezel/badge-radius', fill: bz ? 'role/control' : 'role/hover' })
  const x = await box({ name: 'Remove', dir: 'row', align: 'center', justify: 'center', w: 16, h: 16, radius: 'radius/full', opacity: 0.6 }, icon(icons, 'x', 12, 'role/fg'))
  add(c, await text(label, 'UI/sm/Medium', 'role/fg', { name: 'Label' }), x)
  return c
}

/** The command list inside a picker's panel: the search row over a hairline, then rows with the cursor key on one. */
async function commandPanel(icons: Map<string, IconBuild>, query: string, rows: { label: string; checked?: boolean; on?: boolean }[], w: number | 'fill', heading?: string) {
  const panel = await box({ name: 'Popup', dir: 'col', w, ...panelLook({ pad: 0 }), clip: true })
  const search = await box({ name: 'Search', dir: 'row', align: 'center', gap: 'space/2', h: 40, w: 'fill', stroke: 'role/line', sides: { bottom: 1 } })
  padInline(search, 'space/3')
  search.strokesIncludedInLayout = true
  add(search, icon(icons, 'search', 16, 'role/fg-muted'), await text(query, 'UI/base/Regular', 'role/fg-muted', { name: 'Query', w: 'fill' }))
  const list = await box({ name: 'List', dir: 'col', pad: 6, w: 'fill' })
  if (heading) {
    const h = await box({ name: 'Heading', dir: 'row', pad: [8, 8, 4, 8], w: 'fill' }, await text(heading, bezel() ? 'Bezel/Eyebrow' : 'UI/xs/Caps', 'role/fg-muted', { name: 'Heading' }))
    add(list, h)
  }
  for (const r of rows) {
    const row = await box({ name: 'Item', dir: 'row', align: 'center', gap: 'space/2-5', w: 'fill', radius: 'radius/md', fill: r.on ? 'role/cursor' : undefined })
    padInline(row, 'space/2')
    controlHeight(row)
    add(row, await text(r.label, 'UI/base/Regular', 'role/fg', { name: 'Label', w: 'fill', truncate: true }))
    if (r.checked) add(row, icon(icons, 'check', 16, 'role/accent'))
    add(list, row)
  }
  add(panel, search, list)
  return panel
}

/** A field over its open popup, 4px apart, as the popup sits under its trigger. */
const opened = async (c: ComponentNode, trigger: SceneNode, popup: SceneNode) => {
  await style(c, { dir: 'col', gap: 'space/1' })
  add(c, trigger, popup)
}

/* ── Calendar ───────────────────────────────────────────────────────────── */

type CalMode = 'single' | 'range'
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/** A day: a ghost icon button (control/default square, the button corner), selected in the accent, today with a dot. */
async function dayCell(n: number, p: { outside?: boolean; selected?: boolean; today?: boolean; band?: 'start' | 'middle' | 'end'; weekStart?: boolean; weekEnd?: boolean }) {
  const cell = await box({ name: `Day ${n}`, dir: 'row', align: 'center', justify: 'center', radius: 'bezel/pill', fill: p.selected ? 'role/accent' : undefined })
  controlSquare(cell)
  const ink: Ink = p.selected ? 'role/on-accent' : p.outside ? 'role/fg-muted' : 'role/fg'
  add(cell, await text(String(n), 'UI/base/Regular', ink, { name: 'Date' }))
  if (p.today) {
    const dot = await box({ name: 'Today', w: 4, h: 4, radius: 'radius/full', fill: p.selected ? 'role/on-accent' : 'role/accent' })
    add(cell, dot)
    dot.layoutPositioning = 'ABSOLUTE'
    dot.x = Math.round(cell.width / 2 - 2)
    dot.y = cell.height - 8
  }
  if (!p.band) return cell
  // The range band sits on the cells (accent-subtle), rounded off at the range's ends.
  const band = await box({ name: 'Band', dir: 'row', fill: 'role/accent-subtle' }, cell)
  const r = themeVar('radius/md')
  if (p.band === 'start' || p.weekStart) for (const k of ['topLeftRadius', 'bottomLeftRadius'] as const) band.setBoundVariable(k, r)
  if (p.band === 'end' || p.weekEnd) for (const k of ['topRightRadius', 'bottomRightRadius'] as const) band.setBoundVariable(k, r)
  return band
}

async function drawCalendar(c: ComponentNode | FrameNode, mode: CalMode, icons: Map<string, IconBuild>) {
  await style(c, { dir: 'col', gap: 'space/1-5' })
  // The caption: the month between the two ghost arrows (Button icon-sm).
  const arrow = async (name: string) => {
    const b = await box({ name: 'Nav', dir: 'row', align: 'center', justify: 'center', radius: 'bezel/pill' }, icon(icons, name, 16, 'role/fg-muted'))
    controlSquare(b, 'control/sm')
    return b
  }
  const caption = await box({ name: 'Caption', dir: 'row', align: 'center', justify: 'between', w: 'fill' })
  caption.layoutSizingVertical = 'FIXED'
  caption.setBoundVariable('height', themeVar('control/default'))
  add(caption, await arrow('chevron-left'), ref(await text('October 2026', 'UI/base/Medium', 'role/fg', { name: 'Month' }), 'Month'), await arrow('chevron-right'))
  const grid = await box({ name: 'Grid', dir: 'col', gap: 'space/0-5' })
  const head = await box({ name: 'Weekdays', dir: 'row' })
  for (const d of WEEKDAYS) {
    const w = await box({ name: d, dir: 'row', align: 'center', justify: 'center', h: 28 }, await text(d, 'UI/xs/Regular', 'role/fg-muted', { name: 'Weekday' }))
    w.layoutSizingHorizontal = 'FIXED'
    w.setBoundVariable('width', themeVar('control/default'))
    add(head, w)
  }
  add(grid, head)
  // October 2026 starts on a Thursday; fixed weeks show six, outside days muted. Today is the 13th.
  const days: { n: number; outside: boolean }[] = []
  for (const n of [27, 28, 29, 30]) days.push({ n, outside: true })
  for (let n = 1; n <= 31; n++) days.push({ n, outside: false })
  for (let n = 1; days.length < 42; n++) days.push({ n, outside: true })
  for (let w = 0; w < 6; w++) {
    const week = await box({ name: 'Week', dir: 'row' })
    for (const [i, d] of days.slice(w * 7, w * 7 + 7).entries()) {
      const inMonth = !d.outside
      const range = mode === 'range' && inMonth && d.n >= 14 && d.n <= 20
      const band = range ? (d.n === 14 ? 'start' : d.n === 20 ? 'end' : 'middle') : undefined
      add(
        week,
        await dayCell(d.n, {
          outside: d.outside,
          today: inMonth && d.n === 13,
          selected: inMonth && (mode === 'single' ? d.n === 16 : d.n === 14 || d.n === 20),
          band: band as 'start' | 'middle' | 'end' | undefined,
          // The band rounds off at each week's edges too.
          weekStart: i === 0,
          weekEnd: i === 6,
        }),
      )
    }
    add(grid, week)
  }
  add(c, caption, grid)
}

function calendarSpec({ icons }: Deps): SetSpec {
  return {
    key: 'component:calendar',
    name: 'Calendar',
    description:
      'Calendar in packages/ui (react-day-picker): the month between two ghost arrows, weekdays in muted ui-xs, six fixed weeks of ghost day buttons as tall as a control, outside days muted. Today carries an accent dot; a selected day is the accent; a range runs an accent-subtle band across the week, its ends in the accent. In code the weeks slide by direction when the month changes.',
    variants: (['single', 'range'] as const).map((mode) => ({ props: { Mode: mode }, build: (c: ComponentNode) => drawCalendar(c, mode, icons) })),
    properties: [{ name: 'Month', type: 'TEXT', default: 'October 2026', field: 'characters' }],
    columns: 'Mode',
    gap: [48, 16],
  }
}

/* ── Date picker and Date range picker ─────────────────────────────────── */

async function drawDatePicker(c: ComponentNode, state: 'rest' | 'open' | 'invalid', get: Deps['get'], icons: Map<string, IconBuild>) {
  const g = await group('Field', state === 'open' ? 'open' : state, 240)
  add(g, ref(await text('10/16/2026', 'UI/base/Regular', 'role/fg', { name: 'Value', w: 'fill' }), 'Value'), await groupButton(icons, 'calendar'))
  if (state !== 'open') {
    await style(c, { dir: 'col' })
    add(c, g)
    return
  }
  const popup = await box({ name: 'Popup', dir: 'col', ...panelLook({ pad: 12 }) })
  const cal = instanceOf(get('calendar'), { Mode: 'single' })
  add(popup, cal)
  await opened(c, g, popup)
}

function datePickerSpec({ icons, get }: Deps): SetSpec {
  return {
    key: 'component:date-picker',
    name: 'Date picker',
    description:
      'DatePicker in packages/ui: a typed date in an input group with a calendar button at its end; open, the field keeps the focus edge and the Calendar pops under it in a 12px-padded overlay panel. Typing a complete date selects it; an unreadable one marks the field invalid on blur.',
    variants: (['rest', 'invalid', 'open'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawDatePicker(c, state, get, icons) })),
    properties: [{ name: 'Value', type: 'TEXT', default: '10/16/2026', field: 'characters' }],
    columns: 'State',
    gap: [40, 16],
  }
}

async function drawDateRangePicker(c: ComponentNode, state: 'rest' | 'open', get: Deps['get'], icons: Map<string, IconBuild>) {
  const g = await group('Field', state === 'open' ? 'open' : 'rest', 'hug')
  const start = await box({ name: 'Start', dir: 'row', pad: [0, 4, 0, 0] }, ref(await text('10/14/2026', 'UI/base/Regular', 'role/fg', { name: 'Start' }), 'Start'))
  const end = await box({ name: 'End', dir: 'row', pad: [0, 8, 0, 6] }, ref(await text('10/20/2026', 'UI/base/Regular', 'role/fg', { name: 'End' }), 'End'))
  add(g, start, await text('–', 'UI/base/Regular', 'role/fg-muted', { name: 'Dash' }), end, await groupButton(icons, 'calendar'))
  if (state !== 'open') {
    await style(c, { dir: 'col' })
    add(c, g)
    return
  }
  const popup = await box({ name: 'Popup', dir: 'row', ...panelLook({ pad: 0 }), clip: true })
  // The presets: a column of ghost sm buttons, the pressed one on the sliding hover key.
  const presets = await box({ name: 'Presets', dir: 'col', gap: 'space/0-5', pad: 8, w: 144, h: 'fill', stroke: 'role/line', sides: { right: 1 } })
  presets.strokesIncludedInLayout = true
  for (const [label, on] of [['Today', false], ['Last 7 days', true], ['Last 30 days', false], ['This month', false], ['Last month', false]] as const) {
    const b = await box({ name: 'Preset', dir: 'row', align: 'center', w: 'fill', radius: 'radius/md', fill: on ? 'role/hover' : undefined })
    padInline(b, 'space/2-5')
    b.layoutSizingVertical = 'FIXED'
    b.setBoundVariable('height', themeVar('control/sm'))
    add(b, await text(label, 'UI/base/Regular', on ? 'role/fg' : 'role/fg-muted', { name: 'Label' }))
    add(presets, b)
  }
  const month = await box({ name: 'Month', dir: 'col', pad: 12 }, instanceOf(get('calendar'), { Mode: 'range' }))
  add(popup, presets, month)
  await opened(c, g, popup)
}

function dateRangePickerSpec({ icons, get }: Deps): SetSpec {
  return {
    key: 'component:date-range-picker',
    name: 'Date range picker',
    description:
      'DateRangePicker in packages/ui: two typed dates and a dash in one input group, the calendar button at its end. Open, presets sit in a column beside the Calendar in range mode (a row above it on phones; two months on wide screens, one drawn here); the pressed preset is on the sliding hover key.',
    variants: (['rest', 'open'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawDateRangePicker(c, state, get, icons) })),
    properties: [
      { name: 'Start', type: 'TEXT', default: '10/14/2026', field: 'characters' },
      { name: 'End', type: 'TEXT', default: '10/20/2026', field: 'characters' },
    ],
    columns: 'State',
    gap: [40, 16],
  }
}

/* ── Time picker ────────────────────────────────────────────────────────── */

async function drawTimePicker(c: ComponentNode, state: 'rest' | 'focus' | 'empty' | 'disabled', icons: Map<string, IconBuild>) {
  await field(c, { state: state === 'focus' ? 'focus' : state === 'disabled' ? 'disabled' : 'rest', w: 'hug', gap: 'space/1' })
  padInline(c, 'space/1-5', 'space/2-5')
  c.minWidth = 144
  const seg = async (chars: string, name: string, focused = false) => {
    const s = await box({ name, dir: 'row', align: 'center', justify: 'center', pad: [0, 4], h: 24, radius: 'radius/sm', fill: focused ? 'role/accent-subtle' : undefined })
    add(s, await text(chars, 'UI/base/Regular', state === 'empty' ? 'role/fg-muted' : 'role/fg', { name, align: 'CENTER' }))
    return s
  }
  const empty = state === 'empty'
  const segs = await box({ name: 'Segments', dir: 'row', align: 'center', w: 'fill' })
  add(
    segs,
    await seg(empty ? '--' : '09', 'Hours', state === 'focus'),
    await text(':', 'UI/base/Regular', 'role/fg-muted', { name: 'Colon' }),
    await seg(empty ? '--' : '30', 'Minutes'),
    await box({ name: 'Gap', w: 4, h: 1 }),
    await seg(empty ? '--' : 'AM', 'Period'),
  )
  add(c, segs, icon(icons, 'clock', 16, 'role/fg-muted'))
}

function timePickerSpec({ icons }: Deps): SetSpec {
  return {
    key: 'component:time-picker',
    name: 'Time picker',
    description:
      'TimePicker in packages/ui: hours, minutes and (in a 12-hour locale) the period as spinbutton segments in an input group, a clock at the end. The focused segment takes an accent-subtle key; arrows and typing step it. At least 144 wide.',
    variants: (['rest', 'focus', 'empty', 'disabled'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawTimePicker(c, state, icons) })),
    properties: [],
    columns: 'State',
    gap: [32, 16],
  }
}

/* ── Combobox ───────────────────────────────────────────────────────────── */

async function comboTrigger(state: FieldState, chars: string, placeholder: boolean, icons: Map<string, IconBuild>) {
  const t = await fieldBox('Trigger', { state, w: 240 })
  padInline(t, fieldStart(), 'space/2')
  add(t, ref(await text(chars, 'UI/base/Regular', placeholder ? 'role/fg-muted' : 'role/fg', { name: 'Value', w: 'fill', truncate: true }), 'Value'), icon(icons, 'chevron-down', 16, 'role/fg-muted'))
  return t
}

async function drawCombobox(c: ComponentNode, state: 'rest' | 'placeholder' | 'open', icons: Map<string, IconBuild>) {
  const trigger = await comboTrigger(state === 'open' ? 'open' : 'rest', state === 'placeholder' ? 'Select a framework…' : 'Next.js', state === 'placeholder', icons)
  if (state !== 'open') {
    await style(c, { dir: 'col' })
    add(c, trigger)
    return
  }
  const popup = await commandPanel(icons, 'Search frameworks…', [{ label: 'Next.js', checked: true, on: true }, { label: 'Remix' }, { label: 'Astro' }, { label: 'SvelteKit' }], 240)
  await opened(c, trigger, popup)
}

function comboboxSpec({ icons }: Deps): SetSpec {
  return {
    key: 'component:combobox',
    name: 'Combobox',
    description:
      'Combobox in packages/ui: a select-like trigger (the field well, its chevron) that opens a searchable Command list as wide as itself: a search row over a hairline, then options with the cursor key on the active one and an accent check on the chosen. In code the list eases between heights and the key slides between rows.',
    variants: (['rest', 'placeholder', 'open'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawCombobox(c, state, icons) })),
    properties: [{ name: 'Value', type: 'TEXT', default: 'Next.js', field: 'characters' }],
    columns: 'State',
    gap: [40, 16],
  }
}

/* ── Multi select ───────────────────────────────────────────────────────── */

async function drawMultiSelect(c: ComponentNode, state: 'empty' | 'chosen' | 'open', icons: Map<string, IconBuild>) {
  const t = await fieldBox('Trigger', { state: state === 'open' ? 'open' : 'rest', w: 320, gap: 'space/1' })
  t.setBoundVariable('topLeftRadius', themeVar('bezel/field-area-radius'))
  for (const k of ['topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'] as const) t.setBoundVariable(k, themeVar('bezel/field-area-radius'))
  padInline(t, state === 'empty' ? fieldStart() : 'space/1-5', 'space/2')
  if (state === 'empty') add(t, ref(await text('Select labels…', 'UI/base/Regular', 'role/fg-muted', { name: 'Placeholder', w: 'fill', truncate: true }), 'Placeholder'))
  else {
    const chips = await box({ name: 'Chips', dir: 'row', align: 'center', gap: 'space/1', w: 'fill' })
    add(chips, await chip(icons, 'Design'), await chip(icons, 'Research'))
    const more = await box({ name: 'Overflow', dir: 'row', align: 'center', pad: [0, 6], h: bezel() ? 22 : 20, radius: 'bezel/badge-radius', stroke: bezel() ? 'role/line-strong' : 'role/line' }, await text('+2', 'UI/sm/Medium', 'role/fg', { name: 'Count' }))
    add(chips, more)
    add(t, chips)
  }
  add(t, icon(icons, 'chevron-down', 16, 'role/fg-muted'))
  if (state !== 'open') {
    await style(c, { dir: 'col' })
    add(c, t)
    return
  }
  const popup = await commandPanel(icons, 'Search labels…', [{ label: 'Design', checked: true, on: true }, { label: 'Research', checked: true }, { label: 'Engineering', checked: true }, { label: 'Marketing', checked: true }, { label: 'Sales' }], 320)
  await opened(c, t, popup)
}

function multiSelectSpec({ icons }: Deps): SetSpec {
  return {
    key: 'component:multi-select',
    name: 'Multi select',
    description:
      'MultiSelect in packages/ui: the chosen options as removable secondary chips in the field (the multi-line corner), an outline “+N” for the ones that don’t fit, and a chevron; open, a searchable list with an accent check on each chosen row. Chips enter and leave through PresenceList in code.',
    variants: (['empty', 'chosen', 'open'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawMultiSelect(c, state, icons) })),
    properties: [{ name: 'Placeholder', type: 'TEXT', default: 'Select labels…', field: 'characters' }],
    columns: 'State',
    gap: [40, 16],
  }
}

/* ── Tag input ──────────────────────────────────────────────────────────── */

async function drawTagInput(c: ComponentNode, state: 'rest' | 'focus' | 'invalid', icons: Map<string, IconBuild>) {
  await style(c, { dir: 'col', w: 360 })
  const frame = await box({ name: 'Frame', dir: 'row', align: 'center', pad: [4, 6], w: 'fill', ...fieldLookArea(state) })
  frame.strokesIncludedInLayout = true
  frame.setBoundVariable('minHeight', themeVar('control/default'))
  const chips = await box({ name: 'Chips', dir: 'row', align: 'center', gap: 'space/1', wrap: 4, w: 'fill' })
  for (const t of ['react', 'design-system', 'figma']) add(chips, await chip(icons, t))
  const input = await box({ name: 'Input', dir: 'row', align: 'center', pad: [0, 4], h: 24, w: 80 }, ref(await text('Add a tag…', 'UI/base/Regular', 'role/fg-muted', { name: 'Placeholder' }), 'Placeholder'))
  add(chips, input)
  add(frame, chips)
  add(c, frame)
  if (state === 'invalid') add(c, await box({ name: 'Error', dir: 'row', pad: [6, 0, 0, 0] }, await text('“figma” is already a tag', 'UI/sm/Medium', 'role/danger', { name: 'Error' })))
}

/** The field look with the multi-line corner. */
const fieldLookArea = (state: FieldState) => {
  const bz = bezel()
  return bz
    ? { fill: 'role/field' as Ink, stroke: state === 'focus' ? ('role/focus' as Ink) : state === 'invalid' ? ('role/danger' as Ink) : clear(), effect: state === 'focus' ? 'Focus/field' : undefined, radius: 'bezel/field-area-radius' }
    : { stroke: (state === 'focus' ? 'role/focus' : state === 'invalid' ? 'role/danger' : 'role/line-control') as Ink, effect: state === 'focus' ? 'Focus/field' : undefined, radius: 'bezel/field-area-radius' }
}

function tagInputSpec({ icons }: Deps): SetSpec {
  return {
    key: 'component:tag-input',
    name: 'Tag input',
    description:
      'TagInput in packages/ui: tags as removable secondary chips that wrap inside the field (the multi-line corner, at least a control tall), with the typing field after them. Enter or a comma adds; a duplicate flashes its chip in the warning tint and the reason grows in under the field.',
    variants: (['rest', 'focus', 'invalid'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawTagInput(c, state, icons) })),
    properties: [{ name: 'Placeholder', type: 'TEXT', default: 'Add a tag…', field: 'characters' }],
    columns: 'State',
    gap: [32, 16],
  }
}

/* ── Wheel picker ───────────────────────────────────────────────────────── */

type WheelSize = 'sm' | 'default' | 'lg'
const WHEEL: Record<WheelSize, { row: string; px: number; text: string; on: string }> = {
  sm: { row: 'control/sm', px: 28, text: 'UI/sm/Regular', on: 'UI/sm/Medium' },
  default: { row: 'control/default', px: 32, text: 'UI/base/Regular', on: 'UI/base/Medium' },
  lg: { row: 'control/lg', px: 40, text: 'UI/lg/Regular', on: 'UI/lg/Medium' },
}
const WHEEL_COLUMNS = [
  { name: 'Hours', rows: ['07', '08', '09', '10', '11'], w: 48 },
  { name: 'Minutes', rows: ['28', '29', '30', '31', '32'], w: 48 },
  { name: 'Period', rows: ['', '', 'AM', 'PM', ''], w: 52 },
]

async function drawWheelPicker(c: ComponentNode, size: WheelSize) {
  const s = WHEEL[size]
  await style(c, { dir: 'col', pad: [0, 4] })
  // Five rows of the drum, flattened: the rows 20° and 40° off the band are foreshortened (cos) and fade (cos²), as the 3D drum shows them.
  const fore = [0.77, 0.94, 1, 0.94, 0.77]
  for (let r = 0; r < 5; r++) {
    const band = r === 2
    const row = await box({ name: band ? 'Band' : 'Row', dir: 'row', gap: 'space/1', align: 'center', radius: band ? 'bezel/pill' : undefined, fill: band ? 'role/selected' : undefined })
    row.layoutSizingVertical = 'FIXED'
    if (band) row.setBoundVariable('height', themeVar(s.row))
    else row.resize(Math.max(1, row.width), Math.round(s.px * fore[r]!))
    for (const col of WHEEL_COLUMNS) {
      const cell = await box({ name: col.name, dir: 'row', align: 'center', justify: 'center', w: col.w })
      const chars = col.rows[r]!
      if (chars) {
        const t = await text(chars, band ? s.on : s.text, 'role/fg', { name: 'Label' })
        t.opacity = band ? 1 : Math.round(fore[r]! * fore[r]! * 100) / 100
        add(cell, t)
      }
      add(row, cell)
      cell.layoutSizingVertical = 'FILL'
    }
    add(c, row)
  }
}

function wheelPickerSpec(): SetSpec {
  return {
    key: 'component:wheel-picker',
    name: 'Wheel picker',
    description:
      'WheelPicker in packages/ui: a drum of values in one or more columns (hours, minutes, period here), the chosen row of each in one role/selected band across the middle at the control height, the rows above and below curving away and fading. Drawn flat at rest: the rows off the band are foreshortened and faded as the 3D drum shows them. Drag, flick momentum, the spring back past an end and the ticking live in code.',
    variants: (['default', 'sm', 'lg'] as const).map((size) => ({ props: { Size: size }, build: (c: ComponentNode) => drawWheelPicker(c, size) })),
    properties: [],
    columns: 'Size',
    gap: [40, 16],
  }
}

/* ── Scrub number field and Color opacity field ─────────────────────────── */

async function drawScrub(c: ComponentNode | FrameNode, size: 'default' | 'sm', state: 'rest' | 'scrubbing' | 'focus' | 'disabled', icons: Map<string, IconBuild>, w = 112) {
  await field(c, { state: state === 'focus' ? 'focus' : state === 'disabled' ? 'disabled' : 'rest', w, height: size === 'sm' ? 'control/sm' : 'control/default', gap: 'space/1-5' })
  padInline(c, 'space/2', 'space/2-5')
  const handle = await box({ name: 'Handle', dir: 'row', align: 'center' }, icon(icons, 'droplet', 14, state === 'scrubbing' ? 'role/fg' : 'role/fg-muted'))
  handle.minWidth = 24
  add(c, handle, ref(await text('80', 'UI/base/Regular', 'role/fg', { name: 'Value', w: 'fill' }), 'Value'), ref(await text('%', 'UI/sm/Regular', 'role/fg-muted', { name: 'Unit' }), 'Unit'))
}

function scrubSpec({ icons }: Deps): SetSpec {
  const variants: VariantSpec[] = []
  for (const state of ['rest', 'scrubbing', 'focus', 'disabled'] as const)
    for (const size of ['default', 'sm'] as const) variants.push({ props: { Size: size, State: state }, build: (c) => drawScrub(c, size, state, icons) })
  return {
    key: 'component:scrub-number-field',
    name: 'Scrub number field',
    description:
      'ScrubNumberField in packages/ui: a number in an input group with a scrub handle at its start (an icon or a letter; drag it sideways to change the value, the cursor ew-resize) and the unit at its end. The handle turns fg while scrubbing. Arrows step, Shift steps by ten; typed values commit on Enter or blur.',
    variants,
    properties: [
      { name: 'Value', type: 'TEXT', default: '80', field: 'characters' },
      { name: 'Unit', type: 'TEXT', default: '%', field: 'characters' },
    ],
    columns: 'Size',
  }
}

/** A colour swatch: a 20px chip in the colour, with a 12% fg inset edge. */
async function swatch(ink: Ink, px = 20) {
  return box({ name: 'Swatch', w: px, h: px, radius: 'radius/sm', fill: ink, stroke: ['role/fg', 0.12] })
}

async function drawColorOpacity(c: ComponentNode, size: 'default' | 'sm', state: 'rest' | 'invalid' | 'disabled', get: Deps['get']) {
  await style(c, { dir: 'row', align: 'center', gap: 'space/1-5', w: 280, opacity: state === 'disabled' ? 0.5 : undefined })
  const g = await fieldBox('Colour', { state: state === 'invalid' ? 'invalid' : 'rest', w: 'fill', height: size === 'sm' ? 'control/sm' : 'control/default', gap: 'space/1-5' })
  padInline(g, 'space/1-5', fieldStart())
  // ColorPicker swatchOnly: the swatch centred in a small control square.
  const trigger = await box({ name: 'Swatch trigger', dir: 'row', align: 'center', justify: 'center', radius: 'radius/sm' }, await swatch('role/accent'))
  controlSquare(trigger, size === 'sm' ? 'control/xs' : 'control/sm')
  add(g, trigger, ref(await text('3B5BFF', 'Mono/sm', 'role/fg', { name: 'Hex', w: 'fill' }), 'Hex'))
  const scrub = instanceOf(get('scrub-number-field'), { Size: size, State: 'rest' })
  add(c, g, scrub)
}

function colorOpacitySpec({ get }: Deps): SetSpec {
  const variants: VariantSpec[] = []
  for (const state of ['rest', 'invalid', 'disabled'] as const)
    for (const size of ['default', 'sm'] as const) variants.push({ props: { Size: size, State: state }, build: (c) => drawColorOpacity(c, size, state, get) })
  return {
    key: 'component:color-opacity-field',
    name: 'Color opacity field',
    description:
      'ColorOpacityField in packages/ui: a colour as a swatch (a swatch-only ColorPicker that opens the full picker) and its hex in mono in one input group, then the opacity as a 96px Scrub number field with a droplet handle. A pasted hex with alpha fills both. The swatch shows the accent here; it shows the value in code.',
    variants,
    properties: [{ name: 'Hex', type: 'TEXT', default: '3B5BFF', field: 'characters' }],
    columns: 'Size',
  }
}

/* ── Color picker ───────────────────────────────────────────────────────── */

async function drawColorPicker(c: ComponentNode, state: 'rest' | 'open', icons: Map<string, IconBuild>) {
  const t = await fieldBox('Trigger', { state: state === 'open' ? 'open' : 'rest', w: 160 })
  padInline(t, 'space/1-5', 'space/2')
  add(t, await swatch('role/accent'), ref(await text('#3B5BFF', 'Mono/sm', 'role/fg', { name: 'Hex', w: 'fill' }), 'Hex'), icon(icons, 'chevron-down', 14, 'role/fg-muted'))
  if (state !== 'open') {
    await style(c, { dir: 'col' })
    add(c, t)
    return
  }
  const panel = await box({ name: 'Popup', dir: 'col', gap: 'space/3', w: 288, ...panelLook({ pad: 12 }) })
  // The saturation and brightness area: a gradient over the hue in code; drawn as the picked colour, with its ringed thumb.
  const area = await box({ name: 'Area', dir: 'none', w: 264, h: 144, radius: 'radius/md', fill: 'role/accent', stroke: ['role/fg', 0.1] })
  const thumb = await box({ name: 'Thumb', w: 16, h: 16, radius: 'radius/full', fill: 'role/accent', stroke: 'role/on-accent', strokeWidth: 2, effect: 'Shadow/md' })
  add(area, thumb)
  thumb.x = 190
  thumb.y = 30
  // The hue rail: a spectrum in code; a 10px rail here, its thumb ringed.
  const hue = await box({ name: 'Hue', dir: 'none', w: 264, h: 16 })
  const rail = await box({ name: 'Rail', w: 264, h: 10, radius: 'radius/full', fill: 'role/well', stroke: ['role/fg', 0.1] })
  const knob = await box({ name: 'Knob', w: 16, h: 16, radius: 'radius/full', fill: 'role/accent', stroke: 'role/on-accent', strokeWidth: 2, effect: 'Shadow/sm' })
  add(hue, rail, knob)
  rail.y = 3
  knob.x = 168
  const channel = async (label: string, chars: string) => {
    const g = await fieldBox(label, { w: 'fill', height: 'control/sm', gap: 'space/1-5' })
    padInline(g, 'space/2', 'space/2-5')
    const l = await box({ name: 'Label', dir: 'row', w: 56 }, await text(label, 'UI/xs/Medium', 'role/fg-muted', { name: 'Label' }))
    add(g, l, await text(chars, 'Mono/sm', 'role/fg', { name: 'Value', w: 'fill' }))
    return g
  }
  const fields = await box({ name: 'Fields', dir: 'col', gap: 'space/1-5', w: 'fill' }, await channel('HEX', '3B5BFF'), await channel('OKLCH', '0.553 0.241 266.4'))
  const swatches = await box({ name: 'Swatches', dir: 'row', gap: 'space/1-5', wrap: 6, w: 'fill' })
  const inks: Ink[] = ['role/accent', 'role/chart-1', 'role/chart-2', 'role/chart-3', 'role/chart-4', 'role/chart-5', 'role/success', 'role/warning', 'role/danger']
  for (let i = 0; i < inks.length; i++) {
    const s = await box({ name: 'Swatch button', dir: 'row', align: 'center', justify: 'center', w: 28, h: 28, radius: 'radius/md', stroke: i === 0 ? 'role/fg' : undefined, strokeWidth: 2 }, await swatch(inks[i]!))
    add(swatches, s)
  }
  add(panel, area, hue, fields, swatches)
  await opened(c, t, panel)
}

function colorPickerSpec({ icons }: Deps): SetSpec {
  return {
    key: 'component:color-picker',
    name: 'Color picker',
    description:
      'ColorPicker in packages/ui: a 160px field trigger with the colour’s swatch, its hex in mono and a chevron; open, a 288px panel with the saturation and brightness area, the hue rail, HEX and OKLCH fields and the swatches (the pressed one ringed in fg). The area and the rail are gradients in code; Figma can’t bind gradient stops to variables, so they’re drawn in the picked colour (the accent here) with their thumbs. swatchOnly draws just the swatch.',
    variants: (['rest', 'open'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawColorPicker(c, state, icons) })),
    properties: [{ name: 'Hex', type: 'TEXT', default: '#3B5BFF', field: 'characters' }],
    columns: 'State',
    gap: [40, 16],
  }
}

/* ── Gradient slider ────────────────────────────────────────────────────── */

type GsTone = 'spectrum' | 'accent' | 'status'
/** The tone's stops as layered Color variables: the accent's faint stops are the accent over the surface. */
const GS_STOPS: Record<GsTone, [string, number][][]> = {
  spectrum: [[['role/chart-5', 1]], [['role/chart-3', 1]], [['role/chart-2', 1]]],
  accent: [[['role/surface', 1], ['role/accent', 0.18]], [['role/surface', 1], ['role/accent', 0.58]], [['role/accent', 1]]],
  status: [[['role/success', 1]], [['role/warning', 1]], [['role/danger', 1]]],
}

/** A gradient through token stops, drawn as fine bands: each band a stop with the next laid over it at the band's share. */
async function gradientBands(parent: FrameNode, tone: GsTone, w: number, h: number, until = 1, opacity = 1) {
  const stops = GS_STOPS[tone]
  const N = 48
  const edge = (i: number) => Math.round((i * w) / N)
  // One layer, faded as a whole, so the bands don't stack where they meet.
  const layer = await box({ name: opacity < 1 ? 'Track' : 'Fill', dir: 'none', w, h, opacity })
  for (let i = 0; i < Math.round(N * until); i++) {
    const at = ((i + 0.5) / N) * (stops.length - 1)
    const k = Math.min(stops.length - 2, Math.floor(at))
    const f = Math.round((at - k) * 100) / 100
    const r = figma.createRectangle()
    r.name = 'Band'
    r.resize(edge(i + 1) - edge(i), h)
    r.fills = [...stops[k]!.map((ink) => solid(ink)), ...stops[k + 1]!.map(([name, o]) => solid([name, Math.round(o * f * 100) / 100]))]
    add(layer, r)
    r.x = edge(i)
    r.y = 0
  }
  add(parent, layer)
}

async function drawGradientSlider(c: ComponentNode, tone: GsTone) {
  const W = 360
  const THUMB = 56
  const rail = W - THUMB
  const t = 0.58
  const trackH = bezel() ? 10 : 8
  await style(c, { dir: 'col', gap: 'space/2', w: W })
  const head = await box({ name: 'Header', dir: 'row', w: 'fill' }, ref(await text('Creativity', bezel() ? 'Bezel/Eyebrow' : 'UI/base/Medium', bezel() ? 'role/fg-muted' : 'role/fg', { name: 'Label' }), 'Label'))
  const control = await box({ name: 'Control', dir: 'none', w: W, h: 36 })
  const track = await box({ name: 'Rail', dir: 'none', w: rail, h: trackH, radius: 'radius/full', fill: bezel() ? 'role/well' : 'role/band', clip: true })
  await gradientBands(track, tone, rail, trackH, 1, 0.3)
  await gradientBands(track, tone, rail, trackH, t)
  add(control, track)
  track.x = THUMB / 2
  track.y = (36 - trackH) / 2
  // The thumb: a glass capsule (the surface at 62% on a 14% fg hairline) carrying the value in mono.
  const thumb = await box({ name: 'Thumb', dir: 'row', align: 'center', justify: 'center', w: THUMB, h: 30, radius: 'radius/full', fill: ['role/surface', 0.62], stroke: ['role/fg', 0.14], effect: 'Shadow/sm' })
  add(thumb, ref(await text('0.58', 'Mono/sm', 'role/fg', { name: 'Value' }), 'Value'))
  add(control, thumb)
  thumb.x = Math.round(t * rail)
  thumb.y = 3
  // The ruler: ten steps, the ends and the zone bounds major.
  const ruler = await box({ name: 'Ticks', dir: 'none', w: rail, h: 8 })
  for (let i = 0; i <= 10; i++) {
    const major = i === 0 || i === 10 || i === 3 || i === 7
    const tick = await box({ name: major ? 'Major tick' : 'Tick', w: 1, h: major ? 8 : 4, fill: major ? 'role/fg-subtle' : 'role/line-strong' })
    add(ruler, tick)
    tick.x = Math.round((i / 10) * (rail - 1))
  }
  const rulerRow = await box({ name: 'Ruler', dir: 'row', pad: [0, THUMB / 2], w: 'fill' }, ruler)
  const zone = async (label: string, active: boolean) => {
    const z = await box({ name: 'Zone', dir: 'row', align: 'center', gap: 'space/1-5' })
    if (active) add(z, await box({ name: 'Dot', w: 6, h: 6, radius: 'radius/full', fill: GS_STOPS[tone][1]!.slice(-1)[0]![0] }))
    add(z, await text(label, bezel() ? 'Bezel/Eyebrow' : 'UI/sm/Regular', active ? 'role/fg' : 'role/fg-muted', { name: 'Label' }))
    return z
  }
  const zones = await box({ name: 'Zones', dir: 'row', justify: 'between', align: 'center', pad: [0, THUMB / 2], w: 'fill' }, await zone('Literal', false), await zone('Balanced', true), await zone('Exploratory', false))
  add(c, head, control, rulerRow, zones)
}

function gradientSliderSpec(): SetSpec {
  return {
    key: 'component:gradient-slider',
    name: 'Gradient slider',
    description:
      'GradientSlider in packages/ui: a value on a spectrum. The rail is a gradient through the tone’s tokens (spectrum: chart-5 → chart-3 → chart-2; accent: faint to full; status: success → danger), lit to the thumb and at 30% past it; the thumb is a glass capsule carrying the value in mono; a ruler runs beneath and the zones name the stretch, the current one lit with a dot. Drawn as fine bands of the token stops (Figma can’t bind gradient stops). The glass swelling and the zone tick live in code.',
    variants: (['spectrum', 'accent', 'status'] as const).map((tone) => ({ props: { Tone: tone }, build: (c: ComponentNode) => drawGradientSlider(c, tone) })),
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Creativity', field: 'characters' },
      { name: 'Value', type: 'TEXT', default: '0.58', field: 'characters' },
    ],
    columns: 'Tone',
    gap: [40, 16],
  }
}

/* ── File upload ────────────────────────────────────────────────────────── */

/** Sets an instance's component property by name, whatever its #id. */
function setProp(instance: InstanceNode, name: string, value: string | boolean) {
  const key = Object.keys(instance.componentProperties).find((k) => k.split('#')[0] === name)
  if (key) instance.setProperties({ [key]: value })
}

/** A ghost icon-sm Button with its icon swapped. */
function iconButton(get: Deps['get'], icons: Map<string, IconBuild>, name: string) {
  const b = instanceOf(get('button'), { Variant: 'ghost', Size: 'icon-sm', State: 'rest' })
  setProp(b, 'Icon', pick(icons, name).rest.id)
  return b
}

const pick = (icons: Map<string, IconBuild>, ...names: string[]) => names.map((n) => icons.get(n)).find(Boolean) ?? [...icons.values()][0]!

async function dropzone(icons: Map<string, IconBuild>, state: 'rest' | 'dragging') {
  const on = state === 'dragging'
  const z = await box({ name: 'Dropzone', dir: 'col', align: 'center', gap: 'space/2', pad: [32, 24], w: 'fill', radius: 'radius/lg', stroke: on ? 'role/accent' : 'role/line-control', fill: on ? 'role/accent-subtle' : undefined })
  z.dashPattern = [4, 3]
  const disc = await box({ name: 'Icon', dir: 'row', align: 'center', justify: 'center', w: 40, h: 40, radius: 'radius/full', fill: on ? 'role/accent-subtle' : 'role/band' }, icon(icons, 'upload', 20, on ? 'role/accent' : 'role/fg-muted'))
  const prompt = await box({ name: 'Prompt', dir: 'row', gap: 'space/1' })
  if (on) add(prompt, await text('Drop to upload', 'UI/base/Medium', 'role/fg', { name: 'Title' }))
  else add(prompt, ref(await text('Drop files here or', 'UI/base/Medium', 'role/fg', { name: 'Title' }), 'Prompt'), await text('browse', 'UI/base/Medium', 'role/accent', { name: 'Browse' }))
  const words = await box({ name: 'Text', dir: 'col', align: 'center', gap: 'space/0-5' }, prompt, ref(await text('PNG, JPG or PDF, up to 10 MB', 'UI/sm/Regular', 'role/fg-muted', { name: 'Rules' }), 'Rules'))
  add(z, disc, words)
  return z
}

async function fileRow(get: Deps['get'], icons: Map<string, IconBuild>, name: string, status: 'uploading' | 'done' | 'error', last: boolean) {
  const row = await box({ name: 'File', dir: 'row', align: 'center', gap: 'space/3', pad: [8, 4], w: 'fill', stroke: last ? undefined : 'role/line', sides: last ? undefined : { bottom: 1 } })
  const thumb = await box({ name: 'Thumb', dir: 'row', align: 'center', justify: 'center', w: 36, h: 36, radius: 'radius/md', fill: 'role/band', stroke: 'role/line-subtle' }, icon(icons, 'file-text', 16, 'role/fg-muted'))
  const body = await box({ name: 'Body', dir: 'col', gap: 'space/0-5', w: 'fill' })
  if (status === 'uploading') {
    const p = instanceOf(get('progress'), { Value: '60' })
    add(body, p)
    p.setProperties({ [Object.keys(p.componentProperties).find((k) => k.startsWith('Label'))!]: name })
  } else {
    add(body, await text(name, 'UI/base/Medium', 'role/fg', { name: 'Name', w: 'fill', truncate: true }))
    const meta = await box({ name: 'Meta', dir: 'row', align: 'center', gap: 'space/1-5' }, await text('2.4 MB', 'UI/sm/Regular', status === 'error' ? 'role/danger-text' : 'role/fg-muted', { name: 'Size' }), await text('·', 'UI/sm/Regular', status === 'error' ? 'role/danger-text' : 'role/fg-muted', { name: 'Dot' }))
    if (status === 'done') add(meta, icon(icons, 'check', 12, 'role/success'), await text('Uploaded', 'UI/sm/Regular', 'role/fg-muted', { name: 'Status' }))
    else add(meta, await text('Upload failed', 'UI/sm/Regular', 'role/danger-text', { name: 'Error' }))
    add(body, meta)
  }
  const actions = await box({ name: 'Actions', dir: 'row', align: 'center', gap: 'space/0-5' })
  if (status === 'error') add(actions, iconButton(get, icons, 'refresh'))
  add(actions, iconButton(get, icons, 'x'))
  add(row, thumb, body, actions)
  return row
}

async function drawFileUpload(c: ComponentNode, state: 'rest' | 'dragging' | 'files', get: Deps['get'], icons: Map<string, IconBuild>) {
  await style(c, { dir: 'col', gap: 'space/3', w: 440 })
  add(c, await dropzone(icons, state === 'dragging' ? 'dragging' : 'rest'))
  if (state !== 'files') return
  const list = await box({ name: 'Files', dir: 'col', w: 'fill' })
  add(list, await fileRow(get, icons, 'brand-guide.pdf', 'uploading', false), await fileRow(get, icons, 'roadmap-q4.pdf', 'done', false), await fileRow(get, icons, 'invoice-0912.pdf', 'error', true))
  add(c, list)
}

function fileUploadSpec({ icons, get }: Deps): SetSpec {
  return {
    key: 'component:file-upload',
    name: 'File upload',
    description:
      'FileUpload in packages/ui: a dashed dropzone (role/line-control, the lg corner) with an upload disc, the prompt and its rules; dragging over it turns the edge and the disc accent. Picked files list under it: a 36px thumb, the name and size, a Progress while uploading, a success tick when done, the error in danger ink with a retry, and a remove button. Files enter and leave through PresenceList in code; the gallery layout tiles images instead.',
    variants: (['rest', 'dragging', 'files'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawFileUpload(c, state, get, icons) })),
    properties: [
      { name: 'Prompt', type: 'TEXT', default: 'Drop files here or', field: 'characters' },
      { name: 'Rules', type: 'TEXT', default: 'PNG, JPG or PDF, up to 10 MB', field: 'characters' },
    ],
    columns: 'State',
    gap: [40, 16],
  }
}

/* ── Avatar upload ──────────────────────────────────────────────────────── */

async function drawAvatarUpload(c: ComponentNode, state: 'rest' | 'dragging' | 'disabled', get: Deps['get']) {
  await style(c, { dir: 'row', align: 'center', gap: 'space/4', opacity: state === 'disabled' ? 0.5 : undefined })
  // The 64px avatar (Avatar's fallback: role/band, a faint edge, initials in ui-lg); dragging rings it in a dashed accent outline 2px out.
  const avatar = await box({ name: 'Avatar', dir: 'row', align: 'center', justify: 'center', w: 64, h: 64, radius: 'radius/full', fill: 'role/band', stroke: state === 'dragging' ? 'role/accent' : 'role/line-subtle', strokeWidth: state === 'dragging' ? 2 : 1, strokeAlign: state === 'dragging' ? 'OUTSIDE' : 'INSIDE' })
  if (state === 'dragging') avatar.dashPattern = [4, 3]
  add(avatar, ref(await text('LH', 'UI/lg/Medium', 'role/fg-muted', { name: 'Initials' }), 'Initials'))
  const actions = await box({ name: 'Actions', dir: 'col', gap: 'space/1-5' })
  const buttons = await box({ name: 'Buttons', dir: 'row', gap: 'space/1-5' }, button(get, 'Upload photo', { Variant: 'outline', Size: 'sm' }))
  add(actions, buttons, ref(await text('JPG or PNG, square works best', 'UI/sm/Regular', 'role/fg-muted', { name: 'Hint' }), 'Hint'))
  add(c, avatar, actions)
}

function button(get: Deps['get'], label: string, props: Record<string, string>) {
  const i = instanceOf(get('button'), { Variant: 'default', Size: 'default', State: 'rest', ...props })
  setProp(i, 'Label', label)
  return i
}

function avatarUploadSpec({ get }: Deps): SetSpec {
  return {
    key: 'component:avatar-upload',
    name: 'Avatar upload',
    description:
      'AvatarUpload in packages/ui: a 64px avatar (the fallback initials until there’s a photo) beside an outline “Upload photo” button and a hint. Hovering the avatar darkens it under a camera; dropping an image on it rings it in a dashed accent outline. A picked photo opens a crop dialog (a round window, zoom buttons) before it’s saved; the crop lives in code.',
    variants: (['rest', 'dragging', 'disabled'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawAvatarUpload(c, state, get) })),
    properties: [
      { name: 'Initials', type: 'TEXT', default: 'LH', field: 'characters' },
      { name: 'Hint', type: 'TEXT', default: 'JPG or PNG, square works best', field: 'characters' },
    ],
    columns: 'State',
    gap: [40, 16],
  }
}

/* ── Signature pad ──────────────────────────────────────────────────────── */

/** A drawn signature, in the pad's coordinates (a 360-wide line). */
const SIGNATURE = 'M28,74 C34,46 46,30 52,40 C58,52 44,86 40,96 C52,70 66,52 76,58 C84,64 72,84 82,82 C92,80 98,62 108,64 C116,66 108,84 118,82 C130,78 136,56 150,60 C160,64 150,86 164,82 C182,76 196,50 214,58 C226,64 210,88 228,82 C246,76 262,62 280,66 C292,70 300,74 316,68'

async function drawSignaturePad(c: ComponentNode, state: 'empty' | 'signed' | 'accepted', get: Deps['get'], icons: Map<string, IconBuild>) {
  const W = 400
  const inset = 20
  await style(c, { dir: 'col', w: W, radius: 'radius/xl', fill: 'role/surface', stroke: 'role/line-control', effect: 'Shadow/xs', clip: true })
  // Draw or type: a TabsList inset to the signing line.
  const tabs = instanceOf(get('tabs'), { Variant: 'pill' })
  const triggers = tabs.children.filter((n) => n.type === 'INSTANCE') as InstanceNode[]
  ;['Draw', 'Type'].forEach((label, i) => setProp(triggers[i]!, 'Label', label))
  if (triggers[2]) triggers[2].visible = false
  const head = await box({ name: 'Method', dir: 'row', pad: [12, inset, 0, inset], w: 'fill' }, tabs)
  // The signing area: aspect 3, the line at 24% from its foot.
  const H = Math.round((W - 2) / 3)
  const area = await box({ name: 'Area', dir: 'none', w: W - 2, h: H })
  const lineY = Math.round(H * 0.76)
  const line = rect('Line', W - 2 - 2 * inset, 1, state === 'accepted' ? 'role/success-line' : 'role/line')
  add(area, line)
  line.x = inset
  line.y = lineY
  if (state === 'empty') {
    const hint = await text('Sign here', 'UI/sm/Regular', 'role/fg-subtle', { name: 'Hint' })
    add(area, hint)
    hint.x = inset
    hint.y = lineY - 6 - hint.height
  } else {
    const ink = vector(area, SIGNATURE, { stroke: solid('role/fg'), strokeWidth: 2.5 }, 'Ink')
    ink.x = inset + 8
    ink.y = lineY - 92
  }
  if (state === 'accepted') {
    const tick = icon(icons, 'check', 18, 'role/success-text')
    add(area, tick)
    tick.x = W - 2 - inset - 18
    tick.y = lineY - 6 - 18
  }
  const foot = await box({ name: 'Footer', dir: 'row', align: 'center', gap: 'space/1', pad: [0, inset, 12, inset - 6], w: 'fill' })
  add(foot, iconButton(get, icons, 'undo'), iconButton(get, icons, 'eraser'), await spacerBox())
  add(foot, state === 'accepted' ? button(get, 'Sign again', { Variant: 'ghost', Size: 'sm' }) : button(get, 'Accept', { Size: 'sm', State: state === 'empty' ? 'disabled' : 'rest' }))
  add(c, head, area, foot)
}

const spacerBox = () => box({ name: 'Spacer', w: 'fill', h: 1 })

function signaturePadSpec({ get, icons }: Deps): SetSpec {
  return {
    key: 'component:signature-pad',
    name: 'Signature pad',
    description:
      'SignaturePad in packages/ui: one self-contained surface (role/surface on a role/line-control edge, the xl corner) with Draw and Type tabs, a signing area at aspect 3 whose line sits 24% up, and a footer with undo, clear and Accept. Empty, “Sign here” waits on the line; accepted, the line turns success and a tick sits at its end. The ink follows the pointer with pressure in code; Type sets the name in a script face.',
    variants: (['empty', 'signed', 'accepted'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawSignaturePad(c, state, get, icons) })),
    properties: [],
    columns: 'State',
    gap: [40, 16],
  }
}

/* ── Currency swap ──────────────────────────────────────────────────────── */

async function currencyPicker(icons: Map<string, IconBuild>, symbol: string, mark: string) {
  // SelectTrigger variant ghost, 112 wide: the asset's 20px mark, its symbol, a chevron.
  const t = await box({ name: 'Currency', dir: 'row', align: 'center', gap: 'space/2', w: 112, radius: 'bezel/field-radius' })
  padInline(t, 'space/2-5', 'space/2')
  controlHeight(t)
  const disc = await box({ name: 'Mark', dir: 'row', align: 'center', justify: 'center', w: 20, h: 20, radius: 'radius/full', fill: 'role/band' }, await text(mark, 'UI/xs/Medium', 'role/fg-muted', { name: 'Mark' }))
  add(t, disc, await text(symbol, 'UI/base/Medium', 'role/fg', { name: 'Symbol', w: 'fill' }), icon(icons, 'chevron-down', 16, 'role/fg-muted'))
  return t
}

async function drawCurrencySwap(c: ComponentNode, state: 'rest' | 'focus', get: Deps['get'], icons: Map<string, IconBuild>) {
  await style(c, { dir: 'col', gap: 'space/3', pad: 8, w: 384, radius: 'radius/xl', fill: 'role/surface', stroke: 'role/line' })
  const side = async (caption: string, amount: string, symbol: string, mark: string, worth: string, focused: boolean) => {
    const p = await box({ name: caption, dir: 'col', gap: 'space/1-5', pad: [14, 16], w: 'fill', radius: 'radius/lg', fill: 'role/well', stroke: focused ? 'role/focus' : clear() })
    const row = await box({ name: 'Row', dir: 'row', align: 'center', gap: 'space/3', w: 'fill' })
    const fig = await text(amount, 'Heading/2xl', 'role/fg', { name: 'Amount', w: 'fill', truncate: true })
    if (bezel()) fig.fontName = context().fonts.font('mono', 500)
    add(row, ref(fig, caption === 'You pay' ? 'Pay' : 'Receive'), await currencyPicker(icons, symbol, mark))
    add(p, await text(caption, 'UI/sm/Regular', 'role/fg-muted', { name: 'Caption' }), row, await text(worth, 'UI/sm/Regular', 'role/fg-muted', { name: 'Value' }))
    return p
  }
  const sides = await box({ name: 'Sides', dir: 'col', gap: 'space/1', w: 'fill' })
  add(sides, await side('You pay', '1,250.00', 'USD', '$', '$1,250.00', state === 'focus'), await side('You receive', '1,148.21', 'EUR', '€', '$1,250.00', false))
  // The flip: an outline icon-sm button on the surface, ringed 4px in the surface, over the seam.
  const flip = instanceOf(get('button'), { Variant: 'outline', Size: 'icon-sm', State: 'rest' })
  setProp(flip, 'Icon', pick(icons, 'arrow-up-down').rest.id)
  const ring = await box({ name: 'Flip', dir: 'row', pad: 4, radius: 'radius/full', fill: 'role/surface' }, flip)
  add(sides, ring)
  ring.layoutPositioning = 'ABSOLUTE'
  // Centred over the seam: the card is 384 wide, 8 in.
  ring.x = Math.round((368 - ring.width) / 2)
  ring.y = Math.round((sides.height - ring.height) / 2)
  const rate = await box({ name: 'Rate', dir: 'row', pad: [0, 8], w: 'fill' }, await text('1 USD = 0.9186 EUR', 'UI/sm/Regular', 'role/fg-muted', { name: 'Rate' }))
  const submit = button(get, 'Swap', { Size: 'lg' })
  add(c, sides, rate, submit)
  submit.layoutSizingHorizontal = 'FILL'
}

function currencySwapSpec({ get, icons }: Deps): SetSpec {
  return {
    key: 'component:currency-swap',
    name: 'Currency swap',
    description:
      'CurrencySwap in packages/ui: a converter card. What you pay (an amount field and a ghost currency picker) over what you receive, each in a recessed well with its caption and its value in the base currency, a round flip button over the seam, the rate, and the primary action at full width. In code the received amount rolls digit by digit and a flip sends the amounts and currencies gliding past each other while the arrows turn.',
    variants: (['rest', 'focus'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawCurrencySwap(c, state, get, icons) })),
    properties: [
      { name: 'Pay', type: 'TEXT', default: '1,250.00', field: 'characters' },
      { name: 'Receive', type: 'TEXT', default: '1,148.21', field: 'characters' },
    ],
    columns: 'State',
    gap: [40, 16],
  }
}

/* ── Multi-language input ───────────────────────────────────────────────── */

type Glyph = 'outdated' | 'missing' | 'none'

/** The translation status glyph (12px): missing is a subtle ring, outdated a warning ring half filled. */
async function statusGlyph(kind: Glyph) {
  const g = await box({ name: 'Status', dir: 'none', w: 12, h: 12 })
  if (kind === 'none') return g
  const ring = await box({ name: 'Ring', w: 9, h: 9, radius: 'radius/full', stroke: kind === 'missing' ? 'role/fg-subtle' : 'role/warning', strokeWidth: 1.5, strokeAlign: 'CENTER' })
  add(g, ring)
  ring.x = 1.5
  ring.y = 1.5
  if (kind === 'outdated') vector(g, 'M6 1.5a4.5 4.5 0 0 0 0 9z', { fill: solid('role/warning') }, 'Half')
  return g
}

async function drawMultiLanguage(c: ComponentNode, status: 'translated' | 'outdated', icons: Map<string, IconBuild>) {
  const bz = bezel()
  await style(c, { dir: 'col', w: 420, ...fieldLookArea('rest'), clip: true })
  c.strokesIncludedInLayout = true
  // The switcher: a small segmented control of locale keys, the edited one raised, a picker for the rest at its end.
  const bar = await box({ name: 'Switcher', dir: 'row', align: 'center', pad: 6, w: 'fill', stroke: 'role/line', sides: { bottom: 1 } })
  bar.strokesIncludedInLayout = true
  const track = await box({ name: 'Track', dir: 'row', gap: 2, pad: 3, radius: 'bezel/pill', fill: bz ? 'role/well' : 'role/band' })
  controlHeight(track, 'control/sm')
  const keys: [string, Glyph][] = [['EN', 'none'], ['DE', status === 'outdated' ? 'outdated' : 'none'], ['FR', 'none'], ['JA', 'missing']]
  const active = status === 'outdated' ? 'DE' : 'EN'
  for (const [code, glyph] of keys) {
    const on = code === active
    const k = await box({ name: code, dir: 'row', align: 'center', gap: 'space/1-5', h: 'fill', radius: 'bezel/key-radius', fill: on ? (bz ? 'role/key' : 'role/overlay') : undefined, effect: on ? (bz ? 'Bezel/key' : 'Shadow/sm') : undefined })
    padInline(k, 'space/2')
    add(k, await text(code, 'UI/sm/Medium', on ? 'role/fg' : 'role/fg-muted', { name: 'Code' }))
    if (glyph !== 'none') add(k, await statusGlyph(glyph))
    add(track, k)
    k.layoutSizingVertical = 'FILL'
  }
  const more = await box({ name: 'More', dir: 'row', align: 'center', gap: 'space/1', h: 'fill' }, await text('+3', 'UI/sm/Medium', 'role/fg-muted', { name: 'Count' }), icon(icons, 'chevron-down', 14, 'role/fg-muted'))
  padInline(more, 'space/2')
  add(track, more)
  more.layoutSizingVertical = 'FILL'
  add(bar, track)
  const input = await box({ name: 'Control', dir: 'row', align: 'center', gap: 'space/2', w: 'fill' })
  padInline(input, 'space/2-5', 'space/2')
  controlHeight(input)
  const meter = await box({ name: 'Meter', dir: 'row', align: 'center', gap: 'space/1-5' })
  const rail = await box({ name: 'Rail', dir: 'none', w: 32, h: 4, radius: 'radius/full', fill: 'role/well', clip: true }, rect('Fill', 8, 4, 'role/fg-muted', 'radius/full'))
  add(meter, rail, await text('12/60', 'UI/sm/Regular', 'role/fg-muted', { name: 'Count' }))
  add(input, ref(await text(status === 'outdated' ? 'Willkommen zurück' : 'Welcome back', 'UI/base/Regular', 'role/fg', { name: 'Value', w: 'fill', truncate: true }), 'Value'), meter)
  add(c, bar, input)
  if (status !== 'outdated') return
  const note = await box({ name: 'Note', dir: 'row', align: 'center', gap: 'space/3', pad: [6, 10], w: 'fill', stroke: 'role/line', sides: { top: 1 } })
  const said = await box({ name: 'Text', dir: 'row', align: 'center', gap: 'space/1-5', w: 'fill' }, await statusGlyph('outdated'), await text('The English changed since this was translated', 'UI/sm/Regular', 'role/warning-text', { name: 'Note', w: 'fill' }))
  const mark = await box({ name: 'Mark reviewed', dir: 'row', align: 'center', radius: 'bezel/field-radius', stroke: 'role/line' }, await text('Mark reviewed', 'UI/sm/Medium', 'role/fg', { name: 'Label' }))
  padInline(mark, 'space/1-5')
  controlHeight(mark, 'control/xs')
  add(note, said, mark)
  add(c, note)
}

function multiLanguageSpec({ icons }: Deps): SetSpec {
  return {
    key: 'component:multi-language-input',
    name: 'Multi-language input',
    description:
      'MultiLanguageInput in packages/ui: one field, many languages. A small segmented switcher of locale keys runs along its top (the edited one raised; a glyph marks one that needs work: a half-filled warning ring when the source changed, a subtle ring when missing; the rest fold into a picker), the text under it with a character meter. An outdated translation shows a note and “Mark reviewed” along the foot. Compare mode sets the source beside it in code.',
    variants: (['translated', 'outdated'] as const).map((status) => ({ props: { Status: status }, build: (c: ComponentNode) => drawMultiLanguage(c, status, icons) })),
    properties: [{ name: 'Value', type: 'TEXT', default: 'Welcome back', field: 'characters' }],
    columns: 'Status',
    gap: [40, 16],
  }
}

/* ── Entries ────────────────────────────────────────────────────────────── */

const FILE = (name: string) => `packages/ui/src/components/ui/${name}.tsx`

export const ENTRIES: Entry[] = [
  {
    doc: {
      key: 'component:calendar',
      title: 'Calendar',
      usage: '<Calendar mode="single" selected={date} onSelect={setDate} />',
      tokens: 'Days: ghost buttons control/default square, bezel/pill  ·  Selected role/accent with role/on-accent  ·  Range band role/accent-subtle, radius/md ends  ·  Today dot role/accent, 4  ·  Weekdays UI/xs role/fg-muted, 28 high  ·  Month UI/base/Medium',
      file: FILE('calendar'),
    },
    spec: calendarSpec,
  },
  {
    doc: {
      key: 'component:date-picker',
      title: 'Date picker',
      usage: '<DatePicker value={date} onValueChange={setDate} minDate={today} />',
      tokens: 'Input group: field well, Focus/field  ·  Open role/focus edge  ·  Calendar button control/xs, icon role/fg-muted  ·  Popup role/overlay (Bezel bezel/popover), role/line, Shadow/md, 12 in',
      file: FILE('date-picker'),
    },
    spec: datePickerSpec,
  },
  {
    doc: {
      key: 'component:date-range-picker',
      title: 'Date range picker',
      usage: '<DateRangePicker value={range} onValueChange={setRange} presets={presets} />',
      tokens: 'Two dates and a dash in one input group  ·  Presets: ghost control/sm rows, pressed on role/hover, a role/line hairline beside them  ·  Calendar in range mode  ·  Popup role/overlay, Shadow/md',
      file: FILE('date-range-picker'),
    },
    spec: dateRangePickerSpec,
  },
  {
    doc: {
      key: 'component:time-picker',
      title: 'Time picker',
      usage: '<TimePicker value="09:30" onValueChange={setTime} />',
      tokens: 'Input group, min width 144  ·  Segments 24 high, radius/sm, focused role/accent-subtle  ·  Colon role/fg-muted  ·  Clock 16 role/fg-muted',
      file: FILE('time-picker'),
    },
    spec: timePickerSpec,
  },
  {
    doc: {
      key: 'component:combobox',
      title: 'Combobox',
      usage: '<Combobox options={frameworks} value={value} onValueChange={setValue} placeholder="Select a framework…" />',
      tokens: 'Trigger: field well, control/default, chevron role/fg-muted  ·  Open role/focus  ·  List: search row 40 over role/line, rows control/default at radius/md, active role/cursor, check role/accent  ·  Popup role/overlay, Shadow/md',
      file: FILE('combobox'),
    },
    spec: comboboxSpec,
  },
  {
    doc: {
      key: 'component:multi-select',
      title: 'Multi select',
      usage: '<MultiSelect options={labels} value={chosen} onValueChange={setChosen} placeholder="Select labels…" />',
      tokens: 'Field well at bezel/field-area-radius  ·  Chips: secondary badge (Bezel role/control), label role/fg, remove 12 at 60%  ·  “+N” outline badge  ·  List as Combobox’s, checks role/accent',
      file: FILE('multi-select'),
    },
    spec: multiSelectSpec,
  },
  {
    doc: {
      key: 'component:tag-input',
      title: 'Tag input',
      usage: '<TagInput value={tags} onValueChange={setTags} placeholder="Add a tag…" />',
      tokens: 'Field well at bezel/field-area-radius, min height control/default  ·  Chips: secondary badge, wrap 4px apart  ·  Focus role/focus with Focus/field  ·  Error UI/sm/Medium role/danger',
      file: FILE('tag-input'),
    },
    spec: tagInputSpec,
  },
  {
    doc: {
      key: 'component:wheel-picker',
      title: 'Wheel picker',
      usage: '<WheelPicker columns={[hours, minutes, period]} value={time} onValueChange={setTime} />',
      tokens: 'Band role/selected at the control height, bezel/pill  ·  Chosen row role/fg, medium  ·  Other rows role/fg-muted, foreshortened and faded  ·  Rows control/sm, default, lg',
      file: FILE('wheel-picker'),
    },
    spec: () => wheelPickerSpec(),
  },
  {
    doc: {
      key: 'component:scrub-number-field',
      title: 'Scrub number field',
      usage: '<ScrubNumberField label={<DropletIcon />} unit="%" min={0} max={100} value={80} onValueChange={setOpacity} />',
      tokens: 'Input group: field well, control/default, control/sm  ·  Handle role/fg-muted → role/fg while scrubbing, min width 24  ·  Unit UI/sm role/fg-muted',
      file: FILE('scrub-number-field'),
    },
    spec: scrubSpec,
  },
  {
    doc: {
      key: 'component:color-opacity-field',
      title: 'Color opacity field',
      usage: '<ColorOpacityField value={{ color: "#3b5bff", opacity: 80 }} onValueChange={setFill} />',
      tokens: 'Input group with a 20px swatch (radius/sm, role/fg at 12% edge) and the hex in Mono/sm  ·  Opacity: a 96px Scrub number field  ·  Gap space/1-5',
      file: FILE('color-opacity-field'),
    },
    spec: colorOpacitySpec,
  },
  {
    doc: {
      key: 'component:color-picker',
      title: 'Color picker',
      usage: '<ColorPicker value={color} onValueChange={setColor} swatches={brandColors} />',
      tokens: 'Trigger: field well, 160 wide, swatch 20 at radius/sm, hex Mono/sm  ·  Panel role/overlay (Bezel bezel/popover), 288, 12 in, Shadow/md  ·  Area 144 high, radius/md  ·  Channel fields control/sm  ·  Swatch buttons 28, pressed ringed role/fg',
      file: FILE('color-picker'),
    },
    spec: colorPickerSpec,
  },
  {
    doc: {
      key: 'component:gradient-slider',
      title: 'Gradient slider',
      usage: '<GradientSlider label="Creativity" min={0} max={1} step={0.01} zones={zones} tone="spectrum" />',
      tokens: 'Rail role/band (Bezel role/well), 8 (Bezel 10), the tone’s gradient at 30%, lit to the thumb  ·  Stops role/chart-5 → chart-3 → chart-2 · accent · success → danger  ·  Thumb role/surface at 62%, role/fg at 14% edge, Mono/sm  ·  Ticks role/fg-subtle, role/line-strong  ·  Zones UI/sm (Bezel: Bezel/Eyebrow)',
      file: FILE('gradient-slider'),
    },
    spec: () => gradientSliderSpec(),
  },
  {
    doc: {
      key: 'component:file-upload',
      title: 'File upload',
      usage: '<FileUpload multiple accept="image/*,.pdf" maxSize={10_000_000} onUpload={upload} />',
      tokens: 'Dropzone: dashed role/line-control, radius/lg, 32 × 24 in  ·  Dragging role/accent on role/accent-subtle  ·  Disc role/band, 40  ·  Rows: 36 thumb at radius/md, name UI/base/Medium, meta UI/sm role/fg-muted, error role/danger-text, hairlines role/line  ·  Actions: ghost icon-sm Buttons',
      file: FILE('file-upload'),
    },
    spec: fileUploadSpec,
  },
  {
    doc: {
      key: 'component:avatar-upload',
      title: 'Avatar upload',
      usage: '<AvatarUpload fallback="LH" onUpload={save} onRemove={remove} hint="JPG or PNG, square works best" />',
      tokens: 'Avatar 64, role/band, role/line-subtle edge, initials UI/lg role/fg-muted  ·  Dragging: a 2px dashed role/accent outline  ·  Outline sm Button  ·  Hint UI/sm role/fg-muted  ·  Gap space/4',
      file: FILE('avatar-upload'),
    },
    spec: avatarUploadSpec,
  },
  {
    doc: {
      key: 'component:signature-pad',
      title: 'Signature pad',
      usage: '<SignaturePad typeInstead onAccept={(signature) => save(signature)} />',
      tokens: 'Surface role/surface, role/line-control edge, radius/xl, Shadow/xs  ·  Inset space/5  ·  Line role/line (accepted role/success-line)  ·  Ink role/fg  ·  Hint UI/sm role/fg-subtle  ·  Tick role/success-text  ·  Footer: ghost icon-sm tools, sm Accept',
      file: FILE('signature-pad'),
    },
    spec: signaturePadSpec,
  },
  {
    doc: {
      key: 'component:currency-swap',
      title: 'Currency swap',
      usage: '<CurrencySwap assets={currencies} from="USD" to="EUR" currency="USD" onSubmit={swap} />',
      tokens: 'Card role/surface, role/line, radius/xl, 8 in  ·  Sides role/well, radius/lg, 14 × 16 in, focus role/focus edge  ·  Amount 24 medium (Bezel: mono)  ·  Picker: ghost select 112 wide  ·  Flip: outline icon-sm ringed in role/surface  ·  Submit lg Button',
      file: FILE('currency-swap'),
    },
    spec: currencySwapSpec,
  },
  {
    doc: {
      key: 'component:multi-language-input',
      title: 'Multi-language input',
      usage: '<MultiLanguageInput locales={["en", "de", "fr", "ja"]} source="en" value={copy} onValueChange={setCopy} maxLength={60} />',
      tokens: 'Field well at bezel/field-area-radius  ·  Switcher: control/sm segmented track (Bezel role/well, keys role/key with Bezel/key), over a role/line hairline  ·  Glyphs role/warning, role/fg-subtle  ·  Meter rail role/well, 32 × 4  ·  Note UI/sm role/warning-text',
      file: 'packages/ui/src/components/ui/multi-language-input/',
    },
    spec: multiLanguageSpec,
  },
]
