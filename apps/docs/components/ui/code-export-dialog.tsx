'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactElement, type ReactNode, type RefObject } from 'react'
import { useSoundCue } from '@youj/core/lib/youj/sound-cue'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, Tabs, TabsContent, TabsList, TabsTrigger } from '@youj/react'
import { ScrollFrame } from '@/components/docs/scroll-table'
import { CopyButton } from '@/components/ui/copy-button'
import { cn } from '@/lib/cn'

/* The site's one place for taking code home: a large modal (up to 1100px
 * wide and 860px tall) split into sections, with a nav of them on the inline
 * start and the open one beside it, each with room to read: a command, the
 * files, a download, the steps. Create's export, a scene's code in the
 * illustrations explorer and the illustration builder's export all open it,
 * so code never squeezes into a side panel. It opens on its first section,
 * the most useful one.
 *
 * It is the kit's Dialog (focus is trapped and returns to the trigger, Escape
 * and the scrim close it) and the kit's Tabs: the nav is a vertical tab list
 * (arrow keys, Home, End; its key glides on the smooth spring and jumps under
 * reduced motion) and each section a tab panel, opening with its heading.
 * Where the dialog is narrower than WIDE (a phone, a narrow window, a tablet
 * held upright) the nav is a row of tabs under the title, and on a phone the
 * dialog is the whole screen: centered under a pointer, the touch sheet under
 * a thumb (pulled down from the top of a section, it goes). The head and the
 * nav stay put; a section scrolls, or a file browser fills it. */

export interface CodeExportSection {
  value: string
  /** Its name in the nav, and its heading. */
  label: string
  /** The nav's glyph: a Youj icon at 16px. It plays when its tab is pointed at. */
  icon: ReactNode
  /** One line under the heading: what's in it. */
  description?: ReactNode
  content: ReactNode
  /** The content fills the section (a file browser with its own scrolling) instead of scrolling in it. */
  fill?: boolean
  /** A control at its heading's end (a choice the whole section follows: the package or the copy). */
  end?: ReactNode
}

export interface CodeExportDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Called once it has finished opening or closing, its animation included (focus is back where it goes by then). */
  onOpenChangeComplete?: (open: boolean) => void
  /** The button that opens it; it gets focus back when the dialog closes. */
  trigger?: ReactElement
  title: ReactNode
  description: ReactNode
  /** A picture of what the code is for, over the title in the nav's column (where the nav stands beside the sections). */
  preview?: ReactNode
  sections: CodeExportSection[]
  /** The nav's accessible name. */
  navLabel?: string
  /** `false`: no nav, for a dialog of a single section (its heading and the section fill the whole width). Default `true`. */
  nav?: boolean
  /** The section it opens on: the first by default. */
  defaultSection?: string
  /** Where focus goes when it closes, for a dialog opened without a trigger (a card's island, a panel's button): the control that opened it, or a function of how it was closed (Base UI's finalFocus). */
  finalFocus?: ComponentProps<typeof DialogContent>['finalFocus']
  className?: string
}

/** Anchors the dialog's scale on the control that opened it (a ref given as finalFocus), so it grows out of it and
 * retracts into it. Measured as it mounts, before the first frame paints. */
const growFrom = (from: CodeExportDialogProps['finalFocus']) => (popup: HTMLElement | null) => {
  const trigger = from && typeof from === 'object' && 'current' in from ? from.current : null
  if (!popup || !trigger) return
  const t = trigger.getBoundingClientRect()
  const p = popup.getBoundingClientRect()
  popup.style.transformOrigin = `${t.left + t.width / 2 - p.left}px ${t.top + t.height / 2 - p.top}px`
}

/** The dialog's width from which the nav stands beside the sections, in px. */
const WIDE = 760

export function CodeExportDialog({ open, onOpenChange, onOpenChangeComplete, trigger, finalFocus, className, ...body }: CodeExportDialogProps) {
  // A dialog whose code arrives with its first open mounts open, and the kit's Dialog only hears changes: say that first open here.
  const cue = useSoundCue()
  // biome-ignore lint/correctness/useExhaustiveDependencies: the open it mounted with only
  useEffect(() => {
    if (open) cue('open')
  }, [])
  return (
    <Dialog open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      {trigger && <DialogTrigger render={trigger} />}
      {/* shape: on a phone the dialog is the whole screen, square to its edges */}
      <DialogContent
        finalFocus={finalFocus}
        ref={growFrom(finalFocus)}
        className={cn(
          'h-[min(860px,90dvh)] w-[min(1100px,92vw)] max-w-none gap-0 overflow-hidden p-0',
          // It grows out of the control that opened it and retracts back into it (styles/site.css, .code-grow).
          'code-grow',
          // On touch, wider than the kit's sheet from a tablet up: code needs the room.
          'md:max-w-[min(1100px,92vw)]!',
          // A phone: the whole screen, under a pointer or a thumb, square to its edges (the sheet keeps the home indicator's inset, a transparent bottom border).
          'max-md:fixed max-md:inset-0 max-md:m-0! max-md:h-dvh max-md:max-h-dvh max-md:w-full max-md:rounded-none! max-md:border-x-0 max-md:border-t-0 max-md:not-data-sheet-popup:border-b-0',
          // The touch sheet's grab handle gives way to the head, so the title sits level with the close button; a pull from a section's top still dismisses it.
          '[&>[data-slot=sheet-handle]]:hidden',
          className,
        )}
      >
        <Sections {...body} />
      </DialogContent>
    </Dialog>
  )
}

/** Whether the dialog has the room for the nav beside the sections: a guess from the window for the first paint, then measured. */
function useWide(ref: RefObject<HTMLElement | null>) {
  const [wide, setWide] = useState(() => typeof window === 'undefined' || Math.min(1100, window.innerWidth * 0.92) >= WIDE)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // Layout width, not a rect: the dialog is still in its entrance transform. No width yet is no layout, and the guess stands.
    const measure = () => el.offsetWidth > 0 && setWide(el.offsetWidth >= WIDE)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return wide
}

function Sections({ title, description, preview, sections, navLabel = 'Sections', nav = true, defaultSection }: Omit<CodeExportDialogProps, 'open' | 'onOpenChange' | 'trigger' | 'className'>) {
  const root = useRef<HTMLDivElement>(null)
  const wide = useWide(root) && nav
  // Inside the dialog, so it opens on its default section every time.
  const [picked, setPicked] = useState(defaultSection ?? sections[0]?.value)
  // A choice inside the dialog can change the set; a section that goes gives way to the first, without a remount.
  const value = sections.some((s) => s.value === picked) ? picked : sections[0]?.value

  return (
    // The style's body padding is taken back (p-0!, m-0!): the nav and the sections lay out their own room.
    <div ref={root} className="m-0! flex min-h-0 flex-1 flex-col p-0!">
      <Tabs
        orientation={wide ? 'vertical' : 'horizontal'}
        value={value}
        onValueChange={(next) => setPicked(next as string)}
        className={cn('min-h-0 flex-1 gap-0', wide ? 'grid grid-cols-[14rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)]' : 'flex flex-col')}
      >
        <div
          className={cn(
            'flex min-w-0 shrink-0 flex-col',
            wide
              ? 'gap-7 border-e border-line bg-band px-3 pt-4 pb-4'
              : 'gap-3.5 border-b border-line px-4 pt-4 pb-3',
          )}
        >
          {/* The head: on a phone it shares its row with the close button. */}
          <div className={cn('flex min-w-0 flex-col gap-1', wide ? 'px-2' : 'min-h-7 justify-center pe-12')}>
            {preview && wide && <div className="-mx-2 mb-3">{preview}</div>}
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className={cn('text-[12.5px] leading-snug text-pretty text-fg-muted', !wide && 'sr-only')}>{description}</DialogDescription>
          </div>
          {nav && (
          <TabsList
            aria-label={navLabel}
            variant={wide ? 'pill' : 'underline'}
            className={cn(
              wide
                ? [
                    'w-full gap-0.5 p-0',
                    // shape: the section nav is the docs sidebar's: the selected key on a hairline, in both modes
                    '[&>[data-slot=tabs-indicator]]:bg-selected [&>[data-slot=tabs-indicator]]:shadow-[inset_0_0_0_1px_var(--color-line)]',
                  ]
                : // A phone's row spans the dialog, its tabs sharing the room by the length of their names.
                  'w-full!',
            )}
          >
            {sections.map((s) => (
              <TabsTrigger
                key={s.value}
                value={s.value}
                // shape: a docs-sidebar row (36px), not a track's key
                className={cn(
                  'group/nav',
                  wide
                    ? 'h-9 w-full gap-2.5 px-2.5 text-[13.5px] font-normal text-fg-muted not-data-active:hover:bg-hover data-active:font-medium data-active:text-fg'
                    : 'flex-auto text-[13px] font-medium',
                )}
              >
                {wide && (
                  <span aria-hidden className="grid size-4 place-items-center text-fg-subtle transition-colors yj-duration-fast ease-standard group-hover/nav:text-fg-muted group-data-active/nav:text-fg [&_svg]:size-4">
                    {s.icon}
                  </span>
                )}
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
          )}
        </div>
        {sections.map((s) => (
          <TabsContent
            key={s.value}
            value={s.value}
            className={cn(
              'flex min-h-0 flex-col rounded-none focus-visible:-outline-offset-2',
              !s.fill && 'overflow-y-auto yj-scrollbar',
              wide ? 'col-start-2 row-start-1 px-8 pt-4 pb-8' : 'px-4 pt-4 pb-6',
            )}
          >
            {/* Clear of the close button in the corner. On a phone the tab above names it, so the heading is for assistive technology. */}
            <header className={cn('flex shrink-0 items-start justify-between gap-x-6 gap-y-3', wide ? 'pe-10' : 'flex-wrap')}>
              <div className="flex min-w-0 flex-col gap-1">
                {/* Level with the dialog's title and its close button: a 28px line from the same 16px top. */}
                <h2 className={cn('text-[16px] leading-7 font-semibold tracking-[-0.01em] text-fg', !wide && 'sr-only')}>{s.label}</h2>
                {s.description && <p className="max-w-[46rem] text-[13px] leading-relaxed text-pretty text-fg-muted">{s.description}</p>}
              </div>
              {s.end && <div className="shrink-0">{s.end}</div>}
            </header>
            {/* A container, so a section's parts fit the room it has, not the window. */}
            <div className={cn('@container flex min-w-0 flex-col', wide ? 'mt-6' : 'mt-4', s.fill && 'min-h-0 flex-1')}>{s.content}</div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

/**
 * A command on one line: it scrolls sideways rather than wrapping, under a
 * slim scrollbar and a fade on whichever side has more, so a long link reads
 * as "keeps going". `copy={false}` when a bigger button beside it copies.
 */
export function ExportCommand({ command, label, copy = true, prompt = true, className }: { command: string; label: string; copy?: boolean; /** The `$` before it: off for a link. */ prompt?: boolean; className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-1 rounded-lg border border-line bg-canvas py-1 ps-3 pe-1', className)}>
      <ScrollFrame label={label} group className="min-w-0 flex-1 rounded-sm pb-1 yj-scrollbar focus-ring">
        <p dir="ltr" className="w-fit code-text leading-7 whitespace-nowrap text-fg">
          {prompt && (
            <span aria-hidden className="me-2 text-fg-subtle select-none">
              $
            </span>
          )}
          {command}
        </p>
      </ScrollFrame>
      {copy && <CopyButton value={command} label={`Copy: ${label}`} />}
    </div>
  )
}

/**
 * One file or snippet: its name (a path, or what it is) and a copy button
 * in a bar, the highlighted code under it. `children` is the highlighted
 * markup (a `<pre class="shiki">`, or tokens for a plain `<pre>`), `code`
 * what the button copies.
 */
export function ExportCode({ code, title, label, children, className }: { code: string; title: ReactNode; label: string; children: ReactNode; className?: string }) {
  return (
    <figure className={cn('min-w-0 overflow-hidden rounded-lg border border-line bg-canvas', className)}>
      <figcaption className="flex h-9 items-center gap-2 border-b border-line ps-3 pe-1">
        <span className="min-w-0 flex-1 truncate type-small text-fg-muted">{title}</span>
        <CopyButton value={code} label={`Copy ${label}`} />
      </figcaption>
      <div dir="ltr" tabIndex={0} role="group" aria-label={label} className="code-panel max-h-[32rem] overflow-auto focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset">
        {children}
      </div>
    </figure>
  )
}

/** A titled part of a section, with a line on what it is. */
export function ExportSection({ title, note, children, className }: { title: ReactNode; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('flex min-w-0 flex-col gap-2.5', className)}>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[13px] font-medium text-fg">{title}</h3>
        {note && <p className="max-w-[44rem] text-[12.5px] leading-relaxed text-pretty text-fg-muted">{note}</p>}
      </div>
      {children}
    </section>
  )
}
