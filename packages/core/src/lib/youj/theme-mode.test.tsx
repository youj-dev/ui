import { renderToString } from 'react-dom/server'
import { act, render, screen } from '@testing-library/react'
import { afterEach } from 'vitest'
import { setThemeMode, useThemeMode } from './theme-mode'

/* The visitor's light/dark/system choice, switched from code: stored where
 * ThemeScript and ThemeToggle read it, applied to <html>, and heard by every
 * reader on the page. */

afterEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.style.colorScheme = ''
})

function Probe({ storageKey }: { storageKey?: string }) {
  const { mode, scheme, setMode } = useThemeMode({ storageKey })
  return (
    <button type="button" onClick={() => setMode('dark')}>
      {`${mode ?? 'unknown'}/${scheme ?? 'unknown'}`}
    </button>
  )
}

test('setThemeMode stores the mode, applies it to <html> and every useThemeMode hears it', () => {
  render(<Probe />)
  act(() => setThemeMode('light'))
  expect(localStorage.getItem('theme')).toBe('light')
  expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  expect(document.documentElement.style.colorScheme).toBe('light')
  expect(screen.getByRole('button')).toHaveTextContent('light/light')
})

test("the hook's setter switches it too, under its own storage key", () => {
  localStorage.setItem('app-theme', 'light')
  render(<Probe storageKey="app-theme" />)
  expect(screen.getByRole('button')).toHaveTextContent('light/')
  act(() => screen.getByRole('button').click())
  expect(localStorage.getItem('app-theme')).toBe('dark')
  expect(localStorage.getItem('theme')).toBeNull()
  expect(screen.getByRole('button')).toHaveTextContent('dark/dark')
})

test('with nothing stored the mode is the default, system', () => {
  render(<Probe />)
  expect(screen.getByRole('button')).toHaveTextContent(/^system\//)
})

test('the server renders no choice: only the browser knows it', () => {
  expect(renderToString(<Probe />)).toContain('unknown/unknown')
})
