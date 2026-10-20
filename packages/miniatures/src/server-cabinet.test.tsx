import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureServerCabinet, serverCabinet } from './server-cabinet'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureServerCabinet, serverCabinet)

describe('ServerCabinet', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const online = (readout: string) => Number(readout.match(/^(\d)\/6 ONLINE/)?.[1])

  it('starts with four of six nodes online, the door closed', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureServerCabinet)
    await run(300)
    expect(online(handle().getSnapshot().readout)).toBe(4)
    expect(handle().getSnapshot().state).toBe('LOAD 45% · DOOR CLOSED')
  })

  it('a digit powers a node on or off; each node says its state', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureServerCabinet, { reducedMotion: 'always' })
    const node2 = () => [...inside.querySelectorAll('[role=button]')].find((n) => n.getAttribute('aria-label')?.startsWith('Node 2,'))!
    expect(node2()).toHaveAttribute('aria-pressed', 'false')
    act(() => handle().press('2'))
    await run(300)
    expect(online(handle().getSnapshot().readout)).toBe(5)
    expect(node2()).toHaveAttribute('aria-pressed', 'true')
    expect(node2().getAttribute('aria-label')).toContain('online')
    act(() => handle().press('1'))
    await run(300)
    expect(online(handle().getSnapshot().readout)).toBe(4)
  })

  it('boots a node through its self-test when motion is allowed', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureServerCabinet)
    act(() => handle().press('2'))
    await run(300)
    expect(handle().getSnapshot().state).toBe('POST · NODE 2')
    await run(2500)
    expect(online(handle().getSnapshot().readout)).toBe(5)
  })

  it('F fails a node, traffic reroutes, and R recovers it', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureServerCabinet, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press('f'))
    await run(300)
    expect(handle().getSnapshot().state).toMatch(/^FAULT · NODE \d · TRAFFIC REROUTED$/)
    expect(online(handle().getSnapshot().readout)).toBe(3)
    act(() => handle().press('r'))
    await run(300)
    expect(online(handle().getSnapshot().readout)).toBe(4)
  })

  it('L raises the workload', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureServerCabinet)
    act(() => handle().press('l'))
    await run(300)
    expect(handle().getSnapshot().state).toBe('LOAD 75% · DOOR CLOSED')
  })

  it('D opens the door', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureServerCabinet)
    act(() => handle().press('d'))
    await run(300)
    expect(handle().getSnapshot().pressed.d).toBe(true)
    expect(handle().getSnapshot().state).toBe('LOAD 45% · DOOR OPEN')
  })

  it('N puts the lights out on its own root, not the page’s', async () => {
    const run = useFrames()
    const { handle, root, host } = mount(MiniatureServerCabinet, { reducedMotion: 'always' })
    act(() => handle().press('n'))
    await run(300)
    expect(handle().getSnapshot().pressed.n).toBe(true)
    expect(root()).toHaveClass('night')
    expect(document.documentElement).not.toHaveClass('night')
    expect(host).not.toHaveClass('night')
    expect(handle().getSnapshot().state).toBe('LOAD 45% · DOOR CLOSED · LIGHTS OUT')
    act(() => handle().press('n'))
    expect(root()).not.toHaveClass('night')
  })

  it('fades the lights with a timer that dies with it', async () => {
    const run = useFrames()
    const { handle, root, unmount } = mount(MiniatureServerCabinet)
    act(() => handle().press('n'))
    expect(root()).toHaveClass('fade')
    unmount()
    await run(2000)
    expect(vi.getTimerCount()).toBe(0)
  })
})
