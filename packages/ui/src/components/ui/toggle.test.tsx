import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Toggle } from './toggle'

describe('Toggle', () => {
  test('click, Space and Enter flip aria-pressed', async () => {
    const user = userEvent.setup()
    render(<Toggle aria-label="Bold">B</Toggle>)
    const toggle = screen.getByRole('button', { name: 'Bold' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  test('controlled', async () => {
    const user = userEvent.setup()
    const onPressedChange = vi.fn()
    render(
      <Toggle aria-label="Pin" pressed onPressedChange={onPressedChange}>
        P
      </Toggle>,
    )
    await user.click(screen.getByRole('button', { name: 'Pin' }))
    expect(onPressedChange).toHaveBeenCalledWith(false, expect.anything())
    expect(screen.getByRole('button', { name: 'Pin' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('disabled ignores presses', async () => {
    const user = userEvent.setup()
    render(
      <Toggle aria-label="Off" disabled>
        O
      </Toggle>,
    )
    await user.click(screen.getByRole('button', { name: 'Off' }))
    expect(screen.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('marks itself for reduced motion', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Toggle aria-label="Calm">C</Toggle>
      </YoujProvider>,
    )
    expect(screen.getByRole('button', { name: 'Calm' })).toHaveAttribute('data-reduced-motion')
  })

  test('its transitions take the duration that reduced motion zeroes', () => {
    render(<Toggle aria-label="Bold">B</Toggle>)
    const classes = screen.getByRole('button', { name: 'Bold' }).className.split(/\s+/)
    const durations = classes.filter((c) => /(^|:)(yj-)?duration-/.test(c))
    expect(durations.length).toBeGreaterThan(0)
    for (const c of durations) {
      expect(c).toMatch(/(^|:)yj-duration-(instant|fast|base|slow|deliberate)$/)
      const token = c.split('yj-duration-')[1]
      const presets = readFileSync(resolve(__dirname, '../../../../core/src/styles/presets.css'), 'utf8')
      expect(presets).toContain(`@utility yj-duration-${token} {\n  transition-duration: calc(var(--yj-duration-${token}) * var(--yj-motion, 1));`)
    }
  })
})
