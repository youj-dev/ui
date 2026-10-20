import { describe, expect, it, vi } from 'vitest'
import type { ThemeIssue } from '../../core/src/lib/youj/theme/check'
import type { ThemeInput } from '../../core/src/lib/youj/theme/contract'
import { create } from '../src/create'
import { CliError, silentUi } from '../src/ui'
import { fakeRunner, fixture } from './helpers'

/* The derivation never lets a valid input miss AA, so the check is stubbed for
 * a theme named "Low": one text pair fails (motion's tests cover the real
 * check). Every other link goes through the real one. */
vi.mock('../../core/src/lib/youj/theme/check', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../core/src/lib/youj/theme/check')>()
  const fail: ThemeIssue = { level: 'error', code: 'contrast', mode: 'dark', token: 'fg-subtle', against: 'raised', ratio: 3.4, min: 4.5, message: 'dark: fg-subtle on raised is 3.40:1, below 4.5:1.' }
  return { ...actual, themeErrors: (theme: ThemeInput) => (theme.name === 'Low' ? [fail] : actual.themeErrors(theme)) }
})

const LOW = 'https://www.youj.dev/create?sidebar=rail&preset=brutal&accent=%23e5484d&name=Low'
const FINE = 'https://www.youj.dev/create?sidebar=rail&preset=brutal&accent=%23e5484d&name=Acme'

describe('create and WCAG AA', () => {
  it('refuses a theme that misses AA, listing the pair and the flag, and writes nothing', async () => {
    const root = fixture('next-app')
    const runner = fakeRunner(root)
    const attempt = create({ cwd: root, link: LOW }, runner, silentUi(), {})
    await expect(attempt).rejects.toThrow(CliError)
    await expect(create({ cwd: root, link: LOW }, runner, silentUi(), {})).rejects.toThrow(/misses WCAG AA[\s\S]*fg-subtle on raised is 3\.40:1[\s\S]*--allow-low-contrast/)
    expect(runner.commands).toEqual([])
  })

  it('writes it with --allow-low-contrast, warning loudly and marking the theme', async () => {
    const root = fixture('next-app')
    const ui = silentUi()
    const result = await create({ cwd: root, link: LOW, allowLowContrast: true, dryRun: true }, fakeRunner(root), ui, {})
    expect(ui.log.some((line) => /^warn: --allow-low-contrast: writing a theme with 1 pair\(s\) below WCAG AA/.test(line))).toBe(true)
    const theme = result.changes.find((c) => c.path.endsWith('lib/theme.ts'))!.after
    expect(theme).toContain('allowLowContrast: true,')
  })

  it('leaves a passing theme unmarked', async () => {
    const root = fixture('next-app')
    const ui = silentUi()
    const result = await create({ cwd: root, link: FINE, dryRun: true }, fakeRunner(root), ui, {})
    expect(result.changes.find((c) => c.path.endsWith('lib/theme.ts'))!.after).not.toContain('allowLowContrast')
    expect(ui.log.some((line) => line.includes('allow-low-contrast'))).toBe(false)
  })
})
