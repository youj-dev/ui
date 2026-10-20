import { QUESTION_COPY } from '../question/data'

/* Every string the widget shows or says. */

/** The product at the top of the card, until the app passes its own. */
export const DEFAULT_BRAND = { name: 'Tern' }

export const DEFAULT_COPY = {
  ...QUESTION_COPY,
  pick: 'Choose an answer.',
  /** Where the survey is: "1 of 2". */
  position: (index: number, total: number) => `${index} of ${total}`,
  questionLabel: (index: number, total: number) => `Question ${index} of ${total}`,
  progress: 'Progress',
  minimize: 'Minimize survey',
  /** The folded pill, read out: "Open survey, question 1 of 2". */
  expand: (index: number, total: number) => `Open survey, question ${index} of ${total}`,
  close: 'Close survey',
  back: 'Back',
  next: 'Next',
  skip: 'Skip',
  send: 'Send',
  sending: 'Sending…',
  sent: 'Sent',
  failed: 'Couldn’t send',
  failedTitle: 'Your answers didn’t send',
  failedDescription: 'Nothing is lost. Try again in a moment.',
  dismiss: 'Close',
  reviewTitle: 'Check your answers',
  reviewDescription: 'Change anything before you send it.',
  edit: 'Edit',
  editLabel: (question: string) => `Edit your answer to “${question}”`,
}
