import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Switch } from './switch'

const thumb = (sw: HTMLElement) => sw.querySelector<HTMLElement>('[data-slot=switch-thumb]')!

describe('Switch', () => {
  test('is a switch: click and Space toggle aria-checked', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Wi-Fi" onCheckedChange={onCheckedChange} />)
    const sw = screen.getByRole('switch', { name: 'Wi-Fi' })
    await user.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'true')
    await user.keyboard(' ')
    expect(sw).toHaveAttribute('aria-checked', 'false')
    expect(onCheckedChange).toHaveBeenCalledTimes(2)
  })

  test('the knob’s colour fades with the track’s, so it never shows its off colour on the on track', () => {
    // Bezel paints the knob by state (bezel.css: grey off, light on) while the track's colour fades over the fast
    // duration; the knob has to fade over the same duration, not snap.
    const bezel = readFileSync(resolve(__dirname, '../../styles/bezel.css'), 'utf8')
    expect(bezel).toMatch(
      /\[data-slot='switch'\]:not\(\[data-variant='liquid'\]\):not\(\[data-checked\]\) > \[data-slot='switch-thumb'\]&\s*\{\s*background-color/,
    )
    render(<Switch aria-label="Sync" />)
    const knob = thumb(screen.getByRole('switch', { name: 'Sync' }))
    const track = screen.getByRole('switch', { name: 'Sync' })
    expect(knob.className).toMatch(/transition-\[[^\]]*background-color/)
    expect(track.className).toMatch(/transition-\[background-color\] yj-duration-fast/)
    // scale, background-color, box-shadow: the colours on the track's fast token.
    expect(knob.className).toContain(
      '[transition-duration:calc(var(--yj-duration-spring)*var(--yj-motion,1)),calc(var(--yj-duration-fast)*var(--yj-motion,1)),calc(var(--yj-duration-fast)*var(--yj-motion,1))]',
    )
  })

  test('pressing stretches the knob toward its travel from the edge it rests on, never squeezes it', () => {
    render(<Switch aria-label="Sync" />)
    const knob = thumb(screen.getByRole('switch', { name: 'Sync' }))
    expect(knob).toHaveClass(
      'own:group-active/switch:scale-x-125',
      'origin-[calc(var(--thumb-t)*100%)_50%]',
      'rtl:origin-[calc(100%_-_var(--thumb-t)*100%)_50%]',
    )
    expect(knob.className).not.toMatch(/scale-\[0\.85\]/)
    // Released on the CSS spring; held still under reduced motion and when disabled.
    expect(knob.className).toContain('[transition-timing-function:var(--ease-spring),var(--ease-standard),var(--ease-standard)]')
    expect(knob).toHaveClass('own:reduced:group-active/switch:scale-100', 'own:group-data-disabled/switch:group-active/switch:scale-100')
  })

  test('the thumb starts where it belongs, with no animation on mount', () => {
    render(
      <>
        <Switch aria-label="On" defaultChecked />
        <Switch aria-label="Off" />
      </>,
    )
    expect(thumb(screen.getByRole('switch', { name: 'On' })).style.getPropertyValue('--thumb-t')).toBe('1')
    expect(thumb(screen.getByRole('switch', { name: 'Off' })).style.getPropertyValue('--thumb-t')).toBe('0')
  })

  test('toggling drives --thumb-t to the new end', async () => {
    const user = userEvent.setup()
    render(<Switch aria-label="Sync" />)
    const sw = screen.getByRole('switch', { name: 'Sync' })
    await user.click(sw)
    await waitFor(() => expect(thumb(sw).style.getPropertyValue('--thumb-t')).toBe('1'))
  })

  test('reduced motion jumps the thumb and marks the switch', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always" timeScale={50}>
        <Switch aria-label="Calm" />
      </YoujProvider>,
    )
    const sw = screen.getByRole('switch', { name: 'Calm' })
    expect(sw).toHaveAttribute('data-reduced-motion')
    await user.click(sw)
    // At this Speed any animation would take seconds: settling inside waitFor's timeout proves it was instant, without racing a busy runner.
    await waitFor(() => expect(thumb(sw).style.getPropertyValue('--thumb-t')).toBe('1'))
  })

  test('controlled and disabled', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(
      <>
        <Switch aria-label="Controlled" checked onCheckedChange={onCheckedChange} />
        <Switch aria-label="Disabled" disabled />
      </>,
    )
    await user.click(screen.getByRole('switch', { name: 'Controlled' }))
    expect(onCheckedChange).toHaveBeenCalledWith(false, expect.anything())
    expect(screen.getByRole('switch', { name: 'Controlled' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('switch', { name: 'Disabled' }))
    expect(screen.getByRole('switch', { name: 'Disabled' })).toHaveAttribute('aria-checked', 'false')
  })

  describe('liquid', () => {
    test('keeps the switch role, keyboard and callbacks', async () => {
      const user = userEvent.setup()
      const onCheckedChange = vi.fn()
      render(<Switch variant="liquid" aria-label="Wi-Fi" onCheckedChange={onCheckedChange} />)
      const sw = screen.getByRole('switch', { name: 'Wi-Fi' })
      expect(sw).toHaveAttribute('data-variant', 'liquid')
      await user.click(sw)
      expect(sw).toHaveAttribute('aria-checked', 'true')
      await user.keyboard(' ')
      expect(sw).toHaveAttribute('aria-checked', 'false')
      expect(onCheckedChange).toHaveBeenCalledTimes(2)
    })

    test('the root owns --thumb-t, so the droplet and the accent fill move together', async () => {
      const user = userEvent.setup()
      render(
        <>
          <Switch variant="liquid" aria-label="On" defaultChecked />
          <Switch variant="liquid" aria-label="Off" />
        </>,
      )
      const on = screen.getByRole('switch', { name: 'On' })
      const off = screen.getByRole('switch', { name: 'Off' })
      expect(on.style.getPropertyValue('--thumb-t')).toBe('1')
      expect(off.style.getPropertyValue('--thumb-t')).toBe('0')
      expect(thumb(on).style.getPropertyValue('--thumb-t')).toBe('')
      const fill = off.querySelector('[data-slot=switch-fill]')!
      expect(fill).toHaveAttribute('aria-hidden', 'true')
      expect(fill.className).toContain('var(--thumb-t)')
      await user.click(off)
      await waitFor(() => expect(off.style.getPropertyValue('--thumb-t')).toBe('1'), { timeout: 3000 })
    })

    test('the droplet stretches with speed and rests round', async () => {
      const user = userEvent.setup()
      render(<Switch variant="liquid" aria-label="Sync" />)
      const sw = screen.getByRole('switch', { name: 'Sync' })
      expect(sw.style.getPropertyValue('--ui--liquid-sx')).toBe('1')
      expect(sw.style.getPropertyValue('--ui--liquid-sy')).toBe('1')
      await user.click(sw)
      await waitFor(() => expect(Number(sw.style.getPropertyValue('--ui--liquid-sx'))).toBeGreaterThan(1))
      await waitFor(() => expect(sw.style.getPropertyValue('--thumb-t')).toBe('1'), { timeout: 3000 })
      await waitFor(() => expect(Number(sw.style.getPropertyValue('--ui--liquid-sx'))).toBeCloseTo(1, 2))
    })

    test('reduced motion is the plain switch’s: the droplet jumps and never stretches', async () => {
      const user = userEvent.setup()
      render(
        <YoujProvider reducedMotion="always" timeScale={50}>
          <Switch variant="liquid" aria-label="Calm" />
        </YoujProvider>,
      )
      const sw = screen.getByRole('switch', { name: 'Calm' })
      await user.click(sw)
      await waitFor(() => expect(sw.style.getPropertyValue('--thumb-t')).toBe('1'))
      expect(sw.style.getPropertyValue('--ui--liquid-sx')).toBe('1')
      expect(thumb(sw)).toHaveClass('own:reduced:group-active/switch:scale-100')
    })

    test('sizes sm, default and lg, and disabled', async () => {
      const user = userEvent.setup()
      render(
        <>
          <Switch variant="liquid" size="sm" aria-label="Small" />
          <Switch variant="liquid" size="lg" aria-label="Large" />
          <Switch variant="liquid" aria-label="Disabled" disabled />
        </>,
      )
      expect(screen.getByRole('switch', { name: 'Small' })).toHaveAttribute('data-size', 'sm')
      expect(screen.getByRole('switch', { name: 'Large' })).toHaveAttribute('data-size', 'lg')
      await user.click(screen.getByRole('switch', { name: 'Disabled' }))
      expect(screen.getByRole('switch', { name: 'Disabled' })).toHaveAttribute('aria-checked', 'false')
    })
  })
})
