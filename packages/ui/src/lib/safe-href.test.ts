import { safeHref, safeLink } from './safe-href'

const SCRIPTS = ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'java\nscript:alert(1)', ' javascript:alert(1)', '\u0001javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox', 'file:///etc/passwd']

describe('safeHref', () => {
  test('lets http(s) and mailto through, normalised', () => {
    expect(safeHref('https://example.com')).toBe('https://example.com/')
    expect(safeHref('mailto:ada@example.com')).toBe('mailto:ada@example.com')
  })

  test.each([...SCRIPTS, '/relative', '//evil.com', '#top'])('refuses %j', (url) => {
    expect(safeHref(url)).toBeNull()
  })
})

describe('safeLink', () => {
  test('keeps absolute http(s) and mailto links', () => {
    expect(safeLink('https://example.com/a?b=1')).toBe('https://example.com/a?b=1')
    expect(safeLink('mailto:ada@example.com')).toBe('mailto:ada@example.com')
  })

  test.each(['/orders/12', '#top', '?page=2', './x', '../x', 'orders/12', ' /padded '])('keeps the relative link %j, trimmed', (url) => {
    expect(safeLink(url)).toBe(url.trim())
  })

  test.each([...SCRIPTS, '', '   ', null, undefined])('renders %j inert', (url) => {
    expect(safeLink(url)).toBeNull()
  })

  test('a scheme smuggled behind whitespace or a control character is not a relative link', () => {
    for (const url of ['java\tscript:alert(1)', 'java\nscript:alert(1)', 'java script:alert(1)']) expect(safeLink(url)).toBeNull()
  })
})
