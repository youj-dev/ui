import { act, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MiniatureReducedMotion } from './engine/types'
import { MiniatureCardCatalog, type MiniatureCardCatalogKey, cardCatalog } from './card-catalog'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureCardCatalog, cardCatalog)

/** Each letter's drawer, its label and what the search finds there first. */
const FIRST: Record<string, [drawer: string, label: string, state: string]> = {
  a: ['01', 'A', 'FOUND · ABACUS'],
  b: ['02', 'B', 'FOUND · BEES'],
  c: ['03', 'C', 'FOUND · CANALS'],
  d: ['04', 'D–E', 'FOUND · DANCE'],
  e: ['04', 'D–E', 'FOUND · ECLIPSES'],
  f: ['05', 'F–G', 'FOUND · FERNS'],
  g: ['05', 'F–G', 'FOUND · GARDENS'],
  h: ['06', 'H–I', 'FOUND · HARBORS'],
  i: ['06', 'H–I', 'FOUND · ICE'],
  j: ['07', 'J–L', 'FOUND · JAZZ'],
  k: ['07', 'J–L', 'FOUND · KITES'],
  l: ['07', 'J–L', 'FOUND · LANTERNS'],
  m: ['08', 'M', 'FOUND · MAPS'],
  n: ['09', 'N–O', 'FOUND · NAVIGATION'],
  o: ['09', 'N–O', 'FOUND · OCEANS'],
  p: ['10', 'P–Q', 'FOUND · PAPER'],
  q: ['10', 'P–Q', 'FOUND · QUARRIES'],
  r: ['11', 'R', 'FOUND · RADIO'],
  s: ['12', 'S', 'FOUND · SAILS'],
  t: ['13', 'T–U', 'FOUND · TEA'],
  u: ['13', 'T–U', 'FOUND · UMBRELLAS'],
  v: ['14', 'V–W', 'FOUND · VALVES'],
  w: ['14', 'V–W', 'FOUND · WEATHER'],
  x: ['15', 'X–Z', 'NO MATCH · NEAREST YARN'],
  y: ['15', 'X–Z', 'FOUND · YARN'],
  z: ['15', 'X–Z', 'FOUND · ZINC'],
}

describe('CardCatalog', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it (still, unless asked), presses the keys in order, as fast as type-ahead, and lets it settle. */
  const play = async (keys: MiniatureCardCatalogKey[] = [], settle = 400, reducedMotion: MiniatureReducedMotion = 'always') => {
    const run = useFrames()
    const view = mount(MiniatureCardCatalog, { reducedMotion })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    const raised = () => view.inside.querySelector('.leaf.hit .card-h')?.textContent ?? null
    const panel = (n: number) => view.inside.querySelector(`[aria-label^="Drawer ${n},"]`) as SVGGElement
    return { ...view, run, raised, panel, snap: () => view.handle().getSnapshot() }
  }

  it('starts with the M drawer out and METEORS raised in it', async () => {
    const { snap, raised, panel } = await play()
    expect(snap()).toEqual(cardCatalog.initial)
    expect(raised()).toBe('METEORS')
    expect(panel(8)).toHaveAttribute('aria-expanded', 'true')
    expect(panel(8)).toHaveAttribute('aria-label', 'Drawer 8, M: close')
  })

  it.each(cardCatalog.keys[0].keys)('%s opens its drawer and finds the first card filed under it', async (key) => {
    const [drawer, label, state] = FIRST[key]!
    const { snap, panel } = await play([key])
    expect(snap().readout).toBe(`FIND “${key.toUpperCase()}” · DRAWER ${drawer} · ${label}`)
    expect(snap().state).toBe(state)
    expect(panel(Number(drawer))).toHaveAttribute('aria-expanded', 'true')
    if (drawer !== '08') expect(panel(8)).toHaveAttribute('aria-expanded', 'false')
  })

  it('letters typed within a second narrow the search; after a pause a letter starts a new one', async () => {
    const { handle, run, snap, raised } = await play(['m', 'u'])
    expect(snap().readout).toBe('FIND “MU” · DRAWER 08 · M')
    expect(snap().state).toBe('FOUND · MUSIC')
    expect(raised()).toBe('MUSIC')
    await run(1200)
    act(() => handle().press('s'))
    await run(100)
    expect(snap().readout).toBe('FIND “S” · DRAWER 12 · S')
    expect(raised()).toBe('SAILS')
  })

  it('a query with no card raises nothing and stands a ghost where it would be filed', async () => {
    const { inside, snap, raised } = await play(['x'])
    expect(raised()).toBeNull()
    const ghost = inside.querySelector('.ghost')!
    expect(ghost).toHaveAttribute('display', 'inline')
    expect(ghost).toHaveTextContent('“X”')
    const narrowed = await play(['q', 'u', 'a', 's'])
    expect(narrowed.snap().readout).toBe('FIND “QUAS” · DRAWER 10 · P–Q')
    expect(narrowed.snap().state).toBe('NO MATCH · NEAREST QUILTS')
    expect(snap().state).toBe('NO MATCH · NEAREST YARN')
  })

  it('↓ and ↑ browse the cards of the open drawer and stop at its ends', async () => {
    const { handle, run, snap, raised } = await play(['ArrowDown'])
    expect(snap().readout).toBe('FIND “MOSSES” · DRAWER 08 · M')
    expect(raised()).toBe('MOSSES')
    for (const k of ['ArrowUp', 'ArrowUp', 'ArrowUp'] as const) act(() => handle().press(k))
    await run(100)
    expect(snap().state).toBe('FOUND · MAPS')
    act(() => handle().press('ArrowUp'))
    expect(snap().state).toBe('FIRST CARD IN THE DRAWER')
    for (let i = 0; i < 5; i++) act(() => handle().press('ArrowDown'))
    await run(100)
    expect(snap().state).toBe('LAST CARD IN THE DRAWER')
    expect(raised()).toBe('MUSIC')
  })

  it('↓ after a miss goes on to the next card on file', async () => {
    const { snap, raised } = await play(['x', 'ArrowDown'])
    expect(snap().state).toBe('FOUND · YARN')
    expect(raised()).toBe('YARN')
  })

  it('Enter takes the raised card out of the drawer to read, and puts it back', async () => {
    const { handle, run, inside, svg, snap } = await play(['Enter'])
    expect(snap().state).toBe('CARD OUT · METEORS')
    // Lifted clear of the drawer, it's drawn over everything.
    const out = inside.querySelector('.leaf.hit')!
    expect(out).toHaveTextContent('METEORS')
    const drawing = [...svg().children].find((c) => c.localName === 'g')!
    expect(drawing.lastElementChild).toContainElement(out as HTMLElement)
    act(() => handle().press('Enter'))
    await run(200)
    expect(snap().state).toBe('FOUND · METEORS')
  })

  it('Enter while it riffles takes the card out once it rises', async () => {
    const { snap } = await play(['b', 'Enter'])
    expect(snap().state).toBe('CARD OUT · BEES')
  })

  it('Enter with nothing raised says so', async () => {
    const { handle, snap } = await play(['x'])
    act(() => handle().press('Enter'))
    expect(snap().state).toBe('NO CARD RAISED · TRY ANOTHER LETTER')
    act(() => handle().press('Escape'))
    act(() => handle().press('Enter'))
    expect(snap().state).toBe('NOTHING FOUND YET · TYPE A LETTER')
  })

  it('Escape pushes the drawer home and clears the search', async () => {
    const { handle, snap, panel, raised } = await play(['Escape'])
    expect(snap()).toEqual({ readout: 'FIND — · ALL CLOSED', state: 'CLOSED · TYPE A LETTER', pressed: {} })
    expect(panel(8)).toHaveAttribute('aria-expanded', 'false')
    expect(raised()).toBeNull()
    act(() => handle().press('Escape'))
    expect(snap().state).toBe('ALL CLOSED · TYPE A LETTER')
  })

  it('Backspace erases the last letter, and closes the drawer when the query is empty', async () => {
    const { handle, run, snap } = await play(['m', 'u', 'Backspace'])
    expect(snap().readout).toBe('FIND “M” · DRAWER 08 · M')
    expect(snap().state).toBe('FOUND · MAPS')
    act(() => handle().press('Backspace'))
    await run(100)
    expect(snap().readout).toBe('FIND — · ALL CLOSED')
    act(() => handle().press('Backspace'))
    expect(snap().state).toBe('NOTHING TO ERASE')
  })

  it('a drawer front opens its drawer when clicked and closes it again', async () => {
    const { run, snap, panel } = await play()
    act(() => void fireEvent.click(panel(2)))
    await run(100)
    expect(snap().readout).toBe('FIND “B” · DRAWER 02 · B')
    expect(snap().state).toBe('FOUND · BEES')
    act(() => void fireEvent.click(panel(2)))
    await run(100)
    expect(snap().state).toBe('CLOSED · TYPE A LETTER')
  })

  it('clicking a card raises it, and clicking the raised card takes it out', async () => {
    const { inside, run, snap } = await play()
    const music = [...inside.querySelectorAll('.leaf.card')].find((l) => l.textContent?.startsWith('MUSIC'))!
    act(() => void fireEvent.click(music))
    await run(100)
    expect(snap().state).toBe('FOUND · MUSIC')
    act(() => void fireEvent.click(music))
    await run(100)
    expect(snap().state).toBe('CARD OUT · MUSIC')
  })

  it('slides out, riffles, raises the card and pushes home when motion is allowed', async () => {
    const { handle, run, snap, raised } = await play([], 0, 'never')
    act(() => handle().press('b'))
    await run(50)
    expect(snap().state).toBe('OPENING DRAWER 02')
    await run(1600)
    expect(snap().state).toBe('FOUND · BEES')
    expect(raised()).toBe('BEES')
    act(() => handle().press('Escape'))
    await run(50)
    expect(snap().state).toBe('CLOSING DRAWER 02')
    await run(1200)
    expect(snap().state).toBe('CLOSED · TYPE A LETTER')
  })

  it('left alone, it looks words up by itself until someone types', async () => {
    const { handle, run, snap } = await play([], 0, 'never')
    await run(7600)
    expect(snap().state).toMatch(/^DEMO · /)
    act(() => handle().press('c'))
    await run(1600)
    expect(snap().state).toBe('FOUND · CANALS')
  })
})
