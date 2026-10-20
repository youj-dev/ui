import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureCoolingUnit, coolingUnit } from './cooling-unit'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureCoolingUnit, coolingUnit)

describe('CoolingUnit', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('starts powered on at 50% load with a clean filter and two fan stages', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCoolingUnit, { reducedMotion: 'always' })
    expect(handle().getSnapshot()).toMatchObject(coolingUnit.initial)
    await run(400)
    expect(handle().getSnapshot().readout).toBe('SUPPLY 18.0°C · RETURN 29.8°C · LOAD 50%')
    expect(handle().getSnapshot().state).toBe('FAN STAGE 2/3 · INLETS OK · SETPOINT 18°C')
    expect(handle().getSnapshot().pressed).toEqual({ f: false, o: true })
    expect(inside.querySelector('[aria-label="Unit power (O)"]')).toHaveAttribute('aria-pressed', 'true')
    expect([...inside.querySelectorAll('.seg')].map((n) => n.textContent)).toEqual(['18°', '19°', '19°', '20°'])
    expect(inside.querySelector('.beam')).toHaveStyle({ opacity: '0' })
  })

  it('L cycles the IT load, staging the fans up and back down', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCoolingUnit, { reducedMotion: 'always' })
    for (const [load, stage, flow] of [[75, 3, 100], [100, 3, 100], [25, 1, 33], [50, 2, 67]]) {
      act(() => handle().press('l'))
      await run(400)
      expect(handle().getSnapshot().readout).toMatch(new RegExp(` · LOAD ${load}%$`))
      expect(handle().getSnapshot().state).toBe(`FAN STAGE ${stage}/3 · INLETS OK · SETPOINT 18°C`)
      expect([...inside.querySelectorAll('.lt')].map((n) => n.textContent)).toContain(`FAN ${stage}/3  ${flow}%`)
    }
  })

  it('S cycles the supply setpoint and changes the supply and rack inlet temperatures', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCoolingUnit, { reducedMotion: 'always' })
    for (const sp of [20, 22, 18]) {
      act(() => handle().press('s'))
      await run(400)
      expect(handle().getSnapshot().readout).toMatch(new RegExp(`^SUPPLY ${sp}\\.0°C · RETURN \\d+\\.\\d°C · LOAD 50%$`))
      expect(handle().getSnapshot().state).toBe(`FAN STAGE 2/3 · INLETS OK · SETPOINT ${sp}°C`)
      expect(inside.querySelector('.lt')).toHaveTextContent(`SUP ${sp}.0 SET ${sp}`)
      expect([...inside.querySelectorAll('.seg')].map((n) => n.textContent)).toEqual([`${sp}°`, `${sp + 1}°`, `${sp + 1}°`, `${sp + 2}°`])
    }
  })

  it('F clogs the filter, reduces airflow and raises an alarm; pressing it again replaces the filter', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCoolingUnit, { reducedMotion: 'always' })
    const filter = inside.querySelector('[aria-label="Filter door: clog or replace the filter (F)"]')!
    act(() => handle().press('f'))
    await run(400)
    expect(handle().getSnapshot().pressed.f).toBe(true)
    expect(handle().getSnapshot().state).toBe('FILTER ALARM · AIRFLOW 55% · F TO REPLACE')
    expect(filter).toHaveAttribute('aria-pressed', 'true')
    expect(inside.querySelector('.lt.warn')).toHaveTextContent('FILTER ALARM')
    expect(inside.querySelector('.beam')).toHaveStyle({ fill: 'var(--warn)', opacity: '0.6' })
    act(() => handle().press('f'))
    await run(400)
    expect(handle().getSnapshot().pressed.f).toBe(false)
    expect(handle().getSnapshot().state).toBe('FILTER REPLACED')
    expect(filter).toHaveAttribute('aria-pressed', 'false')
    expect(inside.querySelector('.lt.warn')).toBeNull()
    expect(inside.querySelector('.beam')).toHaveStyle({ opacity: '0' })
    await run(1800)
    expect(handle().getSnapshot().state).toBe('FAN STAGE 2/3 · INLETS OK · SETPOINT 18°C')
  })

  it('O turns cooling off, heats the inlets and raises a red alarm; turning it on cools them again', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCoolingUnit, { reducedMotion: 'always' })
    const power = inside.querySelector('[aria-label="Unit power (O)"]')!
    act(() => handle().press('o'))
    await run(1200)
    expect(handle().getSnapshot().pressed.o).toBe(false)
    expect(handle().getSnapshot().readout).toBe('SUPPLY 36.0°C · RETURN 52.0°C · LOAD 50%')
    expect(handle().getSnapshot().state).toBe('UNIT OFF · INLETS RISING · 45°C')
    expect(power).toHaveAttribute('aria-pressed', 'false')
    expect(inside.querySelector('.lt')).toHaveTextContent('UNIT OFF')
    expect(inside.querySelectorAll('.seg.r')).toHaveLength(4)
    expect([...inside.querySelectorAll('.seg')].map((n) => n.textContent)).toEqual(['45°', '45°', '45°', '45°'])
    expect(inside.querySelector('.stream.cold')).toHaveStyle({ opacity: '0.25' })
    expect(inside.querySelector('.beam')).toHaveStyle({ fill: 'var(--fault)', opacity: '0.6' })
    act(() => handle().press('o'))
    await run(400)
    expect(handle().getSnapshot().pressed.o).toBe(true)
    expect(handle().getSnapshot().readout).toBe('SUPPLY 18.0°C · RETURN 29.8°C · LOAD 50%')
    expect(handle().getSnapshot().state).toBe('FAN STAGE 2/3 · INLETS OK · SETPOINT 18°C')
    expect(power).toHaveAttribute('aria-pressed', 'true')
    expect(inside.querySelectorAll('.seg.r')).toHaveLength(0)
    expect(inside.querySelector('.beam')).toHaveStyle({ opacity: '0' })
  })
})
