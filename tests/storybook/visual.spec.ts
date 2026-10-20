import { expect, test } from '@playwright/test'
import { openStory, stories } from './stories'

/* Screenshots compared with the committed baselines in __screenshots__/.
 * They only match inside the Playwright Linux image, so run them with
 * `pnpm test:visual` (and `pnpm test:visual:update` to accept changes).
 *
 * Baselines are kept for the hero stories and the UI primitives, in the dark
 * theme Storybook opens with. Playground and Reduced Motion stories are left
 * out: every screenshot is taken on the final frame with motion reduced. So
 * are the shader backgrounds: GPU-rasterised with film grain, each is half a
 * megabyte and shifts with Chromium updates, so review them in Storybook.
 * And so are stories that keep changing on their own, listed in LIVE: no
 * screenshot of them repeats. YOUJ_VISUAL=all screenshots every story, to
 * grow the set. */

const LIVE: Record<string, string> = {
  'ui-primitives-progress--hero': 'uploads advance on an interval from mount, so the frame depends on load time (Progress › States is baselined)',
}

const baselined = (s: { id: string; title: string; name: string }) =>
  !(s.id in LIVE) &&
  ((s.name === 'Hero' && !s.title.startsWith('Motion/Backgrounds/')) ||
    (s.title.startsWith('UI/Primitives/') && !['Playground', 'Reduced Motion'].includes(s.name)))

const selected = process.env.YOUJ_VISUAL === 'all' ? stories : stories.filter(baselined)

for (const story of selected) {
  test(story.id, async ({ page }) => {
    await openStory(page, story.id, 'dark')
    await expect(page).toHaveScreenshot(`${story.id}.png`, { fullPage: true })
  })
}
