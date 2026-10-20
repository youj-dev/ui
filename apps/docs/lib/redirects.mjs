/** Each retired Cards page to the pattern page most of its cards moved to. */
const CARD_PAGES = {
  'activity-and-comments': 'activity-and-conversations',
  'ai-and-cost': 'rankings-and-breakdowns',
  audio: 'media',
  bookings: 'calendars-and-schedules',
  capacity: 'meters-and-limits',
  courses: 'timelines-and-steps',
  'data-tables': 'tables-and-lists',
  'empty-states': 'onboarding-and-states',
  fitness: 'calendars-and-schedules',
  forms: 'forms-and-inputs',
  home: 'flows',
  incidents: 'status-and-health',
  logistics: 'networks-and-maps',
  operations: 'rankings-and-breakdowns',
  performance: 'trends-and-comparisons',
  'product-cards': 'media',
  queues: 'flows',
  recipes: 'forms-and-inputs',
  'release-delivery': 'timelines-and-steps',
  security: 'trends-and-comparisons',
  'settings-controls': 'forms-and-inputs',
  setup: 'onboarding-and-states',
  'spend-and-budget': 'rankings-and-breakdowns',
  'stats-and-charts': 'trends-and-comparisons',
  'traffic-maps': 'networks-and-maps',
  uploads: 'media',
  widgets: 'activity-and-conversations',
}

/**
 * Every redirect the site serves (next.config.mjs, and _redirects on Cloudflare):
 * /graphics, the kit's name and its package entry, which opens the illustrations
 * explorer (with its query), and the retired Frames pages, whose parts are
 * chosen in Create now, and the Cards pages that were grouped by domain and are
 * grouped by pattern now. Plain JS, so next.config.mjs can import it.
 *
 * @returns {{ source: string, destination: string, permanent: boolean }[]}
 */
export function siteRedirects() {
  return [
    { source: '/graphics', destination: '/illustrations', permanent: false },
    { source: '/docs/blocks', destination: '/docs/blocks/activity-and-conversations', permanent: false },
    ...['app-frame', 'sidebars', 'top-bars', 'account-and-workspace', 'search-and-notifications', 'pages'].map((page) => ({ source: `/docs/blocks/${page}`, destination: '/create', permanent: false })),
    ...Object.entries(CARD_PAGES).map(([page, family]) => ({ source: `/docs/blocks/${page}`, destination: `/docs/blocks/${family}`, permanent: false })),
  ]
}
