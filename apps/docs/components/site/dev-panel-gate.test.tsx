import { act, fireEvent, render, screen } from '@testing-library/react'
import { DEV_PANEL_KEY, DevPanelGate } from './dev-panel-gate'

/* The developer panel is hidden, turns on with Shift+Alt+D or ?dev=1, is
 * remembered, and its code is fetched only when it is on. The mock records
 * that the panel's module was loaded; it draws a stand-in. */

const loaded = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ usePathname: () => '/' }))
vi.mock('./dev-panel', () => {
  loaded()
  return { default: ({ onClose }: { onClose: () => void }) => <button onClick={onClose}>panel</button> }
})

const press = () => fireEvent.keyDown(window, { code: 'KeyD', key: '∂', shiftKey: true, altKey: true })

describe('DevPanelGate', () => {
  beforeEach(() => {
    localStorage.clear()
    loaded.mockClear()
    window.history.replaceState(null, '', '/')
  })

  it('shows nothing and fetches nothing while off', () => {
    render(<DevPanelGate />)
    expect(screen.queryByText('panel')).toBeNull()
    expect(loaded).not.toHaveBeenCalled()
  })

  it('turns on with the shortcut, remembers it, and turns off again', async () => {
    render(<DevPanelGate />)
    act(press)
    expect(await screen.findByText('panel')).toBeInTheDocument()
    expect(localStorage.getItem(DEV_PANEL_KEY)).toBe('1')
    act(press)
    expect(screen.queryByText('panel')).toBeNull()
    expect(localStorage.getItem(DEV_PANEL_KEY)).toBeNull()
  })

  it('turns on with ?dev=1', async () => {
    window.history.replaceState(null, '', '/?dev=1')
    render(<DevPanelGate />)
    expect(await screen.findByText('panel')).toBeInTheDocument()
    expect(localStorage.getItem(DEV_PANEL_KEY)).toBe('1')
  })

  it('comes back on from the remembered choice', async () => {
    localStorage.setItem(DEV_PANEL_KEY, '1')
    render(<DevPanelGate />)
    expect(await screen.findByText('panel')).toBeInTheDocument()
  })
})
