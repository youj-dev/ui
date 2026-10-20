import { ScrambleText } from '@youj/motion'
import { CopyIcon } from '@youj/icons'
import { tween } from '../../lib/timing'
import { useFrame } from '../../sim/simulation'
import { BRAND, splitAfterComma } from '../../brand'
import { END_BEATS as B } from '../beats'
import { useFormat } from '../format'

/* The end card. The lockup comes home to the centre (brand.tsx moves it),
 * the tagline it opened with returns under it, and the one command that
 * sets an app up decodes in its install box; the copy icon plays as if it
 * had just been pressed. */

const [LEAD, KICKER] = splitAfterComma(BRAND.tagline)
/** The install box holds the command's width while it decodes (and the prompt and copy button). */
const INSTALL_WIDTH = `calc(${BRAND.install.all.length + 2}ch + 5.5rem)`

export function EndScene({ lockupY }: { lockupY: number }) {
  const frame = useFrame()
  const { height, square } = useFormat()
  const line = tween(frame, B.command - 12, 'slow', 'enter')
  const box = tween(frame, B.command, 'slow', 'enter')
  return (
    <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: height * lockupY + 44 }}>
      <p
        className={`flex gap-[0.3em] leading-snug font-medium tracking-[-0.015em] ${square ? 'text-[18px]' : 'text-[20px]'}`}
        style={{ opacity: line, transform: `translateY(${(1 - line) * 8}px)` }}
        aria-label={BRAND.tagline}
      >
        <span className="text-fg-muted">{LEAD}</span>
        <span className="text-fg">{KICKER}</span>
      </p>
      <div
        className="mt-9 flex h-12 items-center gap-3 rounded-lg border border-line bg-surface ps-4 pe-2 font-mono text-[14px]"
        style={{ minWidth: INSTALL_WIDTH, opacity: box, transform: `translateY(${(1 - box) * 10}px)` }}
      >
        <span aria-hidden className="text-fg-subtle">
          $
        </span>
        {frame >= B.command ? (
          <ScrambleText trigger="mount" tick="fast" className="flex-1 text-fg">
            {BRAND.install.all}
          </ScrambleText>
        ) : (
          <span className="invisible flex-1">{BRAND.install.all}</span>
        )}
        <span className="grid size-8 place-items-center rounded-md text-fg-muted" aria-hidden>
          <CopyIcon size={16} strokeWidth={1.75} active={frame >= B.copied} />
        </span>
      </div>
    </div>
  )
}
