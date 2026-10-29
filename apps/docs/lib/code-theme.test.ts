import { highlightHast } from 'fumadocs-core/highlight'
import { vi } from 'vitest'
import { codeHighlight, TOKEN_CLASS } from '@/lib/code-theme'
import { highlightHtml } from '@/lib/code-files'

const SOURCE = `import { Button } from '@youj/react'

// A comment
export function Demo() {
  return <Button size="sm" count={3}>Save</Button>
}`

describe('code highlighting', () => {
  it('keeps every token when a busy machine takes over 500 ms between tokenizer steps', async () => {
    const expected = await highlightHtml(SOURCE)
    let now = Date.now()
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => (now += 501))
    try {
      expect(await highlightHtml(SOURCE)).toBe(expected)
    } finally {
      clock.mockRestore()
    }
  })

  it('colors tokens by class: no inline styles, no per-theme variables, and the text exactly as written', async () => {
    const html = await highlightHtml(SOURCE)
    expect(html).not.toMatch(/style=|--shiki/)
    expect(html).toMatch(/^<pre class="shiki[^"]*"><code>/)
    for (const cls of [TOKEN_CLASS.keyword, TOKEN_CLASS.string, TOKEN_CLASS.number, TOKEN_CLASS.comment]) expect(html).toContain(`class="${cls}"`)
    const text = new DOMParser().parseFromString(html, 'text/html').body.textContent
    expect(text).toBe(SOURCE)
  })

  it('leaves default-colored text bare and joins neighbors of one color, so a line is a few spans', async () => {
    const tree = await highlightHast('const a = b + c', { lang: 'tsx', ...codeHighlight })
    const line = JSON.stringify(tree)
    // "const" is a keyword, "a", "b", "c" default text; each run of one color is one node.
    expect(line).toContain('"value":" a "')
    expect(line).not.toMatch(/"style"/)
  })

  it('drops the <pre>’s own tab stop from a Code tab’s file, whose panel is the scroller', async () => {
    expect(await highlightHtml('let x = 1')).not.toContain('tabindex')
  })
})
