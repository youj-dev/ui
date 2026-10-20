import * as motion from './index'
import * as interactions from './interactions'
import * as backgrounds from './backgrounds'
import * as players from './players'

/* The entries are the package's public surface: what @youj/react imports. */

test('the main entry exposes the transitions, effects and motion primitives', () => {
  for (const name of [
    'SlidingIndicator',
    'MorphLabel',
    'useMorphRoot',
    'Collapse',
    'ContentSwap',
    'PresenceList',
    'PresenceItem',
    'useSpotlight',
    'SpotlightGroup',
    'SpotlightSurface',
    'Shimmer',
    'useShimmer',
    'useAsyncAction',
    'AsyncFeedback',
    'AsyncAnnouncer',
    'Reveal',
    'Stagger',
    'TextSplit',
    'ScrambleText',
    'Counter',
    'TextEffect',
    'Magnetic',
    'Tilt',
    'Marquee',
    'Parallax',
    'ScrollProgress',
  ]) {
    expect(motion, name).toHaveProperty(name, expect.any(Function))
  }
})

test('interactions, backgrounds and players have their own entries', () => {
  for (const name of ['ShimmerBorder', 'ShimmerButton', 'SpotlightCard', 'SpotlightGrid', 'Dock', 'LiquidGlass']) {
    expect(interactions, name).toHaveProperty(name, expect.any(Function))
  }
  for (const name of ['MeshGradient', 'NoiseField', 'Aurora', 'ParticleConstellation', 'DotMatrixWave', 'MagneticField', 'RipplePond', 'WarpGrid', 'FlowField', 'Swarm']) {
    expect(backgrounds, name).toHaveProperty(name, expect.any(Function))
  }
  expect(players.LottiePlayer).toEqual(expect.any(Function))
})

test('the main entry stays light: no player runtimes, no icon set, no re-exported contract (that is @youj/core)', () => {
  for (const name of ['LottiePlayer', 'CheckIcon', 'MeshGradient', 'YoujProvider', 'useYouj', 'cn', 'durations']) expect(motion).not.toHaveProperty(name)
})
