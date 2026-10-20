import { describe, expect, it, vi } from 'vitest'
import type { ThemeInput, ThemeIssue } from '@youj/core/lib/youj/theme'
import { createTheme } from '../src/tools/theme'

/* The derivation never lets a valid input miss AA, so checkTheme is stubbed
 * for a brand named "Low": one text pair fails in light mode, an error unless
 * the theme accepts it (what motion's own checkTheme does; see its tests). */
vi.mock('@youj/core/lib/youj/theme/check', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@youj/core/lib/youj/theme/check')>()
  return {
    ...actual,
    checkTheme: (theme: ThemeInput): ThemeIssue[] =>
      theme.name === 'Low'
        ? [
            {
              level: theme.allowLowContrast ? 'warning' : 'error',
              code: 'contrast',
              mode: 'light',
              token: 'fg-subtle',
              against: 'canvas',
              ratio: 3.1,
              min: 4.5,
              message: 'light: fg-subtle on canvas is 3.10:1, below 4.5:1.',
            },
          ]
        : actual.checkTheme(theme),
  }
})

describe('create_theme and WCAG AA', () => {
  it('refuses a theme that misses AA, naming the pair and the way out', () => {
    const out = createTheme({ accent: '#1f6feb', name: 'Low' })
    expect(out).toContain("It can't be applied as written")
    expect(out).toContain('fg-subtle on canvas is 3.10:1')
    expect(out).toContain('allowLowContrast: true')
    expect(out).not.toContain('defineTheme(')
  })

  it('returns it with allowLowContrast, carrying the flag and a loud warning', () => {
    const out = createTheme({ accent: '#1f6feb', name: 'Low', allowLowContrast: true })
    expect(out).toContain('allowLowContrast: true,')
    expect(out).toMatch(/WARNING: allowLowContrast accepts 1 pair that miss/)
    expect(out).toContain('fg-subtle on canvas is 3.10:1')
  })

  it('leaves a passing theme alone', () => {
    const out = createTheme({ accent: '#1f6feb', name: 'Fine' })
    expect(out).toContain('checkTheme: every pair the library draws passes AA in both modes.')
    expect(out).not.toContain('allowLowContrast')
  })
})
