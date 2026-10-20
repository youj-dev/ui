// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/* Installation and ThemeToggle both show the next-themes layout. They drifted
 * once (two different defaultThemes), so they share one snippet. */

const docs = fileURLToPath(new URL('../content/docs/', import.meta.url))
const layoutSnippet = (page: string) => {
  const source = readFileSync(docs + page, 'utf8')
  return source.match(/```tsx title="app\/layout\.tsx"\n[^`]*from 'next-themes'[^`]*```/)?.[0]
}

test('Installation and ThemeToggle show the same next-themes layout', () => {
  const installation = layoutSnippet('installation.mdx')
  expect(installation).toBeDefined()
  expect(installation).toContain('<ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>')
  expect(installation).toContain('suppressHydrationWarning')
  expect(layoutSnippet('components/(actions)/theme-toggle.mdx')).toBe(installation)
})

test("Installation's index.html script is what ThemeScript renders", async () => {
  const { themeScriptSource } = await import('@youj/react')
  const source = readFileSync(docs + 'installation.mdx', 'utf8')
  expect(source.match(/```html title="index\.html"\n<script>(.*)<\/script>\n```/)?.[1]).toBe(themeScriptSource())
})
