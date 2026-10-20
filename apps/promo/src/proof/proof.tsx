import { MenuIcon, ThemeIcon } from '@youj/icons'
import { ScrambleText } from '@youj/motion'
import { Seq, useFrame } from '../sim/simulation'

/* The determinism proof: two state icons (Motion variants, springs and
 * tweens), a decoding line (its own rAF loop + Math.random) and a CSS
 * transition (the yj-* token durations). Rendered sequentially, in parallel
 * tabs and as a fresh still, every frame must be pixel-identical. */
export function Proof() {
  const frame = useFrame()
  const active = (frame >= 20 && frame < 70) || frame >= 100
  const shown = frame >= 30 && frame < 80
  return (
    <div className="grid size-full place-items-center">
      <div className="flex items-center gap-24">
        <MenuIcon active={active} size={240} strokeWidth={1.5} className="text-fg" />
        <ThemeIcon active={active} size={240} strokeWidth={1.5} className="text-accent" />
      </div>
      <Seq from={10}>
        <ScrambleText className="absolute top-[180px] font-mono text-6xl text-fg">Designed as one.</ScrambleText>
      </Seq>
      <div
        className="absolute bottom-[180px] rounded-xl border border-line bg-surface px-8 py-5 text-3xl text-fg shadow-lg transition-[opacity,translate] duration-(--yj-duration-slow) ease-enter data-[shown=false]:translate-y-6 data-[shown=false]:opacity-0"
        data-shown={shown}
      >
        CSS transition on --yj-duration-slow
      </div>
      <div className="absolute start-10 top-10 font-mono text-2xl text-fg-subtle tabular-nums">frame {frame}</div>
    </div>
  )
}
