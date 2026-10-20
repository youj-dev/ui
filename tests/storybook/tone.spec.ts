import { expect, test, type Page } from '@playwright/test'
import { openStory, type Theme } from './stories'

/* Tone propagation (token-audit §6.6). A chrome tone scope re-derives every
 * role in the chrome's mode, so a component inside it needs no change: on a
 * light page with `tone: { chrome: 'dark' }`, the toolbar and the button, the
 * field and the tabs in it compute exactly the colours the same story does on
 * a dark page, where the tone is the page's own mode. */

const STORY = 'ui-primitives-toolbar--chrome-tone'
const PARTS = [
  "[data-slot='toolbar']",
  "[data-slot='toolbar'] [data-slot='button']",
  "[data-slot='toolbar-input']",
  "[data-slot='tabs-list']",
  "[data-slot='tabs-indicator']",
  "[data-slot='tabs-trigger'][data-active]",
  "[data-slot='tabs-trigger']:not([data-active])",
]
const PROPERTIES = ['color', 'background-color', 'border-top-color', 'box-shadow'] as const

/** Each part's computed paint, by selector and property. */
async function paints(page: Page, theme: Theme) {
  await openStory(page, STORY, theme)
  return page.evaluate(
    ({ parts, properties }) =>
      Object.fromEntries(
        parts.map((selector) => {
          const el = document.querySelector(selector)
          if (!el) return [selector, null]
          const style = getComputedStyle(el)
          return [selector, Object.fromEntries(properties.map((p) => [p, style.getPropertyValue(p)]))]
        }),
      ),
    { parts: PARTS, properties: PROPERTIES },
  )
}

test('a dark chrome tone on a light page paints a toolbar and its button, field and tabs as the dark page does', async ({ page }) => {
  const light = await paints(page, 'light')
  const dark = await paints(page, 'dark')
  for (const selector of PARTS) expect([selector, light[selector]]).not.toEqual([selector, null])
  expect(light).toEqual(dark)
  // Not vacuous: the page around the toolbar is light in one and dark in the other.
  await openStory(page, STORY, 'light')
  const pageLight = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  await openStory(page, STORY, 'dark')
  const pageDark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(pageLight).not.toEqual(pageDark)
})
