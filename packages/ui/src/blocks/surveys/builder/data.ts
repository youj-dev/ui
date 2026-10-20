import type { ComponentType } from 'react'
import {
  AlignLeftIcon,
  AtSignIcon,
  CalendarIcon,
  CircleDotIcon,
  GaugeIcon,
  HashIcon,
  LayoutGridIcon,
  ListOrderedIcon,
  SlidersIcon,
  SmileIcon,
  SquareCheckIcon,
  StarIcon,
  ThumbsUpIcon,
  TypeIcon,
} from '@youj/icons'
import { QUESTION_COPY, type Survey, type SurveyOption, type SurveyQuestion, type SurveyQuestionType } from '../question/data'

/* The builder's own data: the kinds of question its palette offers (each a
 * type of the definition with a starting shape), the deployment it hands
 * to `onPublish`, the audience segments, the accents a survey can wear, and
 * every string. */

/** Where a survey is answered: a page of its own, inside your site, or in a corner of your product. */
export type SurveyChannel = 'link' | 'embed' | 'in-app'

/** A group of your users an in-app survey can be shown to. */
export interface SurveySegment {
  id: string
  label: string
  /** How many people it holds, for the reach estimate. */
  people: number
}

/** What Publish hands to `onPublish`: the survey, and where, to whom and when it's answered. */
export interface SurveyDeployment {
  survey: Survey
  channel: SurveyChannel
  /** The link's last part: forms.tern.so/<slug>. */
  slug: string
  /** Link and embed: anyone with it, or signed-in members only. */
  audience: 'anyone' | 'members'
  /** In-app: the segment it's shown to, the share of it (1–100), when, and whether a person sees it once. */
  segment: string
  sample: number
  trigger: 'load' | 'idle' | 'exit'
  once: boolean
  /** When it opens: now (null), or a local date and time (`2026-10-12T09:00`). */
  start: string | null
  /** When it closes. */
  close: { kind: 'never' } | { kind: 'date'; date: string } | { kind: 'responses'; responses: number }
}

/** What `onPublish` may resolve with: the live link. */
export interface SurveyPublished {
  url?: string
}

export type QuestionKindKey =
  | 'single'
  | 'multiple'
  | 'ranking'
  | 'yesno'
  | 'short'
  | 'long'
  | 'email'
  | 'date'
  | 'nps'
  | 'scale'
  | 'rating'
  | 'emoji'
  | 'slider'
  | 'matrix'

/** A kind of question as the palette offers it. */
export interface QuestionKind {
  key: QuestionKindKey
  type: SurveyQuestionType
  icon: ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
  group: 'choice' | 'text' | 'scale'
}

export const KINDS: QuestionKind[] = [
  { key: 'single', type: 'choice', icon: CircleDotIcon, group: 'choice' },
  { key: 'multiple', type: 'choice', icon: SquareCheckIcon, group: 'choice' },
  { key: 'ranking', type: 'ranking', icon: ListOrderedIcon, group: 'choice' },
  { key: 'yesno', type: 'yesno', icon: ThumbsUpIcon, group: 'choice' },
  { key: 'short', type: 'text', icon: TypeIcon, group: 'text' },
  { key: 'long', type: 'text', icon: AlignLeftIcon, group: 'text' },
  { key: 'email', type: 'email', icon: AtSignIcon, group: 'text' },
  { key: 'date', type: 'date', icon: CalendarIcon, group: 'text' },
  { key: 'nps', type: 'nps', icon: GaugeIcon, group: 'scale' },
  { key: 'scale', type: 'scale', icon: HashIcon, group: 'scale' },
  { key: 'rating', type: 'rating', icon: StarIcon, group: 'scale' },
  { key: 'emoji', type: 'emoji', icon: SmileIcon, group: 'scale' },
  { key: 'slider', type: 'slider', icon: SlidersIcon, group: 'scale' },
  { key: 'matrix', type: 'matrix', icon: LayoutGridIcon, group: 'scale' },
]

/** The palette's name for a question: a choice is single or multiple, text short or long. */
export function kindOf(question: SurveyQuestion): QuestionKind {
  const key: QuestionKindKey =
    question.type === 'choice'
      ? question.multiple
        ? 'multiple'
        : 'single'
      : question.type === 'text'
        ? question.long
          ? 'long'
          : 'short'
        : question.type
  return KINDS.find((k) => k.key === key)!
}

/** An id not yet taken: `base`, `base-2`, `base-3`… */
export function freshId(taken: string[], base: string) {
  if (!taken.includes(base)) return base
  let n = 2
  while (taken.includes(`${base}-${n}`)) n++
  return `${base}-${n}`
}

const options = (labels: string[], prefix = 'option'): SurveyOption[] => labels.map((label, i) => ({ value: `${prefix}-${i + 1}`, label }))

/** A new question of a kind, with a starting title and answers to edit. */
export function createQuestion(kind: QuestionKindKey, id: string, copy: SurveyBuilderCopy): SurveyQuestion {
  const title = copy.starters[kind]
  switch (kind) {
    case 'single':
    case 'multiple':
      return {
        id,
        type: 'choice',
        title,
        multiple: kind === 'multiple' || undefined,
        options: options([copy.option(1), copy.option(2), copy.option(3)]),
      }
    case 'ranking':
      return { id, type: 'ranking', title, options: options([copy.option(1), copy.option(2), copy.option(3)]) }
    case 'short':
    case 'long':
      return { id, type: 'text', title, long: kind === 'long' || undefined }
    case 'scale':
      return { id, type: 'scale', title, min: 1, max: 5, labels: [copy.scaleLow, copy.scaleHigh] }
    case 'slider':
      return { id, type: 'slider', title, min: 0, max: 100, step: 1 }
    case 'matrix':
      return { id, type: 'matrix', title, rows: options([copy.row(1), copy.row(2)], 'row'), columns: options(copy.matrixColumns, 'column') }
    default:
      return { id, type: kind, title } as SurveyQuestion
  }
}

/** The audiences of the demo product. */
export const SEGMENTS: SurveySegment[] = [
  { id: 'all', label: 'Everyone', people: 12480 },
  { id: 'new', label: 'Joined this month', people: 1204 },
  { id: 'pro', label: 'On the Pro plan', people: 3312 },
  { id: 'admins', label: 'Workspace admins', people: 410 },
]

/** The accents a survey can wear (empty: the app's own). Theme inputs an admin picks, derived per mode to stay readable. */
export const ACCENTS = [
  '',
  'oklch(0.55 0.2 264)', // youj-allow: a brand accent the admin picks, a theme input, not paint
  'oklch(0.56 0.19 300)', // youj-allow: a brand accent the admin picks, a theme input, not paint
  'oklch(0.6 0.2 15)', // youj-allow: a brand accent the admin picks, a theme input, not paint
  'oklch(0.68 0.17 55)', // youj-allow: a brand accent the admin picks, a theme input, not paint
  'oklch(0.6 0.13 160)', // youj-allow: a brand accent the admin picks, a theme input, not paint
  'oklch(0.58 0.11 220)', // youj-allow: a brand accent the admin picks, a theme input, not paint
]

export const DEFAULT_COPY = {
  surveys: 'Surveys',
  titleLabel: 'Survey title',
  draft: 'Draft',
  live: 'Live',
  scheduled: 'Scheduled',
  changes: 'Unpublished changes',
  saving: 'Saving…',
  saved: 'Saved',
  saveFailed: 'Couldn’t save',
  retry: 'Retry',
  undo: 'Undo',
  redo: 'Redo',
  /** Read out after an undo or a redo. */
  undone: 'Undone',
  redone: 'Redone',
  design: 'Design',
  preview: 'Preview',
  test: 'Test the survey',
  publish: 'Publish',
  publishChanges: 'Publish changes',
  share: 'Share',
  more: 'More actions',
  questions: 'Questions',
  /** The outline's count: "11 questions". */
  questionCount: (count: number) => `${count} in total`,
  addQuestion: 'Add question',
  ending: 'Ending',
  endingHint: 'What people see after they send',
  untitled: 'Untitled question',
  /** An outline row, read out: "3. How likely… NPS, has logic". */
  rowLabel: (number: number, title: string, kind: string, logic: boolean) => `${number}. ${title}, ${kind}${logic ? ', has logic' : ''}`,
  hasLogic: 'Shown only if…',
  backToQuestions: 'Questions',
  /** The palette's groups and kinds. */
  groups: { choice: 'Choices', text: 'Text and dates', scale: 'Scales and ratings' } as Record<'choice' | 'text' | 'scale', string>,
  kinds: {
    single: 'Single choice',
    multiple: 'Multiple choice',
    ranking: 'Ranking',
    yesno: 'Yes or no',
    short: 'Short text',
    long: 'Long text',
    email: 'Email',
    date: 'Date',
    nps: 'Net Promoter Score',
    scale: 'Opinion scale',
    rating: 'Star rating',
    emoji: 'Emoji scale',
    slider: 'Slider',
    matrix: 'Matrix',
  } as Record<QuestionKindKey, string>,
  hints: {
    single: 'Pick one',
    multiple: 'Pick several',
    ranking: 'Put in order',
    yesno: 'Two answers',
    short: 'A line of text',
    long: 'A few lines',
    email: 'An address',
    date: 'A day',
    nps: '0 to 10',
    scale: '1 to 5, or 1 to 7',
    rating: 'Stars',
    emoji: 'Faces',
    slider: 'Any number in a range',
    matrix: 'Rows on one scale',
  } as Record<QuestionKindKey, string>,
  starters: {
    single: 'Which of these fits best?',
    multiple: 'Which of these apply?',
    ranking: 'Put these in order of importance',
    yesno: 'Would you use this again?',
    short: 'What should we call it?',
    long: 'Tell us more',
    email: 'Where can we reach you?',
    date: 'When would suit you?',
    nps: 'How likely are you to recommend us to a friend or colleague?',
    scale: 'How easy was that?',
    rating: 'How would you rate it?',
    emoji: 'How does it feel?',
    slider: 'How much of your week does it take?',
    matrix: 'How useful is each of these?',
  } as Record<QuestionKindKey, string>,
  option: (n: number) => `Option ${n}`,
  row: (n: number) => `Statement ${n}`,
  matrixColumns: ['Not useful', 'Somewhat', 'Very useful'],
  scaleLow: 'Not at all',
  scaleHigh: 'Completely',
  // The editor
  questionOf: (index: number, total: number) => `Question ${index} of ${total}`,
  type: 'Type',
  title: 'Question',
  titlePlaceholder: 'Ask something',
  description: 'Description',
  descriptionPlaceholder: 'Add a line of context (optional)',
  answers: 'Answers',
  options: 'Options',
  rows: 'Statements',
  columns: 'Columns',
  addOption: 'Add option',
  addRow: 'Add statement',
  addColumn: 'Add column',
  /** A pasted list becomes options, one per line. */
  pasteHint: 'Paste a list to add one option per line.',
  optionLabel: (n: number) => `Option ${n}`,
  removeOption: (label: string) => `Remove “${label}”`,
  reorderOption: (label: string) => `Reorder “${label}”`,
  settings: 'Settings',
  required: 'Required',
  requiredHint: 'People can’t go on without an answer.',
  multipleAnswers: 'Several answers',
  maxAnswers: 'At most',
  noLimit: 'No limit',
  otherOption: 'An “Other” option',
  otherHint: 'With a field for their own answer.',
  randomize: 'Shuffle the order',
  randomizeHint: 'Each person sees an order of their own.',
  longAnswer: 'A few lines',
  maxLength: 'Character limit',
  placeholder: 'Placeholder',
  from: 'From',
  to: 'To',
  step: 'Step',
  unit: 'Unit',
  unitPlaceholder: 'h a week',
  stars: 'Stars',
  faces: 'Faces',
  lowLabel: 'Low end',
  highLabel: 'High end',
  yesLabel: 'Yes',
  noLabel: 'No',
  // Logic
  logic: 'Logic',
  show: 'Show this question',
  always: 'Always',
  when: 'Only if…',
  matchAll: 'All of these',
  matchAny: 'Any of these',
  addCondition: 'Add condition',
  removeCondition: 'Remove condition',
  conditionQuestion: 'Question',
  conditionOp: 'Comparison',
  conditionValue: 'Answer',
  /** No earlier question to read: logic needs one. */
  noEarlier: 'Logic reads earlier answers; this is the first question.',
  /** A condition on a question that now comes later. */
  later: 'Reads a question that now comes later, so it never holds.',
  ops: {
    is: 'is',
    isNot: 'is not',
    includes: 'includes',
    excludes: 'doesn’t include',
    lte: 'is at most',
    gte: 'is at least',
    answered: 'is answered',
    skipped: 'is skipped',
  },
  // The question's menu
  duplicate: 'Duplicate',
  moveUp: 'Move up',
  moveDown: 'Move down',
  delete: 'Delete',
  /** The toast after a delete. */
  deleted: (title: string) => `Deleted “${title}”`,
  // The ending
  endingTitle: 'Title',
  endingDescription: 'Message',
  // Empty
  emptyTitle: 'Start with a question',
  emptyDescription: 'Pick a kind to begin. You can change it, reorder it and add logic later.',
  // Preview
  previewLabel: 'How it looks',
  ok: 'OK',
  /** What respondents read in the preview: the questions' own strings (Other, placeholders, the faces). */
  respondent: QUESTION_COPY,
  desktop: 'Desktop',
  phone: 'Phone',
  device: 'Device',
  testTitle: 'Test run',
  testDescription: 'Answer it as people will. Nothing you send here is saved.',
  layout: 'Layout',
  layouts: { conversational: 'One at a time', form: 'Single page', deck: 'Card deck' },
  // Design
  designTitle: 'Design',
  accent: 'Accent',
  accentInherit: 'Your app’s',
  accentLabel: (n: number) => `Accent ${n}`,
  corners: 'Corners',
  cornerNames: { sharp: 'Sharp', soft: 'Soft', round: 'Round' },
  font: 'Titles',
  fontNames: { sans: 'Sans', serif: 'Serif', mono: 'Mono' },
  // Publish
  publishTitle: 'Publish survey',
  publishDescription: 'Choose where people answer it, then when it opens and closes.',
  stepWhere: 'Where',
  stepWhen: 'When',
  channel: 'Channel',
  channels: { link: 'Link', embed: 'Embed', 'in-app': 'In-app' } as Record<SurveyChannel, string>,
  channelHints: {
    link: 'A page of its own, for anyone you send it to.',
    embed: 'Inside a page of your site.',
    'in-app': 'In a corner of your product.',
  } as Record<SurveyChannel, string>,
  address: 'Address',
  /** Shown before the link's last part. */
  linkBase: 'forms.tern.so/',
  audience: 'Who can answer',
  audiences: { anyone: 'Anyone with the link', members: 'Signed-in members' },
  segment: 'Show it to',
  sample: 'Share of them',
  /** Under the share: "About 2,496 people". */
  reach: (people: string) => `About ${people} people`,
  trigger: 'When it appears',
  triggers: { load: 'As a page loads', idle: 'After 30 seconds on a page', exit: 'When they’re about to leave' },
  once: 'Ask each person once',
  start: 'Opens',
  startNow: 'Now',
  startLater: 'Later',
  startAt: 'Opening date and time',
  close: 'Closes',
  closeNever: 'Never',
  closeDate: 'On a date',
  closeResponses: 'After responses',
  closeDateLabel: 'Closing date',
  responsesLabel: 'Responses',
  back: 'Back',
  continue: 'Continue',
  publishing: 'Publishing…',
  published: 'Published',
  publishFailed: 'Couldn’t publish',
  liveTitle: 'Your survey is live',
  /** The title when it opens later: "Opens Mon, Oct 12, 9:00". */
  scheduledTitle: (when: string) => `Opens ${when}`,
  liveDescriptions: {
    link: 'Anyone with the link can answer it now.',
    embed: 'Paste the snippet where it should appear.',
    'in-app': 'It starts appearing in your product now.',
  } as Record<SurveyChannel, string>,
  link: 'Link',
  copyLink: 'Copy link',
  copied: 'Copied',
  openLink: 'Open',
  shareCard: 'Share card',
  shareCardHint: 'Print it, or drop it on a slide.',
  embedCode: 'Embed code',
  copyCode: 'Copy code',
  done: 'Done',
}

export type SurveyBuilderCopy = typeof DEFAULT_COPY
