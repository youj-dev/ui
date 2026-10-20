// @vitest-environment node
import { icons } from '@youj/icons'
import { areaOf, catalog, dependencyClosure, iconNames } from './catalog'
import { registryItem } from './registry'

describe('catalog', () => {
  const counts = catalog()

  it('counts the icon set exactly, without the motion that drives it', () => {
    expect(counts.icons).toBe(icons.length)
    expect(iconNames()).toContain('bell')
    expect(areaOf(registryItem('icon-swap'))).toBeUndefined()
    expect(areaOf(registryItem('youj-icon'))).toBeUndefined()
    expect(areaOf(registryItem('icon-bell'))).toBe('icons')
  })

  it('files motion components by area and leaves libs and hooks out', () => {
    expect(areaOf(registryItem('reveal'))).toBe('motion')
    expect(areaOf(registryItem('sliding-indicator'))).toBe('transitions')
    expect(areaOf(registryItem('dock'))).toBe('interactions')
    expect(areaOf(registryItem('mesh-gradient'))).toBe('backgrounds')
    expect(areaOf(registryItem('youj-gl'))).toBeUndefined()
    expect(areaOf(registryItem('youj-core'))).toBeUndefined()
    expect(counts.motion.total).toBe(
      counts.motion.motion + counts.motion.transitions + counts.motion.effects + counts.motion.interactions + counts.motion.backgrounds + counts.motion.players,
    )
  })

  it('counts UI components, not its core or hooks', () => {
    expect(areaOf(registryItem('button'))).toBe('ui')
    expect(areaOf(registryItem('youj-ui-core'))).toBeUndefined()
    expect(counts.ui).toBeGreaterThan(30)
  })
})

describe('dependencyClosure', () => {
  const items = new Map(
    [
      { name: 'dialog', registryDependencies: ['button', 'https://youj.io/r/youj-core.json'] },
      { name: 'button', registryDependencies: ['youj-core', 'async-feedback'] },
      { name: 'async-feedback', registryDependencies: ['youj-core', 'dialog'] },
      { name: 'youj-core' },
    ].map((item) => [item.name, { ...item, package: '@youj/react' }]),
  )

  it('follows registry dependencies recursively, once each, in the order first reached', () => {
    expect(dependencyClosure('dialog', items)).toEqual(['button', 'youj-core', 'async-feedback'])
  })

  it('is empty for an item with no dependencies', () => {
    expect(dependencyClosure('youj-core', items)).toEqual([])
  })
})
