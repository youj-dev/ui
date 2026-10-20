'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useInView } from 'motion/react'
import { useYouj, type DurationToken } from '@youj/core'
import { Counter, MorphLabel, useMorphRoot } from '@youj/motion'
import { CheckIcon, CopyIcon, RotateCcwIcon, TerminalIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { useVisible } from '../../../hooks/use-visible'
import { cn } from '../../../lib/utils'

/* The hero's terminal, which types a command and streams its transcript on a
 * token clock (Replay restarts it), and the install command with its
 * morphing copy button. */

const READY_IN = 'in 23s' // youj-allow: transcript copy, not a timing
const FRAMES = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'

/** A line of the transcript. */
export interface HeroTerminalLine {
  /** `muted` for a header, `ok` for a success (a check), `plain` for progress. */
  tone: 'muted' | 'ok' | 'plain'
  text: ReactNode
  /** The glyph before the text. Default: ▲ for muted, ✓ for ok, › for plain. */
  mark?: string
  /** How long after the previous line it lands: a duration token, times `times`. Default `base`. */
  wait?: DurationToken
  times?: number
  /** Spins until the next line lands. */
  busy?: boolean
}

const MARK = { muted: '▲', ok: '✓', plain: '›' } as const
const TONE = { muted: 'text-fg-muted', ok: 'text-success-text', plain: 'text-accent' } as const

export const TRANSCRIPT: HeroTerminalLine[] = [
  { wait: 'slow', tone: 'muted', text: 'Northwind CLI 4.2.0' },
  { wait: 'slow', tone: 'ok', text: <>Linked to <b className="font-medium text-fg">acme/storefront</b> on main</> },
  { wait: 'base', tone: 'plain', text: 'Detected Next.js 16 with pnpm' },
  { wait: 'slow', tone: 'plain', text: <Upload />, busy: true },
  { wait: 'deliberate', times: 3, tone: 'plain', text: 'Building on 4 cores in iad1', busy: true },
  { wait: 'deliberate', times: 4, tone: 'ok', text: 'Built in 18.4s · 31 routes, 6 functions' }, // youj-allow: transcript copy, not a timing
  { wait: 'base', tone: 'plain', text: 'Assigning acme.shop and www.acme.shop', busy: true },
  { wait: 'deliberate', times: 2, tone: 'ok', text: <Ready /> },
]

function Upload() {
  const k = useYouj()
  const live = !k.reduced
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <span>
        Uploading <Counter value={214} from={live ? 0 : 214} mode="tween" duration="deliberate" inView={false} /> files
      </span>
      <span className="relative h-1.5 w-24 overflow-hidden rounded-full bg-well">
        <motion.span
          initial={{ scaleX: live ? 0 : 1 }}
          animate={{ scaleX: 1 }}
          transition={k.tween('deliberate', 'standard')}
          className="absolute inset-y-0 start-0 w-full origin-left rounded-full bg-accent rtl:origin-right"
        />
      </span>
      <span className="text-fg-muted">3.1 MB</span>
    </span>
  )
}

function Ready() {
  return (
    <span>
      <b className="font-medium text-fg">Ready</b> {READY_IN} <span className="text-accent underline decoration-accent-line underline-offset-4">https://acme.shop</span>
    </span>
  )
}

/** The typed command and the lines streamed so far, on a token clock; `run` restarts it. */
function useTranscript(active: boolean, run: number, command: string, script: HeroTerminalLine[]) {
  const k = useYouj()
  const [typed, setTyped] = useState(0)
  const [shown, setShown] = useState(0)
  const latest = useRef(script)
  useLayoutEffect(() => {
    latest.current = script
  })
  const count = script.length
  const [prev, setPrev] = useState<unknown[]>([active, run, k, command, count])
  const deps = [active, run, k, command, count]
  if (deps.some((v, i) => v !== prev[i])) {
    setPrev(deps)
    if (active && !k.reduced) {
      setTyped(0)
      setShown(0)
    }
  }
  useEffect(() => {
    if (!active || k.reduced) return
    const timers: ReturnType<typeof setTimeout>[] = []
    let t = k.ms('slow')
    for (let i = 1; i <= command.length; i++) {
      // Keys land unevenly, the way hands type.
      t += k.ms('instant') * (i % 5 === 0 ? 1.4 : 0.55)
      timers.push(setTimeout(() => setTyped(i), t))
    }
    t += k.ms('slow')
    latest.current.forEach((line, i) => {
      t += k.ms(line.wait ?? 'base') * (line.times ?? 1)
      timers.push(setTimeout(() => setShown(i + 1), t))
    })
    return () => timers.forEach(clearTimeout)
  }, [active, run, k, command, count])
  return k.reduced ? { typed: command.length, shown: count, done: true } : { typed, shown, done: shown === count }
}

function Spinner() {
  const k = useYouj()
  const ref = useRef<HTMLSpanElement>(null)
  const visible = useVisible(ref)
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), k.ms('instant'))
    return () => clearInterval(id)
  }, [k, visible])
  return (
    <span ref={ref} className="text-accent">
      {FRAMES[frame]}
    </span>
  )
}

/** The block cursor: it blinks on the deliberate token, and holds still under reduced motion. */
function Caret() {
  const k = useYouj()
  return (
    <motion.span
      animate={k.reduced ? undefined : { opacity: [1, 1, 0, 0] }}
      transition={{ duration: k.duration('deliberate') * 2, times: [0, 0.5, 0.5, 1], repeat: Infinity }}
      className="ms-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-fg"
    />
  )
}

export function Terminal({
  command,
  script,
  cwd,
  replay,
  preview,
}: {
  command: string
  script: HeroTerminalLine[]
  cwd: string
  replay: string
  preview: ReactNode
}) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [run, setRun] = useState(0)
  const { typed, shown, done } = useTranscript(inView, run, command, script)

  return (
    // Room under the terminal for the site to land on its corner, below the transcript's lines; kept whether it's there or not, so nothing moves.
    <div className={cn('relative', preview != null && 'pb-48 sm:pb-36')}>
      {/* A dark terminal in either mode: the inverse tone re-derives every role inside it. */}
      <div ref={ref} data-yj-tone="inverse" className="overflow-hidden rounded-xl border border-line bg-surface text-fg shadow-2xl shadow-fg/10">
        <div className="flex h-11 items-center gap-3 border-b border-line bg-transparent ps-4 pe-1.5">
          <span aria-hidden className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2.5 rounded-full bg-well" />
            ))}
          </span>
          <span aria-hidden className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate text-ui-sm text-fg-muted">
            <TerminalIcon size={13} /> {cwd}
          </span>
          {!k.reduced && (
            <Button variant="ghost" size="sm" onClick={() => setRun((r) => r + 1)} disabled={!inView} className="text-fg-muted">
              <RotateCcwIcon size={14} /> {replay}
            </Button>
          )}
        </div>
        <div aria-hidden inert className="min-h-[21rem] overflow-x-auto p-4 font-mono text-ui-sm leading-7 yj-scrollbar sm:p-5">
          <p className="whitespace-nowrap">
            <span className="text-fg-muted">$ </span>
            <span className="text-fg">{command.slice(0, typed)}</span>
            {typed < command.length && <Caret />}
          </p>
          <ul className="mt-1">
            {script.slice(0, shown).map((line, i) => {
              const spinning = line.busy && i === shown - 1 && !done
              return (
                <motion.li
                  key={i}
                  initial={k.reduced ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={k.tween('fast', 'enter')}
                  className="flex gap-2.5 sm:whitespace-nowrap"
                >
                  <span className={cn('w-3 shrink-0 text-center', TONE[line.tone])}>{spinning ? <Spinner /> : (line.mark ?? MARK[line.tone])}</span>
                  <span className={line.tone === 'muted' ? 'text-fg-muted' : 'text-fg'}>{line.text}</span>
                </motion.li>
              )
            })}
          </ul>
          {done && (
            <p className="mt-1">
              <span className="text-fg-muted">$ </span>
              <Caret />
            </p>
          )}
        </div>
      </div>
      {preview != null && (
        // The deploy's result lands on the terminal's corner once it's live, on the one spring allowed an overshoot.
        <motion.div
          aria-hidden
          inert
          data-slot="terminal-site"
          data-state={done ? 'live' : 'pending'}
          initial={false}
          animate={done ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 24, scale: 0.94 }}
          transition={done ? { ...k.spring('settle'), delay: k.duration('slow') } : k.tween('fast', 'exit')}
          className="absolute end-3 bottom-0 w-60 origin-bottom-right overflow-hidden rounded-xl border border-line bg-surface text-fg shadow-2xl shadow-fg/20 sm:end-6 sm:w-64 lg:-end-8 rtl:origin-bottom-left"
        >
          {preview}
        </motion.div>
      )}
    </div>
  )
}

/** A Button that is its own morph root: its box reshapes as its MorphLabel changes. */
function useMorphButton() {
  const [radius, setRadius] = useState<string>()
  const ref = useCallback((el: HTMLButtonElement | null) => {
    if (el) setRadius(getComputedStyle(el).borderRadius || undefined)
  }, [])
  return { ref, render: <motion.button {...useMorphRoot(radius)} /> }
}

interface InstallCommandProps {
  command: string
  labels: { copy: string; copied: string; copyAria: string }
  onCopyCommand?: (command: string) => void
}

export function InstallCommand({ command, labels, onCopyCommand }: InstallCommandProps) {
  const [copied, setCopied] = useState(false)
  const { ref: buttonRef, render: buttonRender } = useMorphButton()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-line bg-surface py-1 ps-4 pe-1">
      <code className="min-w-0 flex-1 truncate font-mono text-ui-sm text-fg">
        <span aria-hidden className="me-2 text-fg-muted select-none">
          $
        </span>
        {command}
      </code>
      <Button
        ref={buttonRef}
        render={buttonRender}
        size="sm"
        variant="secondary"
        className="overflow-hidden"
        aria-label={copied ? labels.copied : labels.copyAria}
        onClick={() => {
          void navigator.clipboard?.writeText(command).catch(() => {})
          onCopyCommand?.(command)
          setCopied(true)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => setCopied(false), 1800)
        }}
      >
        <MorphLabel value={copied ? 'copied' : 'copy'} contentClassName="gap-1.5">
          {copied ? (
            <>
              <CheckIcon trigger="mount" size={14} strokeWidth={2.5} /> {labels.copied}
            </>
          ) : (
            <>
              <CopyIcon size={14} /> {labels.copy}
            </>
          )}
        </MorphLabel>
      </Button>
    </div>
  )
}

