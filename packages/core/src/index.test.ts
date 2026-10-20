import * as core from './index'

/* The entry is the contract every package builds on: what @youj/motion, @youj/react and the rest import. */

test('the entry exposes the contract: provider, hooks, tokens, cn and themes', () => {
  for (const name of ['YoujProvider', 'ThemeScope', 'useYouj', 'useYoujScope', 'useMotionBudget', 'cn', 'MotionFeatures', 'defineTheme', 'checkTheme']) {
    expect(core, name).toHaveProperty(name, expect.any(Function))
  }
  expect(core.durations.base).toBeGreaterThan(0)
  expect(Object.keys(core.easings)).toContain('enter')
  expect(core.themes.map((t) => t.id)).toContain(core.DEFAULT_PRESET)
})

test('the entry carries no motion component, player or icon', () => {
  for (const name of ['Reveal', 'SlidingIndicator', 'Spinner', 'LottiePlayer', 'MeshGradient', 'CheckIcon']) expect(core).not.toHaveProperty(name)
})

test('sound: the core carries the cue bus and the mute, never the audio; the packs are @youj/sound', () => {
  expect(core.useSoundCue).toEqual(expect.any(Function))
  expect(core.useSound).toEqual(expect.any(Function))
  expect(core).not.toHaveProperty('SoundCueContext')
  expect(core.soundCues).toEqual(['tap', 'select', 'toggleOn', 'toggleOff', 'success', 'error', 'notify', 'open', 'close', 'tick'])
  expect(core).not.toHaveProperty('SoundProvider')
  expect(core).not.toHaveProperty('playSound')
})

test('the entry exports the presets that ship, and no others', () => {
  const shipped = ['basalt', 'graphite', 'terminal', 'brutal', 'meadow', 'sandstone', 'cinnabar', 'umber', 'seaglass', 'heather']
  expect(core.themes.map((t) => t.id).sort()).toEqual([...shipped].sort())
  for (const name of shipped) expect(core, name).toHaveProperty(name)
  for (const name of ['iris', 'linen']) expect(core, name).not.toHaveProperty(name)
})
