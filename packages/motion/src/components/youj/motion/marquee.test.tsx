import { screen } from '@testing-library/react'
import { Marquee } from './marquee'
import { installObservers, liveObservers, renderFull, renderReduced } from '@youj/core/test-utils'

beforeAll(installObservers)

const logos = ['Northwind', 'Halcyon', 'Vertex'].map((n) => <span key={n}>{n}</span>)

test('one real copy; the leading and trailing duplicates are inert and hidden from assistive tech', () => {
  const { container } = renderFull(<Marquee>{logos}</Marquee>)
  const copies = [...container.querySelectorAll('.shrink-0')]
  expect(copies.length).toBeGreaterThanOrEqual(3)
  expect(copies.filter((c) => !c.hasAttribute('aria-hidden'))).toEqual([copies[1]])
  for (const c of copies) expect(c.hasAttribute('inert')).toBe(c !== copies[1])
})

test('links: Tab reaches only the real set, and the track clips instead of scrolling to them', () => {
  const { container } = renderFull(
    <Marquee>
      {['Docs', 'Blog', 'Status'].map((n) => (
        <a key={n} href={`#${n}`}>
          {n}
        </a>
      ))}
    </Marquee>,
  )
  const focusable = [...container.querySelectorAll('a')].filter((a) => !a.closest('[inert]'))
  expect(focusable.map((a) => a.textContent)).toEqual(['Docs', 'Blog', 'Status'])
  const viewport = container.querySelector('.overflow-x-clip')!
  expect(viewport).not.toHaveClass('overflow-hidden')
  focusable[1]!.focus()
  expect(focusable[1]).toHaveFocus()
  focusable[1]!.blur()
})

test('reduced motion renders one static, wrapping row', () => {
  const { container } = renderReduced(<Marquee fade={48}>{logos}</Marquee>)
  expect(screen.getAllByText('Northwind')).toHaveLength(1)
  const root = container.firstElementChild!.firstElementChild as HTMLElement
  expect(root).toHaveClass('flex-wrap')
  expect(root.style.maskImage).toBe('')
})

test('releases observers on unmount', () => {
  const before = liveObservers.size
  const { unmount } = renderFull(<Marquee direction="up">{logos}</Marquee>)
  unmount()
  expect(liveObservers.size).toBe(before)
})
