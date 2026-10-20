import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureSbcCluster, type MiniatureSbcClusterKey, sbcCluster } from './sbc-cluster'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureSbcCluster, sbcCluster)

describe('SbcCluster', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureSbcClusterKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureSbcCluster, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts balanced: four nodes ready and five pods', async () => {
    const { snap, svg } = await play([], 0)
    expect(snap().readout).toMatch(/^4\/4 NODES READY · 5 PODS · \d\d°C$/)
    expect(snap().state).toBe('BALANCED · 2 / 2 / 1')
    expect(svg()).toHaveClass('powered')
  })

  it('D deploys a new pod to a node', async () => {
    const { snap } = await play(['d'])
    expect(snap().readout).toMatch(/· 6 PODS ·/)
    expect(snap().state).toBe('SCHEDULING API-6 → NODE 3')
  })

  it('N drains a node and moves its pods, and N again uncordons it', async () => {
    const { handle, run, snap } = await play(['n'])
    expect(snap().readout).toMatch(/^3\/4 NODES READY/)
    expect(snap().state).toBe('DRAINING NODE 1 · 2 PODS MOVING')
    act(() => handle().press('n'))
    await run(400)
    expect(snap().readout).toMatch(/^4\/4 NODES READY/)
    expect(snap().state).toBe('NODE 1 UNCORDONED')
  })

  it('X deletes a pod', async () => {
    const { snap } = await play(['x'])
    expect(snap().readout).toMatch(/· 4 PODS ·/)
    expect(snap().state).toBe('DELETED WEB-5')
  })

  it('B powers the whole cluster off and on again', async () => {
    const { handle, run, snap, svg } = await play(['b'])
    expect(snap().readout).toMatch(/^0\/4 NODES READY/)
    expect(snap().state).toBe('OFF · PRESS B')
    expect(svg()).not.toHaveClass('powered')
    act(() => handle().press('b'))
    await run(400)
    expect(snap().readout).toMatch(/^4\/4 NODES READY/)
    expect(svg()).toHaveClass('powered')
  })
})
