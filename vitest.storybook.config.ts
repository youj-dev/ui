import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'

const dirname = fileURLToPath(new URL('.', import.meta.url))

/* Runs the stories that have a `play()` function as tests in Chromium, through
 * the same Storybook config (aliases, decorators, theme) the site uses. The
 * stories come from main.ts; the tag filter keeps the ones with a play function. */
export default defineConfig({
  plugins: [storybookTest({ configDir: `${dirname}.storybook`, tags: { include: ['play-fn'] } })],
  test: {
    name: 'stories',
    browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: 'chromium' }] },
  },
})
