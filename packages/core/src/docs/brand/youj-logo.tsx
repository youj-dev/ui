import { useId, type CSSProperties } from 'react'
import { m } from 'motion/react'
import { useYouj } from '../../lib/youj/provider'
import { MotionFeatures } from '../../lib/youj/features'
import { cn } from '../../lib/youj/cn'
import {
  GRID,
  LOCKUP,
  LOCKUP_UI_VIEWBOX,
  LOCKUP_UI_WIDTH,
  LOCKUP_VIEWBOX,
  MARK_VIEWBOX,
  WORDMARK_UI_VIEWBOX,
  WORDMARK_UI_WIDTH,
  WORDMARK_VIEWBOX,
  WORDMARK_WIDTH,
  logoLetters,
  mark,
  tittle,
  uiTag,
  wordmarkLetters,
  wordmarkParticles,
  type Optical,
} from './logo'

/* The youj logo: the word in the text colour, no badge, the j's square
 * tittle in the accent. `animated` plays the stamp: the letters rise into
 * place in reading order through a window that ends just under the
 * descender line (`slow` on `enter`, a `tight` stagger, no overshoot), and
 * the tittle lands last on the settle spring, the one earned overshoot.
 * Reduced motion renders the rest frame. `ui` adds the "UI" tag in the muted
 * ink after the word, rising last through the same window. The mark is the
 * u holding the tittle in a badge, on the same choreography: the u rises,
 * then the tittle drops in past the rim and settles in the cup. The wordmark is the word at
 * page scale, on its own: its letters rise through a window that ends at
 * the descender line too. */

type Youj = ReturnType<typeof useYouj>
type Tittle = { x: number; y: number; size: number }

/** The stamp's two moves: letter `i` rising from `depth` grid units down (its top below the window), and the tittle landing once the first letter is home. */
function stamp(k: Youj, play: boolean, depth: number) {
  return {
    rise: (i: number, from = depth) =>
      play && {
        initial: { y: from },
        animate: { y: 0 },
        transition: { ...k.tween('slow', 'enter'), delay: i * k.stagger('tight') },
      },
    land: play && {
      initial: { y: -6, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      transition: { default: { ...k.spring('settle'), delay: k.duration('slow') }, opacity: { ...k.tween('fast'), delay: k.duration('slow') } },
    },
  }
}

const TittleRect = ({ tittle, land }: { tittle: Tittle; land: ReturnType<typeof stamp>['land'] }) => (
  <m.rect x={tittle.x} y={tittle.y} width={tittle.size} height={tittle.size} className="fill-accent" {...land} />
)

export function YoujMark({ animated = false, className }: { animated?: boolean; className?: string }) {
  const k = useYouj()
  const play = animated && !k.reduced
  const cut = useId()
  const slot = useId()
  // The u starts with its top below the window, which ends at its baseline.
  const { rise, land } = stamp(k, play, Math.ceil(mark.baseline - mark.xHeight))
  return (
    <MotionFeatures>
      <svg viewBox={MARK_VIEWBOX} className={cn('overflow-visible', className)} style={{ aspectRatio: '1 / 1' }} aria-hidden>
        {play && (
          <clipPath id={slot}>
            <rect width={24} height={mark.baseline} />
          </clipPath>
        )}
        <mask id={cut} maskUnits="userSpaceOnUse" x={0} y={0} width={24} height={24}>
          <path d={mark.tile} fill="white" />
          <g clipPath={play ? `url(#${slot})` : undefined}>
            <m.path d={mark.glyph} fill="black" {...rise(0)} />
          </g>
        </mask>
        <path d={mark.tile} className="fill-fg" mask={`url(#${cut})`} />
        <TittleRect tittle={mark.tittle} land={land} />
      </svg>
    </MotionFeatures>
  )
}

export function YoujWordmark({
  animated = false,
  delay = 0,
  ui = false,
  className,
  style,
}: {
  animated?: boolean
  delay?: number
  /** Adds the "UI" tag in the muted ink: the marketing lockup, "youj UI". */
  ui?: boolean
  className?: string
  style?: CSSProperties
}) {
  const k = useYouj()
  const play = animated && !k.reduced
  const clip = useId()
  const width = ui ? WORDMARK_UI_WIDTH : WORDMARK_WIDTH
  // Each letter starts fully below the window (it ends at the descender line) and rises into it.
  const rise = (i: number) =>
    play && {
      initial: { y: GRID.descender - GRID.ascender + 1 },
      animate: { y: 0 },
      transition: { ...k.tween('slow', 'enter'), delay: delay + i * k.stagger('tight') },
    }
  const land = delay + k.duration('slow')
  return (
    <MotionFeatures>
      <svg
        viewBox={ui ? WORDMARK_UI_VIEWBOX : WORDMARK_VIEWBOX}
        className={cn('overflow-visible', className)}
        style={{ aspectRatio: `${width} / 24`, ...style }}
        role="img"
        aria-label={ui ? 'youj UI' : 'youj'}
      >
        {play && (
          <clipPath id={clip}>
            <rect x={-1} y={-GRID.baseline} width={width + 2} height={GRID.baseline + GRID.descender + 0.5} />
          </clipPath>
        )}
        <g clipPath={play ? `url(#${clip})` : undefined}>
          <g className="fill-fg">
            {wordmarkLetters.map((l, i) => (
              <m.path key={i} d={l.d} {...rise(i)} />
            ))}
          </g>
          {ui && (
            <g className="fill-fg-muted">
              {uiTag.map((l, i) => (
                <m.path key={l.letter} d={l.d} {...rise(wordmarkLetters.length + i)} />
              ))}
            </g>
          )}
        </g>
        {wordmarkParticles.map((p, i) => (
          <m.rect
            key={i}
            x={p.x}
            y={p.y}
            width={p.size}
            height={p.size}
            className="fill-accent"
            {...(play && {
              initial: { y: -6, opacity: 0 },
              animate: { y: 0, opacity: 1 },
              transition: {
                default: { ...k.spring('settle'), delay: land + i * k.stagger('loose') },
                opacity: { ...k.tween('fast'), delay: land + i * k.stagger('loose') },
              },
            })}
          />
        ))}
      </svg>
    </MotionFeatures>
  )
}

export function YoujLockup({
  animated = false,
  ui = false,
  optical = 'text',
  className,
}: {
  animated?: boolean
  /** The marketing lockup, "youj UI": the muted "UI" tag after the word. */
  ui?: boolean
  /** The tittle's cut. `text` (the default) grows it 1.3× about its centre so it reads at interface sizes, a 24px header
   * or a 16px footer; `display` draws it as is, for a hero (about 48px and up). */
  optical?: Optical
  className?: string
}) {
  const k = useYouj()
  const play = animated && !k.reduced
  const slot = useId()
  // The window's foot is the lockup's own, half a unit under the descender line; each letter starts with its top (the
  // x-height, where all four stand) below it, and the tag's capitals (from the ascender) further down.
  const foot = LOCKUP.y + LOCKUP.height
  const { rise, land } = stamp(k, play, Math.ceil(foot - GRID.xHeight))
  const tagDepth = Math.ceil(foot - GRID.ascender)
  const width = ui ? LOCKUP_UI_WIDTH : LOCKUP.width
  return (
    <div className={cn('flex items-center', className)}>
      <MotionFeatures>
        <svg
          viewBox={ui ? LOCKUP_UI_VIEWBOX : LOCKUP_VIEWBOX}
          className="h-[1em] w-auto shrink-0 overflow-visible"
          style={{ aspectRatio: `${width} / ${LOCKUP.height}` }}
          role="img"
          aria-label={ui ? 'youj UI' : 'youj'}
        >
          {play && (
            <clipPath id={slot}>
              <rect x={LOCKUP.x - 1} y={LOCKUP.y - 1} width={width + 2} height={foot - LOCKUP.y + 1} />
            </clipPath>
          )}
          <g clipPath={play ? `url(#${slot})` : undefined}>
            <g className="fill-fg">
              {logoLetters.map((l, i) => (
                <m.path key={l.letter} d={l.d} {...rise(i)} />
              ))}
            </g>
            {ui && (
              <g className="fill-fg-muted">
                {uiTag.map((l, i) => (
                  <m.path key={l.letter} d={l.d} {...rise(logoLetters.length + i, tagDepth)} />
                ))}
              </g>
            )}
          </g>
          <TittleRect tittle={tittle[optical]} land={land} />
        </svg>
      </MotionFeatures>
    </div>
  )
}
