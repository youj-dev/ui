import { renderToString } from 'react-dom/server'
import { chromium, type Browser } from 'playwright'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { KpiCards } from '../blocks/app/kpi-cards'
import { StatValue } from '../components/ui/stat-card'
import { dateTimeFormat, hydrationSafeNumberOptions, hydrationSafeText, numberFormat } from './utils'

/* Server text has to match the client's, or hydration fails in production
 * (React #418). Node's ICU and Chromium's write some formats differently: a
 * range's dash and a time's AM/PM padded with thin or narrow spaces, compact
 * currency keeping fraction digits. Each case is written by Node through the
 * shared formatters and by Chromium through its own Intl, normalized the same
 * way the formatters normalize, and the two must be one text. */

const SEP_1 = Date.UTC(2026, 8, 1)
const SEP_30 = Date.UTC(2026, 8, 30)
const JAN_3 = Date.UTC(2027, 0, 3)
const HOUR = 3_600_000

type Case =
  | { kind: 'range'; locale: string; options: Intl.DateTimeFormatOptions; from: number; to: number }
  | { kind: 'date'; locale: string; options: Intl.DateTimeFormatOptions; at: number }
  | { kind: 'number'; locale: string; options: Intl.NumberFormatOptions; values: number[] }

const UTC = { timeZone: 'UTC' } as const
const MONEY = [0, 0.5, 999, 1000, 1049, 1234, 99_999, 999_999, 1_250_000, 121_140, 12_345_678, 1e9, -1234]
const CASES: Case[] = [
  { kind: 'range', locale: 'en-US', options: { month: 'short', day: 'numeric', ...UTC }, from: SEP_1, to: SEP_30 },
  { kind: 'range', locale: 'en-US', options: { month: 'short', day: 'numeric', year: 'numeric', ...UTC }, from: SEP_1, to: JAN_3 },
  { kind: 'range', locale: 'en-US', options: { hour: 'numeric', ...UTC }, from: SEP_1, to: SEP_1 + HOUR },
  { kind: 'range', locale: 'en-US', options: { hour: 'numeric', minute: '2-digit', ...UTC }, from: SEP_1 + 9 * HOUR, to: SEP_1 + 17 * HOUR },
  { kind: 'range', locale: 'en-GB', options: { day: 'numeric', month: 'short', ...UTC }, from: SEP_1, to: SEP_30 },
  { kind: 'range', locale: 'de-DE', options: { day: 'numeric', month: 'short', ...UTC }, from: SEP_1, to: JAN_3 },
  { kind: 'range', locale: 'fr-FR', options: { day: 'numeric', month: 'short', ...UTC }, from: SEP_1, to: SEP_30 },
  { kind: 'range', locale: 'ja-JP', options: { month: 'short', day: 'numeric', ...UTC }, from: SEP_1, to: SEP_30 },
  { kind: 'date', locale: 'en-US', options: { hour: 'numeric', minute: '2-digit', ...UTC }, at: SEP_1 + 13.5 * HOUR },
  { kind: 'date', locale: 'en-US', options: { weekday: 'short', hour: 'numeric', ...UTC }, at: SEP_1 + 20 * HOUR },
  { kind: 'number', locale: 'en-US', options: { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }, values: MONEY },
  { kind: 'number', locale: 'en-US', options: { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }, values: MONEY },
  { kind: 'number', locale: 'en-US', options: { style: 'currency', currency: 'USD', notation: 'compact' }, values: MONEY },
  { kind: 'number', locale: 'de-DE', options: { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }, values: MONEY },
  { kind: 'number', locale: 'fr-FR', options: { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }, values: MONEY },
  { kind: 'number', locale: 'en-US', options: { notation: 'compact', maximumFractionDigits: 1 }, values: MONEY },
  { kind: 'number', locale: 'en-US', options: { style: 'percent', maximumFractionDigits: 1 }, values: [0, 0.124, -0.05, 1.5] },
]

function inNode(c: Case): string {
  if (c.kind === 'range') return dateTimeFormat(c.locale, c.options).formatRange(c.from, c.to)
  if (c.kind === 'date') return dateTimeFormat(c.locale, c.options).format(c.at)
  return c.values.map((v) => numberFormat(c.locale, c.options).format(v)).join(' | ')
}

let browser: Browser
beforeAll(async () => {
  browser = await chromium.launch()
})
afterAll(() => browser?.close())

async function inBrowser(cases: Case[]): Promise<string[]> {
  const tab = await browser.newPage()
  return tab.evaluate(
    ([cases, text, options]) => {
      const same = new Function(`return ${text}`)() as (text: string) => string
      const safe = new Function(`return ${options}`)() as (options?: Intl.NumberFormatOptions) => Intl.NumberFormatOptions | undefined
      return cases.map((c) => {
        if (c.kind === 'range') return same(new Intl.DateTimeFormat(c.locale, c.options).formatRange(c.from, c.to))
        if (c.kind === 'date') return same(new Intl.DateTimeFormat(c.locale, c.options).format(c.at))
        return c.values.map((v) => new Intl.NumberFormat(c.locale, safe(c.options)).format(v)).join(' | ')
      })
    },
    [cases, hydrationSafeText.toString(), hydrationSafeNumberOptions.toString()] as const,
  )
}

test('the shared formatters write what Chromium writes for ranges, times and compact currency', async () => {
  const browserText = await inBrowser(CASES)
  CASES.forEach((c, i) => expect({ case: c, text: inNode(c) }).toEqual({ case: c, text: browserText[i] }))
})

test("Chromium's own text needs no normalizing for the compact and plain formats", async () => {
  // The number options only change what Node writes: Chromium's raw output is already the target.
  const numbers = CASES.filter((c) => c.kind === 'number')
  const tab = await browser.newPage()
  const raw = await tab.evaluate((cases) => cases.map((c) => c.values.map((v) => new Intl.NumberFormat(c.locale, c.options).format(v)).join(' | ')), numbers)
  numbers.forEach((c, i) => expect(inNode(c)).toBe(raw[i]))
})

test('server-rendered KPI cards and a compact Stat value carry no Node-only text', async () => {
  const kpis = renderToString(
    <YoujProvider reducedMotion="always" locale="en-US">
      <KpiCards />
    </YoujProvider>,
  )
  expect(kpis).not.toMatch(/[\u2009\u202f]/)

  const stat = renderToString(
    <YoujProvider reducedMotion="always" locale="en-US">
      <StatValue value={121_140} format={{ style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }} />
    </YoujProvider>,
  )
  const tab = await browser.newPage()
  const expected = await tab.evaluate(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(121_140))
  expect(stat).toContain(`>${expected}<`)
})
