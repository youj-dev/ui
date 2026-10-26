import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureHandheldConsole, type MiniatureHandheldConsoleKey, handheldConsole } from './handheld-console'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureHandheldConsole, handheldConsole)

describe('Handheld game console', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it (reduced motion unless asked: the game then takes one step per move and the demo holds), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureHandheldConsoleKey[] = [], settle = 100, reducedMotion: 'always' | 'never' = 'always') => {
    const run = useFrames()
    const view = mount(MiniatureHandheldConsole, { reducedMotion })
    await run(100)
    const press = async (list: MiniatureHandheldConsoleKey[]) => {
      for (const k of list) {
        act(() => view.handle().press(k))
        await run(50)
      }
    }
    await press(keys)
    await run(settle)
    const part = (label: string) => view.inside.querySelector(`[aria-label^="${label}"]`) as SVGElement
    return {
      ...view,
      run,
      press,
      part,
      snap: () => view.handle().getSnapshot(),
      /** Pip's column on the screen, and `up` mid-hop; null while no game runs. */
      pip: () => view.inside.querySelector('[data-yj-pip]')?.getAttribute('data-yj-pip') ?? null,
      /** The screen's lit pixels, one path per tone. */
      screen: () => [...view.inside.querySelectorAll('path.l1, path.l2, path.l3')].map((p) => p.getAttribute('d')).join('|'),
    }
  }
  const DOWN: MiniatureHandheldConsoleKey[] = ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown']

  it('waits on its title with the demo still, no game running', async () => {
    const { snap, pip } = await play()
    expect(snap()).toEqual(handheldConsole.initial)
    expect(pip()).toBeNull()
  })

  it('Start begins a game: Pip in the middle of the ground, three hearts', async () => {
    const { snap, pip } = await play(['Enter'])
    expect(snap().state).toBe('PLAYING · LEVEL 1')
    expect(snap().readout).toBe('SCORE 0000 · HI 0000 · ♥♥♥')
    expect(pip()).toBe('3')
  })

  it('the arrows walk Pip a cell at a time, and the walls stop it', async () => {
    const { pip, press } = await play(['Enter', 'ArrowLeft'])
    expect(pip()).toBe('2')
    await press(['ArrowRight', 'ArrowRight'])
    expect(pip()).toBe('4')
    await press(['ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft'])
    expect(pip()).toBe('0')
  })

  it('a coin that falls onto Pip scores, and sets the high score', async () => {
    const { snap } = await play(['Enter', 'ArrowDown', 'ArrowDown'])
    expect(snap().readout).toBe('SCORE 0001 · HI 0001 · ♥♥♥')
    expect(snap().state).toBe('COIN +1')
  })

  it.each(['a', ' ', 'ArrowUp'] as const)('%j hops the block that rolls in, for a point', async (key) => {
    const { snap, pip } = await play(['Enter', ...DOWN, key])
    expect(pip()).toBe('3 up')
    expect(snap().state).toBe('HOP +1')
    expect(snap().readout).toBe('SCORE 0002 · HI 0002 · ♥♥♥')
  })

  it('down drops Pip out of a hop', async () => {
    const { pip, press } = await play(['Enter', 'a'])
    expect(pip()).toBe('3 up')
    await press(['ArrowDown'])
    expect(pip()).toBe('3')
  })

  it('B dashes two cells the way Pip faces', async () => {
    const { pip, press } = await play(['Enter', 'b'])
    expect(pip()).toBe('5')
    await press(['ArrowLeft', 'b'])
    expect(pip()).toBe('2')
  })

  it('a block that reaches Pip on the ground costs a heart', async () => {
    const { snap } = await play(['Enter', ...DOWN, 'ArrowDown'])
    expect(snap().state).toBe('OUCH · ♥ LOST')
    expect(snap().readout).toBe('SCORE 0001 · HI 0001 · ♥♥♡')
  })

  it('the last heart ends the game; Start plays again and keeps the high score', async () => {
    const { snap, press, run } = await play(['Enter', ...DOWN, ...DOWN, ...DOWN, ...DOWN, ...DOWN, ...DOWN])
    await run(1500)
    expect(snap().state).toBe('GAME OVER · START PLAYS AGAIN')
    expect(snap().readout).toMatch(/^SCORE (\d{4}) · HI \1 · ♡♡♡$/)
    const best = snap().readout.slice(6, 10)
    await press(['ArrowLeft'])
    expect(snap().state).toBe('GAME OVER · PRESS START')
    await press(['Enter'])
    expect(snap().state).toBe('PLAYING · LEVEL 1')
    expect(snap().readout).toBe(`SCORE 0000 · HI ${best} · ♥♥♥`)
  })

  it('Start pauses and resumes; paused, the game holds', async () => {
    const { snap, pip, press } = await play(['Enter', 'Enter'])
    expect(snap().state).toBe('PAUSED · START RESUMES')
    await press(['ArrowLeft', 'a'])
    expect(pip()).toBe('3')
    await press(['Enter'])
    expect(snap().state).toBe('PLAYING · LEVEL 1')
  })

  it('select switches the backlight off and on', async () => {
    const { snap, svg, press } = await play(['s'])
    expect(svg()).toHaveClass('unlit')
    expect(snap().state).toBe('BACKLIGHT OFF')
    await press(['s'])
    expect(svg()).not.toHaveClass('unlit')
    expect(snap().state).toBe('BACKLIGHT ON')
  })

  it('E ejects the cartridge and pushes it back in: the console boots again and keeps the high score', async () => {
    const { snap, press, run, part } = await play(['Enter', 'ArrowDown', 'ArrowDown'])
    const front = () => part('Cartridge').querySelector('path.cart')!.getAttribute('d')
    const seated = front()
    await press(['e'])
    expect(snap().state).toBe('CARTRIDGE OUT')
    expect(snap().readout).toBe('SCORE 0000 · HI 0001 · ♥♥♥')
    expect(front()).not.toBe(seated)
    await press(['a'])
    expect(snap().state).toBe('NO CARTRIDGE')
    await run(900)
    expect(snap().state).toBe('CARTRIDGE IN · BOOTING')
    expect(front()).toBe(seated)
    await run(1200)
    expect(snap()).toEqual({ ...handheldConsole.initial, readout: 'SCORE 0000 · HI 0001 · ♥♥♥' })
  })

  it('in full motion Start shows READY, then the game runs on its own clock', async () => {
    const { snap, run } = await play(['Enter'], 100, 'never')
    expect(snap().state).toBe('READY · LEVEL 1')
    await run(900)
    expect(snap().state).toBe('PLAYING · LEVEL 1')
    await run(1000)
    expect(snap().readout).toBe('SCORE 0001 · HI 0001 · ♥♥♥')
  })

  it('in full motion the buttons press under the keys and come back up', async () => {
    const { inside, run, handle } = await play(['Enter'], 300, 'never')
    const looks: [MiniatureHandheldConsoleKey, () => string | null][] = [
      ['a', () => inside.querySelector('circle.top.ka')!.parentElement!.getAttribute('transform')],
      ['b', () => inside.querySelector('circle.top.kb')!.parentElement!.getAttribute('transform')],
      ['ArrowLeft', () => inside.querySelector('path.top.pad')!.getAttribute('d')],
      ['ArrowUp', () => inside.querySelector('path.top.pad')!.getAttribute('d')],
      ['s', () => inside.querySelectorAll('path.top.pill')[0]!.getAttribute('d')],
      ['Enter', () => inside.querySelectorAll('path.top.pill')[1]!.getAttribute('d')],
    ]
    for (const [key, look] of looks) {
      const rest = look()
      act(() => handle().press(key))
      await run(40)
      expect(look()).not.toBe(rest)
      await run(200)
      expect(look()).toBe(rest)
    }
  })

  it('with reduced motion nothing moves by itself, and a tap through press() leaves the buttons at rest', async () => {
    const { inside, run, screen, handle } = await play()
    const still = screen()
    await run(3000)
    expect(screen()).toBe(still)
    const cap = inside.querySelector('circle.top.ka')!.parentElement!
    const redrawn: string[] = []
    const watch = new MutationObserver(() => redrawn.push(cap.getAttribute('transform')!))
    watch.observe(cap, { attributes: true })
    act(() => handle().press('a'))
    await run(200)
    watch.disconnect()
    expect(redrawn).toEqual([])
  })

  it('left alone in full motion it plays a demo, pressing its own buttons', async () => {
    const { inside, run, screen, snap } = await play([], 100, 'never')
    const pad = inside.querySelector('path.top.pad')!
    const cap = inside.querySelector('circle.top.ka')!.parentElement!
    const buttons = new Set<string>()
    const frames = new Set<string>()
    for (let i = 0; i < 80; i++) {
      await run(50)
      buttons.add(`${pad.getAttribute('d')}|${cap.getAttribute('transform')}`)
      frames.add(screen())
    }
    expect(buttons.size).toBeGreaterThan(1)
    expect(frames.size).toBeGreaterThan(5)
    expect(snap().state).toBe('PIP HOP · PRESS START')
    expect(snap().readout).toBe(handheldConsole.initial.readout)
  })

  it('redraws in place: the drawing does not grow over play and every interaction', async () => {
    const { svg, run, press, part } = await play([], 500, 'never')
    const nodes = svg().querySelectorAll('*').length
    await run(3000)
    await press(['Enter'])
    await run(1200)
    await press(['ArrowLeft', 'ArrowRight', 'a', 'b', 'ArrowDown', ' ', 'ArrowUp', 'ArrowRight', 'b'])
    await run(4000)
    await press(['s', 's', 'Enter', 'ArrowLeft', 'Enter'])
    act(() => void part('D-pad right').dispatchEvent(new Event('pointerdown', { bubbles: true })))
    await run(600)
    act(() => void window.dispatchEvent(new Event('pointerup')))
    await press(['e'])
    await run(3000)
    await press(['Enter'])
    await run(5000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
  })

  it('its parts are buttons: start, the d-pad, A and B (Enter on one is its own press), and the cartridge', async () => {
    const { part, run, snap, pip } = await play()
    const tap = async (label: string) => {
      act(() => void part(label).dispatchEvent(new Event('pointerdown', { bubbles: true })))
      act(() => void window.dispatchEvent(new Event('pointerup')))
      await run(100)
    }
    await tap('Start')
    expect(snap().state).toBe('PLAYING · LEVEL 1')
    await tap('D-pad right')
    expect(pip()).toBe('4')
    await tap('A button')
    expect(pip()).toBe('4 up')
    act(() => void part('B button').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true })))
    await run(100)
    expect(pip()).toBe('6')
    expect(snap().state).not.toMatch(/^PAUSED/)
    act(() => void part('Cartridge').dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(100)
    expect(snap().state).toBe('CARTRIDGE OUT')
  })
})
