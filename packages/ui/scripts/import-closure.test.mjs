import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sourceItems } from '../../../scripts/youj-sources.mjs'
import { importClosureProblems } from './import-closure.mjs'
import { motionEntries } from './motion-exports.mjs'

/* Run against the real fragments: the registry as generated is closed, and
 * taking one dependency away is caught for what the item's code imports. */

const root = join(import.meta.dirname, '..')
const fragments = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')))
const items = fragments(join(root, 'registry'))
const motionItems = sourceItems()
const entries = motionEntries()

/** The UI items, with `name`'s registry dependencies changed. */
const withDeps = (name, change) => items.map((item) => (item.name === name ? { ...item, registryDependencies: change(item.registryDependencies) } : item))
const without = (name, dep) => withDeps(name, (deps) => deps.filter((d) => d !== dep))
const check = (uiItems) => importClosureProblems({ root, items: uiItems, motionItems, entries })

test('every import in the generated registry lands in its item or dependencies', () => {
  expect(check(items)).toEqual([])
})

test('a UI component the item imports relatively must be a dependency', () => {
  expect(check(without('button', 'spinner'))).toEqual([
    "button: src/components/ui/button.tsx imports ./spinner, which isn't in the item or its registry dependencies",
  ])
})

test('what the item imports from @youj/motion must come with a motion item', () => {
  expect(check(without('tabs', 'sliding-indicator'))).toEqual([
    expect.stringMatching(/^tabs: src\/components\/ui\/tabs\.tsx imports SlidingIndicator from @youj\/motion \(motion's src\/components\/youj\/transitions\/sliding-indicator\.tsx\)/),
  ])
})

test('dependencies count transitively', () => {
  // youj-core holds popover's useYoujScope, and comes with youj-ui-core or youj-presets.
  expect(check(without('popover', 'youj-core'))).toEqual([])
  expect(check(withDeps('popover', () => ['youj-presets']))).toEqual([
    "popover: src/components/ui/popover.tsx imports ../../lib/utils, which isn't in the item or its registry dependencies",
    "popover: src/components/ui/popover.tsx imports ./presentation, which isn't in the item or its registry dependencies",
  ])
})
