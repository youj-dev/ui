import { createPortal } from 'react-dom'
import { renderToString } from 'react-dom/server'
import { act, render, screen } from '@testing-library/react'
import { YoujProvider, ThemeScope, useDevice, useDeviceSetting, useYoujScope, usePortalContainer } from './provider'
import { DEVICE_SETTINGS, isDeviceSetting, resolveDevice } from './device'

/** A controllable primary pointer: `set(true)` is a phone, and fires `change` like a browser does. */
function mockCoarsePointer(initial: boolean) {
  let matches = initial
  const listeners = new Set<() => void>()
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        get matches() {
          return query.includes('pointer: coarse') ? matches : false
        },
        media: query,
        addEventListener: (_: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
      }) as unknown as MediaQueryList,
  )
  return {
    set(next: boolean) {
      matches = next
      act(() => listeners.forEach((listener) => listener()))
    },
  }
}

function Probe() {
  return (
    <>
      <span data-testid="device">{useDevice()}</span>
      <span data-testid="setting">{useDeviceSetting()}</span>
    </>
  )
}

afterEach(() => vi.restoreAllMocks())

test('resolveDevice: a forced device wins, otherwise the pointer decides', () => {
  expect(resolveDevice('touch', false)).toBe('touch')
  expect(resolveDevice('pointer', true)).toBe('pointer')
  expect(resolveDevice('auto', true)).toBe('touch')
  expect(resolveDevice('auto', false)).toBe('pointer')
  expect(resolveDevice(null, true)).toBe('touch')
  expect(resolveDevice(undefined, false)).toBe('pointer')
})

test('isDeviceSetting accepts the three settings and nothing else', () => {
  for (const setting of DEVICE_SETTINGS) expect(isDeviceSetting(setting)).toBe(true)
  expect(isDeviceSetting('mobile')).toBe(false)
  expect(isDeviceSetting(undefined)).toBe(false)
})

test('useDevice follows the primary pointer, and follows it when it changes', () => {
  const pointer = mockCoarsePointer(false)
  render(
    <YoujProvider>
      <Probe />
    </YoujProvider>,
  )
  expect(screen.getByTestId('device')).toHaveTextContent('pointer')
  expect(screen.getByTestId('setting')).toHaveTextContent('auto')
  pointer.set(true)
  expect(screen.getByTestId('device')).toHaveTextContent('touch')
})

test('a forced device wins over the hardware, and the provider writes data-yj-device for it', () => {
  mockCoarsePointer(false)
  const { container } = render(
    <YoujProvider device="touch">
      <Probe />
    </YoujProvider>,
  )
  expect(screen.getByTestId('device')).toHaveTextContent('touch')
  expect(screen.getByTestId('setting')).toHaveTextContent('touch')
  expect(container.querySelector('[data-yj-device]')).toHaveAttribute('data-yj-device', 'touch')
})

test('with no device set, no attribute is written and the media query governs the CSS', () => {
  mockCoarsePointer(true)
  const { container } = render(
    <YoujProvider>
      <Probe />
    </YoujProvider>,
  )
  expect(container.querySelector('[data-yj-device]')).toBeNull()
  expect(screen.getByTestId('device')).toHaveTextContent('touch')
})

test('a ThemeScope can force a device for its own part of the page', () => {
  mockCoarsePointer(true)
  const { container } = render(
    <YoujProvider>
      <ThemeScope device="pointer">
        <Probe />
      </ThemeScope>
    </YoujProvider>,
  )
  expect(screen.getByTestId('device')).toHaveTextContent('pointer')
  expect(container.querySelector('[data-yj-device]')).toHaveAttribute('data-yj-device', 'pointer')
})

test('the forced device reaches portaled content through useYoujScope', () => {
  mockCoarsePointer(false)
  function Portaled() {
    return createPortal(<div data-testid="portaled" {...useYoujScope()} />, document.body)
  }
  render(
    <YoujProvider device="touch">
      <Portaled />
    </YoujProvider>,
  )
  expect(screen.getByTestId('portaled')).toHaveAttribute('data-yj-device', 'touch')
})

test('device, density and scaling coexist: each is set independently, nests, and reaches portaled content together', () => {
  mockCoarsePointer(false)
  function Portaled() {
    return createPortal(<div data-testid="portaled" {...useYoujScope()} />, document.body)
  }
  const { container } = render(
    <YoujProvider device="touch" density="compact" scaling="90%">
      <ThemeScope density="roomy">
        <Probe />
        <Portaled />
      </ThemeScope>
    </YoujProvider>,
  )
  const root = container.querySelector('[data-yj-device]')!
  expect(root).toHaveAttribute('data-yj-density', 'compact')
  expect(root).toHaveAttribute('data-yj-scaling', '90')
  // The scope writes only what it sets; the provider's device and scale carry on around it.
  expect(container.querySelector('[data-yj-density="roomy"]')).not.toHaveAttribute('data-yj-device')
  expect(screen.getByTestId('device')).toHaveTextContent('touch')
  const portaled = screen.getByTestId('portaled')
  expect(portaled).toHaveAttribute('data-yj-device', 'touch')
  expect(portaled).toHaveAttribute('data-yj-density', 'roomy')
  expect(portaled).toHaveAttribute('data-yj-scaling', '90')
})

test('the server renders for a pointer, so hydration agrees before the client corrects it', () => {
  const html = renderToString(
    <YoujProvider>
      <Probe />
    </YoujProvider>,
  )
  expect(html).toContain('pointer')
})

test('portalContainer sends a subtree\'s overlays to an element of the app\'s choosing, and nests', () => {
  mockCoarsePointer(false)
  const host = document.createElement('div')
  document.body.appendChild(host)
  function Where() {
    const container = usePortalContainer()
    return <span data-testid="where">{container === host ? 'host' : container ? 'other' : 'default'}</span>
  }
  const { rerender } = render(
    <YoujProvider>
      <Where />
    </YoujProvider>,
  )
  expect(screen.getByTestId('where')).toHaveTextContent('default')
  rerender(
    <YoujProvider portalContainer={host}>
      <YoujProvider timeScale={2}>
        <Where />
      </YoujProvider>
    </YoujProvider>,
  )
  expect(screen.getByTestId('where')).toHaveTextContent('host')
  host.remove()
})
