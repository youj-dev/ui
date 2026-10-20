import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { motion } from 'motion/react'
import { useYouj } from '@youj/core'
import { cn } from '@youj/core'
import type { YoujIconComponent } from './icon-base'
import { AlignCenterHorizontalIcon } from './align-center-horizontal'
import { AlignCenterIcon } from './align-center'
import { AlignCenterVerticalIcon } from './align-center-vertical'
import { AlignEndHorizontalIcon } from './align-end-horizontal'
import { AlignEndVerticalIcon } from './align-end-vertical'
import { AlignJustifyIcon } from './align-justify'
import { AlignLeftIcon } from './align-left'
import { AlignRightIcon } from './align-right'
import { AlignStartHorizontalIcon } from './align-start-horizontal'
import { AlignStartVerticalIcon } from './align-start-vertical'
import { CircleIcon } from './circle'
import { DotIcon } from './dot'
import { FrameIcon } from './frame'
import { HandIcon } from './hand'
import { MousePointerIcon } from './mouse-pointer'
import { RectangleHorizontalIcon } from './rectangle-horizontal'
import { SquareIcon } from './square'
import { TextCursorInputIcon } from './text-cursor-input'
import { TypeIcon } from './type'
import { ease, focusRing } from './story-kit'

const meta = {
  title: 'Icons/In context/Editor & shapes',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The editor and shape icons inside a design tool. The six alignment buttons really align the selection on the canvas: each icon slides its objects off the guide and snaps them back, the way the canvas objects then move. Text alignment, the tool rail and the layer list play their icons when hovered or keyboard-focused, and the presence dot runs as a live indicator (`trigger="loop"`). Under reduced motion (toolbar → Motion: reduced) the icons hold still and the canvas objects jump straight to their new place.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/* ── Shared UI ───────────────────────────────────────────────────────────── */


function IconButton({ label, pressed, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-hover hover:text-fg disabled:pointer-events-none disabled:opacity-40',
        ease,
        focusRing,
        pressed && 'bg-selected text-fg',
        className,
      )}
      {...props}
    />
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-line px-4 py-3.5 last:border-b-0">
      <h3 className="mb-2.5 text-[11px] font-semibold tracking-wide text-fg-subtle uppercase">{title}</h3>
      {children}
    </section>
  )
}

/* ── The canvas selection ────────────────────────────────────────────────── */

type Edge = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
interface Box {
  x: number
  y: number
  w: number
  h: number
}

const START: [Box, Box] = [
  { x: 36, y: 40, w: 150, h: 44 },
  { x: 214, y: 118, w: 76, h: 76 },
]

/** Aligns both boxes to the selection's bounding box, as a design tool does. */
function align(boxes: [Box, Box], edge: Edge): [Box, Box] {
  const left = Math.min(...boxes.map((b) => b.x))
  const right = Math.max(...boxes.map((b) => b.x + b.w))
  const top = Math.min(...boxes.map((b) => b.y))
  const bottom = Math.max(...boxes.map((b) => b.y + b.h))
  return boxes.map((b) => {
    switch (edge) {
      case 'left':
        return { ...b, x: left }
      case 'center':
        return { ...b, x: (left + right) / 2 - b.w / 2 }
      case 'right':
        return { ...b, x: right - b.w }
      case 'top':
        return { ...b, y: top }
      case 'middle':
        return { ...b, y: (top + bottom) / 2 - b.h / 2 }
      case 'bottom':
        return { ...b, y: bottom - b.h }
    }
  }) as [Box, Box]
}

const ALIGN: { edge: Edge; label: string; Icon: YoujIconComponent }[] = [
  { edge: 'left', label: 'Align left', Icon: AlignStartVerticalIcon },
  { edge: 'center', label: 'Align horizontal centers', Icon: AlignCenterVerticalIcon },
  { edge: 'right', label: 'Align right', Icon: AlignEndVerticalIcon },
  { edge: 'top', label: 'Align top', Icon: AlignStartHorizontalIcon },
  { edge: 'middle', label: 'Align vertical centers', Icon: AlignCenterHorizontalIcon },
  { edge: 'bottom', label: 'Align bottom', Icon: AlignEndHorizontalIcon },
]

type TextAlign = 'left' | 'center' | 'right' | 'justify'
const TEXT_ALIGN: { value: TextAlign; label: string; icon: ReactNode }[] = [
  // AlignLeft is a state icon (left ↔ center); held still here, where it names one option among four.
  { value: 'left', label: 'Align text left', icon: <AlignLeftIcon size={16} trigger="none" /> },
  { value: 'center', label: 'Align text center', icon: <AlignCenterIcon size={16} /> },
  { value: 'right', label: 'Align text right', icon: <AlignRightIcon size={16} /> },
  { value: 'justify', label: 'Justify text', icon: <AlignJustifyIcon size={16} /> },
]

const TOOLS: { id: string; label: string; key: string; Icon: YoujIconComponent }[] = [
  { id: 'move', label: 'Move', key: 'V', Icon: MousePointerIcon },
  { id: 'hand', label: 'Hand', key: 'H', Icon: HandIcon },
  { id: 'frame', label: 'Frame', key: 'F', Icon: FrameIcon },
  { id: 'rectangle', label: 'Rectangle', key: 'R', Icon: SquareIcon },
  { id: 'ellipse', label: 'Ellipse', key: 'O', Icon: CircleIcon },
  { id: 'text', label: 'Text', key: 'T', Icon: TypeIcon },
]

const LAYERS: { name: string; kind: string; Icon: YoujIconComponent; depth: number }[] = [
  { name: 'Sign-up card', kind: 'Frame', Icon: FrameIcon, depth: 0 },
  { name: 'Avatar', kind: 'Ellipse', Icon: CircleIcon, depth: 1 },
  { name: 'Name', kind: 'Input', Icon: TextCursorInputIcon, depth: 1 },
  { name: 'Email', kind: 'Input', Icon: TextCursorInputIcon, depth: 1 },
  { name: 'Create account', kind: 'Button', Icon: RectangleHorizontalIcon, depth: 1 },
  { name: 'Beta badge', kind: 'Rectangle', Icon: SquareIcon, depth: 1 },
]

const COPY = 'Design systems scale when the smallest pieces are precise. Every icon here lands on the same grid, the same stroke, the same timing.'

function Editor() {
  const k = useYouj()
  const [tool, setTool] = useState('move')
  const [selected, setSelected] = useState(new Set(['Create account', 'Beta badge']))
  const [boxes, setBoxes] = useState<[Box, Box]>(START)
  const [textAlign, setTextAlign] = useState<TextAlign>('left')
  const toggle = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4 md:p-10">
      <div className="flex w-full max-w-[1080px] overflow-hidden rounded-2xl border border-line bg-surface shadow-sm max-lg:flex-col">
        {/* Tool rail */}
        <div role="group" aria-label="Tools" className="flex shrink-0 gap-1 border-line p-2 max-lg:border-b lg:flex-col lg:border-e">
          {TOOLS.map(({ id, label, key, Icon }) => (
            <IconButton key={id} label={`${label} (${key})`} pressed={tool === id} onClick={() => setTool(id)}>
              <Icon size={18} />
            </IconButton>
          ))}
        </div>

        {/* Layers */}
        <nav aria-label="Layers" className="w-full shrink-0 border-line py-2 max-lg:border-b lg:w-56 lg:border-e">
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-xs font-semibold text-fg">Layers</span>
            <span className="text-[11px] text-fg-subtle">{selected.size} selected</span>
          </div>
          <ul>
            {LAYERS.map(({ name, kind, Icon, depth }) => (
              <li key={name}>
                <button
                  type="button"
                  aria-pressed={selected.has(name)}
                  onClick={() => toggle(name)}
                  className={cn(
                    'flex w-full items-center gap-2 py-1.5 pe-3 text-start text-[13px] text-fg-muted hover:bg-hover hover:text-fg',
                    ease,
                    focusRing,
                    selected.has(name) && 'bg-accent-subtle text-fg',
                  )}
                  style={{ paddingInlineStart: 12 + depth * 16 }}
                >
                  <Icon size={14} strokeWidth={1.75} className="shrink-0 text-fg-subtle" aria-label={kind} />
                  <span className="truncate">{name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Canvas */}
        <div className="relative flex min-h-[340px] min-w-0 flex-1 items-center justify-center bg-canvas p-6">
          {/* A canvas keeps its own left-to-right coordinates in any reading direction. */}
          <div dir="ltr" className="relative h-[240px] w-[330px] rounded-lg border border-dashed border-line bg-surface">
            <span className="absolute -top-5 left-0 text-[11px] text-fg-subtle">Sign-up card</span>
            {boxes.map((b, i) => (
              <motion.div
                key={i}
                aria-hidden
                initial={false}
                animate={{ x: b.x, y: b.y }}
                transition={k.spring('smooth')}
                style={{ width: b.w, height: b.h }}
                className={cn(
                  'absolute top-0 left-0 flex items-center justify-center border-2 border-accent text-[11px] font-medium',
                  i === 0 ? 'rounded-lg bg-well text-fg' : 'rounded-md bg-accent text-on-accent',
                )}
              >
                {i === 0 ? 'Create account' : 'Beta'}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Inspector */}
        <aside aria-label="Inspector" className="w-full shrink-0 border-line max-lg:border-t lg:w-72 lg:border-s">
          <Section title="Align">
            <div role="group" aria-label="Align selection" className="grid grid-cols-6 gap-0.5 rounded-lg bg-well p-0.5">
              {ALIGN.map(({ edge, label, Icon }) => (
                <IconButton key={edge} label={label} onClick={() => setBoxes((prev) => align(prev, edge))} className="w-full hover:bg-key">
                  <Icon size={16} />
                </IconButton>
              ))}
            </div>
            <button type="button" onClick={() => setBoxes(START)} className={cn('mt-2 text-[11px] text-fg-subtle hover:text-fg', ease, focusRing)}>
              Reset positions
            </button>
          </Section>
          <Section title="Text">
            <div role="radiogroup" aria-label="Text alignment" className="grid grid-cols-4 gap-0.5 rounded-lg bg-well p-0.5">
              {TEXT_ALIGN.map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={textAlign === value}
                  aria-label={label}
                  title={label}
                  onClick={() => setTextAlign(value)}
                  className={cn('flex h-7 items-center justify-center rounded-md text-fg-muted hover:text-fg', ease, focusRing, textAlign === value && 'bg-key text-fg shadow-sm')}
                >
                  {icon}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-fg-muted" style={{ textAlign }}>
              {COPY}
            </p>
          </Section>
          <Section title="Presence">
            <div className="flex items-center gap-2 text-[13px] text-fg">
              <DotIcon size={16} trigger="loop" className="text-success" aria-label="Live" />
              3 people editing
            </div>
            <p className="mt-1 text-[11px] text-fg-subtle">Changes sync as you make them.</p>
          </Section>
        </aside>
      </div>
    </div>
  )
}

export const Inspector: Story = {
  render: () => <Editor />,
}

/** Every icon of the batch at the sizes the kit uses, hover any tile. */
export const Sheet: Story = {
  render: () => {
    const all: YoujIconComponent[] = [
      AlignRightIcon,
      AlignJustifyIcon,
      AlignStartVerticalIcon,
      AlignCenterVerticalIcon,
      AlignEndVerticalIcon,
      AlignStartHorizontalIcon,
      AlignCenterHorizontalIcon,
      AlignEndHorizontalIcon,
      FrameIcon,
      HandIcon,
      SquareIcon,
      CircleIcon,
      DotIcon,
      RectangleHorizontalIcon,
      TextCursorInputIcon,
    ]
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {all.map((Icon) => (
            <li key={Icon.meta.name}>
              <button
                type="button"
                className={cn('flex w-36 flex-col items-center gap-3 rounded-xl border border-line bg-surface px-3 py-4 text-fg-muted hover:text-fg', ease, focusRing)}
              >
                <span className="flex items-end gap-3">
                  <Icon size={16} />
                  <Icon size={24} />
                  <Icon size={40} strokeWidth={1.25} />
                </span>
                <span className="font-mono text-[10.5px] text-fg-subtle">{Icon.meta.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  },
}
