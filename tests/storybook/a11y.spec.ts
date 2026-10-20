import { readFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { openStory, stories, type Direction, type Theme } from './stories'

/* axe over every story, in both themes, run the way Storybook's a11y addon
 * runs it: default rules on <body>, which skips page-level rules (a story
 * isn't a page, so no main landmark or h1), minus `region` for the same
 * reason, without Storybook's chrome, and with each story's own `a11y`
 * parameters (global, component and story, merged) read from the preview,
 * so this job and the Storybook panel can't drift apart.
 *
 * Then a right-to-left pass, in light: the toolbar's Direction RTL, which is a
 * whole Arabic app (dir="rtl", lang="ar", the provider's dir (which reaches Base UI), the
 * provider's `ar` locale and labels). It covers the stories whose accessible
 * names and layout change with direction: every UI, Blocks and Examples
 * story, which is where the built-in labels, logical properties and
 * direction-aware keyboard handling live. Icons, pieces, players, primitives
 * and foundations draw the same in both directions and carry no built-in
 * copy, so they'd add a third of the run for no new findings; contrast
 * doesn't depend on direction, so one theme is enough.
 *
 * a11y-known.json lists findings accepted for now, per story and theme. A new
 * finding fails the run; one that no longer occurs is noted in the report, so
 * its entry can go. */

const known: Record<string, string[]> = JSON.parse(readFileSync('tests/storybook/a11y-known.json', 'utf8'))

interface A11yParameters {
  disable?: boolean
  test?: 'error' | 'todo' | 'off'
  context?: { include?: string[]; exclude?: string[] }
  config?: { rules?: { id: string; enabled?: boolean }[] }
}

/** The story's merged `parameters.a11y`, as Storybook's test runner reads it. */
function a11yParameters(page: Page, id: string): Promise<A11yParameters> {
  return page.evaluate(async (storyId) => {
    // @ts-expect-error Storybook's preview global
    const story = await window.__STORYBOOK_PREVIEW__.storyStoreValue.loadStory({ storyId })
    return JSON.parse(JSON.stringify(story.parameters.a11y ?? {}))
  }, id)
}

const RTL = /^(UI|Blocks|Examples)\//

const passes = (story: { title: string }): Array<[Theme, Direction]> => [
  ['light', 'ltr'],
  ['dark', 'ltr'],
  ...(RTL.test(story.title) ? [['light', 'rtl'] as [Theme, Direction]] : []),
]

for (const story of stories) {
  for (const [theme, direction] of passes(story)) {
    const key = `${story.id} (${direction === 'rtl' ? `${theme}, rtl` : theme})`
    test(key, async ({ page }) => {
      await openStory(page, story.id, theme, direction)
      // axe schedules its own work on timers, so let time flow again.
      await page.clock.resume()
      const params = await a11yParameters(page, story.id)
      test.skip(params.disable === true || params.test === 'off', 'a11y is off for this story')

      let axe = new AxeBuilder({ page }).include('body').disableRules([
        'region',
        ...(params.config?.rules ?? []).filter((r) => r.enabled === false).map((r) => r.id),
      ])
      for (const selector of ['.sb-wrapper', '#storybook-docs', '#storybook-highlights-root', ...(params.context?.exclude ?? [])]) {
        axe = axe.exclude(selector)
      }
      const { violations } = await axe.analyze()

      const accepted = new Set(known[key] ?? [])
      const fixed = [...accepted].filter((rule) => !violations.some((v) => v.id === rule))
      if (fixed.length) test.info().annotations.push({ type: 'fixed', description: `${fixed.join(', ')} now pass: remove from a11y-known.json` })

      const found = violations
        .filter((v) => !accepted.has(v.id))
        .map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
      expect(found, `${story.title} › ${story.name} in ${theme}${direction === 'rtl' ? ', RTL' : ''}`).toEqual([])
    })
  }
}
