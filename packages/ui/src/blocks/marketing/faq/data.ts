import type { MouseEventHandler, ReactNode } from 'react'

/** A question and its answer. */
export interface FaqQuestion {
  /** A stable id: the answer's deep link (`#id`) and its value when open. Default: made from the question. */
  id?: string
  question: string
  /** Plain text is searched and its matches marked; anything else is searched through `keywords`. */
  answer: ReactNode
  /** The topic it's filed under: the topics come from these, in order. Default: the copy's `general`. */
  topic?: string
  /** More words the search matches, for an answer that isn't plain text or a word people use for it. */
  keywords?: string[]
}

/** A call to action link. */
export interface FaqCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export const QUESTIONS: FaqQuestion[] = [
  {
    topic: 'Plans & billing',
    question: 'Is there really a free plan?',
    answer: 'Yes. Hobby is free forever for personal, non-commercial projects, with unlimited previews and 100 GB of bandwidth a month.',
    keywords: ['hobby', 'price', 'cost'],
  },
  {
    topic: 'Plans & billing',
    question: 'What happens if I go over my bandwidth?',
    answer:
      'Nothing breaks. We email you at 80% and 100%, and usage over the limit is billed at the published rate on your next invoice. You can set a hard cap in Billing.',
    keywords: ['overage', 'limit', 'cap'],
  },
  {
    topic: 'Plans & billing',
    question: 'Can I change plans at any time?',
    answer: 'Upgrades take effect at once and are prorated to the day. A downgrade starts at your next billing date, so you keep what you paid for.',
    keywords: ['upgrade', 'downgrade', 'refund'],
  },
  {
    topic: 'Plans & billing',
    question: 'Do you offer discounts for nonprofits?',
    answer: 'Registered nonprofits and open-source maintainers get Pro free for their first year. Write to us from your organization’s address.',
    keywords: ['open source', 'education', 'charity'],
  },
  {
    topic: 'Deploys',
    question: 'How does rollback work?',
    answer:
      'Every deploy is immutable and stays warm. Rolling back points production at an earlier deploy, which takes effect worldwide in under a second, with no rebuild.',
    keywords: ['revert', 'undo'],
  },
  {
    topic: 'Deploys',
    question: 'Do you support monorepos?',
    answer: 'Yes. Each app in a repository can be its own project with its own root directory, and only the projects a commit touches are rebuilt.',
    keywords: ['workspace', 'turborepo', 'nx'],
  },
  {
    topic: 'Deploys',
    question: 'How long are build logs kept?',
    answer: 'Thirty days on Hobby and a year on Pro and above. You can stream them to your own log drain at any time.',
    keywords: ['retention', 'history'],
  },
  {
    topic: 'Domains',
    question: 'Can I bring my own domain?',
    answer: 'On every plan. Point a CNAME at us and certificates are issued and renewed automatically, including wildcards on Pro and above.',
    keywords: ['dns', 'cname', 'certificate', 'ssl', 'https'],
  },
  {
    topic: 'Domains',
    question: 'Can I redirect an old domain?',
    answer: 'Add it to the project and choose Redirect: requests keep their path and query and land on your main domain with a permanent redirect.',
    keywords: ['301', 'forward'],
  },
  {
    topic: 'Data & security',
    question: 'Where is my data stored?',
    answer:
      'Build artifacts and logs stay in the region you choose when you create a team: the EU, the US or Asia-Pacific. Scale plans can pin functions to a region too.',
    keywords: ['region', 'gdpr', 'residency'],
  },
  {
    topic: 'Data & security',
    question: 'Do you sign a DPA?',
    answer: 'Yes. Our data processing agreement covers the GDPR and the UK’s rules, and you can sign it from team settings in two clicks.',
    keywords: ['gdpr', 'legal', 'privacy', 'contract'],
  },
  {
    topic: 'Data & security',
    question: 'Are you SOC 2 certified?',
    answer: 'SOC 2 Type II, renewed every year. The report is available under NDA from the security page.',
    keywords: ['compliance', 'audit', 'iso'],
  },
]

/** English's one or other: the copy picks its word with the language's plural rules. */
const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  eyebrow: 'FAQ',
  title: 'Questions, answered',
  description: 'Can’t find what you’re looking for? A real engineer answers every message, usually within the hour.',
  search: 'Search questions',
  searchPlaceholder: 'Search, e.g. refund, domain, region',
  clearSearch: 'Clear the search',
  /** The count in the search field while searching. */
  results: (count: number) => `${count} ${plural(count, 'answer', 'answers')}`,
  topics: 'Topics',
  all: 'All questions',
  /** A question with no topic. */
  general: 'General',
  noResults: (query: string) => `No answers for “${query}”`,
  noResultsHint: 'Try other words, or ask us: a person reads every message.',
  helpful: 'Was this helpful?',
  yes: 'Yes',
  no: 'No',
  thanks: 'Thanks for telling us.',
  sorry: 'Sorry it didn’t help.',
  askPerson: 'Ask a person',
  copyLink: 'Copy link',
  copied: 'Link copied',
  copyFailed: 'Couldn’t copy',
  stuckTitle: 'Still stuck?',
  stuckDescription: 'Write to us and an engineer who works on it will reply.',
}
export type FaqCopy = typeof DEFAULT_COPY

/** A question's id: its own, or one made from its words. */
export const questionId = (q: FaqQuestion) =>
  q.id ??
  q.question
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** The words a search looks for, folded so "Region" finds "region" and "café" finds "cafe". */
export const fold = (text: string) => text.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '')

export const words = (query: string) => fold(query).split(/\s+/).filter(Boolean)

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return new Promise((resolve) => setTimeout(resolve, ms))
}
