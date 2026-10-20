import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { openStory, stories } from './stories'

/* WCAG 2.2 AA, 2.5.8 Target Size (Minimum), measured on every UI story.
 *
 * axe's own target-size rule reads bounding boxes only, so it can't see the
 * hit areas components widen with a pseudo-element (after:-inset-*). This
 * measures what a pointer actually reaches: a target passes when
 * elementFromPoint, 12px either side of its centre on both axes, lands on it,
 * on something inside it, or on a <label> for it. An undersized target passes
 * the spacing exception when a 24px circle on its centre touches no other
 * target (it stays 12px from every other target's box, and 24px from every
 * other undersized one's centre). Disabled, hidden and inline targets (links
 * in a sentence) are exempt, as in the criterion, and so is one whose centre
 * is covered (scrolled under a pinned column). Size doesn't depend on
 * colour, so one theme runs.
 *
 * a11y-known.json lists accepted findings under "<story-id> (target)" as
 * ["target-size"]; a new one fails the run. */

const known: Record<string, string[]> = JSON.parse(readFileSync('tests/storybook/a11y-known.json', 'utf8'))

interface TargetFinding {
  target: string
  width: number
  height: number
}

/** Runs in the page: every undersized target that the spacing exception doesn't cover. */
function measureTargets(): TargetFinding[] {
  const SELECTOR = [
    'button',
    'a[href]',
    'input[type=checkbox]',
    'input[type=radio]',
    'input[type=range]',
    'summary',
    '[role=button]',
    '[role=link]',
    '[role=checkbox]',
    '[role=radio]',
    '[role=switch]',
    '[role=tab]',
    '[role=slider]',
    '[role=option]',
    '[role=menuitem]',
    '[role=menuitemcheckbox]',
    '[role=menuitemradio]',
  ].join(',')
  const MIN = 24
  const reach = MIN / 2 - 0.5
  const exempt = (el: Element) =>
    el.matches(':disabled, [aria-disabled=true], [data-disabled]') ||
    el.closest('[aria-hidden=true], [inert], .sb-wrapper, #storybook-docs') !== null ||
    !el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) ||
    getComputedStyle(el).display === 'inline' ||
    getComputedStyle(el).pointerEvents === 'none'
  const targets = [...document.querySelectorAll(SELECTOR)].filter((el) => {
    if (exempt(el)) return false
    const r = el.getBoundingClientRect()
    // Visually hidden native inputs (the form value behind a custom control) and targets off screen.
    return r.width > 1 && r.height > 1 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight
  })
  // The pointer lands on the target when it hits it, something inside it (its hit-area pseudo-element too), or its label.
  const reaches = (el: Element, x: number, y: number) => {
    const hit = document.elementFromPoint(x, y)
    if (!hit) return false
    if (el === hit || el.contains(hit)) return true
    const label = hit.closest('label')
    return label !== null && (label.contains(el) || (el.id !== '' && label.htmlFor === el.id))
  }
  const center = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
  // A target whose centre is covered (a column scrolled under a pinned one) is measured once it's scrolled into view, not here.
  const onTop = targets.filter((el) => {
    const c = center(el.getBoundingClientRect())
    return reaches(el, c.x, c.y)
  })
  const small = onTop.filter((el) => {
    const r = el.getBoundingClientRect()
    const c = center(r)
    return ![
      [c.x - reach, c.y],
      [c.x + reach, c.y],
      [c.x, c.y - reach],
      [c.x, c.y + reach],
    ].every(([x, y]) => reaches(el, x!, y!))
  })
  const distanceToBox = (p: { x: number; y: number }, r: DOMRect) => Math.hypot(Math.max(r.left - p.x, 0, p.x - r.right), Math.max(r.top - p.y, 0, p.y - r.bottom))
  const describe = (el: Element) => {
    const name = el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 30) ?? ''
    const slot = el.getAttribute('data-slot')
    return `${el.tagName.toLowerCase()}${el.getAttribute('role') ? `[role=${el.getAttribute('role')}]` : ''}${slot ? `[data-slot=${slot}]` : ''} "${name}"`
  }
  return small
    .filter((el) => {
      const c = center(el.getBoundingClientRect())
      return targets.some((other) => {
        if (other === el || other.contains(el) || el.contains(other)) return false
        const box = other.getBoundingClientRect()
        if (distanceToBox(c, box) < MIN / 2) return true
        return small.includes(other) && Math.hypot(center(box).x - c.x, center(box).y - c.y) < MIN
      })
    })
    .map((el) => {
      const r = el.getBoundingClientRect()
      return { target: describe(el), width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 }
    })
}

for (const story of stories.filter((s) => s.title.startsWith('UI/'))) {
  const key = `${story.id} (target)`
  test(key, async ({ page }) => {
    await openStory(page, story.id, 'light')
    const findings = await page.evaluate(measureTargets)
    const accepted = (known[key] ?? []).includes('target-size')
    if (accepted && !findings.length) test.info().annotations.push({ type: 'fixed', description: 'target-size now passes: remove from a11y-known.json' })
    if (accepted) return
    expect(
      findings.map((f) => `${f.target}: ${f.width}×${f.height}`),
      `${story.title} › ${story.name}: targets under 24×24 px without spacing`,
    ).toEqual([])
  })
}
