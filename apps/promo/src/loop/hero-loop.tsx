import { BellIcon, HeartIcon, StarIcon } from '@youj/icons'
import { Backdrop } from '../film/backdrop'
import { LOOP, LOOP_BEATS as L } from '../film/beats'
import { IconsScene, type IconsScript } from '../film/scenes/icons'

/* The homepage hero: the foundations, no titles (the page has its own). One
 * icon at macro on its drawing board morphs star to heart to bell, and the
 * bell rings; the camera pulls back to the whole set as a wave of
 * choreographies passes through it, then pushes back in while the bell
 * morphs home to the star. It lands on the frame the loop starts on (the
 * star at rest, every icon still), so the last frame hands straight back to
 * the first. Laid out on the loop's own stage (1200 × 675 at 1.6) so it
 * reads at the homepage's size. Simulated from frame 0, rendered from
 * LOOP.preroll: the script's frames are the composition's. */

const P = LOOP.preroll

export const LOOP_ICONS: IconsScript = {
  moves: [
    { at: P + L.pull, to: 'whole', length: L.pullLength },
    { at: P + L.push, to: 'macro', length: L.pushLength },
  ],
  links: [
    { at: P + L.links[0]!.at, from: StarIcon, to: HeartIcon, length: L.links[0]!.length },
    { at: P + L.links[1]!.at, from: HeartIcon, to: BellIcon, length: L.links[1]!.length },
    { at: P + L.links[2]!.at, from: BellIcon, to: StarIcon, length: L.links[2]!.length },
  ],
  play: P + L.ring,
  wave: P + L.wave,
  arrive: P + L.pull,
  arriveLength: 90,
  keylinesOut: P + L.pull + 4,
  keylinesIn: P + L.push + 40,
}

export function HeroLoop() {
  return (
    <>
      <Backdrop grid={0.8} glow={0.3} glowAt={{ x: 50, y: 50 }} />
      <IconsScene leaveAt={Infinity} script={LOOP_ICONS} />
    </>
  )
}
