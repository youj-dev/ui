import type { ReactNode } from 'react'
import { Composition, Folder } from 'remotion'
import { ASSEMBLE, FILM_FRAMES, FPS, LOOP, ORIGIN, PARTS, SQUARE, STILL_FRAMES, THEMES } from './film/beats'
import { Backdrop } from './film/backdrop'
import { Film, FilmToaster } from './film/film'
import { STAGES } from './film/format'
import { BenchScene } from './film/scenes/bench'
import { OriginScene } from './film/scenes/origin'
import { ThemesScene } from './film/scenes/themes'
import { HOME } from './home/beats'
import { HomeFilm } from './home/film'
import { HOME_V2 } from './home/beats-v2'
import { HomeFilmV2 } from './home/film-v2'
import { HeroLoop } from './loop/hero-loop'
import { TOPIC_CUTS, TOPICS, type TopicId } from './loops/beats'
import { ComponentsLoop } from './loops/components'
import { EntrancesLoop } from './loops/entrances'
import { IconsLoop } from './loops/icons'
import { IllustrationsLoop } from './loops/illustrations'
import { MotionLoop } from './loops/motion'
import { SoundLoop } from './loops/sound'
import { ThemesLoop } from './loops/themes'
import { Proof } from './proof/proof'
import { Stage, type Theme } from './stage'
import { OgImage } from './stills/og'
import { SocialIcons, SocialTokens } from './stills/social'
import { TEASER_FPS, TEASER_FRAMES } from './teaser/beats'
import { Teaser } from './teaser/teaser'

/* Compositions are laid out in CSS px and rendered at a device scale (the
 * render script passes --scale): a 1440 × 810 stage at 4/3 becomes a
 * 1920 × 1080 video, the UI at the size a laptop shows it. */

const on = (Scene: () => ReactNode, theme: Theme = 'dark') =>
  function Composed() {
    return (
      <Stage theme={theme}>
        <Scene />
      </Stage>
    )
  }

const FilmComposition = on(Film)
/** The parts and their assembly on their own, on the film's backdrop. */
const BenchComposition = on(function Bench() {
  return (
    <>
      <FilmToaster />
      <Backdrop grid={0.8} glow={0.25} />
      <BenchScene />
    </>
  )
})
/** The products through the presets on their own, on the film's backdrop. */
const ThemesComposition = on(function Themes() {
  return (
    <>
      <FilmToaster />
      <Backdrop grid={0.8} glow={0.25} />
      <ThemesScene leaveAt={Infinity} />
    </>
  )
})
const ProofComposition = on(Proof)
/** The launch teaser; `board` burns the timecode and beat into the frame, for the storyboard only. */
function TeaserComposition({ board }: { board?: boolean }) {
  return (
    <Stage>
      <Teaser board={board} />
    </Stage>
  )
}
/* The homepage film, once per scheme: the site plays the one matching the page. */
const HomeFilmDark = on(() => <HomeFilm scheme="dark" />, 'dark')
const HomeFilmLight = on(() => <HomeFilm scheme="light" />, 'light')
/* Its second version (HOME-FILM-V2.md), beside the first so the two can be compared. */
const HomeFilmV2Dark = on(() => <HomeFilmV2 scheme="dark" />, 'dark')
const HomeFilmV2Light = on(() => <HomeFilmV2 scheme="light" />, 'light')

const wide = { fps: FPS, width: STAGES.wide.width, height: STAGES.wide.height }
const square = { fps: FPS, width: STAGES.square.width, height: STAGES.square.height }
const loop = { fps: FPS, width: STAGES.loop.width, height: STAGES.loop.height }

/* The topic loops, one scene each, laid out for whichever cut's stage they
 * are on. Simulated from their pre-roll, and one frame past their end, so the
 * seam can be checked against the first frame. */
const TOPIC_SCENES: Record<TopicId, () => ReactNode> = { icons: IconsLoop, themes: ThemesLoop, motion: MotionLoop, components: ComponentsLoop, illustrations: IllustrationsLoop, sound: SoundLoop, entrances: EntrancesLoop }
const TOPIC_COMPOSITIONS = TOPIC_CUTS.flatMap((cut) => {
  const Scene = TOPIC_SCENES[cut.topic]
  if (!Scene) return []
  const { preroll, frames } = TOPICS[cut.topic]
  const stage = STAGES[cut.cut]
  return [{ ...cut, component: on(Scene, cut.scheme), durationInFrames: preroll + frames + 1, width: stage.width, height: stage.height }]
})

/* Stills are compositions too: the simulation steps to the frame they are
 * taken at (STILL_FRAMES, which scripts/render.mjs reads). */

export function Root() {
  return (
    <>
      <Folder name="Promo">
        <Composition id="Film" component={FilmComposition} durationInFrames={FILM_FRAMES} {...wide} />
        <Composition id="FilmSquare" component={FilmComposition} durationInFrames={SQUARE.frames} {...square} />
        <Composition id="HeroLoop" component={on(HeroLoop)} durationInFrames={LOOP.preroll + LOOP.frames + 1} {...loop} />
        <Composition id="HomeFilm" component={HomeFilmDark} durationInFrames={HOME.preroll + HOME.frames + 1} {...loop} />
        <Composition id="HomeFilmLight" component={HomeFilmLight} durationInFrames={HOME.preroll + HOME.frames + 1} {...loop} />
        <Composition id="HomeFilmV2" component={HomeFilmV2Dark} durationInFrames={HOME_V2.preroll + HOME_V2.frames + 1} {...loop} />
        <Composition id="HomeFilmV2Light" component={HomeFilmV2Light} durationInFrames={HOME_V2.preroll + HOME_V2.frames + 1} {...loop} />
      </Folder>
      <Folder name="Loops">
        {TOPIC_COMPOSITIONS.map((c) => (
          <Composition key={c.composition} id={c.composition} component={c.component} durationInFrames={c.durationInFrames} fps={FPS} width={c.width} height={c.height} />
        ))}
      </Folder>
      <Folder name="Stills">
        <Composition id="OgImage" component={on(OgImage)} durationInFrames={STILL_FRAMES.og + 1} fps={FPS} width={960} height={504} />
        <Composition id="SocialTokens" component={on(SocialTokens)} durationInFrames={STILL_FRAMES.tokens + 1} {...square} />
        <Composition id="SocialIcons" component={on(SocialIcons)} durationInFrames={STILL_FRAMES.icons + 1} {...square} />
      </Folder>
      <Folder name="Scenes">
        <Composition id="Origin" component={on(OriginScene)} durationInFrames={ORIGIN.duration} {...wide} />
        <Composition id="Bench" component={BenchComposition} durationInFrames={PARTS.duration + ASSEMBLE.duration} {...wide} />
        <Composition id="Themes" component={ThemesComposition} durationInFrames={THEMES.duration} {...wide} />
      </Folder>
      <Folder name="Teaser">
        <Composition id="Teaser" component={TeaserComposition} durationInFrames={TEASER_FRAMES} fps={TEASER_FPS} width={STAGES.wide.width} height={STAGES.wide.height} />
      </Folder>
      <Folder name="Checks">
        <Composition id="Proof" component={ProofComposition} durationInFrames={130} fps={FPS} width={1920} height={1080} />
      </Folder>
    </>
  )
}
