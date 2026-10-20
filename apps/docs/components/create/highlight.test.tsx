import { render } from '@testing-library/react'
import { shellSource, themeSource } from '@youj/react/docs/create/codegen'
import { DEFAULT_FRAME } from '@youj/react/docs/create/config'
import { readTheme } from '@youj/react/docs/create/theme-url'
import { highlightTsx, lines } from './highlight'

const color = (el: Element) => (el as HTMLElement).style.getPropertyValue('--shiki-light')

describe('highlightTsx', () => {
  it('keeps every line and every character of the source', () => {
    const code = shellSource(DEFAULT_FRAME, 'https://www.youj.dev/create')
    const { container } = render(<>{highlightTsx(code)}</>)
    const rows = container.querySelectorAll('code > .line')
    expect(rows).toHaveLength(code.trimEnd().split('\n').length)
    expect(container.querySelector('code')!.textContent).toBe(code.trimEnd())
  })

  it('colors keywords, strings, tags and comments with the site’s code tokens', () => {
    const { container } = render(<>{highlightTsx(`import { theme } from '@/lib/theme'\n// hi\n<AppFrame nav={NAV}>`)}</>)
    const spans = [...container.querySelectorAll('code span span')]
    const by = (text: string) => spans.find((s) => s.textContent === text)!
    expect(color(by('import'))).toBe('var(--code-keyword)')
    expect(color(by(`'@/lib/theme'`))).toBe('var(--code-string)')
    expect(color(by('// hi'))).toBe('var(--code-comment)')
    expect(color(by('AppFrame'))).toBe('var(--code-type)')
    expect(color(by('nav'))).toBe('var(--code-property)')
  })

  it('splits tokens that span lines, such as block comments', () => {
    const rows = lines('/* one\n * two */\nconst a = 1')
    expect(rows).toHaveLength(3)
    expect(rows[1]!.map((p) => p.text).join('')).toBe(' * two */')
    expect(rows[1]![0]!.color).toBe('var(--code-comment)')
  })

  it('reads a theme file cleanly', () => {
    const code = themeSource(readTheme(new URLSearchParams({ preset: 'brutal' })))
    expect(lines(code).flat().some((p) => p.text === 'defineTheme' && p.color === 'var(--code-function)')).toBe(true)
  })
})
