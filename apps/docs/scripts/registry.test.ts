// @vitest-environment node
import { registrySchema } from 'shadcn/schema'
import { declaredRanges, mergeBuilds, versionedItem, withRanges, withVersion } from './registry'

const index = (...names: string[]) => JSON.stringify({ name: 'youj', homepage: 'x', items: names.map((name) => ({ name })) })

describe('mergeBuilds', () => {
  it('copies every item and combines the registry indexes', () => {
    const merged = mergeBuilds(
      [
        { pkg: 'motion', files: new Map([['reveal.json', '{"r":1}'], ['registry.json', index('reveal')]]) },
        { pkg: 'ui', files: new Map([['button.json', '{"b":1}'], ['registry.json', index('button')]]) },
      ],
      'https://youj.example',
    )
    expect([...merged.keys()].sort()).toEqual(['button.json', 'registry.json', 'reveal.json'])
    expect(merged.get('reveal.json')).toBe('{"r":1}')
    const combined = JSON.parse(merged.get('registry.json')!)
    expect(combined).toMatchObject({ name: 'youj', homepage: 'https://youj.example' })
    expect(combined.items.map((i: { name: string }) => i.name)).toEqual(['reveal', 'button'])
  })

  it('fails when two packages build the same item', () => {
    expect(() =>
      mergeBuilds(
        [
          { pkg: 'motion', files: new Map([['youj-core.json', '{}']]) },
          { pkg: 'ui', files: new Map([['youj-core.json', '{}']]) },
        ],
        'x',
      ),
    ).toThrow(/built by both motion and ui/)
  })

  it('writes an index the shadcn registry directory accepts', () => {
    const item = (name: string) => ({ name, type: 'registry:ui', title: name, description: name, files: [{ path: `registry/${name}.tsx`, type: 'registry:ui' }] })
    const merged = mergeBuilds(
      [{ pkg: 'ui', files: new Map([['registry.json', JSON.stringify({ name: 'youj', homepage: 'x', items: [item('button')] })]]) }],
      'https://www.youj.dev',
    )
    const combined = JSON.parse(merged.get('registry.json')!)
    expect(registrySchema.safeParse(combined).success).toBe(true)
    // The directory matches the index's name to the namespace, lowercased and without the @.
    expect(combined.name).toBe('youj')
    expect(combined.homepage).toBe('https://www.youj.dev')
  })

  it('writes an index even when no package has one', () => {
    const merged = mergeBuilds([{ pkg: 'motion', files: new Map([['a.json', '{}']]) }], 'x')
    expect(JSON.parse(merged.get('registry.json')!).items).toEqual([])
  })
})

describe('dependency ranges', () => {
  const ranges = declaredRanges({
    version: '0.1.0',
    dependencies: { clsx: '^2.1.1', '@youj/icons': 'workspace:*' },
    peerDependencies: { '@base-ui/react': '>=1.8.0 <1.10.0', motion: '^13.4.4 || ^14', recharts: '^3.8.0', '@youj/motion': 'workspace:*' },
    devDependencies: { '@base-ui/react': '~1.8.0', recharts: '3.8.0', zod: '^4.6.5', '@youj/motion': 'workspace:*' },
  })

  it('takes the peer range first (its newest alternative, unless it has a space), and never a workspace: range', () => {
    expect(Object.fromEntries(ranges)).toEqual({
      motion: '^14',
      recharts: '^3.8.0',
      '@youj/motion': '^0.1.0',
      '@base-ui/react': '~1.8.0',
      clsx: '^2.1.1',
      '@youj/icons': '^0.1.0',
      zod: '^4.6.5',
    })
  })

  it('gives an item’s and an index’s unversioned dependencies their range, and leaves the rest', () => {
    const item = JSON.parse(withRanges(JSON.stringify({ name: 'field', dependencies: ['@base-ui/react', 'motion', 'zod@^3', 'left-pad'] }), ranges))
    expect(item.dependencies).toEqual(['@base-ui/react@~1.8.0', 'motion@^14', 'zod@^3', 'left-pad'])
    const index = JSON.parse(withRanges(JSON.stringify({ name: 'youj', items: [{ name: 'chart', dependencies: ['recharts'] }] }), ranges))
    expect(index.items[0].dependencies).toEqual(['recharts@^3.8.0'])
    const plain = '{"name":"x"}'
    expect(withRanges(plain, ranges)).toBe(plain)
  })
})

describe('the versioned registry', () => {
  const base = 'https://www.youj.dev/r'
  const button = JSON.stringify({
    name: 'button',
    registryDependencies: [`${base}/youj-ui-core.json`, 'https://other.example/r/thing.json', `${base}/v0.0.9/old.json`],
  })

  it('serves every file at the latest alias and again under v<version>/', () => {
    const files = withVersion(new Map([['button.json', button], ['registry.json', JSON.stringify({ name: 'youj', items: [] })]]), base, '0.1.0')
    expect([...files.keys()].sort()).toEqual(['button.json', 'registry.json', 'v0.1.0/button.json', 'v0.1.0/registry.json'])
    expect(files.get('button.json')).toBe(button)
  })

  it('points a versioned item’s dependencies on this registry at the same version, and no others', () => {
    expect(JSON.parse(versionedItem(button, base, '0.1.0')).registryDependencies).toEqual([
      `${base}/v0.1.0/youj-ui-core.json`,
      'https://other.example/r/thing.json',
      `${base}/v0.0.9/old.json`,
    ])
    const index = JSON.parse(versionedItem(JSON.stringify({ name: 'youj', items: [{ name: 'card', registryDependencies: [`${base}/button.json`] }] }), base, '0.1.0'))
    expect(index.items[0].registryDependencies).toEqual([`${base}/v0.1.0/button.json`])
  })
})
