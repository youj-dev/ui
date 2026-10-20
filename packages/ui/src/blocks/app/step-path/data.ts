import type { ProgressPathLesson, ProgressPathSection } from '../../../components/ui/progress-path'

/** One stop on the path: a lesson, a task, a workout. */
export type StepPathStep = ProgressPathLesson
/** A run of steps with a title of its own: a unit, a week, a phase. */
export type StepPathSection = ProgressPathSection

/** Where the points stand against the next level: its number and the points at its start and end. */
export interface StepPathLevel {
  number: number
  from: number
  to: number
}

/** Points a finished step earns. */
export const STEP_POINTS = 20
export const LEVEL: StepPathLevel = { number: 7, from: 1000, to: 1500 }
/** Points a day aims for. */
export const GOAL = 50

/** The week so far, Monday first: points earned each day (null = still to come). Today is the last day with a figure: Wednesday here, with nothing done yet. */
export const WEEK: (number | null)[] = [60, 40, 0, null, null, null, null]
/** Today's place in a week of points: the last day with a figure. */
export function todayOf(week: (number | null)[]) {
  let today = 0
  week.forEach((d, i) => {
    if (d !== null) today = i
  })
  return today
}
/** Days in a row, up to yesterday. */
export const STREAK = 12
/** Points so far. */
export const POINTS = 1240
/** Monday of the demo week, local midnight. */
export const WEEK_START = new Date(2026, 8, 28).getTime()

export const SECTIONS: StepPathSection[] = [
  {
    id: 'basics',
    eyebrow: 'Section 1',
    title: 'Basics',
    lessons: [
      { id: 'greetings', title: 'Greetings', detail: '6 min', mastery: 4 },
      { id: 'introductions', title: 'Introductions', detail: '8 min', mastery: 3 },
      { id: 'numbers', title: 'Numbers', detail: '7 min', mastery: 4 },
      { id: 'family', title: 'Family', detail: '9 min', mastery: 2 },
      { id: 'basics-check', title: 'Basics checkpoint', detail: '+50 XP', milestone: true, mastery: 1 },
    ],
  },
  {
    id: 'cafe',
    eyebrow: 'Section 2',
    title: 'Café & food',
    lessons: [
      { id: 'coffee', title: 'Ordering coffee', detail: '8 min', mastery: 3 },
      { id: 'market', title: 'At the market', detail: '10 min', mastery: 1 },
      { id: 'menu', title: 'Reading a menu', detail: '9 min' },
      { id: 'bill', title: 'Paying the bill', detail: '7 min' },
      { id: 'cafe-check', title: 'Café checkpoint', detail: '+50 XP', milestone: true },
    ],
  },
  {
    id: 'travel',
    eyebrow: 'Section 3',
    title: 'Getting around',
    lessons: [
      { id: 'directions', title: 'Asking directions', detail: '9 min' },
      { id: 'tickets', title: 'Buying tickets', detail: '8 min' },
      { id: 'hotel', title: 'At the hotel', detail: '10 min' },
      { id: 'travel-check', title: 'Travel checkpoint', detail: '+50 XP', milestone: true },
    ],
  },
]

/** The step up next in the demo. */
export const CURRENT = 'market'

export const DEFAULT_COPY = {
  title: 'Spanish',
  subtitle: 'A2 · Everyday conversations',
  more: 'Course options',
  path: 'Course path',
  steps: (count: number) => `${count} ${count === 1 ? 'lesson' : 'lessons'}`,
  practice: 'Practice',
  continue: 'Continue',
  continueTo: (title: string) => `Continue: ${title}`,
  finished: 'Course complete',
  /** `gained` is the step's points with their unit: "20 XP". */
  completed: (title: string, gained: string, next?: string) => `${title} complete, +${gained}.${next ? ` Up next: ${next}.` : ''}`,
  progress: 'Progress',
  week: 'Week 40',
  level: (n: number) => `Level ${n}`,
  points: 'XP',
  total: 'Total XP',
  toLevel: (n: number) => `To level ${n}`,
  toGo: (points: string) => `${points} XP to go`,
  dailyGoal: 'Daily goal',
  goalMet: 'Goal met',
  streak: 'Streak',
  streakDays: (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`,
  streakHint: 'Finish a lesson today to keep it going.',
  streakKept: 'Streak kept for today.',
  thisWeek: 'This week',
  /** `points` is null for a day to come; `earned` is the figure with its unit. */
  dayPoints: (day: string, points: number | null, earned: string) => (points === null ? `${day}: to come` : points === 0 ? `${day}: missed` : `${day}: ${earned}`),
  loadingLabel: 'Loading the course',
  errorTitle: 'Couldn’t load the course.',
  retry: 'Retry',
  emptyTitle: 'No steps yet',
  emptyDescription: 'Add sections and steps to lay out the path.',
}

export type StepPathCopy = typeof DEFAULT_COPY & {
  /** How its dates, times and numbers read (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
