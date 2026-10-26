import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureRobotAssistant, type MiniatureRobotAssistantHandle, type MiniatureRobotAssistantKey, robotAssistant } from './robot-assistant'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureRobotAssistant, robotAssistant)

describe('Robot assistant', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it with reduced motion (no travel, no typing out), presses the keys in order and lets it settle. */
  const play = async (keys: (MiniatureRobotAssistantKey | 'space')[] = [], settle = 200) => {
    const run = useFrames()
    const view = mount(MiniatureRobotAssistant, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }
  const hi = (inside: ShadowRoot) => act(() => void (inside.querySelector('[aria-label="Say hi: it waves back"]') as SVGElement).dispatchEvent(new MouseEvent('click')))

  it('stands ready with nothing to say yet', async () => {
    const { snap } = await play()
    expect(snap()).toEqual(robotAssistant.initial)
  })

  it('letters go to the robot: it listens, and what you type is on its chest', async () => {
    const { snap, inside } = await play(['h', 'i', 'space', 't', 'h', 'e', 'r', 'e'])
    expect(snap().state).toBe('LISTENING · EYES ON THE KEYS')
    expect(snap().readout).toBe('YOU · HI THERE')
    expect([...inside.querySelectorAll('.scr')].map((t) => t.textContent).join('|')).toBe('HI THERE_|')
  })

  it('Backspace takes the last letter back', async () => {
    const { snap } = await play(['h', 'e', 'y', 'Backspace'])
    expect(snap().readout).toBe('YOU · HE')
  })

  it('a long prompt runs on to the next line of its chest screen', async () => {
    const { inside } = await play([...'helloworldagain'] as MiniatureRobotAssistantKey[])
    expect([...inside.querySelectorAll('.scr')].map((t) => t.textContent)).toEqual(['HELLOWORLDA', 'GAIN_'])
  })

  it('Enter: it thinks about what you typed, then replies on its chest screen and smiles', async () => {
    const { run, snap, inside } = await play(['h', 'e', 'l', 'l', 'o', 'Enter'])
    expect(snap().state).toBe('THINKING · ANTENNA PULSING')
    expect(snap().readout).toBe('YOU · HELLO')
    expect(inside.querySelector('[role=status]')).toHaveTextContent('Thinking about “hello”.')
    await run(1600)
    expect(snap().state).toBe('REPLIED · SMILING')
    expect(snap().readout).toBe('OLLEN · HI! HOW CAN I HELP?')
    expect(inside.querySelector('[role=status]')).toHaveTextContent('Hi! How can I help?')
    await run(4000)
    expect(snap().state).toBe('READY · TYPE TO TALK')
    expect(snap().readout).toBe('OLLEN · HI! HOW CAN I HELP?')
  })

  it('types its reply out a letter at a time, its mouth moving, when motion is allowed', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureRobotAssistant)
    await run(100)
    for (const k of ['t', 'h', 'a', 'n', 'k', 's', 'Enter'] as const) act(() => handle().press(k))
    await run(1800)
    expect(handle().getSnapshot().state).toBe('REPLYING · TYPING IT OUT')
    expect(inside.querySelector('.scr')!.textContent!.length).toBeLessThan('ANYTIME!'.length)
    await run(1000)
    expect(handle().getSnapshot().state).toBe('REPLIED · SMILING')
    expect(inside.querySelector('.scr')).toHaveTextContent('ANYTIME!')
  })

  it.each([
    ['how are you', 'ALL SYSTEMS GO!'],
    ['what is your name', 'I’M OLLEN!'],
    ['help me', 'HAPPY TO HELP!'],
    ['what should we build', 'GOOD QUESTION!'],
  ])('answers “%s” with “%s”', async (prompt, reply) => {
    const { run, snap } = await play([...[...prompt].map((c) => (c === ' ' ? 'space' : c)), 'Enter'] as MiniatureRobotAssistantKey[])
    await run(1600)
    expect(snap().readout).toBe(`OLLEN · ${reply}`)
  })

  it('Enter with nothing typed asks you to type first', async () => {
    const { run, snap } = await play(['Enter'])
    expect(snap().readout).toBe('THINKING…')
    await run(1600)
    expect(snap().readout).toBe('OLLEN · TYPE, THEN ENTER')
  })

  it('a half-typed prompt lapses after a quiet spell', async () => {
    const { run, snap } = await play(['o', 'k'])
    await run(6500)
    expect(snap().state).toBe('LISTENING · EYES ON THE KEYS')
    await run(800)
    expect(snap().state).toBe('READY · TYPE TO TALK')
  })

  it.each([
    ['1', 'HAPPY · ARMS UP', 'HAPPY', 'YAY!'],
    ['2', 'SURPRISED · EYES WIDE', 'SURPRISED', 'WHOA!'],
    ['3', 'PUZZLED · HEAD TILTED', 'PUZZLED', 'HMM… ?'],
    ['4', 'SLEEPY · DOZING OFF', 'SLEEPY', 'Z z z'],
  ] as const)('%s is a one-shot mood: %s', async (key, state, mood, chest) => {
    const { run, snap, inside } = await play([key])
    expect(snap().state).toBe(state)
    expect(snap().readout).toBe(`MOOD · ${mood}`)
    expect(inside.querySelector('.scr')).toHaveTextContent(chest)
    await run(4400)
    expect(snap().state).toBe('READY · TYPE TO TALK')
  })

  it('a click on it: it waves and says hi', async () => {
    const { run, snap, inside } = await play()
    hi(inside)
    await run(100)
    expect(snap().state).toBe('WAVING · SAYING HI')
    expect(snap().readout).toBe('OLLEN · HI THERE!')
    expect(inside.querySelector('.scr')).toHaveTextContent('HI THERE!')
    await run(2400)
    expect(snap().state).toBe('READY · TYPE TO TALK')
  })

  it('typing cuts in on a reply, and a mood cuts in on typing', async () => {
    const { run, snap, handle } = await play(['y', 'o', 'Enter'])
    await run(1600)
    act(() => handle().press('o'))
    await run(50)
    expect(snap().readout).toBe('YOU · O')
    act(() => handle().press('2'))
    await run(50)
    expect(snap().state).toBe('SURPRISED · EYES WIDE')
  })

  it('its eyes and head follow the pointer', async () => {
    const { run, svg, inside } = await play()
    const face = () => inside.querySelectorAll('.visor')[1]!.parentElement!.getAttribute('transform')
    const before = face()
    svg().getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) as DOMMatrix
    act(() => void svg().dispatchEvent(new MouseEvent('pointermove', { clientX: 60, clientY: -70, bubbles: true })))
    await run(100)
    expect(face()).not.toBe(before)
    act(() => void svg().dispatchEvent(new MouseEvent('pointerleave')))
    await run(100)
    expect(face()).toBe(before)
  })

  it('under reduced motion it keeps still between states: no blinks, no breathing, no glances', async () => {
    const { run, svg } = await play()
    const before = svg().innerHTML
    await run(6000)
    expect(svg().innerHTML).toBe(before)
  })

  it('redraws in place: the drawing keeps its node count through play and every interaction', async () => {
    const run = useFrames()
    const { handle, svg, inside, rerender, ref } = mount(MiniatureRobotAssistant)
    await run(500)
    const nodes = svg().querySelectorAll('*').length
    const same = async (ms: number) => {
      await run(ms)
      expect(svg().querySelectorAll('*').length).toBe(nodes)
    }
    await same(3000)
    for (const k of ['h', 'e', 'l', 'l', 'o', 'Backspace', 'Enter'] as const) act(() => handle().press(k))
    await same(1000)
    await same(4000)
    for (const k of ['1', '2', '3', '4'] as const) {
      act(() => handle().press(k))
      await same(1500)
    }
    hi(inside)
    await same(2500)
    svg().getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) as DOMMatrix
    for (const [x, y] of [[-60, -40], [60, -120], [0, 20]]) {
      act(() => void svg().dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: y, bubbles: true })))
      await same(300)
    }
    rerender(<MiniatureRobotAssistant ref={ref} progress={0.3} />)
    await same(800)
    rerender(<MiniatureRobotAssistant ref={ref} progress={0.3} done />)
    await same(4000)
  })

  it('a progress prop makes it think, its chest screen and light ring filling', async () => {
    const run = useFrames()
    const { handle, rerender, ref, inside } = mount(MiniatureRobotAssistant, { reducedMotion: 'always' })
    rerender(<MiniatureRobotAssistant ref={ref} reducedMotion="always" progress={0.5} />)
    await run(300)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50%')
    expect(handle().getSnapshot().state).toBe('THINKING · ANTENNA PULSING')
    expect(inside.querySelector('.fill')).toHaveAttribute('width', '11.20')
    rerender(<MiniatureRobotAssistant ref={ref} reducedMotion="always" progress={0.75} />)
    await run(3000)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 75%')
    expect(inside.querySelector('.lit')).toHaveAttribute('stroke-dasharray', '75.00 100')
  })

  it('done: it says it is done with a smile, then rests', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureRobotAssistant, { progress: 0.4 })
    await run(300)
    rerender(<MiniatureRobotAssistant ref={ref} progress={0.4} done />)
    await run(300)
    expect(handle().getSnapshot().state).toBe('DONE · ANSWER READY')
    expect(handle().getSnapshot().readout).toBe('OLLEN · ALL DONE!')
    await run(4000)
    expect(handle().getSnapshot().state).toBe('READY · TYPE TO TALK')
  })

  it('the handle drives it too: setProgress, null for thinking without a share, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniatureRobotAssistantHandle>()
    const { rerender } = mount(MiniatureRobotAssistant, { reducedMotion: 'always' })
    rerender(<MiniatureRobotAssistant ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(300)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 25%')
    act(() => ref.current!.setProgress(null))
    await run(3000)
    expect(ref.current!.getSnapshot().state).toBe('THINKING · ANTENNA PULSING')
    expect(ref.current!.getSnapshot().readout).toBe('THINKING…')
    act(() => ref.current!.done())
    await run(300)
    expect(ref.current!.getSnapshot().readout).toBe('OLLEN · ALL DONE!')
  })

  it('a still robot is still a progress indicator: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniatureRobotAssistant, { interactive: false, autoPlay: false, progress: 0.6, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(300)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 60%')
  })
})
