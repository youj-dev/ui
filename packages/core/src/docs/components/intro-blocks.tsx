import { Accessibility, Contrast, Timer } from 'lucide-react'
import { Panel } from './kit'

/* Small blocks for the Introduction page. */

const PRINCIPLES = [
  ['Precise', 'Fast, confident motion that stops exactly on its mark. No overshoot by default.'],
  ['Earned', 'One settle spring with a single overshoot, spent on success and arrival.'],
  ['Restrained', 'Neutral surfaces and one electric accent. The motion is the ornament.'],
  ['Inclusive', 'Reduced motion is a designed state that keeps the meaning, not a missing feature.'],
] as const

export function PrincipleCards() {
  return (
    <div className="my-6 grid gap-3 sm:grid-cols-2">
      {PRINCIPLES.map(([title, body], i) => (
        <Panel key={title} className="flex gap-3 border-0 bg-(--code-bg,var(--color-well)) p-4">
          <span className="font-mono text-[12px] text-fg-muted">{String(i + 1).padStart(2, '0')}</span>
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold tracking-tight text-fg">{title}</span>
            <span className="text-[13.5px] leading-relaxed text-fg-muted">{body}</span>
          </div>
        </Panel>
      ))}
    </div>
  )
}

export function RegistryUrl({ name }: { name: string }) {
  return (
    <code className="sb-unstyled rounded-md border border-line bg-well px-1.5 py-0.5 font-mono text-[12.5px] text-fg">
      https://www.youj.dev/r/<span className="text-accent">{name}</span>.json
    </code>
  )
}

const CONTROLS = [
  { icon: Contrast, name: 'Theme', body: 'Dark and light. Every item must look deliberate in both.' },
  { icon: Accessibility, name: 'Motion', body: 'Follow OS, forced reduced, or forced full. Reduced shows the designed static state.' },
  { icon: Timer, name: 'Speed', body: 'Scales every duration, spring and loop. Use ¼× to study choreography frame by frame.' },
] as const

export function ToolbarGuide() {
  return (
    <div className="my-6 grid gap-3 sm:grid-cols-3">
      {CONTROLS.map(({ icon: Icon, name, body }) => (
        <Panel key={name} className="flex flex-col gap-2 p-4">
          <span className="grid size-8 place-items-center rounded-lg border border-line bg-key text-fg">
            <Icon size={16} aria-hidden />
          </span>
          <span className="text-[14px] font-semibold text-fg">{name}</span>
          <span className="text-[13px] leading-relaxed text-fg-muted">{body}</span>
        </Panel>
      ))}
    </div>
  )
}
