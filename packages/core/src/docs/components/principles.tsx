import { useRef, type ReactNode } from 'react'
import { AnimatePresence, motion, type Transition } from 'motion/react'
import { Check, X } from 'lucide-react'
import { useYouj, type Youj } from '../../lib/youj/provider'
import { cn } from '../../lib/youj/cn'
import { ReducedNote, useCycle } from './kit'

/* The motion language as live do/don't pairs. The "don't" side deliberately
 * uses off-token values (that is the point), still scaled by the Speed
 * control so the comparison stays fair. */

type Demo = (p: { on: boolean; k: Youj }) => ReactNode

/** An off-token tween for the "don't" examples, scaled like everything else. */
const off = (k: Youj, seconds: number, ease: Transition['ease'] = 'easeInOut'): Transition =>
  k.reduced ? { duration: 0 } : { duration: seconds * k.timeScale, ease }

function Bar({ w, className }: { w: string; className?: string }) {
  return <span className={cn('block h-1.5 rounded-full bg-line-strong', className)} style={{ width: w }} />
}

/* 1 · Menus land, they don't bounce */
function Menu({ on, transition, exit, from = 0.94 }: { on: boolean; transition: Transition; exit?: Transition; from?: number }) {
  return (
    <div className="flex w-44 flex-col items-start gap-1.5">
      <div className="flex h-7 items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-[12px] font-medium text-fg">
        Options <span aria-hidden className="text-fg-muted">▾</span>
      </div>
      <AnimatePresence>
        {on && (
          <motion.div
            className="flex w-full origin-top-left flex-col gap-2.5 rounded-lg border border-line bg-surface p-3 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.35)]"
            initial={{ opacity: 0, scale: from, y: (from - 1) * 40 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition }}
            exit={{ opacity: 0, scale: 0.97, y: -2, transition: exit ?? transition }}
          >
            <Bar w="70%" className="bg-fg-subtle" />
            <Bar w="85%" />
            <Bar w="55%" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* 2 · Toasts: quick in, quicker out */
function Toast({ on, enter, exit }: { on: boolean; enter: Transition; exit: Transition }) {
  return (
    <div className="flex h-full w-full items-end justify-center pb-4">
      <AnimatePresence>
        {on && (
          <motion.div
            className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 shadow-[0_8px_24px_-10px_rgb(0_0_0/0.4)]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: enter }}
            exit={{ opacity: 0, y: 8, transition: exit }}
          >
            <span className="grid size-4 place-items-center rounded-full bg-success text-canvas">
              <Check size={10} strokeWidth={3} aria-hidden />
            </span>
            <span className="text-[12px] font-medium text-fg">Changes saved</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* 3 · Overshoot is earned */
function Tasks({ on, all, pop }: { on: boolean; all: boolean; pop: Transition }) {
  return (
    <div className="flex w-48 flex-col gap-2">
      {['Lint', 'Test', 'Deploy'].map((label, i) => {
        const done = all || i === 2
        return (
          <div key={label} className="flex items-center gap-2.5 rounded-md border border-line bg-surface px-2.5 py-1.5">
            <span className="relative grid size-4 place-items-center rounded-full border border-line-strong">
              {done ? (
                <motion.span
                  className="absolute inset-[-1px] grid place-items-center rounded-full bg-success text-canvas"
                  animate={{ scale: on ? 1 : 0.3, opacity: on ? 1 : 0 }}
                  transition={pop}
                >
                  <Check size={10} strokeWidth={3} aria-hidden />
                </motion.span>
              ) : (
                <span className="absolute inset-[-1px] grid place-items-center rounded-full bg-fg-subtle text-canvas">
                  <Check size={10} strokeWidth={3} aria-hidden />
                </span>
              )}
            </span>
            <span className="text-[12px] font-medium text-fg">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* 4 · Cascade, don't waterfall */
function Cascade({ on, stagger, item }: { on: boolean; stagger: number; item: Transition }) {
  return (
    <div className="flex w-48 flex-col gap-2">
      {[80, 64, 72, 52, 68].map((w, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-2"
          initial={false}
          animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={on ? { ...item, delay: i * stagger } : { duration: 0 }}
        >
          <span className="size-2 rounded-[2px] bg-fg-subtle" />
          <Bar w={`${w}%`} />
        </motion.div>
      ))}
    </div>
  )
}

/* 5 · Fast, not sluggish */
function Tabs({ on, transition }: { on: boolean; transition: Transition }) {
  const tabs = ['Overview', 'Activity', 'Settings']
  const active = on ? 2 : 0
  return (
    <div className="relative flex rounded-lg border border-line bg-surface p-1">
      <motion.div
        aria-hidden
        className="absolute inset-y-1 left-1 w-[76px] rounded-md bg-key ring-1 ring-line"
        animate={{ x: active * 76 }}
        transition={transition}
      />
      {tabs.map((t, i) => (
        <span
          key={t}
          className={cn('relative w-[76px] py-1 text-center text-[12px] font-medium', i === active ? 'text-fg' : 'text-fg-muted')}
        >
          {t}
        </span>
      ))}
    </div>
  )
}

/* 6 · Reduced motion keeps the meaning. Always static: this is the reduced state. */
function SaveButton({ saved }: { saved: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-md px-3.5 text-[12.5px] font-semibold',
          saved ? 'bg-success text-canvas' : 'bg-accent text-on-accent',
        )}
      >
        {saved && <Check size={13} strokeWidth={3} aria-hidden />}
        {saved ? 'Saved' : 'Save'}
      </span>
      <span className="text-[11px] text-fg-muted">{saved ? 'state shown instantly' : 'motion removed, so no feedback'}</span>
    </div>
  )
}

interface Principle {
  title: string
  lesson: string
  do: { caption: string; demo: Demo }
  dont: { caption: string; demo: Demo }
}

const principles: Principle[] = [
  {
    title: 'Land, don’t bounce',
    lesson: 'UI chrome arrives decisively and stops dead on its mark. Springy menus read as imprecise.',
    do: {
      caption: 'tween base · enter, exit fast · exit',
      demo: ({ on, k }) => (
        <Menu on={on} transition={k.reduced ? { duration: 0 } : k.tween('base', 'enter')} exit={k.reduced ? { duration: 0 } : k.tween('fast', 'exit')} />
      ),
    },
    dont: {
      caption: 'bouncy spring, bounce 0.6',
      demo: ({ on, k }) => (
        <Menu
          on={on}
          from={0.5}
          transition={k.reduced ? { duration: 0 } : { type: 'spring', visualDuration: 0.6 * k.timeScale, bounce: 0.6 }}
        />
      ),
    },
  },
  {
    title: 'Quick in, quicker out',
    lesson: 'Exits are shorter than entrances and accelerate away. Nobody waits for something to leave.',
    do: {
      caption: 'enter base · enter, exit fast · exit',
      demo: ({ on, k }) => (
        <Toast on={on} enter={k.reduced ? { duration: 0 } : k.tween('base', 'enter')} exit={k.reduced ? { duration: 0 } : k.tween('fast', 'exit')} />
      ),
    },
    dont: {
      caption: 'symmetric 700ms ease-in-out both ways',
      demo: ({ on, k }) => <Toast on={on} enter={off(k, 0.7)} exit={off(k, 0.7)} />,
    },
  },
  {
    title: 'Overshoot is earned',
    lesson: 'The settle spring’s single overshoot is reserved for arrival and success. Spend it once.',
    do: {
      caption: 'only the completing task pops · settle',
      demo: ({ on, k }) => <Tasks on={on} all={false} pop={k.reduced ? { duration: 0 } : k.spring('settle')} />,
    },
    dont: {
      caption: 'everything wobbles, bounce 0.7',
      demo: ({ on, k }) => (
        <Tasks on={on} all pop={k.reduced ? { duration: 0 } : { type: 'spring', visualDuration: 0.5 * k.timeScale, bounce: 0.7 }} />
      ),
    },
  },
  {
    title: 'Cascade, don’t waterfall',
    lesson: 'Stagger reveals order, not suspense. A tight step reads as one gesture; a long one reads as lag.',
    do: {
      caption: 'stagger base · tween base, enter',
      demo: ({ on, k }) => (
        <Cascade on={on} stagger={k.reduced ? 0 : k.stagger('base')} item={k.reduced ? { duration: 0 } : k.tween('base', 'enter')} />
      ),
    },
    dont: {
      caption: '180ms steps, 500ms items',
      demo: ({ on, k }) => <Cascade on={on} stagger={k.reduced ? 0 : 0.18 * k.timeScale} item={off(k, 0.5)} />,
    },
  },
  {
    title: 'Fast, not sluggish',
    lesson: 'Direct manipulation answers within a couple of hundred milliseconds. Linear, slow motion feels mechanical.',
    do: {
      caption: 'spring smooth',
      demo: ({ on, k }) => <Tabs on={on} transition={k.reduced ? { duration: 0 } : k.spring('smooth')} />,
    },
    dont: {
      caption: '900ms linear',
      demo: ({ on, k }) => <Tabs on={on} transition={off(k, 0.9, 'linear')} />,
    },
  },
  {
    title: 'Reduced motion keeps the meaning',
    lesson: 'Under reduced motion, swap the animation for an instant state change, never for nothing.',
    do: { caption: 'instant state change, same information', demo: () => <SaveButton saved /> },
    dont: { caption: 'animation skipped, confirmation lost', demo: () => <SaveButton saved={false} /> },
  },
]

function Side({ kind, caption, children }: { kind: 'do' | 'dont'; caption: string; children: ReactNode }) {
  const good = kind === 'do'
  return (
    <figure className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <div className="relative grid h-48 place-items-center overflow-hidden bg-well [background-image:radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:14px_14px]">
        {children}
      </div>
      <figcaption className="flex items-center gap-2.5 border-t border-line px-3.5 py-2.5">
        {/* Text in the tone's "ink" (a fifth of fg mixed back in, as UI's Badge does): the
            plain tone on its own tint falls under 4.5:1 in the light theme. */}
        <span
          className={cn(
            'inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-semibold',
            good
              ? 'bg-success-subtle text-[color-mix(in_oklab,var(--color-success)_80%,var(--color-fg))]'
              : 'bg-danger-subtle text-[color-mix(in_oklab,var(--color-danger)_80%,var(--color-fg))]',
          )}
        >
          {good ? <Check size={11} strokeWidth={3} aria-hidden /> : <X size={11} strokeWidth={3} aria-hidden />}
          {good ? 'Do' : 'Don’t'}
        </span>
        <span className="font-mono text-[11px] text-fg-muted">{caption}</span>
      </figcaption>
    </figure>
  )
}

export function PrinciplePair({ index }: { index: number }) {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const tick = useCycle(k.ms('deliberate') * 3.2, root)
  const on = k.reduced || tick % 2 === 0
  const p = principles[index]!
  return (
    <section ref={root} className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[12px] text-fg-muted">{String(index + 1).padStart(2, '0')}</span>
        <div className="flex flex-col gap-1">
          <h3 className="text-[17px] font-semibold tracking-tight text-fg">{p.title}</h3>
          <p className="text-[13.5px] leading-relaxed text-fg-muted">{p.lesson}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Side kind="do" caption={p.do.caption}>
          {p.do.demo({ on, k })}
        </Side>
        <Side kind="dont" caption={p.dont.caption}>
          {p.dont.demo({ on, k })}
        </Side>
      </div>
    </section>
  )
}

export const principleCount = principles.length

export function Principles() {
  return (
    <div className="flex flex-col gap-10">
      <ReducedNote />
      {principles.map((_, i) => (
        <PrinciplePair key={i} index={i} />
      ))}
    </div>
  )
}
