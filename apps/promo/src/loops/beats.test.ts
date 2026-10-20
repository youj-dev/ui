import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { durations, palettes, soundCues, styles } from '@youj/core'
import { picks, sounds } from '../../../../packages/sound/src/packs/glass.data'
import { FPS } from '../film/beats'
import {
  COMPONENTS_LOOP as C,
  ENTRANCES_LOOP as N,
  ICONS_LOOP as I,
  ILLUSTRATIONS_LOOP as L,
  MOTION_LOOP as M,
  SOUND_LOOP as S,
  THEMES_HOME,
  THEMES_LOOP as T,
  THEMES_TARGET,
  TOPIC_CUTS,
  TOPIC_TITLES,
  TOPICS,
  type SoundLane,
  type TopicId,
} from './beats'
import { CUE_BINS, GLASS } from './sound-cues'

const topics = Object.keys(TOPICS) as TopicId[]
const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b)

describe('the topic loops', () => {
  it('each runs eight to twelve seconds, simulated from a pre-roll', () => {
    for (const topic of topics) {
      const { preroll, frames } = TOPICS[topic]
      expect(frames / FPS).toBeGreaterThanOrEqual(8)
      expect(frames / FPS).toBeLessThanOrEqual(12)
      expect(preroll).toBeGreaterThan(0)
    }
  })

  it('come in every cut: wide, portrait and the tile in both schemes, each with its own name and composition', () => {
    for (const topic of topics) {
      const cuts = TOPIC_CUTS.filter((c) => c.topic === topic).map((c) => `${c.cut}:${c.scheme}`)
      expect(cuts.sort()).toEqual(['tall:dark', 'tile:dark', 'tile:light', 'wide:dark'])
    }
    expect(new Set(TOPIC_CUTS.map((c) => c.name)).size).toBe(TOPIC_CUTS.length)
    expect(new Set(TOPIC_CUTS.map((c) => c.composition)).size).toBe(TOPIC_CUTS.length)
    expect(TOPIC_CUTS.find((c) => c.topic === 'icons' && c.cut === 'wide')!.name).toBe('loop-icons')
    expect(TOPIC_CUTS.find((c) => c.topic === 'icons' && c.cut === 'tile' && c.scheme === 'light')!.name).toBe('loop-icons-tile-light')
  })

  it('publish only the wide cut to the site: the tile strips and the portrait cuts are exports, rendered on request and kept local', () => {
    for (const cut of TOPIC_CUTS) expect(cut.destination).toBe(cut.cut === 'wide' ? 'site' : 'exports')
    const site = TOPIC_CUTS.filter((c) => c.destination === 'site').map((c) => c.name)
    expect(site.sort()).toEqual(topics.map((topic) => `loop-${topic}`).sort())
  })

  it('say what they show in words, never numbers, so they never go stale as the library grows', () => {
    for (const topic of topics) expect(TOPIC_TITLES[topic]).not.toMatch(/\d/)
  })
})

describe('icons', () => {
  it('reaches each board before its icon plays, and plays the first before the camera sets off', () => {
    expect(I.plays[0]!).toBeLessThan(I.steps[0]!)
    I.steps.forEach((at, i) => expect(I.plays[i + 1]!).toBeGreaterThanOrEqual(at + I.step))
    expect(I.plays).toEqual(sorted(I.plays))
  })

  it('pulls back after the last icon has played, and lands back on the first board with a moment to spare', () => {
    expect(I.pull).toBeGreaterThan(I.plays.at(-1)!)
    expect(I.push).toBeGreaterThan(I.pull + I.pullLength)
    expect(TOPICS.icons.frames - (I.push + I.pushLength)).toBeGreaterThanOrEqual(8)
  })
})

describe('themes', () => {
  const layers = T.layers.map((l) => l.at)
  const lined = Math.max(...T.bands.map((b) => b.at + T.slide))

  it('wipes the contract across a layer at a time, colour first and the component style last, after a rest', () => {
    expect(T.layers.map((l) => l.id)).toEqual(['colour', 'chart', 'shape', 'type', 'depth', 'style'])
    expect(layers).toEqual(sorted(layers))
    expect(layers[0]!).toBeGreaterThanOrEqual(FPS / 3)
  })

  it('never has more than two lines crossing at once: each is past halfway before the next sets off', () => {
    for (let i = 1; i < layers.length; i++) expect(layers[i]! - layers[i - 1]!).toBeGreaterThanOrEqual(T.cross / 2)
    for (let i = 2; i < layers.length; i++) expect(layers[i]! - layers[i - 2]!).toBeGreaterThanOrEqual(T.cross)
  })

  it("lines up four looks side by side once the layers are across, the farthest quarter first", () => {
    // The layers bring Cinnabar in Brutal; the bands bring three more: four distinct palettes, each in a style the library ships.
    const shown = [THEMES_TARGET, ...T.bands]
    expect(new Set(shown.map((l) => l.palette)).size).toBe(4)
    for (const look of [...shown, THEMES_HOME]) {
      expect(palettes.map((p) => p.id)).toContain(look.palette)
      expect(styles.map((s) => s.id)).toContain(look.style)
    }
    expect(T.bands[0]!.at).toBeGreaterThanOrEqual(layers.at(-1)! + T.cross)
    expect(T.bands.map((b) => b.stop)).toEqual([0.75, 0.5, 0.25])
    expect(T.bands.map((b) => b.at)).toEqual(sorted(T.bands.map((b) => b.at)))
  })

  it('works the product while the looks sit still: seven days, then thirty again, settled before the home line', () => {
    expect(T.week).toBeGreaterThanOrEqual(lined)
    expect(T.month - T.week).toBeGreaterThanOrEqual(FPS)
    // Neither press lands while the mode line is moving.
    for (const press of [T.week, T.month]) expect(press < T.light || press >= T.light + T.rise).toBe(true)
    expect(T.home - T.month).toBeGreaterThanOrEqual(FPS / 2)
  })

  it('splits light from dark once the looks are lined up, holds it, and is home in Youj before the loop comes round', () => {
    expect(T.light).toBeGreaterThanOrEqual(lined)
    expect(T.home - (T.light + T.rise)).toBeGreaterThanOrEqual(FPS)
    expect(TOPICS.themes.frames - (T.home + T.homeCross)).toBeGreaterThanOrEqual(FPS / 3)
  })
})

describe('motion', () => {
  it('visits its shots in order, each on screen at least a second and a quarter', () => {
    const at = Object.values(M.shots)
    expect(at).toEqual(sorted(at))
    for (let i = 1; i < at.length - 1; i++) expect(at[i + 1]! - at[i]!).toBeGreaterThanOrEqual(1.25 * FPS)
    expect(TOPICS.motion.frames - M.shots.home).toBeGreaterThanOrEqual(M.dissolve * 1.5)
  })

  it('does each thing while its shot is up', () => {
    const within = (frame: number, shot: keyof typeof M.shots, next: keyof typeof M.shots) => {
      expect(frame).toBeGreaterThanOrEqual(M.shots[shot])
      expect(frame).toBeLessThan(M.shots[next])
    }
    within(M.button.resolve, 'button', 'tabs')
    M.tabs.glides.forEach((at) => within(at, 'tabs', 'toggle'))
    within(M.toggle.flip, 'toggle', 'dialog')
    within(M.dialog.open, 'dialog', 'toasts')
    M.toasts.at.forEach((at) => within(at, 'toasts', 'list'))
    within(M.list.sort, 'list', 'split')
    M.split.sorts.forEach((at) => within(at, 'split', 'home'))
  })
})

describe('components', () => {
  it('saves while whole, then parts, gathers and draws its surface back in before the loop comes round', () => {
    expect(C.press).toBeGreaterThan(C.reach)
    expect(C.saved).toBeGreaterThan(C.press)
    expect(C.unwind).toBeGreaterThan(C.saved + 100)
    expect(C.part).toBeGreaterThanOrEqual(C.unwind)
    expect(C.gather).toBeGreaterThan(C.part + 6 * C.partStagger + 30)
    expect(C.chrome).toBeGreaterThan(C.gather)
    expect(TOPICS.components.frames - C.chrome).toBeGreaterThanOrEqual(FPS)
  })
})

describe('illustrations', () => {
  it('lands on a copy of the scene it starts on, a whole number of bobs later, so the seam is exact', () => {
    // A scene's float: ten deliberate beats a bob.
    expect(L.bob).toBe((durations.deliberate * 10 * FPS) / 1000)
    // The copy it lands on is on the next plot along, and arrives with the ripple.
    expect(L.landing).toBeGreaterThanOrEqual(L.wave + L.ring)
    expect((TOPICS.illustrations.frames - L.landing - (TOPICS.illustrations.preroll - 1)) % L.bob).toBe(0)
    // The first copy has assembled and settled by the first frame shown.
    expect(TOPICS.illustrations.preroll).toBeGreaterThanOrEqual(2 * FPS)
  })

  it('swaps its first scene, takes the new one apart once it has assembled, and pulls back once it has closed', () => {
    expect(L.swap).toBeGreaterThan(L.giveWay)
    expect(L.apart).toBeGreaterThanOrEqual(L.swap + FPS)
    expect(L.together - L.apart).toBeGreaterThanOrEqual(FPS / 2)
    expect(L.pull).toBeGreaterThanOrEqual(L.together)
    expect(L.wave).toBeGreaterThan(L.pull)
    expect(L.sweeps[0]!.at).toBeGreaterThanOrEqual(L.pull + L.pullLength)
  })

  it('sweeps the other presets across in turn, then Basalt, before the camera pushes in', () => {
    const at = L.sweeps.map((s) => s.at)
    expect(at).toEqual(sorted(at))
    expect(L.sweeps.map((s) => s.preset)).toEqual(['graphite', 'terminal', 'brutal', 'basalt'])
    for (let i = 1; i < at.length; i++) expect(at[i]! - at[i - 1]!).toBeGreaterThanOrEqual(FPS * 0.9)
    expect(L.push).toBeGreaterThanOrEqual(at.at(-1)! + L.sweepLength)
  })

  it('clears the library as the camera closes in, and holds still before the loop comes round', () => {
    expect(L.clear).toBeGreaterThan(L.push)
    expect(L.clear + L.clearLength).toBeLessThanOrEqual(L.push + L.pushLength)
    expect(TOPICS.illustrations.frames - (L.push + L.pushLength)).toBeGreaterThanOrEqual(FPS / 3)
  })
})

describe('sound', () => {
  const notes = (lane: SoundLane) => S.score.filter((n) => n.lane === lane)

  it('lands every note on a beat, in order, inside the loop, and the loop is a whole number of beats', () => {
    expect(TOPICS.sound.frames % S.beat).toBe(0)
    for (const note of S.score) {
      expect(note.at % S.beat).toBe(0)
      expect(note.at).toBeGreaterThan(0)
      expect(note.at).toBeLessThan(TOPICS.sound.frames)
    }
    expect(S.score.map((n) => n.at)).toEqual(sorted(S.score.map((n) => n.at)))
  })

  it('has every part play, each only the cues it emits', () => {
    for (const lane of S.lanes) {
      expect(notes(lane).length).toBeGreaterThan(0)
      for (const note of notes(lane)) expect(S.plays[lane]).toContain(note.cue)
    }
  })

  it('sounds a press, a choice, a toggle both ways, a success, an error and an arrival, all cues of the pack', () => {
    expect(new Set(S.score.map((n) => n.cue))).toEqual(new Set(['tap', 'select', 'toggleOn', 'toggleOff', 'success', 'error', 'notify']))
    for (const note of S.score) expect(soundCues).toContain(note.cue)
  })

  it('never overlaps two notes, and never repeats a cue within the player’s run, so each plays at its own level', () => {
    const length = (cue: keyof typeof GLASS) => (GLASS[cue].max.length / CUE_BINS) * FPS
    // Round the seam too: the loop plays again after its last note.
    const round = [...S.score, ...S.score.map((n) => ({ ...n, at: n.at + TOPICS.sound.frames }))]
    for (let i = 1; i < round.length; i++) expect(round[i]!.at - round[i - 1]!.at).toBeGreaterThanOrEqual(length(round[i - 1]!.cue))
    for (const cue of new Set(S.score.map((n) => n.cue))) {
      const at = round.filter((n) => n.cue === cue).map((n) => n.at)
      // The player's RUN_MS: repeats closer than 320 ms play quieter.
      for (let i = 1; i < at.length; i++) expect(((at[i]! - at[i - 1]!) / FPS) * 1000).toBeGreaterThanOrEqual(320)
    }
  })

  it('leaves every part as it found it before the loop comes round, so the seam is exact', () => {
    // The switch flips on and off in turn, and ends off; the range goes to a new segment and back.
    expect(notes('switch').map((n) => n.cue)).toEqual(['toggleOn', 'toggleOff'])
    expect(notes('range').length % 2).toBe(0)
    // Each press of Publish settles a beat later, and the outcome's hold (three deliberate beats) is over before the end.
    const publish = notes('publish')
    publish.forEach((note, i) => {
      if (note.cue === 'tap') expect(['success', 'error']).toContain(publish[i + 1]?.cue)
      else expect(note.at - publish[i - 1]!.at).toBe(S.beat)
    })
    const hold = (durations.deliberate * 3 * FPS) / 1000
    expect(TOPICS.sound.frames - (publish.at(-1)!.at + hold)).toBeGreaterThanOrEqual(FPS / 2)
    // The toast arrives once and is dismissed before the camera lands.
    expect(notes('toast')).toHaveLength(1)
    expect(S.dismiss).toBeGreaterThan(notes('toast')[0]!.at)
    expect(S.dismiss).toBeLessThan(S.push + S.pushLength)
  })

  it('steps down the parts at macro, each reached before its note, and pulls back only once the run has played', () => {
    const first = (lane: SoundLane) => notes(lane)[0]!.at
    S.steps.forEach((at, i) => {
      expect(at).toBeGreaterThan(first(S.lanes[i]!))
      expect(at + S.step).toBeLessThanOrEqual(first(S.lanes[i + 1]!) - 6)
    })
    const run = S.score.filter((n) => n.at <= S.pull)
    expect(run.at(-1)!.cue).toBe('success')
    expect(S.pull).toBeGreaterThan(run.at(-1)!.at)
  })

  it('pushes back in to Send once the phrase has played, landing with time to spare', () => {
    const phrase = S.score.filter((n) => n.at < S.push)
    expect(phrase.at(-1)!.at).toBeLessThan(S.push)
    // Send presses once more as the camera lands on it, and the push is still before the loop comes round.
    expect(S.score.at(-1)!.lane).toBe('send')
    expect(S.score.at(-1)!.at).toBeGreaterThan(S.push)
    expect(TOPICS.sound.frames - (S.push + S.pushLength)).toBeGreaterThanOrEqual(FPS / 3)
  })

})

describe('the sound loop’s cues', () => {
  const sha1 = (text: string) => createHash('sha1').update(text).digest('hex').slice(0, 12)

  it('are the Glass pack as it ships: every cue, its candidate and its bytes (run `pnpm -F promo cues` when the pack changes)', () => {
    expect(Object.keys(GLASS)).toEqual([...soundCues])
    for (const cue of soundCues) {
      expect(GLASS[cue].pick).toBe(picks[cue])
      expect(GLASS[cue].source).toBe(sha1(sounds[cue]))
    }
  })

  it('start where the player starts them, reach their peak within a few tens of milliseconds and end in silence', () => {
    for (const cue of soundCues) {
      const { max, min } = GLASS[cue]
      expect(max).toHaveLength(min.length)
      const level = max.map((hi, i) => Math.max(hi, -min[i]!))
      const top = Math.max(...level)
      expect(top).toBeGreaterThan(100)
      expect(top).toBeLessThan(1000)
      // The player starts a millisecond before the first sample within 50 dB of the peak: quiet, then the attack.
      expect(level[0]!).toBeLessThan(top / 10)
      expect(level.indexOf(top) / CUE_BINS).toBeLessThan(0.1)
      expect(level.at(-1)!).toBeLessThan(top / 100)
    }
  })
})

describe('entrances', () => {
  const relay = N.relay

  it('builds the parts in a relay, one look each, the frame first and Layers last over the whole screen', () => {
    expect(relay.map((r) => r.look)).toEqual(['blueprint', 'trace', 'prism', 'passes', 'inspector', 'layers'])
    expect(relay[0]!.region).toBe('frame')
    expect(relay.at(-1)!.region).toBe('frame')
    expect(new Set(relay.slice(1, -1).map((r) => r.region)).size).toBe(relay.length - 2)
  })

  it('hands over without a pause: each look starts before the one before it has landed', () => {
    relay.slice(1, -1).forEach((r, i) => expect(r.at).toBeLessThan(relay[i]!.at + relay[i]!.length - (relay[i]!.from ?? 0)))
  })

  it('clears to the paper before Blueprint drafts, tilts into Layers after the list, and lands at rest before the seam', () => {
    expect(N.clear + N.clearLength).toBeLessThanOrEqual(relay[0]!.at)
    const inspector = relay.at(-2)!
    expect(N.tilt).toBeGreaterThan(inspector.at)
    expect(N.tilt).toBeLessThan(relay.at(-1)!.at)
    const layers = relay.at(-1)!
    const landed = layers.at + layers.length - (layers.from ?? 0)
    // the install line comes up as the last parts land, and both are at rest before the seam
    expect(N.install).toBeGreaterThan(landed - 20)
    expect(Math.max(landed, N.install + N.installLength)).toBeLessThanOrEqual(TOPICS.entrances.frames - 12)
  })

  it('runs each baton from one part to the next as the next look starts', () => {
    expect(N.batons).toHaveLength(3)
    N.batons.forEach((b, i) => {
      const next = relay[i + 2]!
      expect(b.at + b.length).toBeGreaterThanOrEqual(next.at)
      expect(b.at).toBeLessThan(next.at)
    })
  })
})
