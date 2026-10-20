import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { StepPath, type StepPathSection } from './step-path'

const meta: Meta<typeof StepPath> = {
  title: 'Blocks/App/Step Path',
  component: StepPath,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Guide people along a trail of steps in sections, with progress beside it: the step up next, total points toward the next level, the week’s streak and today’s goal. The demo is a language course; stories show an onboarding and a fitness program.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof StepPath>

/** A language course: units of lessons, XP toward the next level, a streak. */
export const Default: Story = { name: 'Language course' }

/** The first lesson of a fresh course: nothing walked yet. */
export const FirstLesson: Story = { name: 'First lesson', args: { current: 'greetings', points: 1000 } }

/** A coding course halfway through Functions, with today's goal already met: the streak is kept and the next level is close. */
export const CodingCourse: Story = {
  name: 'Coding course',
  args: {
    copy: { title: 'Python', subtitle: 'Beginner · Programming fundamentals', week: 'Week 41' },
    sections: [
      {
        id: 'foundations',
        eyebrow: 'Unit 1',
        title: 'Foundations',
        lessons: [
          { id: 'hello', title: 'Hello, world', detail: '5 min', mastery: 4 },
          { id: 'variables', title: 'Variables', detail: '8 min', mastery: 4 },
          { id: 'types', title: 'Numbers & strings', detail: '10 min', mastery: 3 },
          { id: 'lists', title: 'Lists', detail: '9 min', mastery: 3 },
          { id: 'loops', title: 'Loops', detail: '12 min', mastery: 2 },
          { id: 'foundations-check', title: 'Foundations project', detail: '+50 XP', milestone: true, mastery: 2 },
        ],
      },
      {
        id: 'functions',
        eyebrow: 'Unit 2',
        title: 'Functions',
        lessons: [
          { id: 'def', title: 'Defining functions', detail: '9 min', mastery: 3 },
          { id: 'arguments', title: 'Arguments', detail: '10 min', mastery: 2 },
          { id: 'return', title: 'Return values', detail: '8 min', mastery: 1 },
          { id: 'scope', title: 'Scope', detail: '11 min' },
          { id: 'functions-check', title: 'Functions project', detail: '+50 XP', milestone: true },
        ],
      },
      {
        id: 'data',
        eyebrow: 'Unit 3',
        title: 'Working with data',
        lessons: [
          { id: 'dicts', title: 'Dictionaries', detail: '10 min' },
          { id: 'files', title: 'Reading files', detail: '12 min' },
          { id: 'csv', title: 'CSV in, CSV out', detail: '14 min' },
          { id: 'data-check', title: 'Data project', detail: '+50 XP', milestone: true },
        ],
      },
    ],
    current: 'scope',
    points: 1460,
    week: [40, 80, 60, null, null, null, null],
    streak: 27,
  },
}

/* Onboarding: three weeks of tasks for a new hire. */

const ONBOARDING: StepPathSection[] = [
  {
    id: 'week-1',
    eyebrow: 'Week 1',
    title: 'Getting set up',
    lessons: [
      { id: 'laptop', title: 'Set up your laptop', detail: '20 min', mastery: 4 },
      { id: 'buddy', title: 'Meet your buddy', detail: '30 min', mastery: 4 },
      { id: 'security', title: 'Security basics', detail: '25 min', mastery: 4 },
      { id: 'tools', title: 'Tour the team tools', detail: '15 min', mastery: 3 },
      { id: 'week-1-check', title: 'Week 1 check-in', detail: '+50 pts', milestone: true, mastery: 2 },
    ],
  },
  {
    id: 'week-2',
    eyebrow: 'Week 2',
    title: 'Learning the work',
    lessons: [
      { id: 'brief', title: 'Read the product brief', detail: '20 min', mastery: 3 },
      { id: 'call', title: 'Shadow a customer call', detail: '45 min', mastery: 2 },
      { id: 'fix', title: 'Ship your first fix', detail: '60 min', mastery: 1 },
      { id: 'review', title: 'Review a teammate’s PR', detail: '30 min' },
      { id: 'week-2-check', title: 'Week 2 check-in', detail: '+50 pts', milestone: true },
    ],
  },
  {
    id: 'week-3',
    eyebrow: 'Week 3',
    title: 'Making an impact',
    lessons: [
      { id: 'project', title: 'Pick a starter project', detail: '30 min' },
      { id: 'plan', title: 'Draft your 30-60-90 plan', detail: '45 min' },
      { id: 'sync', title: 'Present at team sync', detail: '20 min' },
      { id: 'review-90', title: 'Onboarding review', detail: '+100 pts', milestone: true },
    ],
  },
]

/** Employee onboarding: weeks as sections, tasks as steps, points in place of XP and a stage in place of a level. */
export const EmployeeOnboarding: Story = {
  name: 'Employee onboarding',
  args: {
    sections: ONBOARDING,
    current: 'fix',
    points: 235,
    stepPoints: 15,
    level: { number: 2, from: 150, to: 300 },
    goal: 30,
    week: [30, 45, 0, null, null, null, null],
    streak: 2,
    copy: {
      title: 'Onboarding',
      subtitle: 'Product design · started Sep 14',
      more: 'Plan options',
      path: 'Onboarding path',
      steps: (count) => `${count} ${count === 1 ? 'task' : 'tasks'}`,
      practice: 'Ask your buddy',
      finished: 'Onboarding complete',
      progress: 'Your progress',
      week: 'Week 2',
      level: (n) => `Stage ${n}`,
      points: 'pts',
      total: 'Total points',
      toLevel: (n) => `To stage ${n}`,
      toGo: (points) => `${points} pts to go`,
      streakHint: 'Finish a task today to keep it going.',
    },
  },
}

/* Fitness: a twelve-week plan, phases of workouts, active minutes as the points. */

const PROGRAM: StepPathSection[] = [
  {
    id: 'base',
    eyebrow: 'Phase 1',
    title: 'Base',
    lessons: [
      { id: 'full-a', title: 'Full-body A', detail: '40 min', mastery: 4 },
      { id: 'easy-run', title: 'Easy run', detail: '30 min', mastery: 4 },
      { id: 'mobility', title: 'Mobility flow', detail: '20 min', mastery: 4 },
      { id: 'full-b', title: 'Full-body B', detail: '40 min', mastery: 3 },
      { id: 'base-check', title: 'Fitness check', detail: '+50 min', milestone: true, mastery: 3 },
    ],
  },
  {
    id: 'build',
    eyebrow: 'Phase 2',
    title: 'Build',
    lessons: [
      { id: 'intervals', title: 'Intervals', detail: '35 min', mastery: 3 },
      { id: 'lower', title: 'Strength: lower body', detail: '45 min', mastery: 2 },
      { id: 'tempo', title: 'Tempo run', detail: '35 min', mastery: 1 },
      { id: 'upper', title: 'Strength: upper body', detail: '45 min' },
      { id: 'build-check', title: '5 km time trial', detail: '+50 min', milestone: true },
    ],
  },
  {
    id: 'peak',
    eyebrow: 'Phase 3',
    title: 'Peak',
    lessons: [
      { id: 'hills', title: 'Hill repeats', detail: '40 min' },
      { id: 'long', title: 'Long run', detail: '60 min' },
      { id: 'circuit', title: 'Power circuit', detail: '40 min' },
      { id: 'peak-check', title: '10K test', detail: '+100 min', milestone: true },
    ],
  },
]

/** A fitness program: phases as sections, workouts as steps, active minutes as the points, today’s target already met. */
export const FitnessProgram: Story = {
  name: 'Fitness program',
  args: {
    sections: PROGRAM,
    current: 'tempo',
    points: 1860,
    stepPoints: 35,
    level: { number: 3, from: 1500, to: 2400 },
    goal: 30,
    week: [45, 35, 40, 30, null, null, null],
    streak: 3,
    copy: {
      title: '10K plan',
      subtitle: 'Week 6 of 12 · Build phase',
      more: 'Plan options',
      path: 'Training path',
      steps: (count) => `${count} ${count === 1 ? 'workout' : 'workouts'}`,
      practice: 'Warm up',
      finished: 'Plan complete',
      progress: 'Training',
      week: 'Week 6',
      points: 'min',
      total: 'Active minutes',
      toGo: (minutes) => `${minutes} min to go`,
      dailyGoal: 'Daily target',
      streakHint: 'Finish a workout today to keep it going.',
    },
  },
}

/** Skeleton trail and figures while your course loads. */
export const Loading: Story = { args: { loading: true } }

/** No steps yet: the message takes the trail’s room. */
export const Empty: Story = { args: { sections: [] } }

/** The course failed to load: the message and Retry take the trail’s room, with a dash for each figure. */
export const Error: Story = { args: { error: 'Couldn’t load the course.', onRetry: fn() } }
