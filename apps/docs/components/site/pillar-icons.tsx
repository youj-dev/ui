'use client'

import { motion } from 'motion/react'
import {
  AudioLinesIcon,
  BookOpenIcon,
  BrandFigmaIcon,
  CompassIcon,
  createIcon,
  FrameIcon,
  LayoutGridIcon,
  origin,
  PackageIcon,
  Rows2Icon,
  SlidersIcon,
  SparklesIcon,
  TerminalIcon,
  ToggleIcon,
  type YoujIconComponent,
} from '@youj/icons'
import type { NavGlyph, PillarId } from '@/lib/nav'

/* One glyph per part of the family, drawn with Youj's own icon engine on
 * the set's 24-unit grid and 1.5 stroke. Each plays a gesture that says what
 * its part does: the switch flips, the curve draws itself and its particle
 * lands, the sparkle turns in its keyline, the box's lid lifts off, the
 * tittle orbits its o, the contrast swaps sides, a block drops into its page. */

/** Youj UI: a component, spelled as a switch that flips. */
export const UiGlyph = createIcon({
  name: 'youj',
  category: 'system',
  keywords: ['components', 'ui'],
  variants: (k) => ({
    knob: {
      rest: { x: 0, transition: k.spring('snappy') },
      active: { x: [0, -7.5, 0], transition: { ...k.tween('deliberate', 'emphasized'), times: [0, 0.45, 1] } },
    },
  }),
  render: (v) => (
    <>
      <rect x="2.75" y="6.75" width="18.5" height="10.5" rx="5.25" />
      <motion.circle cx="15.75" cy="12" r="2.75" fill="currentColor" stroke="none" variants={v.knob} />
    </>
  ),
})

/** Youj Motion: an easing curve, and the particle that rides it to rest. */
export const MotionGlyph = createIcon({
  name: 'youj-motion',
  category: 'system',
  keywords: ['motion', 'easing'],
  variants: (k) => ({
    curve: {
      rest: { pathLength: 1, opacity: 1, transition: k.tween('fast') },
      active: { pathLength: [0, 1], opacity: 1, transition: k.tween('slow', 'emphasized') },
    },
    particle: {
      rest: { y: 0, opacity: 1, transition: k.spring('snappy') },
      active: { y: [-5, 0], opacity: [0, 1], transition: { ...k.spring('settle'), delay: k.duration('base') } },
    },
  }),
  render: (v) => (
    <>
      <motion.path d="M3.5 19.25C11.5 19.25 9.5 5.25 17.75 5.25" variants={v.curve} />
      <motion.rect x="18.5" y="3.75" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" variants={v.particle} />
    </>
  ),
})

/** Youj Icons: a sparkle on its keyline tile, turning a quarter. */
export const IconsGlyph = createIcon({
  name: 'youj-icons',
  category: 'system',
  keywords: ['icons'],
  variants: (k) => ({
    star: {
      rest: { rotate: 0, scale: 1, transition: k.spring('smooth') },
      active: { rotate: 90, scale: [1, 0.72, 1], transition: { rotate: k.spring('settle'), scale: k.tween('slow', 'emphasized') } },
    },
  }),
  render: (v) => (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <motion.path
        d="M12 7.25 13.3 10.7 16.75 12 13.3 13.3 12 16.75 10.7 13.3 7.25 12 10.7 10.7Z"
        variants={v.star}
        style={origin(12, 12)}
      />
    </>
  ),
})

/** Youj Illustrations: an isometric box whose lid lifts off while it's pointed at, as the scenes come apart. */
export const IllustrationsGlyph = createIcon({
  name: 'youj-illustrations',
  category: 'system',
  keywords: ['illustrations', 'isometric', 'scenes'],
  variants: (k) => ({
    lid: {
      rest: { y: 0, transition: k.spring('smooth') },
      active: { y: -2.75, transition: k.spring('smooth') },
    },
  }),
  render: (v) => (
    <>
      <path d="M5 9.5V16.5L12 20.5L19 16.5V9.5M5 9.5L12 13.5L19 9.5M12 13.5V20.5" />
      <motion.path d="M12 5.5L19 9.5L12 13.5L5 9.5Z" variants={v.lid} />
    </>
  ),
})

/* The tittle's round trip: twelve stops on a tilted orbit about the o, from
 * its resting place at the top right, nearer (larger) in front and fainter
 * where it passes behind. */
const ORBIT = {
  x: [0, -0.59, -3.45, -7.8, -12.48, -16.24, -18.07, -17.48, -14.62, -10.27, -5.59, -1.83, 0],
  y: [0, 2.3, 4.76, 6.74, 7.7, 7.38, 5.87, 3.58, 1.11, -0.87, -1.83, -1.51, 0],
  scale: [1, 1.11, 1.19, 1.22, 1.19, 1.11, 1, 0.89, 0.81, 0.78, 0.81, 0.89, 1],
  opacity: [1, 1, 1, 1, 1, 1, 1, 0.7, 0.48, 0.4, 0.48, 0.7, 1],
}

/** Youj Loaders: the youj o, and the j's square tittle going once round it in depth while it's pointed at. */
export const LoadersGlyph = createIcon({
  name: 'youj-loaders',
  category: 'system',
  keywords: ['loaders', 'animations', 'loading', 'orbit'],
  variants: (k) => ({
    tittle: {
      rest: { x: 0, y: 0, scale: 1, opacity: 1, transition: k.spring('snappy') },
      active: { ...ORBIT, transition: { duration: k.duration('deliberate') * 2, ease: 'linear' } },
    },
  }),
  render: (v) => (
    <>
      <rect x="7.5" y="8" width="9" height="9" rx="3.25" />
      <motion.rect x="19.54" y="8.06" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" variants={v.tittle} style={origin(21.04, 9.56)} />
    </>
  ),
})

/** Youj Themes: one circle, light and dark, swapping sides. */
export const ThemesGlyph = createIcon({
  name: 'youj-themes',
  category: 'system',
  keywords: ['themes', 'tokens'],
  variants: (k) => ({
    half: {
      rest: { rotate: 0, transition: k.spring('smooth') },
      active: { rotate: 180, transition: k.tween('slow', 'emphasized') },
    },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <motion.path d="M12 3.75a8.25 8.25 0 0 0 0 16.5Z" fill="currentColor" stroke="none" variants={v.half} style={origin(12, 12)} />
    </>
  ),
})

/** Youj Blocks: a page with its bar, and a whole block dropping into place under it. */
export const BlocksGlyph = createIcon({
  name: 'youj-blocks',
  category: 'system',
  keywords: ['blocks', 'pages'],
  variants: (k) => ({
    block: {
      rest: { y: 0, opacity: 1, transition: k.spring('snappy') },
      active: { y: [-4.5, 0], opacity: [0, 1], transition: k.spring('settle') },
    },
  }),
  render: (v) => (
    <>
      <rect x="3" y="3.75" width="18" height="16.5" rx="3" />
      <path d="M3 8.75H21" />
      <motion.rect x="6.75" y="12.25" width="10.5" height="4.5" rx="1.25" variants={v.block} />
    </>
  ),
})

export const pillarGlyph: Record<PillarId, YoujIconComponent> = {
  ui: UiGlyph,
  motion: MotionGlyph,
  loaders: LoadersGlyph,
  icons: IconsGlyph,
  illustrations: IllustrationsGlyph,
  sound: AudioLinesIcon,
  themes: ThemesGlyph,
  blocks: BlocksGlyph,
}

/** The header menus' entries (lib/nav's `NavGlyph`): the family's parts as their own glyphs, the rest from the set. */
export const navGlyph: Record<NavGlyph, YoujIconComponent> = {
  docs: BookOpenIcon,
  guides: CompassIcon,
  themes: ThemesGlyph,
  motion: MotionGlyph,
  icons: IconsGlyph,
  illustrations: IllustrationsGlyph,
  loaders: LoadersGlyph,
  sound: AudioLinesIcon,
  ai: SparklesIcon,
  cli: TerminalIcon,
  // Figma's own mark: the kit's library lives there.
  figma: BrandFigmaIcon,
  playground: SlidersIcon,
  components: ToggleIcon,
  // The ladder, each level its own shape: a grid of cards, a page's bands, a frame, a screen whose block drops in.
  cards: LayoutGridIcon,
  sections: Rows2Icon,
  frames: FrameIcon,
  screens: BlocksGlyph,
  miniatures: PackageIcon,
}
