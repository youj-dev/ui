import { defineConfig } from '@playwright/test'

/* Suites that run against the built Storybook (pnpm build-storybook first):
 *   visual  screenshots of the baselined stories vs tests/storybook/__screenshots__
 *   a11y    axe over every story, light and dark (and RTL for UI, blocks and
 *           examples), and WCAG 2.5.8 target size over the UI stories
 *   tone    a chrome tone scope paints its controls in the chrome's mode
 * Screenshots only match inside the Playwright Linux image, so the visual
 * scripts run in it (scripts/playwright-docker.mjs), and so does CI. */

const port = 6141

export default defineConfig({
  testDir: 'tests/storybook',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  workers: process.env.CI ? 4 : undefined,
  // CI shards the suites; list the slowest tests of each run in the log.
  reportSlowTests: { max: 15, threshold: 20_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 1200, height: 800 },
    contextOptions: { reducedMotion: 'reduce' },
  },
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.001 },
  },
  projects: [
    // Apple Silicon emulates amd64 for the Linux image, and a heavy story's
    // settle-and-compare can pass the default 30s there.
    { name: 'visual', testMatch: 'visual.spec.ts', timeout: 60_000 },
    // axe (both themes, plus RTL) and WCAG 2.5.8 target size.
    { name: 'a11y', testMatch: /(a11y|target-size)\.spec\.ts/ },
    // A chrome tone re-derives the controls inside it (token-audit §6.6).
    { name: 'tone', testMatch: 'tone.spec.ts' },
  ],
  webServer: {
    command: `node scripts/serve-static.mjs storybook-static ${port}`,
    url: `http://localhost:${port}/index.json`,
    reuseExistingServer: !process.env.CI,
  },
})
