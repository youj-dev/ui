import { render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import * as set from './index'

const icons = Object.values(set).filter((v): v is set.YoujIconComponent => (typeof v === 'function' || typeof v === 'object') && v !== null && !!(v as { meta?: { name?: string } }).meta?.name)

describe('every icon', () => {
  test('owns its mask and clip ids per instance, and each reference resolves inside its own svg', () => {
    expect(icons.length).toBeGreaterThan(500)
    const { container } = render(
      <YoujProvider reducedMotion="never">
        {icons.map((Icon) => (
          <span key={Icon.meta.name}>
            <Icon />
            <Icon active />
          </span>
        ))}
      </YoujProvider>,
    )
    const ids = [...container.querySelectorAll('mask, clipPath')].map((m) => m.id)
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
    for (const el of container.querySelectorAll('[mask], [clip-path]')) {
      const ref = (el.getAttribute('mask') ?? el.getAttribute('clip-path'))!.match(/^url\(#(.+)\)$/)
      if (!ref) continue
      expect(el.closest('svg')!.querySelector(`#${CSS.escape(ref[1]!)}`)).not.toBeNull()
    }
  })
})
