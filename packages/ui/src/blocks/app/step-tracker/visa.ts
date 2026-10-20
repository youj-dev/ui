import type { StepTrackerCopy, StepTrackerItem, StepTrackerStage } from './data'

/* A visa from filed to the passport coming back, for the stories: fictional applicants and offices. */

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export const VISA_STAGES: StepTrackerStage[] = [
  { id: 'filed', label: 'Filed', now: 'Application filed' },
  { id: 'biometrics', label: 'Biometrics', now: 'Waiting for biometrics' },
  { id: 'interview', label: 'Interview', now: 'Interview scheduled' },
  { id: 'decision', label: 'Decision', now: 'Decision pending' },
  { id: 'returned', label: 'Passport returned', now: 'Passport on its way back' },
]

export const VISA_ITEMS: StepTrackerItem[] = [
  {
    id: 'VX-2026-0418',
    ref: '0418',
    subject: 'Amara Nwosu',
    handler: 'Consulate General, Lagos',
    place: 'Student visa',
    total: 185,
    currency: 'USD',
    outcome: 'completed',
    created: '2026-08-03T09:00:00Z',
    scans: [
      {
        id: 'filed',
        at: 0,
        outcome: 'ok',
        place: 'Online portal',
        facts: [
          ['Category', 'F-1 student'],
          ['Fee', '$185 · paid'],
          ['Sponsor', 'Lakeshore University'],
        ],
      },
      {
        id: 'biometrics',
        at: 9 * DAY + 5 * HOUR,
        outcome: 'ok',
        place: 'Application center',
        facts: [
          ['Center', 'Ikoyi application center'],
          ['Captured', 'Fingerprints and photo'],
        ],
      },
      {
        id: 'interview',
        at: 14 * DAY + 2 * HOUR,
        outcome: 'ok',
        place: 'Consular section',
        facts: [
          ['Officer', 'Window 6'],
          ['Language', 'English'],
          ['Documents', 'I-20, bank letter'],
        ],
      },
      {
        id: 'decision',
        at: 22 * DAY + 6 * HOUR,
        outcome: 'ok',
        place: 'Consular section',
        facts: [
          ['Decision', 'Approved'],
          ['Valid until', 'August 2030'],
        ],
      },
      {
        id: 'returned',
        at: 26 * DAY + 11 * HOUR,
        outcome: 'ok',
        place: 'Courier, Lagos',
        facts: [
          ['Courier', 'Pickup point, Ikoyi'],
          ['Signed by', 'A. Nwosu'],
        ],
        attempts: [
          { ok: false, code: 'recipient_unavailable', reason: 'No one was at the address. The courier left a notice and tries again the next day.', at: 25 * DAY + 14 * HOUR },
          { ok: true, code: 'delivered', reason: 'Signed for at the pickup point.', at: 26 * DAY + 11 * HOUR },
        ],
      },
    ],
  },
  {
    id: 'VX-2026-0431',
    ref: '0431',
    subject: 'Kenji Watanabe',
    handler: 'Consulate General, Osaka',
    place: 'Work visa',
    total: 205,
    currency: 'USD',
    outcome: 'stopped',
    stopReason: 'the employer letter could not be verified',
    created: '2026-08-05T01:30:00Z',
    scans: [
      {
        id: 'filed',
        at: 0,
        outcome: 'ok',
        place: 'Online portal',
        facts: [
          ['Category', 'H-1B worker'],
          ['Fee', '$205 · paid'],
          ['Employer', 'Orchard Robotics'],
        ],
      },
      {
        id: 'biometrics',
        at: 6 * DAY + 4 * HOUR,
        outcome: 'ok',
        place: 'Application center',
        facts: [
          ['Center', 'Umeda application center'],
          ['Captured', 'Fingerprints and photo'],
        ],
      },
      {
        id: 'interview',
        at: 15 * DAY + 2 * HOUR,
        outcome: 'ok',
        place: 'Consular section',
        facts: [
          ['Officer', 'Window 3'],
          ['Language', 'Japanese'],
          ['Documents', 'Employer letter, degree'],
        ],
      },
      {
        id: 'decision',
        at: 17 * DAY + 5 * HOUR,
        outcome: 'failed',
        place: 'Consular section',
        facts: [
          ['Decision', 'Refused'],
          ['Reason', 'Employer letter could not be verified'],
          ['Next step', 'Reapply with a new letter'],
        ],
      },
      { id: 'returned', at: 0, outcome: 'skipped', facts: [] },
    ],
  },
]

export const VISA_COPY: Partial<StepTrackerCopy> = {
  title: 'Visa applications',
  subtitle: 'Consular services · applicant status',
  items: 'Recent applications',
  replayLabel: (ref) => `Replay application ${ref}`,
  outcome: { completed: 'Approved', stopped: 'Refused' },
  attemptMissed: 'Delivery attempt missed',
  journey: (ref) => `Progress of application ${ref}`,
  summary: 'Application summary',
  total: 'Fee paid',
  doorToDoor: 'Filed to passport',
  stoppedAfter: 'Refused after',
  attempts: 'Passport delivery',
  missed: (n) => `${n} missed`,
  neverOut: 'not returned',
  attempt: (n) => `Attempt ${n}`,
  tries: (n) => `${n} tries`,
  notReached: 'The application hasn’t got here yet.',
  working: 'Waiting for the next step…',
  retrying: 'The courier tries again the next day.',
  missedNote: 'attempt failed',
  skippedBecause: (stage) => `Skipped: the application stopped at ${stage.toLowerCase()}.`,
  notify: 'Email status link',
  handlerSite: 'Open on consulate site',
  attemptFailed: (reason) => `Passport delivery attempt failed: ${reason}. Retrying the next day.`,
  completedOnRetry: (n) => `Passport delivered on attempt ${n}.`,
  stopped: (stage, reason) => `Refused at ${stage.toLowerCase()}: ${reason}. The passport is returned unstamped.`,
  completed: (place) => `Passport returned through ${place}.`,
  loadingLabel: 'Loading applications',
  retry: 'Retry',
}
