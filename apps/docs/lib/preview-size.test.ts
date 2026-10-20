import { act, renderHook } from '@testing-library/react'
import { COMPACT_SIZE, defaultSize, ROOMY_SIZE } from './preview'
import { PREVIEW_SIZE_KEY, readSizeOverride, resetPreviewSize, setPreviewSize, usePreviewSize } from './preview-size'

describe('the preview size', () => {
  afterEach(() => {
    act(() => resetPreviewSize())
    localStorage.clear()
  })

  it('starts every item at the standard size, roomy at 100%', () => {
    expect(defaultSize()).toEqual(ROOMY_SIZE)
    const { result } = renderHook(() => usePreviewSize(COMPACT_SIZE))
    expect(result.current).toEqual({ size: COMPACT_SIZE, fallback: COMPACT_SIZE, changed: false, picked: false })
    expect(localStorage.getItem(PREVIEW_SIZE_KEY)).toBeNull()
  })

  it('takes a pick per axis, shared by every preview and remembered', () => {
    const app = renderHook(() => usePreviewSize(COMPACT_SIZE))
    const demo = renderHook(() => usePreviewSize(ROOMY_SIZE))
    act(() => setPreviewSize({ scaling: '110%' }))
    // The scale moves for both; each keeps its own density.
    expect(app.result.current.size).toEqual({ density: 'compact', scaling: '110%' })
    expect(demo.result.current.size).toEqual({ density: 'roomy', scaling: '110%' })
    expect(app.result.current).toMatchObject({ changed: true, picked: true })
    act(() => setPreviewSize({ density: 'roomy' }))
    expect(app.result.current.size).toEqual({ density: 'roomy', scaling: '110%' })
    expect(JSON.parse(localStorage.getItem(PREVIEW_SIZE_KEY)!)).toEqual({ scaling: '110%', density: 'roomy' })
    // A pick that lands on an item's own size isn't a change there, but is still a pick.
    act(() => setPreviewSize({ scaling: '100%' }))
    expect(demo.result.current).toMatchObject({ changed: false, picked: true })
  })

  it('resets every preview to its own default and forgets the pick', () => {
    const { result } = renderHook(() => usePreviewSize(COMPACT_SIZE))
    act(() => setPreviewSize({ density: 'roomy', scaling: '75%' }))
    expect(result.current.changed).toBe(true)
    act(() => resetPreviewSize())
    expect(result.current).toMatchObject({ size: COMPACT_SIZE, changed: false, picked: false })
    expect(localStorage.getItem(PREVIEW_SIZE_KEY)).toBeNull()
  })

  it('reads a remembered pick, and ignores anything malformed or unknown in storage', () => {
    localStorage.setItem(PREVIEW_SIZE_KEY, JSON.stringify({ density: 'compact', scaling: '80%' }))
    expect(renderHook(() => usePreviewSize(ROOMY_SIZE)).result.current.size).toEqual({ density: 'compact', scaling: '80%' })
    expect(readSizeOverride('{nope')).toEqual({})
    expect(readSizeOverride('"compact"')).toEqual({})
    expect(readSizeOverride(JSON.stringify({ density: 'airy', scaling: '90' }))).toEqual({})
    expect(readSizeOverride(JSON.stringify({ density: 'roomy', scaling: 120 }))).toEqual({ density: 'roomy' })
  })

  it('holds a pick for the page when storage is blocked', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    try {
      const { result } = renderHook(() => usePreviewSize(ROOMY_SIZE))
      act(() => setPreviewSize({ scaling: '85%' }))
      expect(result.current.size).toEqual({ density: 'roomy', scaling: '85%' })
    } finally {
      get.mockRestore()
      set.mockRestore()
    }
  })
})
