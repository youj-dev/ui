// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const pages = [
  '(forms)/tag-input',
  '(data-and-tables)/filter-chips',
  '(actions)/segmented-control',
  '(data-and-tables)/filter-builder',
  '(charts-and-meters)/calendar-heatmap',
  '(data-and-tables)/data-table',
]

describe('stateful component snippets', () => {
  it.each(pages)('%s imports useState in every snippet that calls it', (page) => {
    const source = readFileSync(join(process.cwd(), 'content/docs/components', `${page}.mdx`), 'utf8')
    const snippets = [...source.matchAll(/^```tsx[^\n]*\n([\s\S]*?)^```/gm)].map((match) => match[1]!).filter((code) => /\buseState\s*[<(]/.test(code))
    expect(snippets.length).toBeGreaterThan(0)
    for (const code of snippets) expect(code, page).toMatch(/import\s*\{[^}]*\buseState\b[^}]*\}\s*from ['"]react['"]/)
  })
})
