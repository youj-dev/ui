import { describe, expect, it, vi } from 'vitest'
import { createStore } from './store'

describe('the snapshot store', () => {
  const initial = { readout: 'A', state: 'B', pressed: { d: true } }

  it('replaces the snapshot on change and tells listeners once per burst', async () => {
    const store = createStore(initial)
    const listener = vi.fn()
    store.subscribe(listener)
    store.line('readout', 'A')
    expect(store.get()).toBe(initial)
    store.line('readout', 'A2')
    store.line('state', 'B2')
    store.press('d', false)
    await Promise.resolve()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.get()).toEqual({ readout: 'A2', state: 'B2', pressed: { d: false } })
    expect(initial.pressed.d).toBe(true)
  })

  it('unsubscribes, and resets to the first readout', async () => {
    const store = createStore(initial)
    const listener = vi.fn()
    const off = store.subscribe(listener)
    off()
    store.line('readout', 'Z')
    store.reset()
    await Promise.resolve()
    expect(listener).not.toHaveBeenCalled()
    expect(store.get()).toBe(initial)
  })
})
