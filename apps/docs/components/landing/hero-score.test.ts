import type { PillarId } from '@/lib/nav'
import { COPY_OUT, ELEMENTS, fadeIn, FRAME, HEADING_IN, HERO_PIN_QUERY, heroSheet, land, LANDED, LANDINGS, travel, type Flight } from './hero-score'

const IDS: PillarId[] = [...ELEMENTS, 'blocks']
const flight = (id: PillarId, i: number): Flight => ({
  id,
  from: { x: 400 + i * 10, y: 420 + i * 10, w: 200, h: 100 },
  rest: 0.9,
  room: { x: 150 + i * 140, y: 200, w: 270, h: 150 },
})

describe('the hero’s score', () => {
  it('lets the copy go first, then the frame from under the parts, which only leave once it has started', () => {
    expect(COPY_OUT[0]).toBe(0)
    for (const id of ELEMENTS) expect(travel(id)[0], id).toBeGreaterThan(FRAME[0])
  })

  it('sends the tree through the middle only once the frame is out of it', () => {
    expect(travel('loaders')[0]).toBeGreaterThanOrEqual(FRAME[1])
  })

  it('staggers the parts, so no two leave at once, and lands every one before the grid has landed', () => {
    const starts = ELEMENTS.map((id) => travel(id)[0])
    expect(new Set(starts).size).toBe(starts.length)
    for (const id of IDS) {
      expect(fadeIn(id)[1], id).toBeLessThanOrEqual(LANDED)
      expect(fadeIn(id)[0], id).toBeGreaterThan(travel(id)[0])
    }
    expect(HEADING_IN[1]).toBeLessThanOrEqual(LANDED)
  })

  it('lands an element in its tile at its own shape, centered, never past its largest', () => {
    const room = { x: 0, y: 0, w: 400, h: 200 }
    const ui = land('ui', { w: 248, h: 170 }, room)
    expect(ui.w / ui.h).toBeCloseTo(248 / 170)
    expect(ui.x + ui.w / 2).toBeCloseTo(200)
    expect(land('icons', { w: 100, h: 20 }, room).w).toBe(125)
  })

  it('fits Banyan by its tree, which fills about two thirds of its square', () => {
    const room = { x: 0, y: 0, w: 400, h: 150 }
    expect(land('loaders', { w: 236, h: 272 }, room).h).toBeGreaterThan(150)
  })

  it('marks one tick on the rail for each of the eight parts, at its landing, in order, all before the grid has landed', () => {
    expect(LANDINGS).toHaveLength(8)
    expect([...LANDINGS].sort((a, b) => a - b)).toEqual(LANDINGS)
    for (const at of LANDINGS) expect(at).toBeLessThanOrEqual(LANDED)
    const sheet = heroSheet(IDS.map(flight))
    // The rail fills with the scroll and each tick lights as its part lands.
    expect(sheet).toContain('@keyframes ho-rail-fill{0%{scale:1 0}')
    for (let i = 0; i < 8; i++) expect(sheet).toContain(`@keyframes ho-tick-${i}{`)
  })

  it('writes keyframes for every element and its tile that move only translate, scale and opacity', () => {
    const sheet = heroSheet(IDS.map(flight))
    expect(sheet.startsWith(`@media ${HERO_PIN_QUERY}{`)).toBe(true)
    for (const id of IDS) for (const kind of ['f', 't']) expect(sheet).toContain(`@keyframes ho-${kind}-${id}{`)
    const properties = new Set([...sheet.matchAll(/@keyframes [^{]+\{(.*?)\}\}/g)].flatMap(([, body]) => [...body!.matchAll(/([a-z-]+):/g)].map((m) => m[1])))
    expect([...properties].sort()).toEqual(['animation-timing-function', 'opacity', 'scale', 'transform', 'translate'])
    // An element starts from the scale it rests at in the card.
    expect(sheet).toMatch(/@keyframes ho-f-ui\{0%\{translate:0 0;scale:0\.9\}/)
    // Played on the track's view timeline where there is one, else seeked by the stage; only once the card comes apart.
    expect(sheet).toContain('@supports (animation-timeline: view())')
    expect(sheet).toContain('animation-timeline:--ho')
    expect(sheet).toContain('.ho[data-apart] [data-el=ui]{animation:ho-f-ui 1000ms linear both paused}')
  })
})
