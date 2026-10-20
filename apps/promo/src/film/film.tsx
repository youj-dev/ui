import type { ReactNode } from 'react'
import { Toaster } from '@youj/react/components/ui/toast'
import { during, tween } from '../lib/timing'
import { Seq, useFrame } from '../sim/simulation'
import { Backdrop } from './backdrop'
import {
  ASSEMBLE,
  CAPTIONS,
  END,
  END_BEATS,
  ICONS,
  ORIGIN,
  ORIGIN_BEATS,
  PARTS,
  SQUARE,
  SQUARE_CAPTIONS,
  SQUARE_THEMES_SCRIPT,
  THEMES,
  TOKENS,
} from './beats'
import { Brand } from './brand'
import { useFormat } from './format'
import { paletteVars } from './palette'
import { BenchScene } from './scenes/bench'
import { EndScene } from './scenes/end'
import { IconsScene } from './scenes/icons'
import { markHandover, OriginScene } from './scenes/origin'
import { SpecimenScene, stopAt, tuningAt } from './scenes/specimen'
import { ThemesScene } from './scenes/themes'

/* The film, from the atom to the product (see beats.ts): motion as the
 * origin, the tokens, the icons, the parts, the parts assembled into a
 * block, three products through the five themes, and the one command. One stage
 * (1440 × 810 CSS px, rendered at 4/3), one lockup that travels, and the
 * chapters in order, each starting while the one before is leaving. The
 * square cut (810 × 810) is shorter: the origin, the icons, two of the parts,
 * Tandem in three presets and the command. */

/** Where the lockup rests on the end card, as a fraction of the height. */
const END_Y = 0.4

export function Film() {
  const { width, height, square } = useFormat()
  const frame = useFrame()
  const end = square ? SQUARE.end : END
  // The accent glow sits behind the mark while it forms, and dims to a wash for the chapters.
  const glow = Math.min(1, 0.25 + during(frame, ORIGIN_BEATS.resolve, ORIGIN_BEATS.toHud + 30, 40) * 0.55 + tween(frame, end.from, 'deliberate') * 0.6)
  const mark = markHandover(width, height)
  return (
    <>
      {/* First, so it leads: anything else's Toaster waits behind it. */}
      <FilmToaster />
      <Tuned frame={frame} square={square}>
        <Backdrop grid={tween(frame, ORIGIN_BEATS.resolve, 'deliberate') * 0.8} glow={glow} glowAt={{ x: 50, y: 44 }} />
        <Seq from={ORIGIN.from} duration={ORIGIN.duration}>
          <OriginScene />
        </Seq>
        {square ? <SquareChapters /> : <WideChapters />}
        <Seq from={end.from}>
          <EndScene lockupY={END_Y} />
        </Seq>
        <Brand
          width={width}
          height={height}
          move={{
            from: ORIGIN_BEATS.word,
            mark,
            settle: 40,
            centerY: mark.at.y / height,
            toHud: { start: ORIGIN_BEATS.toHud, length: ORIGIN_BEATS.hudLength },
            toCenter: { start: end.from + END_BEATS.home, length: END_BEATS.homeLength },
            endY: END_Y,
            endSize: 56,
          }}
          captions={square ? SQUARE_CAPTIONS : CAPTIONS}
        />
      </Tuned>
    </>
  )
}

function WideChapters() {
  return (
    <>
      <Seq from={TOKENS.from} duration={TOKENS.duration}>
        <SpecimenScene leaveAt={TOKENS.leave} />
      </Seq>
      <Seq from={ICONS.from} duration={ICONS.duration}>
        <IconsScene leaveAt={ICONS.leave} />
      </Seq>
      <Seq from={PARTS.from} duration={PARTS.duration + ASSEMBLE.duration}>
        <BenchScene />
      </Seq>
      <Seq from={THEMES.from} duration={THEMES.duration}>
        <ThemesScene leaveAt={THEMES.leave} />
      </Seq>
    </>
  )
}

function SquareChapters() {
  return (
    <>
      <Seq from={SQUARE.icons.from} duration={SQUARE.icons.duration}>
        <Fade length={SQUARE.icons.duration} fadeOut={false}>
          <IconsScene leaveAt={SQUARE.icons.leave} />
        </Fade>
      </Seq>
      <Excerpt cut={SQUARE.save}>
        <BenchScene />
      </Excerpt>
      <Excerpt cut={SQUARE.lanes}>
        <BenchScene />
      </Excerpt>
      <Seq from={SQUARE.themes.from} duration={SQUARE.themes.duration}>
        <ThemesScene leaveAt={SQUARE.themes.leave} script={SQUARE_THEMES_SCRIPT} from="fade" />
      </Seq>
    </>
  )
}

/** A stretch of a scene: from its frame `start`, `length` frames long, shown from `from`, faded in and out. */
function Excerpt({ cut, children }: { cut: { from: number; start: number; length: number }; children: ReactNode }) {
  return (
    <Seq from={cut.from} duration={cut.length}>
      <Fade length={cut.length}>
        <Seq from={-cut.start}>{children}</Seq>
      </Fade>
    </Seq>
  )
}

function Fade({ length, fadeOut = true, children }: { length: number; fadeOut?: boolean; children: ReactNode }) {
  const frame = useFrame()
  const shown = Math.min(tween(frame, 0, 20, 'standard'), fadeOut ? 1 - tween(frame, length - 20, 20, 'standard') : 1)
  return (
    <div className="absolute inset-0" style={{ opacity: shown }}>
      {children}
    </div>
  )
}

/**
 * While the specimen retunes, the whole frame is painted in the palette of
 * the moment: backdrop, HUD and all. Outside it, the stage's own theme.
 */
function Tuned({ frame, square, children }: { frame: number; square: boolean; children: ReactNode }) {
  const local = frame - TOKENS.from
  const stop = !square && local >= 0 && local < TOKENS.duration ? stopAt(local) : null
  const retuned = stop && (stop.from !== 'basalt' || stop.to !== 'basalt')
  return (
    <div className="absolute inset-0" style={retuned ? paletteVars(tuningAt(local).palette) : undefined}>
      {children}
    </div>
  )
}

/**
 * The film's one Toaster (toast() feeds a single manager, and the first
 * Toaster mounted leads). A scene parks it through --film-toast-bottom,
 * --film-toast-end and --film-toast-zoom: zoomed, it matches a camera that
 * is magnifying the scene around it.
 */
export function FilmToaster() {
  return (
    <Toaster
      position="bottom-end"
      limit={3}
      timeout={4000}
      className="end-(--film-toast-end) bottom-(--film-toast-bottom) w-[21rem] opacity-(--film-toast-opacity) [zoom:var(--film-toast-zoom)]"
    />
  )
}
