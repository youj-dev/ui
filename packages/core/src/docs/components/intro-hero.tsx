import { motion } from 'motion/react'
import { useYouj } from '../../lib/youj/provider'
import { YoujLockup } from '../brand/youj-logo'
import { ReplayButton, useReplay } from './kit'

/* Introduction hero: the animated lockup on a quiet dot grid. */
export function IntroHero() {
  const k = useYouj()
  const [key, replay] = useReplay()
  const rise = (i: number) =>
    k.reduced
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { ...k.tween('slow', 'enter'), delay: k.duration('deliberate') + i * k.stagger('loose') },
        }
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
      <div
        aria-hidden
        className="absolute inset-0 [background-image:radial-gradient(var(--color-line-strong)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_70%_65%_at_50%_45%,black,transparent)] opacity-70"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-[38%] h-64 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-subtle blur-3xl"
      />
      <div key={key} className="relative flex flex-col items-center gap-7 px-6 pb-10 pt-16 text-center">
        <YoujLockup animated optical="display" className="text-[56px] sm:text-[72px]" />
        <motion.p {...rise(0)} className="max-w-md text-[17px] leading-relaxed text-fg-muted">
          Animated icons, motion primitives and signature pieces.{' '}
          <span className="text-fg">Fast, confident, and precise on landing.</span>
        </motion.p>
        <motion.div {...rise(1)} className="flex flex-wrap items-center justify-center gap-2">
          {['shadcn registry', 'motion/react', 'Tailwind v4', 'reduced-motion first'].map((t) => (
            <span key={t} className="rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[11px] text-fg-muted">
              {t}
            </span>
          ))}
        </motion.div>
      </div>
      <div className="absolute right-3 top-3">
        <ReplayButton onClick={replay} />
      </div>
    </div>
  )
}
