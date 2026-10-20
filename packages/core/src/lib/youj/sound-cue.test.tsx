import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { useState } from 'react'
import { renderToString } from 'react-dom/server'
import { fireEvent, render, screen } from '@testing-library/react'
import { YoujProvider } from './provider'
import { useSound, useSoundCue } from './sound-cue'
import type { SoundCue, SoundRuntime } from './sound-scope'

/* YoujProvider's sound options: a pack's runtime hears the cues, the mute and
 * volume are the provider's, and without a `sound` prop a cue goes nowhere
 * and nothing is armed. */

function stubPack() {
  const disarm = vi.fn()
  const arm = vi.fn(() => disarm)
  const play = vi.fn<SoundRuntime['play']>(() => true)
  const runtime: SoundRuntime = { name: 'stub', arm, play }
  return { runtime, arm, disarm, play }
}

function Pad({ cue = 'tap' }: { cue?: SoundCue }) {
  const emit = useSoundCue()
  return (
    <button type="button" onClick={() => emit(cue)}>
      {cue}
    </button>
  )
}

function Status() {
  const sound = useSound()
  return (
    <>
      <output>{`${sound.enabled ? 'on' : 'off'}|${sound.muted ? 'muted' : 'live'}|${sound.volume}`}</output>
      <button type="button" onClick={() => sound.setMuted(!sound.muted)}>
        mute
      </button>
      <button type="button" onClick={() => sound.play('select')}>
        play
      </button>
    </>
  )
}

const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

test('without a sound prop, a cue is a no-op and nothing is armed', () => {
  render(
    <>
      <Pad />
      <YoujProvider>
        <Pad cue="success" />
        <Status />
      </YoujProvider>
    </>,
  )
  expect(() => press('tap')).not.toThrow()
  expect(() => press('success')).not.toThrow()
  expect(screen.getByRole('status')).toHaveTextContent('off|live|0.5')
  expect(() => press('play')).not.toThrow()
})

test('a pack hears each cue at the provider volume, and is armed once sound is on', () => {
  const { runtime, arm, play } = stubPack()
  render(
    <YoujProvider sound={{ pack: runtime, volume: 0.3 }} reducedMotion="never">
      <Pad cue="toggleOn" />
    </YoujProvider>,
  )
  expect(arm).toHaveBeenCalledTimes(1)
  press('toggleOn')
  expect(play).toHaveBeenCalledWith('toggleOn', 0.3)
})

test('once a pack is given, sound starts unmuted and plays', () => {
  const { runtime, arm, play } = stubPack()
  render(
    <YoujProvider sound={runtime} reducedMotion="never">
      <Pad />
    </YoujProvider>,
  )
  expect(arm).toHaveBeenCalledTimes(1)
  press('tap')
  expect(play).toHaveBeenCalled()
})

test('muted, it plays nothing and arms nothing, and unmuting arms it', () => {
  const { runtime, arm, play } = stubPack()
  const view = render(
    <YoujProvider sound={{ pack: runtime, muted: true }} reducedMotion="never">
      <Pad />
    </YoujProvider>,
  )
  press('tap')
  expect(play).not.toHaveBeenCalled()
  expect(arm).not.toHaveBeenCalled()
  view.rerender(
    <YoujProvider sound={{ pack: runtime, muted: false }} reducedMotion="never">
      <Pad />
    </YoujProvider>,
  )
  expect(arm).toHaveBeenCalledTimes(1)
  press('tap')
  expect(play).toHaveBeenCalledTimes(1)
})

test('a volume of 0 arms nothing', () => {
  const { runtime, arm } = stubPack()
  render(<YoujProvider sound={{ pack: runtime, volume: 0 }}>{null}</YoujProvider>)
  expect(arm).not.toHaveBeenCalled()
})

test('setMuted keeps the mute itself when uncontrolled, and reports it through onMutedChange', () => {
  const { runtime, play } = stubPack()
  const onSoundMutedChange = vi.fn()
  render(
    <YoujProvider sound={{ pack: runtime, onMutedChange: onSoundMutedChange }} reducedMotion="never">
      <Status />
      <Pad />
    </YoujProvider>,
  )
  press('mute')
  expect(onSoundMutedChange).toHaveBeenCalledWith(true)
  expect(screen.getByRole('status')).toHaveTextContent('on|muted')
  press('tap')
  expect(play).not.toHaveBeenCalled()
})

test('defaultMuted starts muted until the user turns sound on', () => {
  const { runtime, arm, play } = stubPack()
  render(
    <YoujProvider sound={{ pack: runtime, defaultMuted: true }}>
      <Pad />
      <Status />
    </YoujProvider>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('on|muted|0.5')
  press('tap')
  expect(play).not.toHaveBeenCalled()
  expect(arm).not.toHaveBeenCalled()
  press('mute')
  press('tap')
  expect(play).toHaveBeenCalledWith('tap', 0.5)
})

test("the user's own mute is remembered for the next visit, and the server renders the default", () => {
  const first = render(
    <YoujProvider sound={stubPack().runtime}>
      <Status />
    </YoujProvider>,
  )
  press('mute')
  expect(localStorage.getItem('youj-sound-muted')).toBe('true')
  first.unmount()

  const markup = renderToString(
    <YoujProvider sound={stubPack().runtime}>
      <Status />
    </YoujProvider>,
  )
  expect(markup).toContain('on|live|0.5')
  render(
    <YoujProvider sound={stubPack().runtime}>
      <Status />
    </YoujProvider>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('on|muted|0.5')
})

test('a controlled mute follows the app, which hears the request', () => {
  const { runtime, play } = stubPack()
  function App() {
    const [muted, setMuted] = useState(true)
    return (
      <YoujProvider sound={{ pack: runtime, muted, onMutedChange: setMuted }} reducedMotion="never">
        <Status />
        <Pad />
      </YoujProvider>
    )
  }
  render(<App />)
  expect(screen.getByRole('status')).toHaveTextContent('muted')
  press('mute')
  expect(screen.getByRole('status')).toHaveTextContent('live')
  press('tap')
  expect(play).toHaveBeenCalledTimes(1)
})

test('sound={false} silences a subtree, and a nested provider otherwise inherits the pack', () => {
  const { runtime, play } = stubPack()
  render(
    <YoujProvider sound={runtime} reducedMotion="never">
      <YoujProvider sound={false}>
        <Pad cue="open" />
        <Status />
      </YoujProvider>
      <YoujProvider sound={{ volume: 0.9 }}>
        <Pad cue="close" />
      </YoujProvider>
    </YoujProvider>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('off')
  press('open')
  expect(play).not.toHaveBeenCalled()
  press('close')
  expect(play).toHaveBeenCalledWith('close', 0.9)
})

test('under reduced motion a cue is silent, unless whenReduced', () => {
  const { runtime, play } = stubPack()
  render(
    <>
      <YoujProvider sound={runtime} reducedMotion="always">
        <Pad cue="tap" />
      </YoujProvider>
      <YoujProvider sound={{ pack: runtime, whenReduced: true }} reducedMotion="always">
        <Pad cue="select" />
      </YoujProvider>
    </>,
  )
  press('tap')
  expect(play).not.toHaveBeenCalled()
  press('select')
  expect(play).toHaveBeenCalledWith('select', 0.5)
})

test('motion={false} silences sound too, because the sound belongs to the motion', () => {
  const { runtime, play } = stubPack()
  render(
    <YoujProvider sound={runtime} motion={false}>
      <Pad />
    </YoujProvider>,
  )
  press('tap')
  expect(play).not.toHaveBeenCalled()
})

test('useSound().play says whether it played', () => {
  const { runtime, play } = stubPack()
  const played: boolean[] = []
  function Player() {
    const sound = useSound()
    return <button onClick={() => played.push(sound.play('tick'))}>go</button>
  }
  play.mockReturnValueOnce(false)
  render(
    <YoujProvider sound={runtime} reducedMotion="never">
      <Player />
    </YoujProvider>,
  )
  press('go')
  press('go')
  expect(played).toEqual([false, true])
})

test('a provider renders on a server that has no Web Audio, arming nothing', () => {
  const { runtime, arm } = stubPack()
  const html = renderToString(
    <YoujProvider sound={{ pack: runtime, volume: 0.6 }}>
      <Status />
    </YoujProvider>,
  )
  expect(html).toContain('on|live|0.6')
  expect(arm).not.toHaveBeenCalled()
})

test('motion makes no sound of its own: no file reaches for Web Audio', () => {
  const src = join(import.meta.dirname, '../..')
  const offenders = (readdirSync(src, { recursive: true }) as string[])
    .filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.test.tsx') && !f.endsWith('.test.ts'))
    .filter((f) => /AudioContext|decodeAudioData|new Audio\(/.test(readFileSync(join(src, f), 'utf8')))
  expect(offenders).toEqual([])
})

describe('the sound shorthand', () => {
  test('a pack on its own is the shorthand, and `false` silences', () => {
    const { runtime } = stubPack()
    render(
      <YoujProvider sound={runtime}>
        <Status />
        <YoujProvider sound={false}>
          <Status />
        </YoujProvider>
      </YoujProvider>,
    )
    expect(screen.getAllByRole('status').map((el) => el.textContent)).toEqual(['on|live|0.5', 'off|live|0.5'])
  })
})
