import { motionPersonalities, type MotionPersonality } from '@youj/core/lib/youj/tokens'
import {
  nearestDuration,
  nearestSpring,
  round,
  springValues,
  tweenValues,
  type Interaction,
  type Moment,
  type PlaygroundState,
  type Preset,
  type StaggerVariant,
} from './state'

/* The code each view takes, written as an app would write it, with a note on
 * the lines that matter. Tokens are named, never spelled out as numbers: a
 * value that is a token prints as `k.spring('smooth')`. Custom values print
 * as numbers scaled by the time scale, and their note says which token is
 * closest. The playground runs the same transitions it prints. */

export interface Note {
  /** First and last line the note explains, 1-based. */
  from: number
  to: number
  /** Backticks render as code. */
  text: string
}

export interface Snippet {
  file: string
  code: string
  notes: Note[]
}

type Block = [lines: string[], note?: string]

function snippet(file: string, blocks: Block[]): Snippet {
  const lines: string[] = []
  const notes: Note[] = []
  for (const [code, note] of blocks) {
    // A note starts on its block's first line of code, not on the blank line before it.
    const from = lines.length + 1 + Math.max(0, code.findIndex((line) => line.trim() !== ''))
    lines.push(...code)
    if (note) notes.push({ from, to: lines.length, text: note })
  }
  return { file, code: `${lines.join('\n')}\n`, notes }
}

const seconds = (ms: number) => String(round(ms / 1000, 3))
const felt = (s: number) => `${round(s)} s`
const bounceText = (bounce: number) => (bounce === 0 ? 'no bounce' : `bounce ${round(bounce)}`)
const curveText = (curve: readonly number[]) => `[${curve.map((v) => round(v)).join(', ')}]`

const K_LINE: Block = [['  const k = useYouj()'], 'Reads the tokens in effect here: the theme’s motion personality, Speed and reduced motion, from the nearest `YoujProvider`.']

/* ── Springs ─────────────────────────────────────────────────────────────── */

export function springExpression(state: Pick<PlaygroundState, 'spring' | 'springCustom'>): string {
  if (state.spring !== 'custom') return `k.spring('${state.spring}')`
  const { visualDuration, bounce } = state.springCustom
  return `{ type: 'spring', visualDuration: ${round(visualDuration)} * k.timeScale, bounce: ${round(bounce)} }`
}

const SPRING_JOB = {
  snappy: 'the feedback spring, for presses, toggles and icon states',
  smooth: 'the layout spring, for anything that changes position or size',
  settle: 'the arrival spring, with the one overshoot Youj allows, for success and arrival',
} as const

function springNote(state: PlaygroundState, personality: MotionPersonality): string {
  const values = springValues(state, personality)
  if (state.spring === 'custom') {
    const near = nearestSpring(values, personality)
    const t = motionPersonalities[personality].springs[near]
    return `A custom spring: multiply by \`k.timeScale\` yourself so Speed reaches it. It stays the same in every theme, where a token follows the personality. Closest token: \`${near}\` (${felt(t.visualDuration)}, ${bounceText(t.bounce)}).`
  }
  return `\`${state.spring}\` is ${SPRING_JOB[state.spring]}: it feels done in ${felt(values.visualDuration)}, ${bounceText(values.bounce)}. \`k.reduced\` swaps it for a jump; the item is still marked.`
}

function springsSnippet(state: PlaygroundState, personality: MotionPersonality): Snippet {
  return snippet('sidebar.tsx', [
    [
      [
        "'use client'",
        '',
        "import { motion } from 'motion/react'",
        "import { useYouj } from '@youj/core'",
        '',
        "const ITEMS = ['Overview', 'Deployments', 'Analytics', 'Settings']",
        '',
        'interface SidebarProps {',
        '  active: number',
        '  onSelect: (index: number) => void',
        '}',
        '',
      ],
    ],
    [['export function Sidebar({ active, onSelect }: SidebarProps) {']],
    K_LINE,
    [['', '  return (', '    <nav className="relative flex flex-col">']],
    [
      ['      <motion.span', '        aria-hidden', '        className="absolute inset-x-0 top-0 h-10 rounded-md bg-selected"'],
      'One highlight behind the items. It’s decoration, so it’s hidden from assistive tech: `aria-current` says which item is selected.',
    ],
    [['        initial={false}'], 'No entrance: it mounts on the active item.'],
    [['        animate={{ y: `${active * 100}%` }}'], 'It moves by its own height per item, so one number places it on any row, and only `transform` changes.'],
    [[`        transition={k.reduced ? { duration: 0 } : ${springExpression(state)}}`], springNote(state, personality)],
    [
      [
        '      />',
        '      {ITEMS.map((item, index) => (',
        '        <button',
        '          key={item}',
        "          aria-current={index === active ? 'page' : undefined}",
        '          onClick={() => onSelect(index)}',
        '          className="relative h-10 rounded-md px-3 text-start"',
        '        >',
        '          {item}',
        '        </button>',
        '      ))}',
      ],
      'Press another item mid-glide: a spring retargets from where it is and keeps its velocity, so it never jumps.',
    ],
    [['    </nav>', '  )', '}']],
  ])
}

/* ── Tweens ──────────────────────────────────────────────────────────────── */

export function tweenExpression(state: Pick<PlaygroundState, 'duration' | 'durationCustom' | 'ease' | 'easeCustom'>): string {
  if (state.duration !== 'custom' && state.ease !== 'custom') return `k.tween('${state.duration}', '${state.ease}')`
  const duration = state.duration === 'custom' ? `${seconds(state.durationCustom)} * k.timeScale` : `k.duration('${state.duration}')`
  const ease = state.ease === 'custom' ? curveText(state.easeCustom) : `k.ease('${state.ease}')`
  return `{ duration: ${duration}, ease: ${ease} }`
}

const EASE_JOB = {
  standard: 'moves between two resting states',
  enter: 'decelerates hard into place, for arrivals',
  exit: 'accelerates away, for departures',
  emphasized: 'winds up, whips through and lands long, for hero moments',
  linear: 'runs at a constant rate, for loops',
} as const

function tweenNote(state: PlaygroundState, personality: MotionPersonality): string {
  const { ms } = tweenValues(state, personality)
  const custom: string[] = []
  if (state.duration === 'custom') {
    const near = nearestDuration(ms, personality)
    custom.push(`the duration (closest token: \`${near}\`, ${motionPersonalities[personality].durations[near]} ms)`)
  }
  if (state.ease === 'custom') custom.push('the curve (closest in spirit: `standard` between states, `enter` in, `exit` out)')
  if (custom.length) {
    return `Custom ${custom.join(' and ')}. Multiplying by \`k.timeScale\` keeps Speed working, but custom values stay the same in every theme, where tokens follow the personality.`
  }
  return `\`k.tween('${state.duration}', '${state.ease}')\`: ${ms} ms on a curve that ${EASE_JOB[state.ease as keyof typeof EASE_JOB]}. Under reduced motion the change is instant.`
}

function tweensSnippet(state: PlaygroundState, personality: MotionPersonality): Snippet {
  return snippet('deploy-toast.tsx', [
    [["'use client'", '', "import { AnimatePresence, motion } from 'motion/react'", "import { useYouj } from '@youj/core'", '']],
    [['export function DeployToast({ open }: { open: boolean }) {']],
    K_LINE,
    [[`  const transition = k.reduced ? { duration: 0 } : ${tweenExpression(state)}`], tweenNote(state, personality)],
    [['', '  return (']],
    [['    <AnimatePresence>'], 'Keeps the toast mounted until its exit has played.'],
    [['      {open && (', '        <motion.div'], undefined],
    [['          initial={k.reduced ? false : { opacity: 0, y: 48 }}'], 'Where it comes from: 48 px down and transparent. Under reduced motion there’s no entrance; it’s simply there.'],
    [
      ['          animate={{ opacity: 1, y: 0, transition }}', '          exit={{ opacity: 0, y: 48, transition }}'],
      'One tween both ways here, so you can compare. Youj leaves faster than it arrives, on `fast` · `exit`: nobody waits for something to go.',
    ],
    [['          className="rounded-lg border bg-surface p-3 shadow-md"', '        >', '          Deployed to production', '        </motion.div>', '      )}', '    </AnimatePresence>', '  )', '}']],
  ])
}

/* ── Stagger ─────────────────────────────────────────────────────────────── */

/** The Reveal variant each row enters on: its duration, curve and what moves (primitives/reveal.tsx). */
export const VARIANT_TIMING: Record<StaggerVariant, { duration: 'slow' | 'deliberate'; ease: 'enter' | 'standard'; moves: string }> = {
  rise: { duration: 'slow', ease: 'enter', moves: 'rises 12 px as it fades in' },
  fade: { duration: 'slow', ease: 'standard', moves: 'fades in where it stands' },
  scale: { duration: 'slow', ease: 'enter', moves: 'grows from 0.94 as it fades in' },
  'blur-in': { duration: 'deliberate', ease: 'enter', moves: 'sharpens from an 8 px blur' },
}

/** Rows on the stage; the timeline and the note count the same six. */
export const STAGGER_ROWS = 6

export function staggerTotal(state: Pick<PlaygroundState, 'stagger' | 'variant'>, personality: MotionPersonality) {
  const tokens = motionPersonalities[personality]
  const step = tokens.staggers[state.stagger]
  const item = tokens.durations[VARIANT_TIMING[state.variant].duration]
  return { step, item, lastStart: step * (STAGGER_ROWS - 1), total: step * (STAGGER_ROWS - 1) + item }
}

const ORDER_NOTE = {
  start: '`start` plays top to bottom, the order people read.',
  end: '`end` plays bottom to top, for things that stack upward, like a feed that grows from the bottom.',
  center: '`center` plays from the middle out, for a grid or a hero row.',
  random: '`random` shuffles with a seed, so the server and the browser agree on the order.',
} as const

function staggerSnippet(state: PlaygroundState, personality: MotionPersonality): Snippet {
  const { step, total } = staggerTotal(state, personality)
  const timing = VARIANT_TIMING[state.variant]
  const ms = motionPersonalities[personality].durations[timing.duration]
  return snippet('deployments.tsx', [
    [["'use client'", '', "import { Stagger } from '@youj/motion'", "import { DeploymentRow, type Deployment } from './deployment-row'", '']],
    [['export function Deployments({ items }: { items: Deployment[] }) {', '  return (']],
    [
      [`    <Stagger as="ul" itemAs="li" step="${state.stagger}" order="${state.order}" variant="${state.variant}">`],
      `\`${state.stagger}\` puts ${step} ms between rows, so six land in ${total} ms. ${ORDER_NOTE[state.order]} Each row ${timing.moves} on \`${timing.duration}\` · \`${timing.ease}\` (${ms} ms).`,
    ],
    [
      ['      {items.map((item) => (', '        <DeploymentRow key={item.id} {...item} />', '      ))}'],
      'Stagger wraps each child in a Reveal and plays them once the list scrolls into view. Under reduced motion every row is simply there, and on a low motion budget a sequence longer than six steps compresses to six.',
    ],
    [['    </Stagger>', '  )', '}']],
    [
      ['', '// By hand, with your own elements:', "// transition={{ ...k.tween('slow', 'enter'), delay: index * k.stagger('base') }}"],
      'The same rhythm by hand: `k.stagger()` is the step in seconds, already scaled by Speed.',
    ],
  ])
}

/* ── Personalities ───────────────────────────────────────────────────────── */

export const MOMENT_TOKEN: Record<Moment, { label: string; call: string; kind: 'spring' | 'tween' }> = {
  glide: { label: 'Glide', call: "k.spring('smooth')", kind: 'spring' },
  arrival: { label: 'Arrival', call: "k.spring('settle')", kind: 'spring' },
  enter: { label: 'Enter', call: "k.tween('base', 'enter')", kind: 'tween' },
  exit: { label: 'Exit', call: "k.tween('fast', 'exit')", kind: 'tween' },
}

const MOMENT_COMPONENT: Record<Moment, string[]> = {
  glide: [
    'export function Highlight({ index }: { index: number }) {',
    '  const k = useYouj()',
    '  return (',
    '    <motion.span',
    '      animate={{ y: `${index * 100}%` }}',
    "      transition={k.reduced ? { duration: 0 } : k.spring('smooth')}",
    '    />',
    '  )',
    '}',
  ],
  arrival: [
    'export function SavedCheck() {',
    '  const k = useYouj()',
    '  return (',
    '    <motion.span',
    '      initial={k.reduced ? false : { opacity: 0, scale: 0.6 }}',
    '      animate={{ opacity: 1, scale: 1 }}',
    "      transition={k.reduced ? { duration: 0 } : k.spring('settle')}",
    '    />',
    '  )',
    '}',
  ],
  enter: [
    'export function Card() {',
    '  const k = useYouj()',
    '  return (',
    '    <motion.div',
    '      initial={k.reduced ? false : { opacity: 0, y: 16 }}',
    '      animate={{ opacity: 1, y: 0 }}',
    "      transition={k.reduced ? { duration: 0 } : k.tween('base', 'enter')}",
    '    />',
    '  )',
    '}',
  ],
  exit: [
    'export function Card({ open }: { open: boolean }) {',
    '  const k = useYouj()',
    '  return (',
    '    <AnimatePresence>',
    '      {open && (',
    '        <motion.div',
    '          exit={{ opacity: 0, y: 16 }}',
    "          transition={k.reduced ? { duration: 0 } : k.tween('fast', 'exit')}",
    '        />',
    '      )}',
    '    </AnimatePresence>',
    '  )',
    '}',
  ],
}

function personalitiesSnippet(state: PlaygroundState): Snippet {
  const { call } = MOMENT_TOKEN[state.moment]
  const imports = state.moment === 'exit' ? "import { AnimatePresence, motion } from 'motion/react'" : "import { motion } from 'motion/react'"
  return snippet('providers.tsx', [
    [["'use client'", '', "import type { ReactNode } from 'react'", imports, "import { YoujProvider, defineTheme, useYouj } from '@youj/core'", '']],
    [
      ["const theme = defineTheme({ motionPersonality: 'calm' }) // 'precise' | 'calm' | 'lively'"],
      'One word in the theme re-values every duration, curve, spring and stagger. Every preset is `precise`; `calm` and `lively` are there for your own themes.',
    ],
    [
      ['', 'export function Providers({ children }: { children: ReactNode }) {', '  return <YoujProvider theme={theme}>{children}</YoujProvider>', '}'],
      'The provider hands the personality to `useYouj()` in JavaScript and to the `--yj-duration-*` and `ease-*` values in CSS, as `data-yj-motion`. Without JavaScript, put `data-yj-motion="calm"` on `<html>`.',
    ],
    [['', '// Components don’t change: they ask for tokens by name.'], undefined],
    [MOMENT_COMPONENT[state.moment], `\`${call}\` is the same call in every lane. Only what it resolves to changes, so a theme can change how the whole kit feels without touching a component.`],
  ])
}

/* ── Presence ────────────────────────────────────────────────────────────── */

export const PRESET_TIMING: Record<Preset, { part: string; enter: [string, string]; exit: [string, string]; moves: string }> = {
  'yj-pop': { part: 'Popover, Menu, Select', enter: ['fast', 'enter'], exit: ['instant', 'exit'], moves: 'scales from 0.96 and fades in from its trigger' },
  'yj-dialog': { part: 'Dialog, Alert Dialog', enter: ['base', 'enter'], exit: ['fast', 'exit'], moves: 'rises 6 px while it scales from 0.96' },
  'yj-sheet-end': { part: 'Sheet, Drawer', enter: ['slow', 'enter'], exit: ['base', 'exit'], moves: 'slides fully off its edge, the end edge flipped under right-to-left text' },
  'yj-toast': { part: 'Toast', enter: ['slow', 'enter'], exit: ['slow', 'enter'], moves: 'rises in from the edge and fades as it goes' },
}

const SCOPE_NOTE =
  'A portal renders outside the provider’s element, so it can’t inherit Speed or reduced motion. `useYoujScope()` gives the portal the same settings.'

function presetNote(preset: Preset): string {
  const t = PRESET_TIMING[preset]
  const exitText = preset === 'yj-toast' ? 'and leaves the same way, fading' : `and leaves on \`${t.exit[0]}\` · \`${t.exit[1]}\``
  return `\`${preset}\` ${t.moves}: \`${t.enter[0]}\` · \`${t.enter[1]}\` in ${exitText}. A CSS transition, so reopening mid-close continues from where it is.`
}

function presenceSnippet(state: PlaygroundState): Snippet {
  const preset = state.preset
  const scope: Block = [['  const scope = useYoujScope()'], SCOPE_NOTE]
  if (preset === 'yj-pop') {
    return snippet('share-popover.tsx', [
      [["'use client'", '', "import { Popover } from '@base-ui/react/popover'", "import { useYoujScope } from '@youj/core'", '', 'export function SharePopover() {']],
      scope,
      [['', '  return (', '    <Popover.Root>', '      <Popover.Trigger>Share</Popover.Trigger>', '      <Popover.Portal {...scope}>', '        <Popover.Positioner sideOffset={6}>']],
      [['          <Popover.Popup className="yj-pop rounded-lg border bg-overlay p-4 shadow-md">'], presetNote(preset)],
      [['            Anyone with the link can view this deployment.', '          </Popover.Popup>', '        </Popover.Positioner>', '      </Popover.Portal>', '    </Popover.Root>', '  )', '}']],
      [['', '// Youj UI’s Popover, DropdownMenu and Select already wear yj-pop.'], undefined],
    ])
  }
  if (preset === 'yj-toast') {
    return snippet('toasts.tsx', [
      [["'use client'", '', "import { Toast } from '@base-ui/react/toast'", "import { useYoujScope } from '@youj/core'", '', 'export function Toasts() {', '  const { toasts } = Toast.useToastManager()']],
      scope,
      [['', '  return (', '    <Toast.Portal {...scope}>', '      <Toast.Viewport className="fixed end-4 bottom-4 w-80">', '        {toasts.map((toast) => (']],
      [
        ['          <Toast.Root key={toast.id} toast={toast} className="yj-toast rounded-xl border bg-overlay shadow-lg">'],
        `${presetNote(preset)} Behind the front toast, others peek and shrink, and spread on hover or focus.`,
      ],
      [['            <Toast.Content className="yj-toast-content p-3">'], '`yj-toast-content` hides the text of the toasts behind until the stack spreads.'],
      [['              <Toast.Title />', '            </Toast.Content>', '          </Toast.Root>', '        ))}', '      </Toast.Viewport>', '    </Toast.Portal>', '  )', '}']],
      [['', '// Youj UI’s <Toaster /> and toast() do all of this for you.'], undefined],
    ])
  }
  const sheet = preset === 'yj-sheet-end'
  return snippet(sheet ? 'activity-sheet.tsx' : 'rename-dialog.tsx', [
    [["'use client'", '', "import { Dialog } from '@base-ui/react/dialog'", "import { useYoujScope } from '@youj/core'", '', `export function ${sheet ? 'ActivitySheet' : 'RenameDialog'}() {`]],
    scope,
    [['', '  return (', '    <Dialog.Root>', `      <Dialog.Trigger>${sheet ? 'Activity' : 'Rename'}</Dialog.Trigger>`, '      <Dialog.Portal {...scope}>']],
    [['        <Dialog.Backdrop className="yj-backdrop fixed inset-0 bg-scrim" />'], '`yj-backdrop` fades the scrim in on `base` and out on `fast`. It brings no color of its own.'],
    [
      [
        sheet
          ? '        <Dialog.Popup className="yj-sheet-end fixed inset-y-0 end-0 w-80 border-s bg-overlay p-6">'
          : '        <Dialog.Popup className="yj-dialog fixed top-1/2 left-1/2 w-96 -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-overlay p-6">',
      ],
      sheet ? presetNote(preset) : `${presetNote(preset)} It animates \`transform\`, so centering with \`translate\` keeps working.`,
    ],
    [[`          <Dialog.Title>${sheet ? 'Activity' : 'Rename project'}</Dialog.Title>`, '        </Dialog.Popup>', '      </Dialog.Portal>', '    </Dialog.Root>', '  )', '}']],
    [['', `// Youj UI’s ${sheet ? 'Sheet and Drawer already wear yj-sheet-*' : 'Dialog and AlertDialog already wear yj-dialog'}.`], undefined],
  ])
}

/* ── Reduced motion ──────────────────────────────────────────────────────── */

function reducedSnippet(interaction: Interaction): Snippet {
  if (interaction === 'insert') {
    return snippet('activity.tsx', [
      [["'use client'", '', "import { PresenceItem, PresenceList } from '@youj/motion'", '']],
      [['export function Activity({ rows }: { rows: { id: string; text: string }[] }) {', '  return (', '    <PresenceList>']],
      [
        ['      {rows.map((row) => (', '        <PresenceItem key={row.id}>{row.text}</PresenceItem>', '      ))}'],
        'Nothing to write: PresenceItem reads `useYouj().reduced`. With motion, a new row rises 6 px in on `base` · `enter` while the rows below glide down on `smooth`. Reduced, the row is there at once and the rows below step down in the same frame.',
      ],
      [['    </PresenceList>', '  )', '}']],
    ])
  }
  if (interaction === 'tabs') {
    return snippet('range-picker.tsx', [
      [["'use client'", '', "import { useState } from 'react'", "import { SegmentedControl, SegmentedControlItem } from '@youj/react'", '']],
      [['export function RangePicker() {', "  const [range, setRange] = useState('day')"]],
      [
        ['', '  return (', '    <SegmentedControl value={range} onValueChange={setRange} aria-label="Range">'],
        'The raised key glides on `smooth` through motion’s SlidingIndicator. Reduced, it jumps to the new segment, which is selected and announced either way.',
      ],
      [['      <SegmentedControlItem value="day">Day</SegmentedControlItem>', '      <SegmentedControlItem value="week">Week</SegmentedControlItem>', '      <SegmentedControlItem value="month">Month</SegmentedControlItem>', '    </SegmentedControl>', '  )', '}']],
    ])
  }
  if (interaction === 'save') {
    return snippet('saved-badge.tsx', [
      [["'use client'", '', "import { AnimatePresence, motion } from 'motion/react'", "import { useYouj } from '@youj/core'", "import { CheckIcon } from '@youj/icons'", '']],
      [['export function SavedBadge({ saved }: { saved: boolean }) {']],
      K_LINE,
      [['', '  return (', '    <span role="status">'], 'The status region is always there, so the confirmation is announced with or without motion.'],
      [['      <AnimatePresence>', '        {saved && (', '          <motion.span']],
      [['            initial={k.reduced ? false : { opacity: 0, scale: 0.6 }}'], 'Reduced: no entrance. The badge is simply there, with the same words and the same check.'],
      [['            animate={{ opacity: 1, scale: 1 }}', '            exit={{ opacity: 0 }}']],
      [["            transition={k.reduced ? { duration: 0 } : k.spring('settle')}"], 'With motion it lands on `settle`, the one overshoot, because a save is an arrival. Reduced, the change is instant.'],
      [['          >', '            <CheckIcon size={14} /> Saved', '          </motion.span>', '        )}', '      </AnimatePresence>', '    </span>', '  )', '}']],
    ])
  }
  return snippet('share-menu.tsx', [
    [["'use client'", '', "import { Popover } from '@base-ui/react/popover'", "import { useYoujScope } from '@youj/core'", '', 'export function ShareMenu() {']],
    [['  const scope = useYoujScope()'], 'The scope carries reduced motion to the portal as `--yj-motion`: 1 with motion, 0 when reduced.'],
    [['', '  return (', '    <Popover.Root>', '      <Popover.Trigger>Share</Popover.Trigger>', '      <Popover.Portal {...scope}>', '        <Popover.Positioner sideOffset={6}>']],
    [
      ['          <Popover.Popup className="yj-pop rounded-lg border bg-overlay p-2 shadow-md">…</Popover.Popup>'],
      'Every preset’s duration is the token times `--yj-motion`, so under reduced motion the menu opens at once, and Base UI unmounts it at once on close because there’s nothing to wait for.',
    ],
    [['        </Popover.Positioner>', '      </Popover.Portal>', '    </Popover.Root>', '  )', '}']],
    [
      ['', '// Your own transitions get the same for free:', '// <ChevronDownIcon className="transition-transform yj-duration-base ease-standard" />'],
      'The `yj-duration-*` utilities are token × Speed × `--yj-motion`, so a chevron that turns snaps under reduced motion and still ends up turned.',
    ],
  ])
}

export function playgroundSnippet(state: PlaygroundState, personality: MotionPersonality): Snippet {
  switch (state.tab) {
    case 'springs':
      return springsSnippet(state, personality)
    case 'tweens':
      return tweensSnippet(state, personality)
    case 'stagger':
      return staggerSnippet(state, personality)
    case 'personalities':
      return personalitiesSnippet(state)
    case 'presence':
      return presenceSnippet(state)
    case 'reduced':
      return reducedSnippet(state.interaction)
  }
}
