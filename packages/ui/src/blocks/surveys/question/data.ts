import type { ThemeInput } from '@youj/core'

/* The survey definition every block of the family shares: the builder writes
 * it, the respondent blocks answer it, the results read it. It's plain data
 * (no functions), so it can be stored as JSON and sent anywhere. Logic is
 * display logic: a question with `showIf` is asked only while its conditions
 * hold for the answers to earlier questions, so the path and its count follow
 * what this person said. */

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

/**
 * An answer: an option's value or the text typed for "Other" (a choice), the
 * values chosen (a multiple choice) or in order (a ranking), a number (NPS, a
 * scale, a rating, a face, a slider), yes or no, text, a date (`YYYY-MM-DD`),
 * or each matrix row's column.
 */
export type SurveyAnswer = string | string[] | number | boolean | Record<string, string>
/** Every answer by its question's `id`. */
export type SurveyAnswers = Record<string, SurveyAnswer>

export interface SurveyOption {
  value: string
  label: string
}

/** How a condition reads an earlier answer: equal (`is`, `isNot`), among a multiple choice's (`includes`, `excludes`), a number at most or at least (`lte`, `gte`), or there at all. */
export type SurveyOperator = 'is' | 'isNot' | 'includes' | 'excludes' | 'lte' | 'gte' | 'answered' | 'skipped'

export interface SurveyCondition {
  /** The earlier question whose answer decides. */
  question: string
  op: SurveyOperator
  value?: string | number | boolean
}

/** "Show this question if…": every condition (`all`, the default) or any of them. */
export interface SurveyLogic {
  match?: 'all' | 'any'
  conditions: SurveyCondition[]
}

interface QuestionBase {
  id: string
  title: string
  description?: string
  /** An optional question can be skipped. Default true. */
  required?: boolean
  /** Asked only while this holds. Default: always asked. */
  showIf?: SurveyLogic
}

/** One question. `type` picks how it's answered. */
export type SurveyQuestion =
  | (QuestionBase & {
      type: 'choice'
      options: SurveyOption[]
      /** Any number of options instead of one. */
      multiple?: boolean
      /** The most options a multiple choice takes. */
      max?: number
      /** Adds "Other" with a field of its own; what's typed there is the answer. */
      other?: boolean
      /** Shows the options in an order of each respondent's own. */
      randomize?: boolean
    })
  | (QuestionBase & {
      type: 'text'
      /** A few lines instead of one (⌘↵ or Ctrl+↵ goes on). */
      long?: boolean
      placeholder?: string
      maxLength?: number
    })
  | (QuestionBase & { type: 'email'; placeholder?: string })
  | (QuestionBase & {
      type: 'nps'
      /** What 0 and 10 mean. Default: copy.npsLabels. */
      labels?: [string, string]
    })
  | (QuestionBase & {
      type: 'scale'
      /** Default 1. */
      min?: number
      /** Default 5. */
      max?: number
      /** What the two ends mean: ["Very hard", "Very easy"]. */
      labels?: [string, string]
    })
  | (QuestionBase & {
      type: 'rating'
      /** Number of stars. Default 5. */
      max?: number
    })
  | (QuestionBase & {
      type: 'emoji'
      /** Three faces or five. Default 5. */
      points?: 3 | 5
    })
  | (QuestionBase & {
      type: 'slider'
      /** Default 0. */
      min?: number
      /** Default 100. */
      max?: number
      /** Default 1. */
      step?: number
      /** Said after the value: "h a week". */
      unit?: string
      labels?: [string, string]
    })
  | (QuestionBase & {
      type: 'matrix'
      /** The statements, each answered on the same columns. */
      rows: SurveyOption[]
      columns: SurveyOption[]
    })
  | (QuestionBase & {
      type: 'ranking'
      options: SurveyOption[]
      randomize?: boolean
    })
  | (QuestionBase & {
      type: 'yesno'
      /** Default: copy.yes and copy.no. */
      labels?: [string, string]
    })
  | (QuestionBase & { type: 'date'; min?: string; max?: string })

export type SurveyQuestionType = SurveyQuestion['type']
export type SurveyQuestionOf<T extends SurveyQuestionType> = Extract<SurveyQuestion, { type: T }>

/** The survey's own look, set in the builder's Design: an accent, corners, a typeface for its titles, and the layout its link opens in. Unset, it wears the app's. */
export interface SurveyDesign {
  /** Any CSS color. */
  accent?: string
  corners?: 'sharp' | 'soft' | 'round'
  font?: 'sans' | 'serif' | 'mono'
  layout?: 'conversational' | 'form' | 'deck'
}

export interface Survey {
  title: string
  description?: string
  questions: SurveyQuestion[]
  /** What respondents see once their answers are sent. Default: copy.doneTitle and copy.doneDescription. */
  ending?: { title: string; description?: string }
  design?: SurveyDesign
}

/* ── Reading answers ──────────────────────────────────────────────────── */

/** Whether a question has an answer (an empty list, blank text or an empty matrix doesn't count). */
export function answered(answer: SurveyAnswer | undefined) {
  if (answer === undefined) return false
  if (typeof answer === 'number' || typeof answer === 'boolean') return true
  if (Array.isArray(answer)) return answer.length > 0
  if (typeof answer === 'object') return Object.keys(answer).length > 0
  return answer.trim() !== ''
}

function holds(condition: SurveyCondition, answer: SurveyAnswer | undefined) {
  const { op, value } = condition
  if (op === 'answered') return answered(answer)
  if (op === 'skipped') return !answered(answer)
  if (!answered(answer) || value === undefined) return false
  if (op === 'lte' || op === 'gte')
    return typeof answer === 'number' && typeof value === 'number' && (op === 'lte' ? answer <= value : answer >= value)
  const has = Array.isArray(answer) ? answer.includes(String(value)) : answer === value
  return op === 'is' || op === 'includes' ? has : !has
}

/**
 * The questions the answers so far lead to, in order. A condition reads an
 * earlier question that was itself asked: one that names a later question,
 * a hidden one or none never holds, so a question can't be shown by an answer
 * this person was never asked for.
 */
export function asked(questions: SurveyQuestion[], answers: SurveyAnswers) {
  const shown = new Set<string>()
  const path: SurveyQuestion[] = []
  for (const question of questions) {
    const logic = question.showIf
    const results = (logic?.conditions ?? []).map((c) => shown.has(c.question) && holds(c, answers[c.question]))
    const visible = !logic || results.length === 0 || (logic.match === 'any' ? results.some(Boolean) : results.every(Boolean))
    if (visible) {
      shown.add(question.id)
      path.push(question)
    }
  }
  return path
}

/** For a choice: what was typed for "Other" (the answer that isn't one of the options). */
export function otherText(question: SurveyQuestionOf<'choice'>, answer: SurveyAnswer | undefined) {
  const known = new Set(question.options.map((o) => o.value))
  const values = Array.isArray(answer) ? answer : typeof answer === 'string' ? [answer] : []
  return values.find((v) => !known.has(v)) ?? ''
}

/** What stops a question's answer from going on (or being sent), if anything. */
export function problem(question: SurveyQuestion, answer: SurveyAnswer | undefined, copy: QuestionCopy, otherOpen = false) {
  if (question.type === 'choice' && otherOpen && !otherText(question, answer)) return copy.otherMissing
  if (!answered(answer)) {
    if (question.required === false) return undefined
    if (question.type === 'ranking') return copy.rankMissing
    if (question.type === 'matrix') return copy.matrixRows
    return question.type === 'text' || question.type === 'email' || question.type === 'date' ? copy.required : copy.pick
  }
  if (question.type === 'choice' && question.multiple && question.max && Array.isArray(answer) && answer.length > question.max)
    return copy.tooMany(question.max)
  if (
    question.type === 'matrix' &&
    question.required !== false &&
    typeof answer === 'object' &&
    question.rows.some((row) => !(answer as Record<string, string>)[row.value])
  )
    return copy.matrixRows
  if (question.type === 'text' && question.maxLength && typeof answer === 'string' && answer.length > question.maxLength)
    return copy.tooLong(question.maxLength)
  if (question.type === 'email' && typeof answer === 'string' && !/^\S+@\S+\.\S+$/.test(answer.trim())) return copy.emailInvalid
  return undefined
}

/** Formatters an answer is read with: lists in the locale's words, dates in its order. */
export interface AnswerFormat {
  list: Intl.ListFormat
  date: Intl.DateTimeFormat
}

/** An answer as it reads: the options' labels, a ranking in order, a face's name, a date in the locale's words, or the text. */
export function readable(question: SurveyQuestion, answer: SurveyAnswer | undefined, format: AnswerFormat, copy: QuestionCopy) {
  if (!answered(answer)) return undefined
  const label = (options: SurveyOption[], value: string) => options.find((o) => o.value === value)?.label ?? value
  switch (question.type) {
    case 'choice':
      return Array.isArray(answer) ? format.list.format(answer.map((v) => label(question.options, v))) : label(question.options, String(answer))
    case 'ranking':
      return Array.isArray(answer) ? answer.map((v, i) => copy.ranked(i + 1, label(question.options, v))).join('\n') : undefined
    case 'matrix':
      return question.rows
        .filter((row) => (answer as Record<string, string>)[row.value])
        .map((row) => copy.matrixAnswer(row.label, label(question.columns, (answer as Record<string, string>)[row.value]!)))
        .join('\n')
    case 'yesno':
      return answer ? (question.labels?.[0] ?? copy.yes) : (question.labels?.[1] ?? copy.no)
    case 'rating':
      return copy.ratingValue(Number(answer), question.max ?? 5)
    case 'emoji':
      return faceLabels(question.points ?? 5, copy)[Number(answer) - 1]
    case 'slider':
      return copy.sliderValue(Number(answer), question.unit)
    case 'date': {
      const [y, m, d] = String(answer).split('-').map(Number)
      return y && m && d ? format.date.format(new Date(y, m - 1, d)) : String(answer)
    }
    default:
      return String(answer)
  }
}

/** The faces' names for a question of `points` faces: three take the first, the middle and the last. */
export const faceLabels = (points: 3 | 5, copy: QuestionCopy) => (points === 3 ? [copy.faces[0]!, copy.faces[2]!, copy.faces[4]!] : copy.faces)

/** About how long the questions take, in whole minutes (at least one): a typed answer takes longest, a pick a few seconds. */
export function minutes(questions: SurveyQuestion[]) {
  const seconds = questions.reduce((total, q) => {
    if (q.type === 'text') return total + (q.long ? 45 : 20)
    if (q.type === 'matrix') return total + 6 * q.rows.length
    if (q.type === 'ranking') return total + 20
    return total + 10
  }, 0)
  return Math.max(1, Math.round(seconds / 60))
}

/** The letter key for the nth option: A, B, C… */
export const letter = (index: number) => String.fromCharCode(65 + index)

/* ── Order ────────────────────────────────────────────────────────────── */

function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

/** `items` in an order of `seed`'s own when `randomize` is on (a seeded shuffle, so a respondent's order holds across renders). */
export function ordered<T>(items: T[], randomize: boolean | undefined, seed: string) {
  if (!randomize || items.length < 2) return items
  let state = hash(seed)
  const random = () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

/* ── Design ───────────────────────────────────────────────────────────── */

const DISPLAY_FONTS = {
  serif: "ui-serif, 'New York', 'Iowan Old Style', Georgia, serif",
  mono: "ui-monospace, 'Geist Mono', 'SF Mono', Menlo, monospace",
}

/** The survey's design as a theme override for a ThemeScope: undefined when it changes nothing, so the app's theme shows through. */
export function designTheme(design: SurveyDesign | undefined): ThemeInput | undefined {
  if (!design) return undefined
  const theme: ThemeInput = {}
  if (design.accent) theme.accent = design.accent
  if (design.corners === 'sharp') theme.radius = 'sm'
  if (design.corners === 'round') {
    theme.radius = 'full'
    theme.controls = 'pill'
  }
  if (design.font === 'serif' || design.font === 'mono') theme.fonts = { display: DISPLAY_FONTS[design.font] }
  return Object.keys(theme).length ? theme : undefined
}

/* ── Strings ──────────────────────────────────────────────────────────── */

/** The strings every question shares; each block's copy carries them. */
export const QUESTION_COPY = {
  other: 'Other',
  otherPlaceholder: 'Type your answer',
  textPlaceholder: 'Type your answer here',
  emailPlaceholder: 'name@company.com',
  /** What a scale's ends mean, read with it: "0 is Not likely, 10 is Very likely". */
  scaleEnds: (min: number, low: string, max: number, high: string) => `${min} is ${low}, ${max} is ${high}`,
  /** What 0 and 10 mean on an NPS question without labels of its own. */
  npsLabels: ['Not likely', 'Very likely'] as [string, string],
  /** Under a multiple choice with a limit: "Choose up to 2." */
  upTo: (max: number) => `Choose up to ${max}.`,
  yes: 'Yes',
  no: 'No',
  /** The five faces, from the lowest to the highest (three faces take the first, middle and last). */
  faces: ['Awful', 'Not great', 'Okay', 'Good', 'Great'],
  /** What a rating counts, read with its value. */
  ratingUnit: 'stars',
  ratingValue: (value: number, max: number) => `${value} of ${max}`,
  /** A slider's value as it reads: "12 h a week". */
  sliderValue: (value: number, unit?: string) => (unit ? `${value} ${unit}` : String(value)),
  /** Under a slider nobody has moved yet. */
  sliderHint: 'Drag, or use the arrow keys',
  /** Under a ranking: how to move the items. */
  rankHint: 'Drag to reorder, or pick an item up with Space and move it with the arrow keys.',
  rankKeep: 'Keep this order',
  /** A ranked answer as it reads: "1. Offline mode". */
  ranked: (position: number, label: string) => `${position}. ${label}`,
  /** A matrix row's answer as it reads: "Cycles: Very useful". */
  matrixAnswer: (row: string, column: string) => `${row}: ${column}`,
  required: 'This one needs an answer.',
  pick: 'Choose an answer to go on.',
  tooMany: (max: number) => `Choose ${max} at most.`,
  otherMissing: 'Say what “Other” is, or choose another answer.',
  tooLong: (max: number) => `Keep it under ${max} characters.`,
  emailInvalid: 'Enter an email like name@company.com.',
  matrixRows: 'Answer every row.',
  rankMissing: 'Put them in your order, or keep this one.',
  /** Beside a question that can be skipped. */
  optional: 'Optional',
  skipped: 'Skipped',
  doneTitle: 'Thank you',
  doneDescription: 'Your answers are with the team. We read every one.',
}

export type QuestionCopy = typeof QUESTION_COPY

/* ── Demo data ────────────────────────────────────────────────────────── */

/** Tern's product survey: every type of question, and logic that follows the score. */
export const SURVEY: Survey = {
  title: 'Help shape Tern',
  description: 'A few quick questions about how you use Tern. Your answers go straight to the product team.',
  questions: [
    {
      id: 'role',
      type: 'choice',
      title: 'What best describes your role?',
      options: [
        { value: 'engineering', label: 'Engineering' },
        { value: 'design', label: 'Design' },
        { value: 'product', label: 'Product management' },
        { value: 'leadership', label: 'Leadership' },
      ],
      other: true,
    },
    {
      id: 'use',
      type: 'choice',
      multiple: true,
      title: 'What do you use Tern for?',
      description: 'Choose all that apply.',
      options: [
        { value: 'sprints', label: 'Planning sprints' },
        { value: 'bugs', label: 'Tracking bugs' },
        { value: 'roadmaps', label: 'Roadmaps' },
        { value: 'docs', label: 'Docs and specs' },
      ],
    },
    { id: 'score', type: 'nps', title: 'How likely are you to recommend Tern to a friend or colleague?' },
    {
      id: 'fix',
      type: 'text',
      long: true,
      maxLength: 500,
      title: 'What’s the one thing we should fix first?',
      description: 'Be blunt. It goes straight to the team.',
      showIf: { conditions: [{ question: 'score', op: 'lte', value: 6 }] },
    },
    {
      id: 'love',
      type: 'text',
      required: false,
      title: 'In a few words, what do you love about Tern?',
      showIf: { conditions: [{ question: 'score', op: 'gte', value: 9 }] },
    },
    { id: 'setup', type: 'scale', min: 1, max: 7, title: 'How easy was Tern to set up?', labels: ['Very hard', 'Very easy'] },
    { id: 'speed', type: 'rating', title: 'How would you rate Tern’s speed?' },
    { id: 'planner', type: 'emoji', title: 'How does the new planner feel?' },
    {
      id: 'value',
      type: 'matrix',
      title: 'How useful is each of these to you?',
      rows: [
        { value: 'cycles', label: 'Cycles' },
        { value: 'roadmaps', label: 'Roadmaps' },
        { value: 'insights', label: 'Insights' },
      ],
      columns: [
        { value: 'not', label: 'Not useful' },
        { value: 'some', label: 'Somewhat' },
        { value: 'very', label: 'Very useful' },
      ],
    },
    {
      id: 'next',
      type: 'ranking',
      title: 'Rank what we should build next',
      options: [
        { value: 'offline', label: 'Offline mode' },
        { value: 'calendar', label: 'Calendar sync' },
        { value: 'triage', label: 'Automatic triage' },
        { value: 'api', label: 'A public API' },
      ],
    },
    {
      id: 'hours',
      type: 'slider',
      min: 0,
      max: 40,
      step: 1,
      unit: 'h a week',
      title: 'How much time do you spend in Tern?',
      labels: ['None', '40 h'],
    },
    { id: 'follow', type: 'yesno', title: 'Can we follow up about your answers?', description: 'A short call or an email, never sales.' },
    {
      id: 'email',
      type: 'email',
      title: 'Where can we reach you?',
      showIf: { conditions: [{ question: 'follow', op: 'is', value: true }] },
    },
    {
      id: 'call',
      type: 'date',
      required: false,
      title: 'Is there a day that suits a 15-minute call?',
      showIf: { conditions: [{ question: 'follow', op: 'is', value: true }] },
    },
  ],
  ending: { title: 'Thank you', description: 'Your answers are with the team. We read every one, and we’ll be in touch if you said we could.' },
}

/** One question under a help article. */
export const HELPFUL: SurveyQuestion = { id: 'helpful', type: 'emoji', title: 'How was this article?' }

/** An in-product pulse: the score, then one follow-up that depends on it. */
export const PULSE: Survey = {
  title: 'Quick question',
  questions: [
    { id: 'score', type: 'nps', title: 'How likely are you to recommend Tern to a friend or colleague?' },
    {
      id: 'blocker',
      type: 'choice',
      title: 'What would make the biggest difference?',
      options: [
        { value: 'speed', label: 'A faster app' },
        { value: 'features', label: 'Missing features' },
        { value: 'simpler', label: 'Simpler to use' },
        { value: 'price', label: 'A lower price' },
      ],
      showIf: { conditions: [{ question: 'score', op: 'lte', value: 6 }] },
    },
    {
      id: 'why',
      type: 'text',
      long: true,
      required: false,
      title: 'What’s the main reason for your score?',
      placeholder: 'Optional',
      showIf: { conditions: [{ question: 'score', op: 'gte', value: 7 }] },
    },
  ],
  ending: { title: 'Thanks for telling us', description: 'It helps us decide what to build next.' },
}
