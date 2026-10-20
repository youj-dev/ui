import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { resetMedia } from './browser'

/* What jsdom lacks and the figures call: the SVG geometry a few of them read
 * at draw time, and a matchMedia the tests can flip (browser.ts). */
if (typeof window !== 'undefined') {
  const proto = (globalThis.SVGElement ?? Element).prototype as unknown as Record<string, unknown>
  proto.getTotalLength ??= () => 100
  proto.getPointAtLength ??= () => ({ x: 0, y: 0 })
  proto.getBBox ??= () => ({ x: 0, y: 0, width: 10, height: 10 })
  proto.getComputedTextLength ??= () => 10
  proto.getScreenCTM ??= () => null
}

afterEach(() => resetMedia())
