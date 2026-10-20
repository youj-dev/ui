import { existsSync, readFileSync } from 'node:fs'
import { expect, type Page } from '@playwright/test'

export interface Story {
  id: string
  title: string
  name: string
  tags: string[]
}

const INDEX = 'storybook-static/index.json'
if (!existsSync(INDEX)) throw new Error(`${INDEX} is missing: run pnpm build-storybook first`)

/** Every story, minus those tagged `ci-skip`: ones that can't render in the static build (say why in the story). */
export const stories: Story[] = Object.values(
  JSON.parse(readFileSync(INDEX, 'utf8')).entries as Record<string, Story & { type: string }>,
).filter((entry) => entry.type === 'story' && !entry.tags.includes('ci-skip'))

export type Theme = 'light' | 'dark'
export type Direction = 'ltr' | 'rtl'

/** "Now" in every story, so dates and times render the same on every run. */
const NOW = new Date('2026-01-15T09:00:00Z').getTime()

/**
 * Opens a story in its iframe on its designed final frame (in `direction`,
 * RTL being the toolbar's Arabic setup): reduced motion
 * through the toolbar global (and the OS setting, see playwright.config.ts),
 * so entrances render finished and loops hold still.
 *
 * The page's clock starts at NOW and flows while Storybook loads the story,
 * fonts arrive and the network goes quiet (players fetch files). Then it jumps
 * a minute on and stops: whatever the story scheduled, like a faked fetch or
 * a delayed state, has happened, once. Two seconds of frames let motion land,
 * and transitions settle. Math.random is seeded, so demos that jitter (an
 * upload's irregular chunks) repeat too. What's captured doesn't depend on
 * machine speed or luck.
 */
export async function openStory(page: Page, id: string, theme: Theme, direction: Direction = 'ltr') {
  await page.addInitScript(seedRandom)
  await page.clock.install({ time: NOW })
  // a11y.manual keeps Storybook's a11y addon from running axe after each
  // render: that pass would collide with the a11y suite's ("Axe is already
  // running") and slow every screenshot.
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=reducedMotion:always;theme:${theme};direction:${direction};a11y.manual:!true`)
  await page.waitForSelector('body.sb-show-main, body.sb-show-errordisplay', { state: 'attached' })
  const error = await page.evaluate(() => document.body.classList.contains('sb-show-errordisplay') && document.querySelector('.sb-errordisplay')?.textContent)
  expect(error ? error.trim().split('\n')[0] : '', `${id} failed to render`).toBe('')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
  await page.clock.pauseAt(NOW + 60_000)
  await page.clock.runFor(2_000)
  await settleAnimations(page)
}

/** mulberry32, seeded: the same sequence on every page load. */
function seedRandom() {
  let seed = 0x6b696e
  Math.random = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Storybook's own waitForAnimations: running finite animations and
 * transitions (the colours easing into the theme), up to 5 s. It polls from
 * here because the page's timers are stopped.
 */
async function settleAnimations(page: Page) {
  for (let waited = 0; waited < 5_000; waited += 100) {
    const running = await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations !== Infinity).length,
    )
    if (!running) return
    await page.waitForTimeout(100)
  }
}
