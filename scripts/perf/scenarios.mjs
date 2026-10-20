/* What `pnpm perf` measures. Each scenario opens one story and drives its main
 * interaction or animation while the recorder is running. `run` receives the
 * Playwright page and the helpers below; it should take roughly 2–4 s so a
 * full pass stays under ~15 minutes. Keep scenario names stable: they key the
 * baseline. */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Moves the pointer along a Lissajous path over `box` for `ms`, one move per ~16 ms. */
export async function sweep(page, box, ms = 3000) {
  const t0 = Date.now()
  let i = 0
  while (Date.now() - t0 < ms) {
    const t = (Date.now() - t0) / 1000
    const x = box.x + box.width * (0.5 + 0.45 * Math.sin(t * 2.1))
    const y = box.y + box.height * (0.5 + 0.4 * Math.sin(t * 1.3 + 0.7))
    await page.mouse.move(x, y)
    if (++i % 2 === 0) await sleep(16)
  }
}

/** Sweeps back and forth along the horizontal midline of `box`. */
export async function scan(page, box, ms = 3000, passes = 4) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    const t = ((Date.now() - t0) / ms) * passes
    const phase = t % 2 < 1 ? t % 1 : 1 - (t % 1)
    await page.mouse.move(box.x + box.width * (0.04 + 0.92 * phase), box.y + box.height / 2)
    await sleep(8)
  }
}

/** Walks the pointer across a grid of elements row by row. */
async function hoverEach(page, locator, ms = 3000) {
  const boxes = await locator.evaluateAll((els) =>
    els.map((e) => e.getBoundingClientRect().toJSON()).filter((b) => b.width && b.bottom > 0 && b.top < innerHeight),
  )
  const t0 = Date.now()
  for (let i = 0; Date.now() - t0 < ms && boxes.length; i++) {
    const b = boxes[i % boxes.length]
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 3 })
  }
}

/** Wheel-scrolls over (x, y) for `ms`: down for the first half, back up for the second. */
async function wheel(page, x, y, ms = 3000, delta = 120) {
  await page.mouse.move(x, y)
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    await page.mouse.wheel(0, Date.now() - t0 < ms / 2 ? delta : -delta)
    await sleep(16)
  }
}

const viewport = (page) => {
  const { width, height } = page.viewportSize()
  return { x: 0, y: 0, width, height }
}
const boxOf = async (locator) => {
  await locator.scrollIntoViewIfNeeded()
  return locator.boundingBox()
}

const background = (name, id) => ({
  name,
  story: id,
  group: 'backgrounds',
  run: (page) => sweep(page, viewport(page)),
})

export const scenarios = [
  background('mesh-gradient', 'motion-backgrounds-mesh-gradient--hero'),
  background('noise-field', 'motion-backgrounds-noise-field--hero'),
  background('aurora', 'motion-backgrounds-aurora--hero'),
  background('particle-constellation', 'motion-backgrounds-particle-constellation--hero'),
  background('dot-matrix-wave', 'motion-backgrounds-dot-matrix-wave--hero'),
  background('magnetic-field', 'motion-backgrounds-magnetic-field--hero'),
  background('ripple-pond', 'motion-backgrounds-ripple-pond--hero'),
  background('warp-grid', 'motion-backgrounds-warp-grid--hero'),
  {
    name: 'cursor-follower',
    story: 'motion-interactions-cursorfollower--hero',
    group: 'pointer',
    run: (page) => sweep(page, viewport(page)),
  },
  {
    name: 'dock',
    story: 'motion-interactions-dock--hero',
    group: 'pointer',
    run: async (page) => scan(page, await boxOf(page.getByRole('toolbar', { name: 'Applications' }))),
  },
  {
    name: 'spotlight-grid',
    story: 'motion-interactions-spotlightcard--hero',
    group: 'pointer',
    run: async (page) => {
      const cards = page.getByRole('link')
      const first = await boxOf(cards.first())
      const last = await cards.last().boundingBox()
      await sweep(page, { x: first.x, y: first.y, width: last.x + last.width - first.x, height: last.y + last.height - first.y })
    },
  },
  {
    name: 'marquee',
    story: 'motion-marquee--hero',
    group: 'loops',
    run: () => sleep(3000),
  },
  {
    name: 'parallax',
    story: 'motion-parallax--hero',
    group: 'scroll',
    run: async (page) => {
      const box = await page.locator('.overflow-y-auto').first().boundingBox()
      await wheel(page, box.x + box.width / 2, box.y + box.height / 2, 3000, 80)
    },
  },
  {
    name: 'text-split',
    story: 'motion-textsplit--hero',
    group: 'entrance',
    run: async (page) => {
      for (let i = 0; i < 2; i++) {
        await page.getByRole('button', { name: 'Replay' }).click()
        await sleep(1500)
      }
    },
  },
  {
    name: 'counter-roll',
    story: 'motion-counter--rolling-stats',
    group: 'entrance',
    run: async (page) => {
      // Keyboard: on the phone profile the 640px demo overflows and the button sits off-canvas.
      const next = page.getByRole('button', { name: 'Next period' })
      await next.focus()
      for (let i = 0; i < 3; i++) {
        await next.press('Enter')
        await sleep(900)
      }
    },
  },
  {
    name: 'datatable-scroll',
    story: 'ui-data-datatable--virtualized',
    group: 'data',
    run: async (page) => {
      const box = await page.getByRole('grid').boundingBox()
      await wheel(page, box.x + box.width / 2, box.y + Math.min(box.height / 2, 300), 3000, 160)
    },
  },
  {
    name: 'datatable-toggle',
    story: 'ui-data-datatable--virtualized',
    group: 'data',
    run: async (page) => {
      const boxes = page.getByRole('checkbox', { name: /^Select ORD-/ })
      for (let i = 0; i < 6; i++) {
        await boxes.nth(i).click()
        await sleep(250)
      }
    },
  },
  {
    // The 10k story has no search box, so this uses the Filters story (200 rows, faceted filters on).
    name: 'datatable-filter',
    story: 'ui-data-datatable--filters',
    group: 'data',
    run: async (page) => {
      const search = page.getByRole('searchbox')
      await search.click()
      await search.pressSequentially('ada', { delay: 180 })
      await sleep(400)
      for (let i = 0; i < 3; i++) {
        await search.press('Backspace')
        await sleep(180)
      }
      await sleep(400)
    },
  },
  {
    name: 'command-palette',
    story: 'ui-overlays-command-palette--hero',
    group: 'overlays',
    run: async (page) => {
      await page.getByRole('button', { name: /Search or run a command/ }).click()
      await sleep(500)
      await page.keyboard.type('deploy', { delay: 150 })
      await sleep(400)
      await page.keyboard.press('Escape')
      await sleep(500)
    },
  },
  {
    name: 'toast-stack',
    story: 'ui-overlays-toast--stack',
    group: 'overlays',
    run: async (page) => {
      await page.getByRole('button', { name: 'Send 5 notifications' }).click()
      await sleep(1600)
      const region = await page.getByRole('region', { name: 'Notifications' }).boundingBox()
      await page.mouse.move(region.x + region.width / 2, region.y + region.height - 40, { steps: 5 })
      await sleep(900)
      await page.mouse.move(10, 10, { steps: 5 })
      await sleep(600)
    },
  },
  {
    name: 'icon-gallery',
    story: 'icons-gallery--gallery',
    group: 'pointer',
    run: (page) => hoverEach(page, page.getByRole('button', { name: /icon, copy$/ }), 3000),
  },
  {
    name: 'theme-switch',
    story: 'foundations-themes--composition',
    group: 'theme',
    run: async (page) => {
      for (const preset of ['terminal', 'brutal', 'basalt', 'graphite']) {
        await page.evaluate(async (preset) => {
          const t0 = performance.now()
          window.__STORYBOOK_ADDONS_CHANNEL__.emit('updateGlobals', { globals: { themePreset: preset } })
          await new Promise((resolve) => {
            const check = () => (document.documentElement.getAttribute('data-yj-theme') === preset ? resolve() : requestAnimationFrame(check))
            check()
          })
          await window.__perf.afterPaint()
          window.__perf.interaction('theme', performance.now() - t0)
        }, preset)
        await sleep(450)
      }
    },
  },
]
