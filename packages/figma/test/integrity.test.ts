import { buildKit } from '../src/data/build-kit'
import type { Kit } from '../src/kit'
import { run } from '../src/plugin/run'
import { KEY } from '../src/plugin/store'
import { allNodes, installFakeFigma, type FakeEnv, type FakeOptions } from './fake-figma'
import { checkIntegrity } from './integrity'

/* The build's integrity, on every plan and in both looks: a clean build, a
 * second run and a switch of look each pass the integrity check
 * (./integrity.ts). The failures are in failures.test.ts. */

const kit: Kit = buildKit()

const plans: [string, FakeOptions][] = [
  ['Professional', { modeLimit: 10 }],
  ['Starter, drafts', { modeLimit: 1 }],
  ['Starter, team file', { modeLimit: 1, pageLimit: 3 }],
]

// Every plan in both styles: Classic (the default, from "Build or update the kit") and Bezel (from the Look menu).
const builds = plans.flatMap(([plan, opts]) => [
  [plan, 'Classic', 'build', opts] as const,
  [plan, 'Bezel', 'look:bezel', opts] as const,
])

describe.each(builds)('a clean build (%s, %s)', (_, style, command, opts) => {
  let env: FakeEnv
  let log: string
  let message: string
  beforeAll(async () => {
    env = installFakeFigma(opts).env
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    message = await run(kit, command)
    log = spy.mock.calls.map((c) => c.join(' ')).join('\n')
    spy.mockRestore()
  })

  test('says it is ready, with no problems', () => {
    expect(message).toMatch(/is ready/)
  })

  test(`draws the components in ${style}`, () => {
    expect(log).toMatch(new RegExp(`Look: ${style}`))
  })

  test('passes the integrity check', () => {
    expect(checkIntegrity(env)).toEqual([])
  })

  test('logs every page’s node count', () => {
    const pages = [...new Set(env.pages.filter((p) => p.getPluginData(KEY).startsWith('page:')).map((p) => p.name))]
    for (const name of pages) expect(log).toMatch(new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: \\d+ nodes`))
  })

  test('a second run is just as whole', async () => {
    expect(await run(kit, 'build')).toMatch(/is ready/)
    expect(checkIntegrity(env)).toEqual([])
  })

  test('switching to the other style redraws in place and stays whole', async () => {
    const sets = allNodes(env).filter((n) => n.type === 'COMPONENT_SET').map((n) => n.id)
    expect(await run(kit, style === 'Classic' ? 'look:bezel' : 'look:classic')).toMatch(/is ready/)
    expect(allNodes(env).filter((n) => n.type === 'COMPONENT_SET').map((n) => n.id)).toEqual(sets)
    expect(checkIntegrity(env)).toEqual([])
  })
})
