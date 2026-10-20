/* Sample books for The Ledger, the Analytics example: Meadow Tea Co., a tea
 * shop that sells online and to cafés, reported week by week. Every number
 * reconciles: a week's hourly revenue is last week's plus each driver's
 * effect, so the bridge, the running total, the "without it" line and the
 * figures all add up. Deterministic, so tests and screenshots read the same
 * every run; dates count back from the load. */

import { at, baseline, drift, HOURS, hours, isoWeek, lumps, outage, scaleTo, sum, surge, weekStart } from './series'

export type DriverKind = 'Marketing' | 'Wholesale' | 'Operations' | 'Refunds' | 'Press' | 'Subscriptions' | 'Other'

export interface Breakdown {
  title: string
  unit: 'currency' | 'count'
  rows: { label: string; value: number; note?: string }[]
}

export interface Driver {
  id: string
  name: string
  /** How the prose names it: "the launch email". */
  short: string
  kind: DriverKind
  /** The driver's effect on the week's revenue, in dollars. */
  amount: number
  /** The finding, when this driver is the page's subject. */
  headline: string
  standfirst: string
  breakdown: Breakdown
  facts: { label: string; value: string }[]
  next: string
  /** Revenue it added or took, hour by hour: 168 values that sum to `amount`. */
  effect: number[]
}

export interface ChartEvent {
  /** Hour of the week it happened, from Monday 00:00; with `to`, a span. */
  at: number
  to?: number
  label: string
  driver?: string
}

export interface Figure {
  value: number
  previous: number
}

export interface Product {
  id: string
  name: string
  last: number
  now: number
}

export interface Week {
  /** Weeks back from the one in progress: 0 is this week. */
  offset: number
  /** ISO week number. */
  number: number
  /** Monday 00:00 of the week, local time. */
  start: number
  headline: string
  standfirst: string
  /** The chart's title: what Fig. 1 shows, as a finding. */
  chartTitle: string
  revenue: Figure
  orders: Figure
  newCustomers: Figure
  refunds: Figure
  /** Revenue per hour this week and last, 168 values each; this week's is cut off at `hoursIn`. */
  hourly: number[]
  lastHourly: number[]
  /** Hours of the week that have happened: 168 for a closed week. */
  hoursIn: number
  drivers: Driver[]
  events: ChartEvent[]
  products: Product[]
  watch: { title: string; body: string }[]
}

type DriverInput = Omit<Driver, 'effect'> & { shape: number[] }
const driver = ({ shape, ...rest }: DriverInput): Driver => ({ ...rest, effect: scaleTo(shape, rest.amount).map((v) => (rest.amount < 0 ? -Math.abs(v) : Math.abs(v))) })

const f = (value: number, previous: number): Figure => ({ value, previous })

export function makeWeeks(now = Date.now()): Week[] {
  /* ── Last week: the First Flush launch ─────────────────────────────── */
  const last1 = baseline(161_420, 3)
  const email = surge(at(1, 9), 14)
  const email1 = email.map((v) => (v * 21_380) / sum(email))
  const trade1 = last1.map((v, h) => v + email1[h]!)
  const launch: DriverInput[] = [
    {
      id: 'email',
      name: 'First Flush launch email',
      short: 'the launch email',
      kind: 'Marketing',
      amount: 21_380,
      headline: 'The First Flush email brought in $21,380, most of it before Wednesday.',
      standfirst:
        'It went to 48,200 subscribers at 9 a.m. on Tuesday. Four in ten opened it and 1,236 ordered, half of them within six hours, which is when the checkout went down.',
      breakdown: {
        title: 'From inbox to order',
        unit: 'count',
        rows: [
          { label: 'Sent', value: 48_200 },
          { label: 'Opened', value: 21_210, note: '44%' },
          { label: 'Clicked', value: 6_480, note: '13%' },
          { label: 'Ordered', value: 1_236, note: '2.6%' },
        ],
      },
      facts: [
        { label: 'Revenue per recipient', value: '$0.44' },
        { label: 'Average order', value: '$17.30' },
        { label: 'New customers', value: '412' },
      ],
      next: 'Send the follow-up to everyone who didn’t open it on Thursday morning. After the spring launch it added a fifth again.',
      shape: email,
    },
    {
      id: 'wholesale',
      name: 'Café reorders',
      short: 'the café reorders',
      kind: 'Wholesale',
      amount: 9_840,
      headline: 'Three cafés reordered on Thursday morning, $9,840 between them.',
      standfirst: 'Birch & Bean, Northcote and Salt Bakery all came back within two hours of each other, a week after the First Flush samples went out.',
      breakdown: {
        title: 'Orders',
        unit: 'currency',
        rows: [
          { label: 'Birch & Bean', value: 4_100, note: '200 tins' },
          { label: 'Northcote Café', value: 3_260, note: '160 tins' },
          { label: 'Salt Bakery', value: 2_480, note: '126 tins' },
        ],
      },
      facts: [
        { label: 'Tins', value: '486' },
        { label: 'Average order', value: '$3,280' },
        { label: 'Days since their last order', value: '41' },
      ],
      next: 'Offer all three a standing monthly order at 5% off, before they find another supplier for the winter.',
      shape: lumps([
        [at(3, 10), 4_100],
        [at(3, 11), 3_260],
        [at(3, 12), 2_480],
      ]),
    },
    {
      id: 'outage',
      name: 'Checkout outage',
      short: 'the outage',
      kind: 'Operations',
      amount: -6_190,
      headline: 'A checkout outage on Tuesday afternoon cost about $6,190.',
      standfirst:
        'Tillpoint, our payment provider, declined cards from 2:10 to 4:40 in the afternoon, the middle of the email rush. 311 baskets stalled at payment; 38 came back later and bought.',
      breakdown: {
        title: 'Failed payments, Tuesday',
        unit: 'count',
        rows: [
          { label: '2 to 3 p.m.', value: 64 },
          { label: '3 to 4 p.m.', value: 131 },
          { label: '4 to 4:40 p.m.', value: 116 },
        ],
      },
      facts: [
        { label: 'Down for', value: '2 h 30 min' },
        { label: 'Baskets stalled', value: '311' },
        { label: 'Came back and bought', value: '38' },
      ],
      next: 'Ask Tillpoint for a service credit, and add a fallback card processor before the next send.',
      shape: outage(at(1, 14, 10), at(1, 16, 40), trade1, email1),
    },
    {
      id: 'refunds',
      name: 'Refunds for crushed tins',
      short: 'the refunds',
      kind: 'Refunds',
      amount: -4_310,
      headline: 'Refunds rose to $5,120, and $4,310 of it was one crushed pallet.',
      standfirst: 'Parcelwise dropped a pallet of Harvest gift tins on Friday. We refunded all 164 orders on Saturday rather than make anyone wait for the claim.',
      breakdown: {
        title: 'Refunds by reason',
        unit: 'currency',
        rows: [
          { label: 'Damaged in transit', value: 4_310, note: '164 orders' },
          { label: 'Wrong item', value: 420 },
          { label: 'Changed their mind', value: 390 },
        ],
      },
      facts: [
        { label: 'Orders refunded', value: '198' },
        { label: 'Refund rate', value: '2.1%, from 0.9%' },
        { label: 'Courier claim', value: 'Accepted' },
      ],
      next: 'The claim covers it. Move the Harvest tins to double-walled boxes before the gift season.',
      shape: lumps([
        [at(5, 11), 2_900],
        [at(5, 15), 1_000],
        [at(6, 10), 410],
      ]),
    },
    {
      id: 'press',
      name: 'Kettle Magazine feature',
      short: 'the Kettle feature',
      kind: 'Press',
      amount: 3_120,
      headline: 'Kettle Magazine’s feature sent 2,900 readers and $3,120 of orders.',
      standfirst: 'It ran on Friday evening. Its readers stayed longer than anyone else this week and mostly bought the First Flush and the matcha.',
      breakdown: {
        title: 'Orders from the feature',
        unit: 'currency',
        rows: [
          { label: 'First Flush Darjeeling', value: 1_640 },
          { label: 'Ceremonial Matcha', value: 860 },
          { label: 'Breakfast Blend', value: 620 },
        ],
      },
      facts: [
        { label: 'Readers', value: '2,900' },
        { label: 'Bought', value: '5.6%' },
        { label: 'Time on site', value: '4 min 10 s' },
      ],
      next: 'Send Lena Marsh a thank-you tin, and link the feature from the First Flush page while it’s still fresh.',
      shape: surge(at(4, 18), 20),
    },
    {
      id: 'other',
      name: 'Everything else',
      short: 'everything else',
      kind: 'Other',
      amount: -1_500,
      headline: 'Everything else took $1,500 off, spread thinly across the week.',
      standfirst: 'No single change was worth more than $400: a slower Saturday, fewer gift boxes after last week’s offer, and currency moving against us.',
      breakdown: {
        title: 'The largest of the rest',
        unit: 'currency',
        rows: [
          { label: 'Gift boxes', value: -390 },
          { label: 'Saturday visits', value: -360 },
          { label: 'Currency', value: -210 },
        ],
      },
      facts: [
        { label: 'Changes counted', value: '42' },
        { label: 'Largest', value: '$390' },
        { label: 'Smallest', value: '$4' },
      ],
      next: 'Nothing to act on.',
      shape: drift(11),
    },
  ]

  /* ── Two weeks back: a flat week ───────────────────────────────────── */
  const quiet: DriverInput[] = [
    {
      id: 'hotels',
      name: 'Harbour Hotels’ first order',
      short: 'the hotel order',
      kind: 'Wholesale',
      amount: 6_140,
      headline: 'Harbour Hotels placed its first order: 280 tins for its breakfast rooms.',
      standfirst: 'The buyer found us at the trade fair in June. They took Breakfast Blend and Chamomile for all six hotels, and asked about a standing order.',
      breakdown: {
        title: 'The order',
        unit: 'currency',
        rows: [
          { label: 'Breakfast Blend', value: 3_820, note: '180 tins' },
          { label: 'Chamomile & Honeybush', value: 2_320, note: '100 tins' },
        ],
      },
      facts: [
        { label: 'Tins', value: '280' },
        { label: 'Hotels', value: '6' },
        { label: 'Terms', value: '30 days' },
      ],
      next: 'Quote a standing monthly order, and send the First Flush samples with it.',
      shape: lumps([[at(2, 11), 1]]),
    },
    {
      id: 'quiet',
      name: 'No email this week',
      short: 'the missing email',
      kind: 'Marketing',
      amount: -3_880,
      headline: 'With no email out, the shop was $3,880 quieter than usual.',
      standfirst: 'The week before had the last summer sale reminder. Nothing went out this week while the First Flush tins were printed.',
      breakdown: {
        title: 'Visits from email',
        unit: 'count',
        rows: [
          { label: 'The week before', value: 5_140 },
          { label: 'This week', value: 1_210 },
        ],
      },
      facts: [
        { label: 'Email revenue', value: '$2,030' },
        { label: 'The week before', value: '$5,910' },
        { label: 'Subscribers', value: '48,020' },
      ],
      next: 'Nothing to fix: the launch email goes out next Tuesday.',
      shape: drift(4),
    },
    {
      id: 'subscriptions',
      name: 'Tasting box sign-ups',
      short: 'the new subscribers',
      kind: 'Subscriptions',
      amount: 1_750,
      headline: 'The tasting box picked up 88 new subscribers, worth $1,750 in first boxes.',
      standfirst: 'Most came from the recipe post on Sunday evening.',
      breakdown: {
        title: 'Sign-ups by plan',
        unit: 'count',
        rows: [
          { label: 'Monthly', value: 61 },
          { label: 'Every two months', value: 27 },
        ],
      },
      facts: [
        { label: 'New subscribers', value: '88' },
        { label: 'Active', value: '2,406' },
        { label: 'Canceled', value: '19' },
      ],
      next: 'Pin the recipe post and add the tasting box to it.',
      shape: surge(at(6, 19), 6),
    },
    {
      id: 'other-2',
      name: 'Everything else',
      short: 'everything else',
      kind: 'Other',
      amount: -2_090,
      headline: 'Everything else took $2,090 off, none of it large.',
      standfirst: 'A wet weekend kept the gift orders down, and two cafés skipped their usual order.',
      breakdown: {
        title: 'The largest of the rest',
        unit: 'currency',
        rows: [
          { label: 'Gift boxes', value: -820 },
          { label: 'Café orders', value: -640 },
          { label: 'Currency', value: -180 },
        ],
      },
      facts: [
        { label: 'Changes counted', value: '37' },
        { label: 'Largest', value: '$820' },
        { label: 'Smallest', value: '$3' },
      ],
      next: 'Nothing to act on.',
      shape: drift(19),
    },
  ]

  /* ── Three weeks back: the sale ends ───────────────────────────────── */
  const last3 = baseline(169_890, 13)
  const after: DriverInput[] = [
    {
      id: 'sale',
      name: 'Summer sale ended',
      short: 'the end of the sale',
      kind: 'Marketing',
      amount: -14_300,
      headline: 'The summer sale ended, and with it $14,300 of the week before’s orders.',
      standfirst: 'Twenty per cent off every iced blend ran for two weeks and closed at midnight on Sunday. Much of what it sold was bought early rather than bought extra.',
      breakdown: {
        title: 'Sale blends, this week against the week before',
        unit: 'currency',
        rows: [
          { label: 'Iced Peach Oolong', value: -6_210 },
          { label: 'Cold Brew Sencha', value: -4_880 },
          { label: 'Hibiscus Cooler', value: -3_210 },
        ],
      },
      facts: [
        { label: 'Orders', value: '−730' },
        { label: 'Average order', value: '+$0.38' },
        { label: 'Margin', value: '+4 pts' },
      ],
      next: 'Expect two quieter weeks while the pantry stock runs down. Don’t chase it with another offer.',
      // A share of each hour's trade, largest at first: what the sale had pulled forward.
      shape: hours((h) => Math.exp(-h / 70) * last3[h]!),
    },
    {
      id: 'renewals',
      name: 'Subscription renewals',
      short: 'the renewals',
      kind: 'Subscriptions',
      amount: 2_860,
      headline: 'Monthly renewals ran on Monday and brought $2,860 more than the month before.',
      standfirst: 'There were 143 more active subscribers than at the last run, most from the June tasting box offer.',
      breakdown: {
        title: 'Renewals',
        unit: 'count',
        rows: [
          { label: 'Renewed', value: 2_318 },
          { label: 'Paused', value: 64 },
          { label: 'Canceled', value: 22 },
        ],
      },
      facts: [
        { label: 'Active subscribers', value: '2,318' },
        { label: 'Renewal rate', value: '96%' },
        { label: 'Card failures', value: '31' },
      ],
      next: 'Chase the 31 failed cards before Friday.',
      shape: lumps([
        [at(0, 6), 3],
        [at(0, 7), 1],
      ]),
    },
    {
      id: 'wholesale-3',
      name: 'Wholesale',
      short: 'the new café',
      kind: 'Wholesale',
      amount: 1_560,
      headline: 'Wholesale was $1,560 ahead, from one new café.',
      standfirst: 'Salt Bakery placed its first order after tasting the Breakfast Blend at the market.',
      breakdown: {
        title: 'Orders',
        unit: 'currency',
        rows: [{ label: 'Salt Bakery', value: 1_560, note: '80 tins' }],
      },
      facts: [
        { label: 'Cafés ordering', value: '14' },
        { label: 'New', value: '1' },
        { label: 'Average order', value: '$2,110' },
      ],
      next: 'Send Salt Bakery the First Flush samples when they land.',
      shape: lumps([[at(2, 15), 1]]),
    },
    {
      id: 'other-3',
      name: 'Everything else',
      short: 'everything else',
      kind: 'Other',
      amount: -510,
      headline: 'Everything else came to −$510, which is noise.',
      standfirst: 'A dozen small ups and downs, none larger than $200.',
      breakdown: {
        title: 'The largest of the rest',
        unit: 'currency',
        rows: [
          { label: 'Gift boxes', value: -190 },
          { label: 'Accessories', value: 120 },
          { label: 'Currency', value: -90 },
        ],
      },
      facts: [
        { label: 'Changes counted', value: '31' },
        { label: 'Largest', value: '$190' },
        { label: 'Smallest', value: '$2' },
      ],
      next: 'Nothing to act on.',
      shape: drift(27),
    },
  ]

  const closed = (lastHourly: number[], inputs: DriverInput[]) => {
    const drivers = inputs.map(driver)
    const hourly = lastHourly.map((v, h) => v + sum(drivers.map((d) => d.effect[h]!)))
    return { lastHourly, hourly, drivers }
  }

  const w1 = closed(last1, launch)
  const w2 = closed(baseline(159_500, 7), quiet)
  const w3 = closed(last3, after)

  // This week so far: last week's ordinary trade with a little growth, up to now.
  const start0 = weekStart(now)
  const hoursIn = Math.min(HOURS, Math.max(0, Math.floor((now - start0) / 3_600_000)))
  const trade0 = baseline(186_900, 17)
  const hourly0 = trade0.map((v, h) => (h < hoursIn ? v : 0))

  const products = (rows: [string, string, number, number][]): Product[] => rows.map(([id, name, last, now]) => ({ id, name, last, now }))

  return [
    {
      offset: 0,
      number: isoWeek(start0),
      start: start0,
      headline: 'This week is still being written.',
      standfirst: '',
      chartTitle: 'This week so far, against last week.',
      revenue: f(Math.round(sum(hourly0)), Math.round(sum(w1.hourly.slice(0, hoursIn)))),
      orders: f(0, 0),
      newCustomers: f(0, 0),
      refunds: f(0, 0),
      hourly: hourly0,
      lastHourly: w1.hourly,
      hoursIn,
      drivers: [],
      events: [],
      products: [],
      watch: [],
    },
    {
      offset: 1,
      number: isoWeek(weekStart(now, 1)),
      start: weekStart(now, 1),
      headline: 'Revenue rose 14%, carried by the First Flush email.',
      standfirst:
        'Meadow took $183,760, up $22,340 on the week before. The launch email brought in $21,380 on its own. A checkout outage on Tuesday afternoon, just as the email peaked, cost about $6,190. Without it, this would have been the best week of the year.',
      chartTitle: 'The email lifted Tuesday; the outage flattened its best hours.',
      revenue: f(183_760, 161_420),
      orders: f(9_412, 8_466),
      newCustomers: f(1_840, 1_331),
      refunds: f(5_120, 810),
      ...w1,
      hoursIn: HOURS,
      events: [
        { at: at(1, 9), label: 'Launch email to 48,200', driver: 'email' },
        { at: at(1, 14, 10), to: at(1, 16, 40), label: 'Checkout down', driver: 'outage' },
        { at: at(3, 10), label: 'Three cafés reorder', driver: 'wholesale' },
        { at: at(4, 18), label: 'Kettle feature', driver: 'press' },
        { at: at(5, 11), label: 'Pallet refunds', driver: 'refunds' },
      ],
      products: products([
        ['first-flush', 'First Flush Darjeeling', 0, 24_860],
        ['breakfast', 'Breakfast Blend', 38_210, 41_930],
        ['matcha', 'Ceremonial Matcha', 26_300, 27_540],
        ['oolong', 'Smoked Oolong', 21_480, 20_110],
        ['chamomile', 'Chamomile & Honeybush', 17_920, 18_640],
        ['gifts', 'Gift tins', 19_860, 17_020],
      ]),
      watch: [
        { title: 'The First Flush sells out by Saturday.', body: '412 tins left, selling about 70 a day. The next shipment from the estate is two weeks out.' },
        { title: 'Refunds should fall back.', body: 'Every refund over the usual was the crushed pallet, and Parcelwise has accepted the claim.' },
        { title: 'Two more cafés asked for prices.', body: 'Northcote’s sister café and the Old Mill. At this week’s order size that is about $6,000 a month.' },
      ],
    },
    {
      offset: 2,
      number: isoWeek(weekStart(now, 2)),
      start: weekStart(now, 2),
      headline: 'A flat week. Wholesale made up for a quiet shop.',
      standfirst:
        'Revenue was $161,420, up $1,920 on the week before. With no email out, the shop was quieter than usual, and Harbour Hotels’ first order filled the gap almost to the dollar.',
      chartTitle: 'A quiet shop, until Wednesday’s hotel order.',
      revenue: f(161_420, 159_500),
      orders: f(8_466, 8_390),
      newCustomers: f(1_331, 1_402),
      refunds: f(810, 2_310),
      ...w2,
      hoursIn: HOURS,
      events: [
        { at: at(2, 11), label: 'Harbour Hotels order', driver: 'hotels' },
        { at: at(6, 19), label: 'Recipe post', driver: 'subscriptions' },
      ],
      products: products([
        ['breakfast', 'Breakfast Blend', 37_900, 38_210],
        ['matcha', 'Ceremonial Matcha', 25_880, 26_300],
        ['oolong', 'Smoked Oolong', 21_020, 21_480],
        ['chamomile', 'Chamomile & Honeybush', 18_260, 17_920],
        ['gifts', 'Gift tins', 19_440, 19_860],
      ]),
      watch: [
        { title: 'Send the launch email on Tuesday.', body: 'The last time we emailed, the week grew by nine per cent.' },
        { title: 'Harbour Hotels may order monthly.', body: 'Their buyer asked about a standing order for all six hotels.' },
      ],
    },
    {
      offset: 3,
      number: isoWeek(weekStart(now, 3)),
      start: weekStart(now, 3),
      headline: 'Revenue fell 6% as the summer sale ended.',
      standfirst:
        'Revenue was $159,500, down $10,390. The sale’s last week had pulled orders forward, and the drop is mostly iced blends that people had already stocked up on. Renewals and one new café softened it.',
      chartTitle: 'Below last week from the first hour, and never caught up.',
      revenue: f(159_500, 169_890),
      orders: f(8_390, 9_120),
      newCustomers: f(1_402, 1_760),
      refunds: f(2_310, 2_980),
      ...w3,
      hoursIn: HOURS,
      events: [
        { at: at(0, 6), label: 'Renewals run', driver: 'renewals' },
        { at: at(2, 15), label: 'Salt Bakery’s first order', driver: 'wholesale-3' },
      ],
      products: products([
        ['breakfast', 'Breakfast Blend', 41_300, 37_900],
        ['matcha', 'Ceremonial Matcha', 27_410, 25_880],
        ['oolong', 'Smoked Oolong', 22_950, 21_020],
        ['chamomile', 'Chamomile & Honeybush', 19_120, 18_260],
        ['gifts', 'Gift tins', 21_610, 19_440],
      ]),
      watch: [
        { title: 'The sale pulled demand forward.', body: 'Expect two quieter weeks before it evens out, and don’t chase it with another offer.' },
        { title: 'Thirty-one renewals failed.', body: 'Most are expired cards. The reminder goes out on Thursday.' },
      ],
    },
  ]
}
