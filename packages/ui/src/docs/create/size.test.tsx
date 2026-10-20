import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DENSITIES as PROVIDER_DENSITIES, SCALINGS as PROVIDER_SCALINGS, YoujProvider } from '@youj/core/lib/youj/provider'
import { DEFAULT_FRAME, readFrame, writeFrame } from './config'
import { providerTag, themeSource } from './codegen'
import { SizeControl } from './size-control'
import { DEFAULT_SIZE, DENSITIES, readSize, SCALINGS, writeSize, type SizeConfig } from './size-url'
import { readLook, writeLook } from './look-url'
import { readTheme, writeTheme } from './theme-url'

/* Create's size: the layout density and scale its export's root provider
 * sets. It travels in the link beside the theme, the frame and the style, and
 * the export writes exactly what was chosen. */

describe('the size in a URL', () => {
  test('its lists are the provider’s', () => {
    expect([...DENSITIES]).toEqual([...PROVIDER_DENSITIES])
    expect([...SCALINGS]).toEqual([...PROVIDER_SCALINGS])
  })

  test('round-trips every density and scale, and leaves the standard size out of the link', () => {
    for (const density of DENSITIES)
      for (const scaling of SCALINGS) expect(readSize(writeSize({ density, scaling }))).toEqual({ density, scaling })
    expect(writeSize(DEFAULT_SIZE).toString()).toBe('')
    expect(writeSize({ density: 'compact', scaling: '90%' }).toString()).toBe('layout=compact&scale=90')
  })

  test('anything missing or unknown keeps the standard size', () => {
    expect(readSize(new URLSearchParams(''))).toEqual(DEFAULT_SIZE)
    expect(readSize(new URLSearchParams('layout=airy&scale=91'))).toEqual(DEFAULT_SIZE)
    expect(readSize(new URLSearchParams('scale=120%'))).toEqual(DEFAULT_SIZE)
    expect(readSize(new URLSearchParams('layout=compact'))).toEqual({ density: 'compact', scaling: '100%' })
  })

  test('travels beside the theme, the frame and the style without disturbing them, the theme’s own control size included', () => {
    const theme = readTheme(new URLSearchParams({ preset: 'brutal', controlSize: 'comfortable' }))
    const frame = { ...DEFAULT_FRAME, sidebar: 'rail-panel' as const }
    const size: SizeConfig = { density: 'compact', scaling: '75%' }
    const params = writeSize(size, writeLook('bezel', writeFrame(frame, writeTheme(theme))))
    expect(params.toString()).toBe('preset=brutal&controlSize=comfortable&sidebar=rail-panel&look=bezel&layout=compact&scale=75')
    expect(readTheme(params)).toEqual(theme)
    expect(readFrame(params)).toEqual(frame)
    expect(readLook(params)).toBe('bezel')
    expect(readSize(params)).toEqual(size)
    // Back to the standard size takes both out again.
    expect(writeSize(DEFAULT_SIZE, params).has('layout')).toBe(false)
    expect(params.has('scale')).toBe(false)
  })
})

describe('the size in the export', () => {
  test('the provider tag writes the density and scale that differ from the standard size, none by default', () => {
    expect(providerTag()).toBe('<YoujProvider theme={theme}>')
    expect(providerTag('classic', { density: 'compact', scaling: '90%' })).toBe('<YoujProvider theme={theme} density="compact" scaling="90%">')
    expect(providerTag('classic', { density: 'roomy', scaling: '110%' })).toBe('<YoujProvider theme={theme} scaling="110%">')
    expect(providerTag('bezel', { density: 'compact', scaling: '75%' })).toBe('<YoujProvider theme={theme} density="compact" scaling="75%" look="bezel">')
  })

  test('the theme file’s note on applying it names the same tag', () => {
    const theme = readTheme(new URLSearchParams({ preset: 'basalt' }))
    expect(themeSource(theme)).toContain('<YoujProvider theme={theme}>')
    expect(themeSource(theme, 'package', 'classic', { density: 'compact', scaling: '90%' })).toContain('<YoujProvider theme={theme} density="compact" scaling="90%">')
  })
})

describe('SizeControl', () => {
  function Controlled({ initial = DEFAULT_SIZE, onChange }: { initial?: SizeConfig; onChange?: (size: SizeConfig) => void }) {
    const [size, setSize] = useState(initial)
    return (
      <YoujProvider reducedMotion="always">
        <SizeControl
          value={size}
          onChange={(next) => {
            setSize(next)
            onChange?.(next)
          }}
        />
        <output data-testid="tag">{providerTag('bezel', size)}</output>
      </YoujProvider>
    )
  }

  test('picks a density and a scale, and the export follows', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    expect(screen.getByRole('group', { name: 'Size' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Reset/ })).toBeNull()

    await user.click(screen.getByRole('combobox', { name: 'Layout' }))
    await user.click(await screen.findByRole('option', { name: /^Compact/ }))
    expect(onChange).toHaveBeenLastCalledWith({ density: 'compact', scaling: '100%' })

    await user.click(screen.getByRole('combobox', { name: 'Scale' }))
    await user.click(await screen.findByRole('option', { name: /^110%/ }))
    expect(onChange).toHaveBeenLastCalledWith({ density: 'compact', scaling: '110%' })
    expect(screen.getByTestId('tag')).toHaveTextContent('density="compact" scaling="110%"')
  })

  test('resets to the standard size once it moved', async () => {
    const user = userEvent.setup()
    render(<Controlled initial={{ density: 'compact', scaling: '120%' }} />)
    await user.click(screen.getByRole('button', { name: 'Reset to the default size (Standard · 100%)' }))
    expect(screen.getByTestId('tag')).not.toHaveTextContent('density=')
    expect(screen.queryByRole('button', { name: /^Reset/ })).toBeNull()
  })
})
