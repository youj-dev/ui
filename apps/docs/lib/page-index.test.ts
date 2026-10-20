// @vitest-environment node
import { hasPage, pageIndex } from './page-index'

describe('pageIndex', () => {
  const urls = ['/', '/icons', '/docs', '/docs/components', '/docs/components/button', '/blocks/auth-login']
  const index = pageIndex(urls)

  it('writes each folder once', () => {
    expect(index).toEqual({ '': ['', 'icons', 'docs'], '/docs': ['components'], '/docs/components': ['button'], '/blocks': ['auth-login'] })
  })

  it('knows every page it was given and nothing else', () => {
    for (const url of urls) expect(hasPage(index, url), url).toBe(true)
    for (const url of ['/docsy', '/docs/', '/docs/components/buttons', '/docs/motion/reveal', '/blocks', '/icons/x']) expect(hasPage(index, url), url).toBe(false)
  })
})
