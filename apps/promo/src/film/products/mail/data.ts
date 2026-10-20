/* Sample post for Folio, the Mail example: the inbox of Ada Lindgren, who
 * runs Meadow Tea Co., the week after the First Flush launch. The letters
 * are the stories behind that week's numbers: the payment outage, the
 * magazine feature, the cafés reordering, the crushed pallet, the estate's
 * harvest. Deterministic, so tests and screenshots read the same every run;
 * times and the days they name count from the load. */

export type Stack = 'inbox' | 'later' | 'done' | 'sent' | 'drafts' | 'trash'
/** What a letter needs from you, which is how the inbox is sorted. */
export type Kind = 'reply' | 'read' | 'fyi'

export interface Enclosure {
  name: string
  size: string
}

export interface Letter {
  id: string
  stack: Stack
  kind: Kind
  from: { name: string; email: string; org?: string; role?: string }
  to: string[]
  cc?: string[]
  subject: string
  /** Paragraphs. */
  body: string[]
  signoff?: string
  time: number
  read: boolean
  starred: boolean
  enclosures: Enclosure[]
  /** Days and deadlines the letter names, pulled into the margin. `match` is the phrase in the body. */
  dates: { match: string; when: string; what: string }[]
  /** Your history with the sender, for the margin. */
  history?: string
  /** A letter set aside: when it comes back. */
  until?: number
}

export const ME = { name: 'Ada Lindgren', email: 'ada@meadowtea.co' }

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export const KINDS: { id: Kind; label: string; note: string }[] = [
  { id: 'reply', label: 'Needs you', note: 'A reply or a decision' },
  { id: 'read', label: 'Reading', note: 'Worth your full attention' },
  { id: 'fyi', label: 'Paper trail', note: 'Receipts and notices' },
]

/** Folio's "now": a fixed demo morning (UTC), so the server and the browser render the same letters. */
export const DEMO_NOW = Date.UTC(2026, 9, 1, 9, 50)

export function makeLetters(now = DEMO_NOW): Letter[] {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' })
  /** The weekday `n` days from now: letters name real days. */
  const on = (n: number) => weekday.format(now + n * DAY)
  const l = (id: string, kind: Kind, from: Letter['from'], subject: string, body: string[], ago: number, extra: Partial<Letter> = {}): Letter => ({
    id,
    stack: 'inbox',
    kind,
    from,
    to: [ME.email],
    subject,
    body,
    time: now - ago,
    read: false,
    starred: false,
    enclosures: [],
    dates: [],
    ...extra,
  })

  return [
    l(
      'tillpoint',
      'reply',
      { name: 'Priya Raman', email: 'priya.raman@tillpoint.com', org: 'Tillpoint', role: 'Account manager' },
      'Incident report: card payments on Tuesday',
      [
        'I’m sorry for Tuesday. Between 2:10 and 4:40 in the afternoon, card payments through your checkout were declined after a certificate rotation at one of our upstream processors went wrong. Wallet payments were unaffected, which is why a few orders still came through.',
        'We saw 311 declined attempts from your store in that window, most of them from the launch email. The full timeline and what we have changed are in the attached report.',
        `As an apology we’d like to waive your processing fees for three months. I need you to confirm the account the credit should go to by ${on(3)}, and I’ll have it applied before your next payout.`,
      ],
      38 * MIN,
      {
        signoff: 'Priya',
        cc: ['sam@meadowtea.co'],
        enclosures: [{ name: 'tillpoint-incident-report.pdf', size: '184 KB' }],
        dates: [{ match: `by ${on(3)}`, when: on(3), what: 'Confirm the account for the fee credit' }],
        history: 'Six letters since June. You last wrote in August.',
      },
    ),
    l(
      'kettle',
      'reply',
      { name: 'Lena Marsh', email: 'lena@kettlemag.com', org: 'Kettle Magazine', role: 'Features editor' },
      'Your First Flush, in Friday’s issue',
      [
        'The piece on the First Flush is running in Friday evening’s issue, and I think it’s one of the loveliest things we’ve printed this year. The photographs of the garden came out beautifully.',
        'Two things before we close the pages. Could you check the two quotes on page 14 are how you’d like to be quoted, and confirm the price: we have $24 for a 50 g tin.',
        `We close at 3 p.m. ${on(1)}. After that I can’t change anything but the captions.`,
      ],
      1 * HOUR + 52 * MIN,
      {
        signoff: 'Lena',
        starred: true,
        enclosures: [{ name: 'kettle-page-14-proof.pdf', size: '2.1 MB' }],
        dates: [{ match: `3 p.m. ${on(1)}`, when: `${on(1)}, 3 p.m.`, what: 'Kettle closes the pages' }],
        history: 'First letter. Introduced by June Okafor.',
      },
    ),
    l(
      'birch',
      'reply',
      { name: 'Tom Birch', email: 'tom@birchandbean.cafe', org: 'Birch & Bean', role: 'Owner' },
      'Reorder, and a question about the winter',
      [
        'The First Flush samples went down so well that we’d like 120 tins of it and 80 of the Breakfast Blend, delivered as usual.',
        'And a question. We go through about the same every month now. Could we set that up as a standing order, and is there room for five per cent off if we commit to the winter?',
      ],
      26 * HOUR,
      { signoff: 'Tom', history: 'Wholesale since last March. Nine orders.' },
    ),
    l(
      'brightwater',
      'reply',
      { name: 'Mara Quinn', email: 'mara@brightwater.studio', org: 'Brightwater Studio', role: 'Producer' },
      'Launch film: the final cut',
      [
        'Here’s the final cut of the launch film: ninety seconds, three chapters, the field, the harvest and the first cup. Jun re-graded the dawn shots and the music is locked.',
        `If you can sign it off by ${on(2)}, Jun will start on the social cutdowns the same afternoon.`,
      ],
      29 * HOUR,
      {
        signoff: 'Mara',
        enclosures: [{ name: 'meadow-first-flush-final.mp4', size: '412 MB' }],
        dates: [{ match: `by ${on(2)}`, when: on(2), what: 'Sign off the launch film' }],
        history: 'Brightwater has made every launch since 2023.',
      },
    ),
    l(
      'estate',
      'read',
      { name: 'Arjun Sen', email: 'arjun@kalimpongridge.in', org: 'Kalimpong Ridge Estate', role: 'Garden manager' },
      'From the garden: the first flush is in',
      [
        'The last of the first flush was plucked on Saturday morning, a week later than last year. The rains came late and then all at once, and for ten days we could do nothing but watch the bushes and wait.',
        'It was worth it. The leaf is small and even, with more silver tip than we have had in years, and the cups we have tasted so far have that muscatel note you liked, with something like green apple underneath it. Priyanka says it is the best lot since 2019. I think she is being careful.',
        'We will send 400 kilos in two shipments, the first by air next week so you can keep the shop stocked, the rest by sea. I have kept back twenty kilos of the Moonlight lot for you, if you want it.',
        'The pickers asked me to thank you for the photographs you sent of the tins on the shelves in London. They are pinned up in the factory, by the withering troughs.',
      ],
      2 * DAY + 3 * HOUR,
      { signoff: 'Arjun', starred: true, history: 'Kalimpong Ridge has grown your Darjeeling for six years.' },
    ),
    l(
      'ledger',
      'read',
      { name: 'The Ledger', email: 'memo@ledger.meadowtea.co', org: 'Meadow Tea Co.', role: 'Weekly revenue memo' },
      'Revenue rose 14%, carried by the First Flush email',
      [
        'Meadow took $183,760 last week, up $22,340 on the week before. The launch email brought in $21,380 on its own.',
        'A checkout outage on Tuesday afternoon, just as the email peaked, cost about $6,190. Without it, this would have been the best week of the year.',
        'Three cafés reordered on Thursday morning, $9,840 between them, and Kettle’s feature sent 2,900 readers on Friday. Refunds rose to $5,120, almost all of it one crushed pallet.',
      ],
      3 * DAY + 2 * HOUR,
      { history: 'Every Monday at 7 a.m.' },
    ),
    l(
      'june',
      'read',
      { name: 'June Okafor', email: 'june@okafor.me' },
      'Tasting notes for the autumn blend',
      [
        'I brewed the three samples side by side this morning. The second is the one: the smoke from the Lapsang sits underneath instead of on top, and it holds up with milk, which the others don’t.',
        'I’d take the rose petals out of the third altogether. They make it taste like a candle shop.',
      ],
      4 * DAY,
      { signoff: 'June', history: 'Friend, and your first stockist.' },
    ),
    l(
      'parcelwise',
      'fyi',
      { name: 'Parcelwise Claims', email: 'claims@parcelwise.com', org: 'Parcelwise' },
      'Claim 88213 accepted: damaged pallet',
      [
        'We have accepted your claim for the pallet damaged in our depot on Friday. $4,310 will be credited to your account within five working days.',
        'Reference: 88213. No further action is needed.',
      ],
      3 * DAY + 5 * HOUR,
      { read: true, enclosures: [{ name: 'claim-88213.pdf', size: '96 KB' }] },
    ),
    l(
      'payout',
      'fyi',
      { name: 'Tillpoint', email: 'payouts@tillpoint.com', org: 'Tillpoint' },
      'A payout of $41,220 is on its way',
      ['Your payout of $41,220.18 has been sent to the account ending 4410 and should arrive within two working days.'],
      4 * DAY + 6 * HOUR,
      { read: true },
    ),
    l(
      'stall',
      'fyi',
      { name: 'Stall', email: 'summary@stall.shop', org: 'Stall' },
      'Your week: 9,412 orders',
      ['Your shop took 9,412 orders last week, 11% more than the week before. Your busiest hour was Tuesday at 10 a.m.'],
      3 * DAY + 9 * HOUR,
      { read: true },
    ),

    /* Set aside for later. */
    l(
      'hollis',
      'reply',
      { name: 'Hollis & Rowe', email: 'proofs@hollisrowe.co', org: 'Hollis & Rowe', role: 'Printers' },
      'Tin proofs for the Harvest box',
      ['The proofs for the Harvest tins are attached. The copper foil prints a touch warmer than on screen; we’d suggest seeing a printed proof before you approve.'],
      2 * DAY + 7 * HOUR,
      { stack: 'later', read: true, until: nextMorning(now, 1), enclosures: [{ name: 'harvest-tin-proofs.pdf', size: '18 MB' }], history: 'Your printers since the first tins.' },
    ),
    l(
      'harbour',
      'reply',
      { name: 'Camille Durand', email: 'c.durand@harbourhotels.com', org: 'Harbour Hotels', role: 'Buyer' },
      'A standing order for all six hotels',
      ['Following our first order, we would like to discuss a standing monthly order for all six hotels from November. Could we speak next week?'],
      5 * DAY,
      { stack: 'later', read: true, until: nextMonday(now) },
    ),

    /* Done, sent and drafts. */
    l(
      'samples',
      'fyi',
      { name: 'Parcelwise', email: 'tracking@parcelwise.com', org: 'Parcelwise' },
      'Delivered: First Flush samples to three cafés',
      ['All three parcels were delivered on Thursday before noon.'],
      8 * DAY,
      { stack: 'done', read: true },
    ),
    l(
      'sent-lena',
      'reply',
      { name: ME.name, email: ME.email },
      'Re: The First Flush feature',
      ['Thank you, Lena. The photographs are Arjun’s, from the garden; please credit him.'],
      6 * DAY,
      { stack: 'sent', read: true, to: ['lena@kettlemag.com'] },
    ),
    l(
      'draft-arjun',
      'reply',
      { name: ME.name, email: ME.email },
      'Re: From the garden',
      ['Dear Arjun, yes please to the Moonlight lot, all twenty kilos. And thank the pickers for us.'],
      20 * HOUR,
      { stack: 'drafts', read: true, to: ['arjun@kalimpongridge.in'] },
    ),
  ]
}

/** 8 a.m., `days` from now. */
export function nextMorning(now: number, days: number) {
  const d = new Date(now + days * DAY)
  d.setUTCHours(8, 0, 0, 0)
  return d.getTime()
}

/** 6 p.m. today, or tomorrow once that has passed. */
export function thisEvening(now: number) {
  const d = new Date(now)
  d.setUTCHours(18, 0, 0, 0)
  return d.getTime() > now ? d.getTime() : d.getTime() + DAY
}

/** 8 a.m. next Monday. */
export function nextMonday(now: number) {
  const d = new Date(now)
  d.setUTCHours(8, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + (((8 - d.getUTCDay()) % 7) || 7))
  return d.getTime()
}
