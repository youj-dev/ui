import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { MiniatureThreeDPrinter, type MiniatureThreeDPrinterHandle, type MiniatureThreeDPrinterKey, threeDPrinter } from './3d-printer'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureThreeDPrinter, threeDPrinter)

describe('ThreeDPrinter', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('starts in standby with a cold bed, no vase and the axes parked', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureThreeDPrinter)
    expect(handle().getSnapshot()).toEqual(threeDPrinter.initial)
    await run(300)
    expect(handle().getSnapshot()).toEqual(threeDPrinter.initial)
    expect(inside.getElementById('head')).toHaveAttribute('transform', 'translate(0 0)')
    expect(inside.getElementById('gantry')).toHaveAttribute('transform', 'translate(0 0)')
    expect(inside.getElementById('bed')).toHaveAttribute('transform', 'translate(0 0)')
    expect(inside.querySelectorAll('[data-layer][display=inline]')).toHaveLength(0)
    expect(inside.getElementById('printControl')).toHaveAttribute('aria-pressed', 'false')
    expect(inside.getElementById('printScreen')?.textContent).toContain('READY')
    expect(svg()).not.toHaveClass('powered', 'printing', 'lights')
  })

  it('Space heats the bed, prints layers, pauses the build and resumes it', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureThreeDPrinter, { reducedMotion: 'always' })
    act(() => handle().press('space'))
    expect(handle().getSnapshot().state).toBe('HEATING BED → 60°C · 100% SPEED')
    expect(inside.getElementById('printControl')).toHaveAttribute('aria-pressed', 'true')
    await run(4500)
    expect(handle().getSnapshot().state).toMatch(/^PRINTING · \d+\/36 · 100% SPEED$/)
    expect(handle().getSnapshot().readout).toMatch(/^[1-9]\d*% · 60°C$/)
    expect(svg()).toHaveClass('powered', 'printing')
    const layers = inside.querySelectorAll('[data-layer][display=inline]').length
    expect(layers).toBeGreaterThan(0)
    const gantry = inside.getElementById('gantry')!.getAttribute('transform')
    act(() => handle().press(' '))
    expect(handle().getSnapshot().state).toBe(`PAUSED · ${layers}/36 · 100% SPEED`)
    expect(inside.getElementById('printControl')).toHaveAttribute('aria-pressed', 'false')
    expect(svg()).not.toHaveClass('printing')
    expect(inside.getElementById('gantry')).not.toHaveAttribute('transform', gantry)
    const held = handle().getSnapshot().readout
    await run(1600)
    expect(handle().getSnapshot().readout).toBe(held)
    expect(inside.querySelectorAll('[data-layer][display=inline]')).toHaveLength(layers)
    act(() => handle().press(' '))
    await run(1000)
    expect(handle().getSnapshot().state).toMatch(/^PRINTING · /)
    expect(inside.querySelectorAll('[data-layer][display=inline]').length).toBeGreaterThan(layers)
  })

  it('finishes the hollow vase with all thirty-six layers and a full progress bar', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureThreeDPrinter, { reducedMotion: 'always' })
    act(() => handle().press(' '))
    act(() => handle().press('d'))
    await run(23000)
    expect(handle().getSnapshot().state).toBe('VASE COMPLETE · 150% SPEED')
    expect(handle().getSnapshot().readout).toMatch(/^100% · \d+°C$/)
    expect(inside.querySelectorAll('[data-layer][display=inline]')).toHaveLength(36)
    expect(inside.querySelector('.hollow')?.parentElement).toHaveAttribute('display', 'inline')
    expect(inside.querySelector('.screen-bar')).toHaveAttribute('width', '36')
    expect(svg()).not.toHaveClass('printing')
    act(() => handle().press(' '))
    expect(handle().getSnapshot().readout).toMatch(/^0% · /)
    expect(inside.querySelectorAll('[data-layer][display=inline]')).toHaveLength(0)
  })

  it('H homes the axes and preserves the deposited layers', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureThreeDPrinter, { reducedMotion: 'always' })
    act(() => handle().press(' '))
    await run(4500)
    const layers = inside.querySelectorAll('[data-layer][display=inline]').length
    const progress = handle().getSnapshot().readout
    expect(layers).toBeGreaterThan(0)
    expect(inside.getElementById('head')).not.toHaveAttribute('transform', 'translate(0 0)')
    act(() => handle().press('h'))
    expect(handle().getSnapshot().state).toBe('HOMING XYZ · 100% SPEED')
    expect(inside.getElementById('homeControl')).toHaveAttribute('aria-pressed', 'true')
    await run(100)
    expect(handle().getSnapshot().state).toBe('AXES HOMED · 100% SPEED')
    expect(handle().getSnapshot().readout).toBe(progress)
    expect(inside.getElementById('homeControl')).toHaveAttribute('aria-pressed', 'false')
    for (const id of ['head', 'gantry', 'bed']) expect(inside.getElementById(id)).toHaveAttribute('transform', 'translate(0 0)')
    expect(inside.querySelectorAll('[data-layer][display=inline]')).toHaveLength(layers)
  })

  it('C stops the build, lifts the nozzle and cools the heated bed', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureThreeDPrinter, { reducedMotion: 'always' })
    act(() => handle().press(' '))
    await run(4500)
    const layers = inside.querySelectorAll('[data-layer][display=inline]').length
    const gantry = inside.getElementById('gantry')!.getAttribute('transform')
    act(() => handle().press('c'))
    expect(handle().getSnapshot().state).toBe('COOLING BED · 100% SPEED')
    expect(inside.getElementById('coolControl')).toHaveAttribute('aria-pressed', 'true')
    expect(svg()).toHaveClass('cooling')
    await run(1000)
    const temperature = Number(handle().getSnapshot().readout.match(/ · (\d+)°C$/)?.[1])
    expect(temperature).toBeGreaterThanOrEqual(47)
    expect(temperature).toBeLessThanOrEqual(50)
    expect(inside.getElementById('gantry')).not.toHaveAttribute('transform', gantry)
    await run(2500)
    expect(handle().getSnapshot().state).toBe('BED COOLED · 100% SPEED')
    expect(handle().getSnapshot().readout).toMatch(/^\d+% · 23°C$/)
    expect(inside.getElementById('coolControl')).toHaveAttribute('aria-pressed', 'false')
    expect(svg()).not.toHaveClass('cooling', 'powered')
    expect(inside.querySelectorAll('[data-layer][display=inline]')).toHaveLength(layers)
    expect(inside.querySelector('.heat')).toHaveAttribute('opacity', '0.00')
  })

  it('D switches the dial and print speed between 100 and 150 percent', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureThreeDPrinter, { reducedMotion: 'always' })
    const speed = inside.getElementById('speedControl')!
    act(() => handle().press('d'))
    expect(handle().getSnapshot().state).toBe('STANDBY · 150% SPEED')
    expect(speed).toHaveAttribute('aria-pressed', 'true')
    expect(inside.getElementById('speedLabel')?.querySelector('text')).toHaveTextContent('150%')
    expect(speed.querySelector('g')).toHaveAttribute('transform', 'rotate(50)')
    act(() => handle().press(' '))
    await run(3500)
    const layers = inside.querySelectorAll('[data-layer][display=inline]').length
    await run(1600)
    expect(inside.querySelectorAll('[data-layer][display=inline]')).toHaveLength(layers + 3)
    act(() => handle().press('d'))
    expect(handle().getSnapshot().state).toMatch(/ · 100% SPEED$/)
    expect(speed).toHaveAttribute('aria-pressed', 'false')
    expect(inside.getElementById('speedLabel')?.querySelector('text')).toHaveTextContent('100%')
    expect(speed.querySelector('g')).toHaveAttribute('transform', 'rotate(-40)')
  })

  it('L switches the frame light and its control on and off', () => {
    const { handle, inside, svg } = mount(MiniatureThreeDPrinter)
    const light = inside.querySelector('[aria-label="Toggle the frame light (L)"]')!
    act(() => handle().press('l'))
    expect(handle().getSnapshot().state).toBe('STANDBY · 100% SPEED · LIGHT')
    expect(svg()).toHaveClass('lights')
    expect(light).toHaveAttribute('aria-pressed', 'true')
    act(() => handle().press('l'))
    expect(handle().getSnapshot()).toEqual(threeDPrinter.initial)
    expect(svg()).not.toHaveClass('lights')
    expect(light).toHaveAttribute('aria-pressed', 'false')
  })

  it('types every shortcut and its handle', () => {
    expectTypeOf<MiniatureThreeDPrinterKey>().toEqualTypeOf<' ' | 'h' | 'c' | 'd' | 'l'>()
    expectTypeOf<Parameters<MiniatureThreeDPrinterHandle['press']>[0]>().toEqualTypeOf<MiniatureThreeDPrinterKey | 'space' | 'enter' | 'escape' | 'up' | 'down' | 'left' | 'right'>()
  })
})
