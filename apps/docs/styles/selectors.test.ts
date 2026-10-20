import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

/* `:root:has(…)` and `[style*=…]` made a theme switch and every inline style change restyle the whole page
 * (they depend on the document's or any element's state). The site's own sheets keep to classes and data attributes. */
const sheets = ['styles/site.css', 'styles/theme.css', 'styles/prose.css', 'app/global.css', 'app/tailwind.css', 'app/gallery.css']

describe('site stylesheets', () => {
  test.each(sheets)('%s has no :root:has() or [style*=] selector', (file) => {
    const css = readFileSync(join(process.cwd(), file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toMatch(/:root:has\(/)
    expect(css).not.toMatch(/\[style\s*[*^$|~]?=/)
  })
})
