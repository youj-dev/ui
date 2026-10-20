// @vitest-environment node
import { createElement, type ComponentType } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

/* A server has no window: importing any entry must not reach for one, and
 * rendering must give the sized, labelled, empty stage. */
describe('on a server', () => {
  it('imports every entry without a window', async () => {
    expect(typeof window).toBe('undefined')
    const index = await import('../index')
    expect(index.miniatures.map((m) => m.id)).toEqual(expect.arrayContaining(['hourglass', 'server-cabinet', 'turntable']))
    for (const id of index.miniatures.map((m) => m.id)) await import(`../${id}.tsx`)
  })

  it('renders each miniature as its stage, framed by its viewBox', async () => {
    const { miniatures } = await import('../index')
    for (const meta of miniatures) {
      const mod = (await import(`../${meta.id}.tsx`)) as Record<string, unknown>
      const component = Object.entries(mod).find(([k, v]) => /^[A-Z]/.test(k) && typeof v === 'function')?.[1] as ComponentType<{ size: number }>
      const html = renderToString(createElement(component, { size: 240 }))
      const [, , w, h] = meta.viewBox.split(' ')
      expect(html).toContain(`aspect-ratio:${w} / ${h};width:240px;height:240px`)
      expect(html).toContain(`aria-label="${meta.label.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
    }
  })
})
