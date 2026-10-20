import type { StepTrackerCopy, StepTrackerItem, StepTrackerStage } from './data'

/* A loan from submitted to funded, for the stories: fictional applicants and departments. */

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export const LOAN_STAGES: StepTrackerStage[] = [
  { id: 'submitted', label: 'Submitted', now: 'Application received' },
  { id: 'reviewed', label: 'Reviewed', now: 'Under review' },
  { id: 'approved', label: 'Approved', now: 'Awaiting approval' },
  { id: 'signed', label: 'Signed', now: 'Out for signature' },
  { id: 'funded', label: 'Funded', now: 'Funds on the way' },
]

export const LOAN_ITEMS: StepTrackerItem[] = [
  {
    id: 'LN-20817',
    ref: '20817',
    subject: 'Priya Raman',
    handler: 'Harbor Credit Union',
    place: 'Austin, TX',
    total: 18500,
    currency: 'USD',
    outcome: 'completed',
    created: '2026-09-21T15:20:00Z',
    scans: [
      {
        id: 'submitted',
        at: 0,
        outcome: 'ok',
        place: 'Online application',
        facts: [
          ['Product', 'Personal loan'],
          ['Term', '48 months · 7.9% APR'],
          ['Income', '$92,000 / year'],
        ],
      },
      {
        id: 'reviewed',
        at: DAY + 3 * HOUR + 40 * MINUTE,
        outcome: 'ok',
        place: 'Underwriting',
        facts: [
          ['Underwriter', 'D. Whitfield'],
          ['Credit score', '742'],
          ['Debt to income', '21%'],
        ],
      },
      {
        id: 'approved',
        at: 2 * DAY + 14 * HOUR + 5 * MINUTE,
        outcome: 'ok',
        place: 'Credit committee',
        facts: [
          ['Decision', 'Approved as requested'],
          ['Approved by', 'M. Alvarez'],
          ['Offer valid', '14 days'],
        ],
      },
      {
        id: 'signed',
        at: 3 * DAY + 10 * HOUR + 30 * MINUTE,
        outcome: 'ok',
        place: 'Legal',
        facts: [
          ['Signed by', 'P. Raman'],
          ['Method', 'E-signature'],
        ],
      },
      {
        id: 'funded',
        at: 4 * DAY + 8 * HOUR,
        outcome: 'ok',
        place: 'Treasury',
        facts: [
          ['Deposited to', 'Checking ····4417'],
          ['Rail', 'ACH · next business day'],
          ['Amount', '$18,500.00'],
        ],
        attempts: [
          { ok: false, code: 'account_mismatch', reason: 'The bank returned the deposit: the account number didn’t match. The applicant confirmed it and it was sent again.', at: 3 * DAY + 17 * HOUR + 20 * MINUTE },
          { ok: true, code: 'funded', reason: 'Deposited to checking ····4417.', at: 4 * DAY + 8 * HOUR },
        ],
      },
    ],
  },
  {
    id: 'LN-20822',
    ref: '20822',
    subject: 'Tomás Herrera',
    handler: 'Harbor Credit Union',
    place: 'Denver, CO',
    total: 42000,
    currency: 'USD',
    outcome: 'stopped',
    stopReason: 'debt to income above the limit',
    created: '2026-09-22T11:05:00Z',
    scans: [
      {
        id: 'submitted',
        at: 0,
        outcome: 'ok',
        place: 'Branch, Denver',
        facts: [
          ['Product', 'Home improvement loan'],
          ['Term', '84 months · 8.4% APR'],
          ['Income', '$61,000 / year'],
        ],
      },
      {
        id: 'reviewed',
        at: DAY + 6 * HOUR + 20 * MINUTE,
        outcome: 'ok',
        place: 'Underwriting',
        facts: [
          ['Underwriter', 'D. Whitfield'],
          ['Credit score', '688'],
          ['Debt to income', '47%'],
        ],
      },
      {
        id: 'approved',
        at: 2 * DAY + 2 * HOUR + 45 * MINUTE,
        outcome: 'failed',
        place: 'Credit committee',
        facts: [
          ['Decision', 'Declined'],
          ['Reason', 'Debt to income above 43%'],
          ['Next step', 'Adverse action notice sent'],
        ],
      },
      { id: 'signed', at: 0, outcome: 'skipped', facts: [] },
      { id: 'funded', at: 0, outcome: 'skipped', facts: [] },
    ],
  },
]

export const LOAN_COPY: Partial<StepTrackerCopy> = {
  title: 'Loan applications',
  subtitle: 'Harbor Credit Union · consumer lending',
  items: 'Recent applications',
  replayLabel: (ref) => `Replay application ${ref}`,
  outcome: { completed: 'Funded', stopped: 'Declined' },
  attemptMissed: 'Deposit returned',
  journey: (ref) => `Progress of application ${ref}`,
  summary: 'Application summary',
  total: 'Loan amount',
  doorToDoor: 'Submitted to funded',
  attempts: 'Funding attempts',
  missed: (n) => `${n} returned`,
  neverOut: 'not funded',
  attempt: (n) => `Attempt ${n}`,
  tries: (n) => `${n} attempts`,
  notReached: 'The application hasn’t got here yet.',
  working: 'Waiting for the next step…',
  retrying: 'The bank sends the deposit again the next business day.',
  missedNote: 'deposit returned',
  skippedBecause: (stage) => `Skipped: the application stopped at ${stage.toLowerCase()}.`,
  notify: 'Email status link',
  handlerSite: 'Open in loan system',
  attemptFailed: (reason) => `Deposit returned: ${reason}. Sending again the next business day.`,
  completedOnRetry: (n) => `Funded on attempt ${n}.`,
  stopped: (stage, reason) => `Declined at ${stage.toLowerCase()}: ${reason}. Notice sent to the applicant.`,
  completed: (place) => `Funded by ${place}.`,
  loadingLabel: 'Loading applications',
  retry: 'Retry',
}
