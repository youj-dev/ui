import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AnimatePresence, motion, useDragControls, useMotionValue } from 'motion/react'
import { useYouj } from '@youj/core'
import { cn } from '@youj/core'
import {
  AlignCenterIcon,
  AlignLeftIcon,
  ArrowDownIcon,
  ArrowDownLeftIcon,
  ArrowLeftIcon,
  ArrowLeftRightIcon,
  ArrowRightIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  BoldIcon,
  BookmarkIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  CodeXmlIcon,
  CopyIcon,
  CornerDownLeftIcon,
  ExternalLinkIcon,
  GripIcon,
  HeadingIcon,
  ItalicIcon,
  LinkIcon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  LogInIcon,
  LogOutIcon,
  MaximizeIcon,
  MinimizeIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  PanelRightIcon,
  PaperclipIcon,
  PlayIcon,
  QuoteIcon,
  RedoIcon,
  RepeatIcon,
  ShuffleIcon,
  SidebarIcon,
  SkipForwardIcon,
  StrikethroughIcon,
  TrashIcon,
  TypeIcon,
  UnderlineIcon,
  UndoIcon,
  type YoujIconComponent,
} from './index'
import { ease, focusRing, Panel, Stage } from './story-kit'

const meta = {
  title: 'Icons/In context/Arrows & editor',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The arrows, navigation and editor icons inside real product UI. Every state icon is driven by the state of its control: the sidebar and inspector fold their dividers into chevrons, focus mode folds the corners in, bold thickens, the list toggles into a checklist, undo turns over into redo while Shift is held, the drag handle fuses into bars while a row is lifted, sort arrows flip, and the overflow dots stretch into a close. Hover-only icons play when their button, link or menu item is hovered or keyboard-focused. Under reduced motion (toolbar → Motion: reduced) every state icon switches straight to its other pose and hover icons hold still, so the UI reads the same without the movement.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/* ── Shared UI ───────────────────────────────────────────────────────────── */


type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
function Button({ variant = 'secondary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap disabled:pointer-events-none disabled:opacity-40',
        ease,
        focusRing,
        variant === 'primary' && 'bg-accent text-on-accent hover:opacity-90',
        variant === 'secondary' && 'border border-line bg-surface text-fg hover:bg-hover',
        variant === 'ghost' && 'text-fg-muted hover:bg-hover hover:text-fg',
        variant === 'danger' && 'text-fg-muted hover:bg-hover hover:text-danger',
        className,
      )}
      {...props}
    />
  )
}

/** A square icon-only button. `pressed` turns it into a toggle. */
function IconButton({
  label,
  pressed,
  className,
  ref,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; pressed?: boolean; ref?: RefObject<HTMLButtonElement | null> }) {
  return (
    <button
      ref={ref}
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

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line bg-canvas px-1 font-mono text-[10px] leading-4 text-fg-muted">{children}</kbd>
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line" />
}

/** Closes a popover on a click outside it or its trigger. Escape is handled by the popover itself. */
function useClickOutside(open: boolean, close: () => void, refs: RefObject<HTMLElement | null>[]) {
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!refs.some((r) => r.current?.contains(e.target as Node))) close()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open, close, refs])
}

/** Arrow keys move between the items of a menu or listbox; Escape closes it and returns focus to the trigger. */
function useRovingKeys(role: 'menuitem' | 'option', close: () => void, trigger: RefObject<HTMLElement | null>) {
  return (e: ReactKeyboardEvent<HTMLElement>) => {
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>(`[role="${role}"]`)]
    const i = items.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length
      items[next]?.focus()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
      trigger.current?.focus()
    } else if (e.key === 'Tab') {
      close()
    }
  }
}

interface MenuItem {
  label: string
  Icon: YoujIconComponent
  onSelect?: () => void
  danger?: boolean
}

function Menu({ items, close, trigger, label, className }: { items: MenuItem[]; close: () => void; trigger: RefObject<HTMLElement | null>; label: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const onKeyDown = useRovingKeys('menuitem', close, trigger)
  useClickOutside(true, close, [ref, trigger])
  useEffect(() => ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus(), [])
  return (
    <div ref={ref} role="menu" aria-label={label} onKeyDown={onKeyDown} className={cn('absolute z-30 w-52 rounded-xl border border-line bg-surface p-1 shadow-lg', className)}>
      {items.map(({ label: itemLabel, Icon, onSelect, danger }) => (
        <button
          key={itemLabel}
          type="button"
          role="menuitem"
          tabIndex={-1}
          onClick={() => {
            onSelect?.()
            close()
            trigger.current?.focus()
          }}
          className={cn(
            'flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-start text-sm text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:bg-hover focus-visible:text-fg',
            ease,
            danger && 'hover:text-danger focus-visible:text-danger',
          )}
        >
          <Icon size={16} />
          {itemLabel}
        </button>
      ))}
    </div>
  )
}

/* ── Editor ──────────────────────────────────────────────────────────────── */

type Block = 'text' | 'heading' | 'quote' | 'code'
type ListStyle = 'bullets' | 'checks' | 'numbers'
type Mark = 'bold' | 'italic' | 'underline' | 'strike' | 'code'
interface Doc {
  block: Block
  marks: Record<Mark, boolean>
  list: ListStyle
  centred: boolean
}

const BLOCKS: { id: Block; label: string; Icon: YoujIconComponent }[] = [
  { id: 'text', label: 'Text', Icon: TypeIcon },
  { id: 'heading', label: 'Heading', Icon: HeadingIcon },
  { id: 'quote', label: 'Quote', Icon: QuoteIcon },
  { id: 'code', label: 'Code', Icon: CodeXmlIcon },
]

const MARKS: { id: Exclude<Mark, 'bold'>; label: string; Icon: YoujIconComponent }[] = [
  { id: 'italic', label: 'Italic', Icon: ItalicIcon },
  { id: 'underline', label: 'Underline', Icon: UnderlineIcon },
  { id: 'strike', label: 'Strikethrough', Icon: StrikethroughIcon },
  { id: 'code', label: 'Inline code', Icon: CodeXmlIcon },
]

const MARK_CLASS: Record<Mark, string> = {
  bold: 'font-semibold text-fg',
  italic: 'italic',
  underline: 'underline decoration-1 underline-offset-[3px]',
  strike: 'line-through',
  code: 'font-mono text-[0.9em]',
}

const TREE = [
  { id: 'product', label: 'Product', pages: ['Roadmap', 'Pricing'] },
  { id: 'launch', label: 'Launch', pages: ['Launch plan', 'Press kit', 'Assets'] },
  { id: 'archive', label: 'Archive', pages: ['Q3 review', 'Offsite notes'] },
]

const CHECKLIST = ['Freeze the pricing page', 'Record the two-minute demo', 'Draft the changelog']
const ATTACHMENTS = ['launch-brief.pdf', 'press-shots.zip', 'timeline.key']

const INITIAL_DOC: Doc = {
  block: 'text',
  marks: { bold: true, italic: false, underline: false, strike: false, code: false },
  list: 'bullets',
  centred: false,
}

function useHistory<T>(initial: T) {
  const [h, setH] = useState({ past: [] as T[], present: initial, future: [] as T[] })
  return {
    value: h.present,
    set: (next: T) => setH((s) => ({ past: [...s.past, s.present], present: next, future: [] })),
    undo: () => setH((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1]!, future: [s.present, ...s.future] } : s)),
    redo: () => setH((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0]!, future: s.future.slice(1) } : s)),
    canUndo: h.past.length > 0,
    canRedo: h.future.length > 0,
  }
}

/** True while Shift is held anywhere on the page. */
function useShiftHeld() {
  const [held, setHeld] = useState(false)
  useEffect(() => {
    const sync = (e: KeyboardEvent) => setHeld(e.shiftKey)
    const release = () => setHeld(false)
    window.addEventListener('keydown', sync)
    window.addEventListener('keyup', sync)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('keydown', sync)
      window.removeEventListener('keyup', sync)
      window.removeEventListener('blur', release)
    }
  }, [])
  return held
}

function BlockSelect({ value, onChange }: { value: Block; onChange: (b: Block) => void }) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)
  const onKeyDown = useRovingKeys('option', close, trigger)
  const current = BLOCKS.find((b) => b.id === value)!
  const id = useId()
  useClickOutside(open, close, [list, trigger])
  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus()
  }, [open])

  return (
    <div className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={`Block type: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
        className={cn('inline-flex h-8 w-[118px] items-center gap-2 rounded-md px-2 text-sm text-fg hover:bg-hover', ease, focusRing, open && 'bg-selected')}
      >
        <current.Icon size={16} className="text-fg-muted" />
        <span className="flex-1 text-start">{current.label}</span>
        <ChevronsUpDownIcon size={14} active={open} className="text-fg-subtle" />
      </button>
      {open && (
        <div ref={list} id={id} role="listbox" aria-label="Block type" onKeyDown={onKeyDown} className="absolute start-0 top-10 z-30 w-52 rounded-xl border border-line bg-surface p-1 shadow-lg">
          {BLOCKS.map((b) => (
            <button
              key={b.id}
              type="button"
              role="option"
              aria-selected={b.id === value}
              tabIndex={-1}
              onClick={() => {
                onChange(b.id)
                close()
                trigger.current?.focus()
              }}
              className={cn(
                'group flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-start text-sm text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:bg-hover focus-visible:text-fg',
                ease,
                b.id === value && 'text-fg',
              )}
            >
              <b.Icon size={16} />
              <span className="flex-1">{b.label}</span>
              <span className="flex items-center gap-1 text-fg-subtle opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
                <CornerDownLeftIcon size={13} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Toolbar({ doc, history, onAttach }: { doc: Doc; history: ReturnType<typeof useHistory<Doc>>; onAttach: () => void }) {
  const shift = useShiftHeld()
  const set = (patch: Partial<Doc>) => history.set({ ...doc, ...patch })
  const toggleMark = (m: Mark) => set({ marks: { ...doc.marks, [m]: !doc.marks[m] } })
  return (
    <div aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-line px-2 py-1.5">
      {/* Like a macOS alternate menu item: holding Shift turns undo into redo. */}
      <IconButton
        label={shift ? 'Redo' : 'Undo (hold Shift to redo)'}
        disabled={shift ? !history.canRedo : !history.canUndo}
        onClick={shift ? history.redo : history.undo}
      >
        <UndoIcon size={16} active={shift} />
      </IconButton>
      <IconButton label="Redo" disabled={!history.canRedo} onClick={history.redo}>
        <RedoIcon size={16} />
      </IconButton>
      <Divider />
      <BlockSelect value={doc.block} onChange={(block) => set({ block })} />
      <Divider />
      <IconButton label="Bold" pressed={doc.marks.bold} onClick={() => toggleMark('bold')}>
        <BoldIcon size={16} active={doc.marks.bold} />
      </IconButton>
      {MARKS.map(({ id, label, Icon }) => (
        <IconButton key={id} label={label} pressed={doc.marks[id]} onClick={() => toggleMark(id)}>
          <Icon size={16} />
        </IconButton>
      ))}
      <Divider />
      <IconButton label={doc.list === 'checks' ? 'Bulleted list' : 'Checklist'} pressed={doc.list === 'checks'} onClick={() => set({ list: doc.list === 'checks' ? 'bullets' : 'checks' })}>
        <ListIcon size={16} active={doc.list === 'checks'} />
      </IconButton>
      <IconButton label="Numbered list" pressed={doc.list === 'numbers'} onClick={() => set({ list: doc.list === 'numbers' ? 'bullets' : 'numbers' })}>
        <ListOrderedIcon size={16} />
      </IconButton>
      <IconButton label={doc.centred ? 'Align left' : 'Align center'} pressed={doc.centred} onClick={() => set({ centred: !doc.centred })}>
        <AlignLeftIcon size={16} active={doc.centred} />
      </IconButton>
      <Divider />
      <IconButton label="Attach a file" onClick={onAttach}>
        <PaperclipIcon size={16} />
      </IconButton>
    </div>
  )
}

function Document({ doc, done, onToggle, attachments, centreTitle }: { doc: Doc; done: boolean[]; onToggle: (i: number) => void; attachments: string[]; centreTitle: boolean }) {
  const selection = (
    <span className={cn('-mx-0.5 rounded-[3px] bg-accent-subtle px-0.5 text-fg ring-1 ring-accent-line', ...(Object.keys(doc.marks) as Mark[]).filter((m) => doc.marks[m]).map((m) => MARK_CLASS[m]))}>
      public beta
    </span>
  )
  const sentence = <>We open the {selection} on March 12 to the 4,200 teams on the waitlist, with self-serve billing from day one.</>
  const block = {
    text: <p className="text-[15px] leading-7 text-fg-muted">{sentence}</p>,
    heading: <h2 className="text-xl leading-8 font-semibold tracking-tight text-fg">{sentence}</h2>,
    quote: <blockquote className="border-s-2 border-line-strong ps-4 text-[15px] leading-7 text-fg-muted italic">{sentence}</blockquote>,
    code: <pre className="rounded-lg bg-well px-4 py-3 font-mono text-[13px] leading-6 whitespace-pre-wrap text-fg">{sentence}</pre>,
  }[doc.block]

  return (
    <article className={cn('mx-auto flex max-w-[600px] flex-col gap-5 px-6 py-8 md:px-10', doc.centred && 'text-center')}>
      <p className={cn('font-mono text-[11px] tracking-[0.16em] text-fg-muted uppercase', centreTitle && 'text-center')}>Launch · Draft</p>
      <h1 className={cn('-mt-3 text-[28px] font-semibold tracking-tight text-fg', centreTitle && 'text-center')}>Launch plan</h1>
      {block}
      <div className={cn('flex flex-col gap-2 text-start', doc.centred && 'self-center')}>
        {CHECKLIST.map((item, i) => (
          <div key={item} className="flex items-center gap-3 text-[15px] text-fg-muted">
            {doc.list === 'bullets' && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-fg-subtle" />}
            {doc.list === 'numbers' && <span aria-hidden className="w-4 shrink-0 text-end font-mono text-[13px] text-fg-muted tabular-nums">{i + 1}.</span>}
            {doc.list === 'checks' && (
              <button
                type="button"
                role="checkbox"
                aria-checked={done[i]}
                aria-label={item}
                onClick={() => onToggle(i)}
                className={cn('flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border', ease, focusRing, done[i] ? 'border-accent bg-accent text-on-accent' : 'border-line-strong hover:border-fg-subtle')}
              >
                {done[i] && <CheckIcon size={12} strokeWidth={2.5} trigger="mount" />}
              </button>
            )}
            <span className={cn(doc.list === 'checks' && done[i] && 'text-fg-muted line-through')}>{item}</span>
          </div>
        ))}
      </div>
      <h2 className="mt-2 text-[15px] font-semibold text-fg">Open questions</h2>
      <p className="-mt-3 text-[15px] leading-7 text-fg-muted">
        Do we gate the API behind the waitlist or open it with the beta? Pricing needs an answer by Friday so the page can freeze.
      </p>
      {attachments.length > 0 && (
        <ul aria-label="Attachments" className={cn('flex flex-wrap gap-2', doc.centred && 'justify-center')}>
          {attachments.map((name) => (
            <motion.li key={name} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-canvas px-2 font-mono text-xs text-fg-muted">
              <PaperclipIcon size={13} trigger="mount" />
              {name}
            </motion.li>
          ))}
        </ul>
      )}
    </article>
  )
}

function Sidebar({ signedIn, onSign }: { signedIn: boolean; onSign: () => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ launch: true })
  return (
    <nav aria-label="Pages" className="hidden w-56 shrink-0 flex-col border-r border-line bg-canvas md:flex">
      <div className="flex h-12 items-center gap-2 border-b border-line px-4">
        <span className="size-5 rounded-md bg-accent" />
        <span className="text-sm font-semibold tracking-tight text-fg">Acme</span>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        <p className="px-2 pt-1 pb-1.5 text-[11px] font-medium tracking-wider text-fg-muted uppercase">Pages</p>
        {TREE.map((group) => (
          <div key={group.id}>
            <button
              type="button"
              aria-expanded={Boolean(open[group.id])}
              onClick={() => setOpen((o) => ({ ...o, [group.id]: !o[group.id] }))}
              className={cn('flex h-8 w-full items-center gap-1.5 rounded-md px-1.5 text-start text-sm text-fg-muted hover:bg-hover hover:text-fg', ease, focusRing)}
            >
              <ChevronRightIcon size={14} strokeWidth={1.75} active={Boolean(open[group.id])} className="text-fg-subtle" />
              {group.label}
            </button>
            {open[group.id] && (
              <ul className="mb-1">
                {group.pages.map((p) => (
                  <li key={p}>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      aria-current={p === 'Launch plan' ? 'page' : undefined}
                      className={cn('flex h-8 items-center rounded-md ps-[30px] pe-2 text-sm', ease, focusRing, p === 'Launch plan' ? 'bg-selected text-fg' : 'text-fg-muted hover:bg-hover hover:text-fg')}
                    >
                      {p}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2.5 border-t border-line p-2 ps-3">
        {signedIn ? (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-well text-[11px] font-semibold text-fg">MS</span>
        ) : (
          <span className="size-7 shrink-0 rounded-full border border-dashed border-line-strong" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-fg">{signedIn ? 'Mira Sol' : 'Guest'}</p>
          <p className="truncate text-[11px] text-fg-muted">{signedIn ? 'mira@acme.so' : 'Read-only'}</p>
        </div>
        <IconButton label={signedIn ? 'Sign out' : 'Sign in'} onClick={onSign}>
          <LogInIcon size={16} active={signedIn} />
        </IconButton>
      </div>
    </nav>
  )
}

function Inspector({ centreTitle, onCentreTitle }: { centreTitle: boolean; onCentreTitle: () => void }) {
  const [langs, setLangs] = useState(['English', 'Español'])
  const heading = 'mb-2 text-[11px] font-medium tracking-wider text-fg-muted uppercase'
  return (
    <aside aria-label="Page details" className="hidden w-64 shrink-0 flex-col gap-6 overflow-y-auto border-l border-line bg-canvas p-4 lg:flex">
      <section>
        <h3 className={heading}>Details</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
          <dt className="text-fg-muted">Status</dt>
          <dd className="text-fg">Draft</dd>
          <dt className="text-fg-muted">Words</dt>
          <dd className="text-fg tabular-nums">1,284</dd>
          <dt className="text-fg-muted">Edited</dt>
          <dd className="text-fg">2 minutes ago</dd>
        </dl>
      </section>
      <section>
        <h3 className={heading}>Layout</h3>
        <button
          type="button"
          role="switch"
          aria-checked={centreTitle}
          onClick={onCentreTitle}
          className={cn('flex h-9 w-full items-center gap-2.5 rounded-lg border border-line px-2.5 text-start text-[13px] text-fg-muted hover:bg-hover hover:text-fg', ease, focusRing)}
        >
          <AlignCenterIcon size={16} />
          <span className="flex-1">Center the title</span>
          <span aria-hidden className={cn('flex h-4 w-7 items-center rounded-full p-0.5', ease, centreTitle ? 'bg-accent' : 'bg-line-strong')}>
            <span className={cn('size-3 rounded-full bg-surface transition-transform duration-(--yj-duration-fast) ease-standard', centreTitle && 'translate-x-3')} />
          </span>
        </button>
      </section>
      <section>
        <h3 className={heading}>Translate</h3>
        <div className="flex items-center gap-1.5">
          {langs.map((lang, i) => (
            <motion.span key={lang} layout className={cn('flex h-8 flex-1 items-center justify-center rounded-md border border-line text-[13px] text-fg', i === 1 && 'order-3')}>
              {lang}
            </motion.span>
          ))}
          <IconButton label="Swap languages" className="order-2" onClick={() => setLangs(([a, b]) => [b!, a!])}>
            <ArrowLeftRightIcon size={16} />
          </IconButton>
        </div>
      </section>
      <section className="mt-auto flex flex-col gap-1">
        <h3 className={heading}>Sharing</h3>
        <a href="#" onClick={(e) => e.preventDefault()} className={cn('flex h-8 items-center gap-2 rounded-md px-1 text-[13px] text-fg-muted hover:text-fg', ease, focusRing)}>
          <span className="flex-1 truncate font-mono">acme.so/launch</span>
          <ExternalLinkIcon size={14} strokeWidth={1.75} />
        </a>
        <Button variant="danger" className="-mx-1 justify-start px-1">
          <LogOutIcon size={16} />
          Leave page
        </Button>
      </section>
    </aside>
  )
}

function EditorDemo() {
  const history = useHistory(INITIAL_DOC)
  const doc = history.value
  const [sidebar, setSidebar] = useState(true)
  const [inspector, setInspector] = useState(true)
  const [focus, setFocus] = useState(false)
  const [saved, setSaved] = useState(false)
  const [menu, setMenu] = useState(false)
  const [signedIn, setSignedIn] = useState(true)
  const [centreTitle, setCentreTitle] = useState(false)
  const [done, setDone] = useState([true, false, false])
  const [attachments, setAttachments] = useState<string[]>([])
  const menuTrigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!focus) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) setFocus(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focus])

  return (
    <Stage>
      <Panel className="relative flex h-[660px] w-full max-w-[1120px] overflow-hidden">
        {sidebar && !focus && <Sidebar signedIn={signedIn} onSign={() => setSignedIn((s) => !s)} />}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <header className="flex h-12 shrink-0 items-center gap-1 border-b border-line px-2">
            {!focus && (
              <IconButton label={sidebar ? 'Hide sidebar' : 'Show sidebar'} aria-expanded={sidebar} onClick={() => setSidebar((s) => !s)}>
                <SidebarIcon size={18} active={!sidebar} />
              </IconButton>
            )}
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 px-1 text-sm">
              <a href="#" onClick={(e) => e.preventDefault()} className={cn('rounded text-fg-muted hover:text-fg', ease, focusRing)}>
                Launch
              </a>
              <span className="text-fg-muted">/</span>
              <span aria-current="page" className="truncate text-fg">
                Launch plan
              </span>
            </nav>
            <div className="ms-auto flex items-center gap-0.5">
              <IconButton label={saved ? 'Remove bookmark' : 'Bookmark this page'} pressed={saved} onClick={() => setSaved((s) => !s)}>
                <BookmarkIcon size={18} active={saved} />
              </IconButton>
              <IconButton label={focus ? 'Exit focus mode' : 'Focus mode'} pressed={focus} onClick={() => setFocus((f) => !f)}>
                <MaximizeIcon size={18} active={focus} />
              </IconButton>
              {!focus && (
                <IconButton label={inspector ? 'Hide details' : 'Show details'} aria-expanded={inspector} onClick={() => setInspector((s) => !s)}>
                  <PanelRightIcon size={18} active={!inspector} />
                </IconButton>
              )}
              <div className="relative">
                <IconButton ref={menuTrigger} label="More actions" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
                  <MoreHorizontalIcon size={18} active={menu} />
                </IconButton>
                {menu && (
                  <Menu
                    label="Page actions"
                    trigger={menuTrigger}
                    close={() => setMenu(false)}
                    className="end-0 top-10"
                    items={[
                      { label: 'Open in new tab', Icon: ExternalLinkIcon },
                      { label: 'Copy link', Icon: LinkIcon },
                      { label: 'Duplicate', Icon: CopyIcon },
                      { label: 'Move to trash', Icon: TrashIcon, danger: true },
                    ]}
                  />
                )}
              </div>
            </div>
          </header>
          <Toolbar doc={doc} history={history} onAttach={() => setAttachments((a) => (a.length < ATTACHMENTS.length ? [...a, ATTACHMENTS[a.length]!] : a))} />
          <main className="min-h-0 flex-1 overflow-y-auto">
            <Document doc={doc} done={done} onToggle={(i) => setDone((d) => d.map((v, j) => (j === i ? !v : v)))} attachments={attachments} centreTitle={centreTitle} />
          </main>
          <AnimatePresence>
            {focus && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <Button onClick={() => setFocus(false)} className="h-8 rounded-full border border-line bg-surface ps-3 pe-2 text-xs text-fg-muted shadow-lg hover:text-fg">
                  <MinimizeIcon size={14} strokeWidth={1.75} />
                  Exit focus
                  <Kbd>esc</Kbd>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {inspector && !focus && <Inspector centreTitle={centreTitle} onCentreTitle={() => setCentreTitle((c) => !c)} />}
      </Panel>
    </Stage>
  )
}

export const Editor: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A document editor. The sidebar and inspector toggles fold their dividers into chevrons, focus mode folds the corners in, the page tree turns its chevrons, bookmarking fills the ribbon and signing out swings the door. In the toolbar, bold thickens the letter, the list button unfolds bullets into ticks, alignment slides the lines to center and the block picker folds its chevrons while open. Hold Shift and undo turns over into redo.',
      },
    },
  },
  render: () => <EditorDemo />,
}

/* ── Tasks: drag list, sorting, pagination ───────────────────────────────── */

interface Task {
  id: number
  title: string
  priority: 0 | 1 | 2
  due: number
  done: boolean
  from?: string
}

const PRIORITY = ['High', 'Medium', 'Low'] as const
const TITLES = [
  'Freeze the pricing page',
  'Record the two-minute demo',
  'Draft the changelog',
  'Brief the support team',
  'Load-test the signup flow',
  'Book the launch-day livestream',
  'Translate onboarding emails',
  'Swap in the new hero video',
  'Update the status page copy',
  'Prepare the press embargo list',
  'Review the referral terms',
  'Pin the launch thread',
  'QA the mobile checkout',
  'Schedule the newsletter',
  'Archive the beta Slack',
  'Tag the 2.0 release',
  'Refresh the docs screenshots',
  'Warm up the ad accounts',
  'Plan the post-launch retro',
  'Send the thank-you notes',
]
const PER_PAGE = 5
const seedTasks = (): Task[] =>
  TITLES.map((title, i) => ({
    id: i + 1,
    title,
    priority: ([1, 0, 2, 1, 0, 2, 1][i % 7] ?? 1) as Task['priority'],
    due: ((i * 7) % 23) + 1,
    done: i % 6 === 5,
    from: i % 4 === 2 ? 'Linear' : undefined,
  }))

type SortKey = 'priority' | 'due'

function SortButton({ label, active, desc, onClick }: { label: string; active: boolean; desc: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Sort by ${label.toLowerCase()}${active ? `, currently ${desc ? 'descending' : 'ascending'}` : ''}`}
      className={cn('-mx-1 inline-flex h-6 items-center gap-1 rounded px-1 text-xs font-medium', ease, focusRing, active ? 'text-fg' : 'text-fg-muted hover:text-fg')}
    >
      {label}
      {active ? <ArrowUpIcon size={13} strokeWidth={1.75} active={desc} /> : <ArrowUpDownIcon size={13} strokeWidth={1.75} />}
    </button>
  )
}

function TaskRow({
  task,
  hintId,
  lifted,
  onLiftChange,
  onDragMove,
  onKeys,
  onToggle,
  menuItems,
}: {
  task: Task
  hintId: string
  lifted: boolean
  onLiftChange: (lifted: boolean) => void
  /** While dragged: the row, how far it has moved from its slot, and its velocity. */
  onDragMove: (row: HTMLLIElement, offset: number, velocity: number) => void
  onKeys: (e: ReactKeyboardEvent<HTMLButtonElement>) => void
  onToggle: () => void
  menuItems: MenuItem[]
}) {
  const controls = useDragControls()
  const y = useMotionValue(0)
  const row = useRef<HTMLLIElement>(null)
  const [menu, setMenu] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  return (
    // Layout projection glides every row to its slot and keeps the dragged one under the pointer when it swaps.
    <motion.li
      ref={row}
      layout
      drag="y"
      dragListener={false}
      dragControls={controls}
      dragSnapToOrigin
      style={{ y }}
      onDragStart={() => onLiftChange(true)}
      onDrag={(_, info) => row.current && onDragMove(row.current, y.get(), info.velocity.y)}
      onDragEnd={() => onLiftChange(false)}
      whileDrag={{ scale: 1.015 }}
      className={cn('relative flex items-center gap-2 border-b border-line bg-surface py-2 ps-1.5 pe-2', lifted ? 'z-10 rounded-lg shadow-lg ring-1 ring-line-strong' : 'last:border-b-0')}
    >
      <button
        type="button"
        aria-label={`Reorder ${task.title}`}
        aria-pressed={lifted}
        aria-describedby={hintId}
        onPointerDown={(e) => {
          e.preventDefault()
          controls.start(e)
        }}
        onKeyDown={onKeys}
        onBlur={() => lifted && onLiftChange(false)}
        className={cn('flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-fg-subtle hover:bg-hover hover:text-fg active:cursor-grabbing', ease, focusRing, lifted && 'bg-selected text-fg')}
      >
        <GripIcon size={16} active={lifted || undefined} />
      </button>
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.title}
        onClick={onToggle}
        className={cn('flex size-[18px] shrink-0 items-center justify-center rounded-full border', ease, focusRing, task.done ? 'border-success bg-success text-on-accent' : 'border-line-strong hover:border-fg-subtle')}
      >
        {task.done && <CheckIcon size={11} strokeWidth={2.75} trigger="mount" />}
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className={cn('truncate text-sm', task.done ? 'text-fg-muted line-through' : 'text-fg')}>{task.title}</span>
        {task.from && (
          <a href="#" onClick={(e) => e.preventDefault()} className={cn('hidden h-5 shrink-0 items-center gap-1 rounded border border-line px-1.5 text-[11px] text-fg-muted hover:text-fg sm:inline-flex', ease, focusRing)}>
            <ArrowDownLeftIcon size={11} strokeWidth={2} />
            {task.from}
          </a>
        )}
      </div>
      <span className={cn('w-16 shrink-0 text-xs', task.priority === 0 ? 'text-warning' : 'text-fg-muted')}>{PRIORITY[task.priority]}</span>
      <span className="w-14 shrink-0 font-mono text-xs text-fg-muted tabular-nums">Mar {task.due + 3}</span>
      <div className="relative">
        <IconButton ref={trigger} label={`Actions for ${task.title}`} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)} className="size-7">
          <MoreVerticalIcon size={16} active={menu} />
        </IconButton>
        {menu && <Menu label={`Actions for ${task.title}`} items={menuItems} trigger={trigger} close={() => setMenu(false)} className="end-0 top-8" />}
      </div>
    </motion.li>
  )
}

function TasksDemo() {
  const [tasks, setTasks] = useState(seedTasks)
  const [sort, setSort] = useState<{ key: SortKey | null; desc: boolean }>({ key: null, desc: false })
  const [page, setPage] = useState(0)
  const [lifted, setLifted] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [said, setSaid] = useState('')
  const hintId = useId()
  const pages = Math.max(1, Math.ceil(tasks.length / PER_PAGE))
  const start = page * PER_PAGE
  const visible = tasks.slice(start, start + PER_PAGE)

  useEffect(() => {
    if (page > pages - 1) setPage(pages - 1)
  }, [page, pages])

  const patch = (id: number, p: Partial<Task>) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...p } : t)))
  const reorderPage = (ids: number[]) => {
    setTasks((ts) => {
      const byId = new Map(ts.map((t) => [t.id, t]))
      return [...ts.slice(0, start), ...ids.map((id) => byId.get(id)!), ...ts.slice(start + PER_PAGE)]
    })
    setSort({ key: null, desc: false })
  }
  const sortBy = (key: SortKey) => {
    const desc = sort.key === key ? !sort.desc : false
    setSort({ key, desc })
    setTasks((ts) => [...ts].sort((a, b) => (a[key] - b[key]) * (desc ? -1 : 1) || a.id - b.id))
    setSaid(`Sorted by ${key}, ${desc ? 'descending' : 'ascending'}`)
  }
  const moveBy = (id: number, delta: number, announce = true) => {
    const ids = visible.map((t) => t.id)
    const i = ids.indexOf(id)
    const j = i + delta
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
    reorderPage(ids)
    if (announce) setSaid(`Moved to position ${j + 1} of ${ids.length}`)
  }
  /* Dragging: once the row's leading edge passes the middle of its neighbor
   * in the direction of travel, the two swap. One swap per render, so a fast
   * drag never measures a layout that is about to change. */
  const swapping = useRef(false)
  useEffect(() => {
    swapping.current = false
  })
  const dragMove = (id: number) => (row: HTMLLIElement, offset: number, velocity: number) => {
    if (!velocity || swapping.current) return
    const step = velocity > 0 ? 1 : -1
    const neighbour = step > 0 ? row.nextElementSibling : row.previousElementSibling
    if (!(neighbour instanceof HTMLElement)) return
    const top = row.offsetTop + offset
    const middle = neighbour.offsetTop + neighbour.offsetHeight / 2
    if (step > 0 ? top + row.offsetHeight > middle : top < middle) {
      swapping.current = true
      moveBy(id, step, false)
    }
  }
  const onKeys = (task: Task) => (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      const lift = lifted !== task.id
      setLifted(lift ? task.id : null)
      setSaid(lift ? `Picked up ${task.title}. Use the arrow keys to move it, Space to drop it.` : `Dropped ${task.title}`)
    } else if (lifted === task.id && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      moveBy(task.id, e.key === 'ArrowUp' ? -1 : 1)
    } else if (lifted === task.id && e.key === 'Escape') {
      setLifted(null)
      setSaid(`Dropped ${task.title}`)
    }
  }
  const add = () => {
    const title = draft.trim()
    if (!title) return
    setTasks((ts) => [{ id: Math.max(0, ...ts.map((t) => t.id)) + 1, title, priority: 1, due: 4, done: false }, ...ts])
    setDraft('')
    setPage(0)
  }

  return (
    <Stage>
      <Panel className="w-full max-w-[720px]">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3 ps-4">
          <div className="me-auto">
            <h2 className="text-sm font-semibold text-fg">Launch tasks</h2>
            <p className="text-xs text-fg-muted">
              {tasks.filter((t) => t.done).length} of {tasks.length} done
            </p>
          </div>
          <Button variant="ghost" onClick={() => setTasks((ts) => ts.map((t, i) => (i >= start && i < start + PER_PAGE ? { ...t, done: true } : t)))}>
            <ListChecksIcon size={16} />
            Complete page
          </Button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
          className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-line bg-canvas ps-3 pe-1 focus-within:ring-2 focus-within:ring-accent"
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="New task" placeholder="Add a task…" className="h-9 min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle" />
          <button type="submit" aria-label="Add task" disabled={!draft.trim()} className={cn('flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-fg-muted hover:bg-hover hover:text-fg disabled:opacity-40', ease, focusRing)}>
            Add
            <CornerDownLeftIcon size={14} />
          </button>
        </form>
        {/* Same box model as a row, so every header lines up with its column. */}
        <div className="mt-3 border-y border-line bg-canvas px-1.5">
          <div className="flex h-8 items-center gap-2 ps-1.5 pe-2 text-xs">
            <span className="w-7 shrink-0" />
            <span className="w-[18px] shrink-0" />
            <span className="flex-1 font-medium text-fg-muted">Task</span>
            <span className="w-16 shrink-0">
              <SortButton label="Priority" active={sort.key === 'priority'} desc={sort.desc} onClick={() => sortBy('priority')} />
            </span>
            <span className="w-14 shrink-0">
              <SortButton label="Due" active={sort.key === 'due'} desc={sort.desc} onClick={() => sortBy('due')} />
            </span>
            <span className="w-7 shrink-0" />
          </div>
        </div>
        <p id={hintId} className="sr-only">
          Press Space to pick up a task, the arrow keys to move it, and Space again to drop it.
        </p>
        {visible.length === 0 && <p className="px-4 py-12 text-center text-sm text-fg-muted">Nothing left on this page. Add a task above.</p>}
        <ul aria-label="Tasks" className="px-1.5 py-1">
          {visible.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              hintId={hintId}
              lifted={lifted === task.id}
              onLiftChange={(l) => setLifted(l ? task.id : null)}
              onDragMove={dragMove(task.id)}
              onKeys={onKeys(task)}
              onToggle={() => patch(task.id, { done: !task.done })}
              menuItems={[
                { label: 'Move to the end', Icon: ArrowDownIcon, onSelect: () => setTasks((ts) => [...ts.filter((t) => t.id !== task.id), task]) },
                { label: 'Duplicate', Icon: CopyIcon, onSelect: () => setTasks((ts) => [...ts, { ...task, id: Math.max(...ts.map((t) => t.id)) + 1 }]) },
                { label: 'Delete', Icon: TrashIcon, danger: true, onSelect: () => setTasks((ts) => ts.filter((t) => t.id !== task.id)) },
              ]}
            />
          ))}
        </ul>
        <p aria-live="polite" className="sr-only">
          {said}
        </p>
        <nav aria-label="Pagination" className="flex items-center gap-1 border-t border-line p-2">
          <Button variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ArrowLeftIcon size={15} strokeWidth={1.75} />
            Previous
          </Button>
          <div className="mx-auto flex items-center gap-0.5">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Page ${i + 1}`}
                aria-current={i === page ? 'page' : undefined}
                onClick={() => setPage(i)}
                className={cn('size-8 rounded-md font-mono text-xs tabular-nums', ease, focusRing, i === page ? 'bg-selected text-fg' : 'text-fg-muted hover:bg-hover hover:text-fg')}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <Button variant="ghost" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
            Next
            <ArrowRightIcon size={15} strokeWidth={1.75} />
          </Button>
        </nav>
      </Panel>
    </Stage>
  )
}

export const Tasks: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A drag list with pagination. Grab a handle (or focus it and press Space) and its dots fuse into bars until you drop the row; arrow keys move it while lifted. Sortable columns show ⇅ until they own the sort, then an arrow that flips between ascending and descending. Row menus open from a kebab that stretches into a close.',
      },
    },
  },
  render: () => <TasksDemo />,
}

/* ── Playback: shuffle and repeat ────────────────────────────────────────── */

const QUEUE = [
  { id: 1, title: 'Rain on the library roof', length: '42:00' },
  { id: 2, title: 'Night train, second class', length: '38:10' },
  { id: 3, title: 'Harbour at dawn', length: '51:32' },
  { id: 4, title: 'Reading room', length: '60:00' },
  { id: 5, title: 'Brown noise, warm', length: '45:00' },
]
/** Shuffle re-deals what plays next; the current sound keeps playing. */
const SHUFFLED_NEXT = [4, 2, 5, 3]
type RepeatMode = 'off' | 'all' | 'one'
const NEXT_REPEAT: Record<RepeatMode, RepeatMode> = { off: 'all', all: 'one', one: 'off' }

function PlaybackDemo() {
  const k = useYouj()
  const [playing, setPlaying] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<RepeatMode>('all')
  const [now, ...rest] = QUEUE
  const next = shuffle ? SHUFFLED_NEXT.map((id) => QUEUE.find((t) => t.id === id)!) : rest

  return (
    <Stage>
      <Panel className="w-full max-w-[380px] p-4">
        <p className="font-mono text-[11px] tracking-[0.16em] text-fg-muted uppercase">Focus sounds</p>
        <p className="mt-3 text-base font-semibold tracking-tight text-fg">{now!.title}</p>
        <p className="text-[13px] text-fg-muted">Ambient · {now!.length}</p>
        <div className="mt-4 h-1 rounded-full bg-well">
          <div className="h-full w-[28%] rounded-full bg-fg" />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[11px] text-fg-muted tabular-nums">
          <span>11:52</span>
          <span>{now!.length}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <IconButton label="Shuffle" pressed={shuffle} onClick={() => setShuffle((s) => !s)} className={cn('size-10 rounded-full', shuffle && 'bg-transparent text-accent hover:text-accent')}>
            <ShuffleIcon size={18} />
          </IconButton>
          <button
            type="button"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={() => setPlaying((p) => !p)}
            className={cn('flex size-12 items-center justify-center rounded-full bg-fg text-canvas', focusRing)}
          >
            <PlayIcon size={20} strokeWidth={1.75} active={playing} />
          </button>
          <IconButton label="Next sound" className="size-10 rounded-full">
            <SkipForwardIcon size={18} />
          </IconButton>
          <IconButton
            label={`Repeat: ${repeat}`}
            onClick={() => setRepeat((r) => NEXT_REPEAT[r])}
            className={cn('size-10 rounded-full', repeat !== 'off' && 'text-accent hover:text-accent')}
          >
            <RepeatIcon size={18} active={repeat === 'one'} />
          </IconButton>
        </div>
        <p className="mt-5 mb-1 text-[11px] font-medium tracking-wider text-fg-muted uppercase">Up next</p>
        <ul className="flex flex-col">
          {next.map((t) => (
            <motion.li
              key={t.id}
              layout
              transition={k.spring('smooth')}
              className="flex h-9 items-center justify-between border-b border-line text-[13px] last:border-0"
            >
              <span className="truncate text-fg-muted">{t.title}</span>
              <span className="font-mono text-[11px] text-fg-muted tabular-nums">{t.length}</span>
            </motion.li>
          ))}
        </ul>
      </Panel>
    </Stage>
  )
}

export const Playback: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A focus-sounds player. Shuffle re-deals the queue (and its routes on hover); repeat cycles off → all → one, writing a 1 into the loop for repeat one.',
      },
    },
  },
  render: () => <PlaybackDemo />,
}
