import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureFirewallAppliance, firewallAppliance } from './firewall-appliance'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureFirewallAppliance, firewallAppliance)

describe('FirewallAppliance', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "SECURE · 12 RULES · TRAFFIC BUSY"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureFirewallAppliance, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: '0.3 Gb/s · 0 PASSED · 0 DROPPED', state: 'SECURE · 12 RULES · TRAFFIC BUSY', pressed: { l: false, o: true } })
  })

  it('A (attack burst) shows "SUSPICIOUS BURST · 203.0.113.124"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureFirewallAppliance, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('a'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '1.5 Gb/s · 0 PASSED · 0 DROPPED', state: 'SUSPICIOUS BURST · 203.0.113.124', pressed: { l: false, o: true } })
  })

  it('T (traffic) shows "SECURE · 12 RULES · TRAFFIC PEAK"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureFirewallAppliance, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('t'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '1.3 Gb/s · 0 PASSED · 0 DROPPED', state: 'SECURE · 12 RULES · TRAFFIC PEAK', pressed: { l: false, o: true } })
  })

  it('L (lockdown) shows "LOCKDOWN · 12 RULES · INBOUND DROPPED"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureFirewallAppliance, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('l'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '0.7 Gb/s · 0 PASSED · 0 DROPPED', state: 'LOCKDOWN · 12 RULES · INBOUND DROPPED', pressed: { l: true, o: true } })
    act(() => handle().press('l'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '0.8 Gb/s · 0 PASSED · 0 DROPPED', state: 'SECURE · 12 RULES · TRAFFIC BUSY', pressed: { l: false, o: true } })
  })

  it('C (clear alert) shows "NO ACTIVE ALERT"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureFirewallAppliance, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('c'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '0.7 Gb/s · 0 PASSED · 0 DROPPED', state: 'NO ACTIVE ALERT', pressed: { l: false, o: true } })
  })

  it('O (power) shows "OFF · PRESS O"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureFirewallAppliance, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('o'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '0.0 Gb/s · 0 PASSED · 0 DROPPED', state: 'OFF · PRESS O', pressed: { l: false, o: false } })
    expect(svg()).toHaveClass('dead')
    act(() => handle().press('o'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '0.6 Gb/s · 0 PASSED · 0 DROPPED', state: 'SECURE · 12 RULES · TRAFFIC BUSY', pressed: { l: false, o: true } })
    expect(svg()).not.toHaveClass('dead')
  })
})
