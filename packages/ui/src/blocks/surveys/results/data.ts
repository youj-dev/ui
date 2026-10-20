import { answered, asked, ordered, SURVEY, type SurveyAnswer, type SurveyAnswers, type SurveyQuestion } from '../question/data'

/* The results' data: a response as it's stored (the answers, whether it was
 * sent, how long it took), the summaries the card draws from many of them,
 * and the demo's responses, drawn from a seeded random so every render and
 * every capture show the same ones. */

/** One person's answers. */
export interface SurveyResponse {
  id: string
  answers: SurveyAnswers
  /** Sent, rather than left partway. */
  completed: boolean
  /** How long it took, in seconds. */
  seconds?: number
}

/** How a question was answered across responses: a count per answer (an option, a point, yes or no), in display order. */
export interface Tally {
  key: string
  label: string
  count: number
}

/** The share of `part` in `whole`, 0–1. */
export const share = (part: number, whole: number) => (whole ? part / whole : 0)

/** The responses that answered a question. */
export const answering = (question: SurveyQuestion, responses: SurveyResponse[]) => responses.filter((r) => answered(r.answers[question.id]))

/** Net Promoter Score: promoters (9–10) minus detractors (0–6), as shares of everyone who answered. */
export function nps(scores: number[]) {
  const promoters = scores.filter((s) => s >= 9).length
  const detractors = scores.filter((s) => s <= 6).length
  const passives = scores.length - promoters - detractors
  const counts = Array.from({ length: 11 }, (_, score) => scores.filter((s) => s === score).length)
  return {
    score: Math.round((share(promoters, scores.length) - share(detractors, scores.length)) * 100),
    promoters,
    passives,
    detractors,
    total: scores.length,
    counts,
  }
}

/** Counts per answer for the questions answered by picking. */
export function tally(question: SurveyQuestion, responses: SurveyResponse[], faces: string[], yesNo: [string, string]): Tally[] {
  const answers = answering(question, responses).map((r) => r.answers[question.id]!)
  const count = (match: (a: SurveyAnswer) => boolean) => answers.filter(match).length
  switch (question.type) {
    case 'choice':
      return question.options.map((o) => ({
        key: o.value,
        label: o.label,
        count: count((a) => (Array.isArray(a) ? a.includes(o.value) : a === o.value)),
      }))
    case 'yesno':
      return [
        { key: 'yes', label: question.labels?.[0] ?? yesNo[0], count: count((a) => a === true) },
        { key: 'no', label: question.labels?.[1] ?? yesNo[1], count: count((a) => a === false) },
      ]
    case 'emoji':
      return faces.map((label, i) => ({ key: String(i + 1), label, count: count((a) => a === i + 1) }))
    case 'nps':
    case 'scale':
    case 'rating': {
      const min = question.type === 'nps' ? 0 : question.type === 'rating' ? 1 : (question.min ?? 1)
      const max = question.type === 'nps' ? 10 : question.type === 'rating' ? (question.max ?? 5) : (question.max ?? 5)
      return Array.from({ length: max - min + 1 }, (_, i) => ({ key: String(min + i), label: String(min + i), count: count((a) => a === min + i) }))
    }
    case 'ranking': {
      // The average place each option took, as points: first place scores highest.
      const n = question.options.length
      return question.options
        .map((o) => ({
          key: o.value,
          label: o.label,
          count: answers.reduce<number>((sum, a) => sum + (Array.isArray(a) && a.includes(o.value) ? n - a.indexOf(o.value) : 0), 0),
        }))
        .sort((a, b) => b.count - a.count)
    }
    default:
      return []
  }
}

/** The middle of a list of numbers. */
export function median(values: number[]) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

/* ── The demo's responses ─────────────────────────────────────────────── */

function generator(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const QUOTES = {
  fix: [
    'Search across workspaces is slow once you pass a few thousand issues.',
    'Notifications. I get too many and miss the ones that matter.',
    'The mobile app needs offline mode for flights.',
  ],
  love: [
    'The keyboard shortcuts. I never touch the mouse.',
    'Cycles finally made our planning honest.',
    'It’s fast. Everything opens instantly.',
    'Roadmaps my execs actually read.',
  ],
}

/** Tern's survey answered by `count` people, the same every time. */
export function demoResponses(count = 312): SurveyResponse[] {
  const random = generator(20261010)
  const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)]!
  const weighted = (weights: number[]) => {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = random() * total
    return weights.findIndex((w) => (r -= w) < 0)
  }
  return Array.from({ length: count }, (_, i) => {
    const answers: SurveyAnswers = {}
    const completed = random() > 0.13
    for (const question of SURVEY.questions) {
      if (!asked(SURVEY.questions, answers).includes(question)) continue
      if (!completed && random() < 0.2) break
      switch (question.id) {
        case 'role':
          answers.role = pick(['engineering', 'engineering', 'design', 'product', 'product', 'leadership'])
          break
        case 'use':
          answers.use = ['sprints', 'bugs', 'roadmaps', 'docs'].filter((_, k) => random() < [0.64, 0.41, 0.33, 0.22][k]!)
          if (!(answers.use as string[]).length) answers.use = ['sprints']
          break
        case 'score':
          answers.score = weighted([2, 1, 2, 3, 4, 6, 9, 22, 30, 42, 37])
          break
        case 'fix':
          answers.fix = pick(QUOTES.fix)
          break
        case 'love':
          if (random() < 0.7) answers.love = pick(QUOTES.love)
          break
        case 'setup':
          answers.setup = weighted([1, 2, 4, 8, 18, 31, 24]) + 1
          break
        case 'speed':
          answers.speed = weighted([3, 6, 16, 44, 51]) + 1
          break
        case 'planner':
          answers.planner = weighted([4, 9, 21, 46, 38]) + 1
          break
        case 'value':
          answers.value = {
            cycles: pick(['very', 'very', 'some']),
            roadmaps: pick(['very', 'some', 'some', 'not']),
            insights: pick(['some', 'not', 'very']),
          }
          break
        case 'next':
          answers.next = ordered(['offline', 'calendar', 'triage', 'api'], true, `demo-${i}`)
          break
        case 'hours':
          answers.hours = Math.round(4 + random() * random() * 30)
          break
        case 'follow':
          answers.follow = random() < 0.38
          break
        case 'email':
          answers.email = `person${i}@example.com`
          break
      }
    }
    return { id: `r${i + 1}`, answers, completed, seconds: Math.round(70 + random() * 200) }
  })
}
