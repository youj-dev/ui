import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureCellTower, cellTower } from './cell-tower'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureCellTower, cellTower)

describe('CellTower', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  const coverage = (inside: ShadowRoot) => [...inside.querySelectorAll<SVGElement>('.wedge')].map((w) => w.style.opacity)
  const phones = (inside: ShadowRoot) => [...inside.querySelectorAll<SVGElement>('.ph')].filter((p) => p.style.opacity !== '0').length
  const cabinetLamp = (inside: ShadowRoot, label: string) => [...inside.querySelectorAll('text')].find((n) => n.textContent === label)!.nextElementSibling!

  it('starts with traffic at 40%, sector A selected and the car served by B', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCellTower, { reducedMotion: 'always' })
    await run(100)
    // The lab caption starts at 48 users; its first frame computes 55 for sector A.
    expect(handle().getSnapshot()).toMatchObject({
      readout: 'LOAD 40% · 55 USERS · SECTOR A',
      state: 'ALL SECTORS UP · CAR ON B',
      pressed: { o: false },
    })
    expect(inside.querySelector('[aria-label="Select sector A (1)"]')).toHaveAttribute('aria-pressed', 'true')
    expect(coverage(inside)).toEqual(['0.09', '0.08', '0.07'])
    expect(phones(inside)).toBe(9)
    expect(inside.querySelector<SVGElement>('.link')!.style.opacity).toBe('0.8')
    expect(cabinetLamp(inside, 'PWR')).toHaveClass('g')
    expect(cabinetLamp(inside, 'ALM')).not.toHaveClass('r', 'a')
  })

  it('the arrows raise and lower traffic, changing users, coverage and phones', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCellTower, { reducedMotion: 'always' })
    await run(100)
    const rings = [...inside.querySelectorAll<SVGElement>('.ring')]
    const initialRings = rings.map((r) => r.style.opacity)
    act(() => handle().press('ArrowUp'))
    await run(200)
    expect(handle().getSnapshot().readout).toBe('LOAD 50% · 69 USERS · SECTOR A')
    expect(coverage(inside)).toEqual(['0.1', '0.1', '0.08'])
    expect(phones(inside)).toBe(12)
    rings.forEach((r, i) => expect(Number(r.style.opacity)).toBeGreaterThan(Number(initialRings[i])))
    act(() => handle().press('ArrowDown'))
    await run(200)
    expect(handle().getSnapshot().readout).toBe('LOAD 40% · 55 USERS · SECTOR A')
    expect(coverage(inside)).toEqual(['0.09', '0.08', '0.07'])
    expect(phones(inside)).toBe(9)
    expect(handle().getSnapshot().state).toBe('ALL SECTORS UP · CAR ON B')
  })

  it('traffic stays within zero and 100 percent', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCellTower, { reducedMotion: 'always' })
    await run(100)
    act(() => { for (let i = 0; i < 12; i++) handle().press('ArrowDown') })
    await run(200)
    expect(handle().getSnapshot().readout).toBe('LOAD 0% · 0 USERS · SECTOR A')
    expect(phones(inside)).toBe(0)
    act(() => { for (let i = 0; i < 12; i++) handle().press('ArrowUp') })
    await run(200)
    expect(handle().getSnapshot().readout).toBe('LOAD 100% · 120 USERS · SECTOR A')
    expect(phones(inside)).toBe(22)
  })

  it.each([
    ['2', 'B', 49, 1],
    ['3', 'C', 34, 2],
    ['1', 'A', 55, 0],
  ] as const)('%s selects sector %s in the readout, antenna control and coverage outline', async (key, sector, users, index) => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCellTower, { reducedMotion: 'always' })
    if (key === '1') act(() => handle().press('3'))
    await run(100)
    act(() => handle().press(key))
    await run(200)
    expect(handle().getSnapshot().readout).toBe(`LOAD 40% · ${users} USERS · SECTOR ${sector}`)
    expect(handle().getSnapshot().state).toBe('ALL SECTORS UP · CAR ON B')
    for (const name of ['A', 'B', 'C']) {
      expect(inside.querySelector(`[aria-label^="Select sector ${name}"]`)).toHaveAttribute('aria-pressed', String(name === sector))
    }
    const edges = [...inside.querySelectorAll('.edge')]
    expect(edges[index]).toHaveClass('sel')
    expect(inside.querySelectorAll('.edge.sel')).toHaveLength(1)
  })

  it('H moves the car and its radio link, handing service from B to A', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCellTower, { reducedMotion: 'always' })
    await run(100)
    const car = inside.querySelector('.beam')!.parentElement!
    const link = inside.querySelector('.link')!
    const start = car.getAttribute('transform')
    const oldLink = link.getAttribute('d')
    act(() => handle().press('h'))
    await run(200)
    expect(handle().getSnapshot().state).toBe('HANDOVER B → A')
    expect(handle().getSnapshot().readout).toBe('LOAD 40% · 61 USERS · SECTOR A')
    expect(car.getAttribute('transform')).not.toBe(start)
    expect(link.getAttribute('d')).not.toBe(oldLink)
    await run(1600)
    expect(handle().getSnapshot().state).toBe('ALL SECTORS UP · CAR ON A')
  })

  it('the car travels along the road when motion is allowed', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureCellTower)
    await run(100)
    act(() => handle().press('h'))
    await run(1000)
    expect(handle().getSnapshot().state).toBe('CAR ON B · DRIVING')
    await run(1000)
    expect(handle().getSnapshot().state).toBe('HANDOVER B → A')
    await run(3000)
    expect(handle().getSnapshot().state).toBe('ALL SECTORS UP · CAR ON A')
  })

  it('O cuts power and service; O again restores the radios in order C, A, B', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCellTower, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press('o'))
    await run(200)
    expect(handle().getSnapshot()).toMatchObject({
      readout: 'LOAD 40% · 0 USERS · SECTOR A',
      state: 'OUTAGE · ON BATTERY · ALARM RAISED',
      pressed: { o: true },
    })
    expect(inside.querySelector('[aria-label="Cut or restore the power (O)"]')).toHaveAttribute('aria-pressed', 'true')
    expect(coverage(inside)).toEqual(['0', '0', '0'])
    expect(phones(inside)).toBe(0)
    expect(inside.querySelector<SVGElement>('.link')!.style.opacity).toBe('0')
    expect(cabinetLamp(inside, 'PWR')).toHaveClass('a')
    expect(cabinetLamp(inside, 'ALM')).toHaveClass('r')

    const car = inside.querySelector('.beam')!.parentElement!
    const held = car.getAttribute('transform')
    act(() => handle().press('h'))
    await run(200)
    expect(car).toHaveAttribute('transform', held)
    expect(handle().getSnapshot().state).toBe('OUTAGE · ON BATTERY · ALARM RAISED')

    act(() => handle().press('o'))
    await run(200)
    expect(handle().getSnapshot().pressed.o).toBe(false)
    expect(handle().getSnapshot().state).toBe('RECOVERING 0/3')
    expect(cabinetLamp(inside, 'ALM')).toHaveClass('a')
    await run(500)
    expect(handle().getSnapshot().state).toBe('RECOVERING 1/3')
    expect(coverage(inside)).toEqual(['0', '0', '0.07'])
    await run(650)
    expect(handle().getSnapshot().state).toBe('RECOVERING 2/3')
    expect(handle().getSnapshot().readout).toBe('LOAD 40% · 55 USERS · SECTOR A')
    expect(coverage(inside)).toEqual(['0.09', '0', '0.07'])
    await run(650)
    expect(handle().getSnapshot().state).toBe('ALL SECTORS UP · CAR ON B')
    expect(coverage(inside)).toEqual(['0.09', '0.08', '0.07'])
    expect(cabinetLamp(inside, 'ALM')).not.toHaveClass('r', 'a')
    expect(inside.querySelector<SVGElement>('.link')!.style.opacity).toBe('0.8')
  })

  it('an outage also recovers automatically after the battery alarm', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureCellTower, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press('o'))
    await run(2800)
    expect(handle().getSnapshot().state).toBe('RECOVERING 0/3')
    expect(handle().getSnapshot().pressed.o).toBe(false)
    await run(2000)
    expect(handle().getSnapshot().state).toBe('ALL SECTORS UP · CAR ON B')
    expect(handle().getSnapshot().readout).toBe('LOAD 40% · 55 USERS · SECTOR A')
  })

  it('the random cabinet LINK lamp flickers without changing service or the readout', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCellTower, { reducedMotion: 'always' })
    // The port log flags this random indicator for visual comparison; keep the lab's behavior.
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    await run(100)
    expect(cabinetLamp(inside, 'LINK')).toHaveClass('b')
    const snapshot = handle().getSnapshot()
    random.mockReturnValue(1)
    await run(200)
    expect(cabinetLamp(inside, 'LINK')).not.toHaveClass('b')
    expect(handle().getSnapshot()).toEqual(snapshot)
    expect(inside.querySelector<SVGElement>('.link')!.style.opacity).toBe('0.8')
  })
})
