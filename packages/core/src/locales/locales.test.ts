import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { defaultLabels, type YoujLabels } from '../lib/youj/labels'
import type { de } from './de'

/* Every language pack against the English: the same keys, a string from every
 * function for counts that hit each plural form, and no English left behind. */

const LANGUAGES = ['de', 'fr', 'es', 'pt-BR', 'it', 'nl', 'ja', 'zh-CN', 'ko', 'ar', 'he', 'pl', 'sv', 'tr'] as const
type Language = (typeof LANGUAGES)[number]
const COUNTS = [0, 1, 2, 3, 5, 11, 21, 22, 100, 1234]

const dir = join(process.cwd(), 'src/locales')
const codes = readdirSync(dir).flatMap((f) => /^([a-z]{2}(?:-[A-Z]{2})?)\.ts$/.exec(f)?.[1] ?? [])
const packs = await Promise.all(
  codes.map(async (code) => [code, Object.values((await import(`./${code}.ts`)) as Record<string, YoujLabels>)[0]!] as [string, YoujLabels]),
)

type FunctionKey = { [K in keyof YoujLabels]: YoujLabels[K] extends (...args: never[]) => string ? K : never }[keyof YoujLabels]
const PEOPLE = ['Ada', 'Grace', 'Linus', 'Margaret', 'Alan']
const DATE = '12/03/2026'

/** Representative arguments for every function key, for a count `n`. Typed, so a new key without a row fails typecheck. */
const args: { [K in FunctionKey]: (n: number) => Parameters<YoujLabels[K]> } = {
  remove: (_n) => ['Ada'],
  showMoreCount: (n) => [n],
  slidePosition: (n) => [n, n],
  slideOf: (n) => [n, n],
  slideNumber: (n) => [n],
  commandPalettePage: (n) => [String(n)],
  openMenu: (_n) => ['Ada'],
  closeMenu: (_n) => ['Ada'],
  badgeNewCount: (n) => [n],
  loadingNamed: (_n) => ['Ada'],
  allowanceValueText: (n) => [String(n), String(n), String(n)],
  allowanceOverText: (n) => [String(n), String(n), String(n)],
  allowanceMarkerAt: (n) => ['Ada', String(n)],
  dotMapSummary: (n) => [n, 'Ada', '12.4k'],
  rolloutStageAt: (_n) => ['Ada', '5%'],
  permissionSelectRow: (_n) => ['Ada'],
  permissionSelectColumn: (_n) => ['Ada'],
  permissionSelected: (n) => [n],
  permissionBulkSet: (n) => [n, 'Ada'],
  permissionChanged: (_n) => ['Ada', 'Ada', 'Ada'],
  permissionWas: (_n) => ['Ada'],
  stageItem: (n) => ['Ada', 'Ada', n % 2 ? '12 s' : ''],
  severity: (n) => [(n % 4) + 1],
  sinceStart: (_n) => ['2 min'],
  laneOf: (n) => [String(n), String(n)],
  laneItemAction: (_n) => ['Ada', 'Ada'],
  runsIn: (_n) => ['01:12:04'],
  scheduleRunAt: (_n) => ['Ada', '02:00'],
  scheduleRuns: (n) => [n],
  scheduleOverlaps: (n) => [n],
  scheduleOverlapAt: (_n) => ['Ada', '02:00'],
  dateRangeSummary: (n) => [n, DATE, DATE],
  calendarDay: (n) => [DATE, n % 2 === 1, n % 2 === 1],
  passwordStrengthIs: (_n) => ['Ada'],
  createOption: (_n) => ['Ada'],
  selectedSummary: (n) => [n, 'Ada'],
  allSelected: (n) => [n],
  countOfMaxSelected: (n) => [n, n],
  optionsShown: (n) => [n, n],
  limitOfReached: (n) => [n],
  removed: (_n) => ['Ada'],
  upToTags: (n) => [n],
  added: (_n) => ['Ada'],
  addedTags: (n) => [n],
  alreadyAdded: (_n) => ['Ada'],
  movedTo: (n) => ['Ada', n, n],
  valueRange: (n) => [`${n} s`, `${n + 1} s`],
  accentSwatch: (_n) => ['Ada'],
  saturationBrightnessValue: (_n) => ['Ada', 'Ada'],
  resendIn: (_n) => ['Ada'],
  moreLanguages: (n) => [n],
  searchLanguages: (n) => [n],
  translationCount: (n) => [n, (['missing','outdated','review'] as const)[n % 3]!],
  languagesComplete: (n) => [n, n],
  fieldsComplete: (n) => [n, n],
  copyFrom: (_n) => ['Ada'],
  copiedFrom: (_n) => ['Ada'],
  markedReviewed: (_n) => ['Ada'],
  sourceChanged: (_n) => ['Ada'],
  requiredIn: (_n) => ['Ada'],
  characterCount: (n) => [n, n],
  charactersOver: (n) => [n],
  editingLanguage: (_n) => ['Ada', 'Ada'],
  fillFromSource: (_n) => ['Ada'],
  clearLanguage: (_n) => ['Ada'],
  clearLanguageDescription: (n) => ['Ada', n],
  translationBulkDone: (n) => [(['copy','review','clear'] as const)[n % 3]!, 'Ada', n],
  phoneCountry: (_n) => ['Ada', 'Ada'],
  ratingValue: (n) => [n, n, 'Ada'],
  ratedOutOf: (n) => [n, n],
  stepOf: (n) => [n, n],
  rowNumber: (n) => [n],
  hiddenColumns: (n) => [n],
  columnOptions: (_n) => ['Ada'],
  rowActions: (_n) => ['Ada'],
  filterBy: (_n) => ['Ada'],
  filterNoOptions: (_n) => ['Ada'],
  removeFilter: (_n) => ['Ada'],
  quoted: (_n) => ['Ada'],
  filterFrom: (_n) => [DATE],
  filterUntil: (_n) => [DATE],
  minimumOf: (_n) => ['Ada'],
  maximumOf: (_n) => ['Ada'],
  rangeOf: (n) => [String(n), String(n), 'Ada'],
  pageOf: (n) => [String(n), String(n)],
  noItems: (_n) => ['Ada'],
  selectAllCount: (n) => [String(n), 'Ada'],
  selectRow: (_n) => ['Ada'],
  sortedBy: (n) => [PEOPLE.slice(0, Math.min(Math.max(n, 1), 5))],
  sortedColumn: (n) => ['Ada', n % 2 === 1],
  selectedRows: (n) => [String(n), n],
  matchCount: (n) => [String(n), n, 'Ada'],
  totalCount: (n) => [String(n), n, 'Ada'],
  columnWidth: (n) => ['Ada', n],
  cellOf: (_n) => ['Ada', 'Ada'],
  cellSaved: (_n) => ['Ada'],
  cellSaveFailed: (_n) => ['Ada', 'Timeout'],
  loadFailed: (_n) => ['Ada'],
  noMatches: (_n) => ['Ada'],
  emptyHint: (_n) => ['Ada'],
  enterAtLeast: (n) => [n],
  enterAtMost: (n) => [n],
  itemCount: (n) => [String(n), n, 'Ada'],
  confirmTitle: (_n) => ['Ada', 'Ada'],
  confirmAction: (_n) => ['Ada', 'Ada'],
  confirmPending: (_n) => ['Ada', 'Ada'],
  saveViewChanges: (_n) => ['Ada'],
  deleteView: (_n) => ['Ada'],
  chatThoughtFor: (n) => [n],
  chatToolDuration: (n) => [n],
  chatToolFailed: (n) => ['Ada', n % 2 ? 'Timeout' : undefined],
  chatResponding: (_n) => ['Ada'],
  chatResponseFailed: (_n) => ['Ada', 'Timeout'],
  chatOverLimit: (n) => [n, 'Ada'],
  chatLeft: (n) => [n, 'Ada'],
  kanbanLane: (_n) => ['Ada'],
  kanbanPlace: (n) => ['Ada', n % 2 ? 'Blocked' : undefined, n, n, n % 2 ? n : undefined],
  kanbanPickedUp: (_n) => ['Ada', 'Ada'],
  kanbanPickedUpKeyboard: (_n) => ['Ada', 'Ada'],
  kanbanDropped: (_n) => ['Ada', 'Ada'],
  kanbanCancelled: (_n) => ['Ada', 'Ada'],
  kanbanMoveFailed: (_n) => ['Ada', 'Ada'],
  kanbanExpand: (_n) => ['Ada'],
  kanbanCollapse: (_n) => ['Ada'],
  kanbanCardCount: (n) => [n, n % 2 ? n : undefined, n % 2 ? n % 2 === 1 : undefined],
  kanbanNewCard: (_n) => ['Ada'],
  treeLoadingItem: (_n) => ['Ada'],
  treeLoaded: (_n) => ['Ada'],
  treeLoadFailed: (_n) => ['Ada'],
  treeRename: (_n) => ['Ada'],
  treeRenamed: (_n) => ['Ada'],
  notificationsUnread: (n) => [n],
  notificationNew: (_n) => ['Ada'],
  notificationsNew: (n) => [n],
  fileUploaded: (_n) => ['Ada'],
  fileUploadedTile: (_n) => ['Ada'],
  fileFailedToUpload: (_n) => ['Ada', 'Timeout'],
  fileUnsupported: (n) => ['Ada', n % 2 ? 'Ada' : undefined],
  fileTooLarge: (_n) => ['Ada', '2 MB', '2 MB'],
  fileDuplicate: (_n) => ['Ada'],
  fileTooMany: (n) => ['Ada', n],
  filesAdded: (n) => [n],
  filesRejected: (n) => [n],
  fileRemoved: (_n) => ['Ada'],
  fileRetrying: (_n) => ['Ada'],
  fileTypeList: (n) => [PEOPLE.slice(0, Math.min(Math.max(n, 1), 5))],
  fileTypeGroup: (_n) => ['Ada'],
  fileMaxSize: (n) => ['2 MB', n % 2 === 1],
  fileMaxFiles: (n) => [n],
  fileDropPrompt: (n) => [(['images','files','file'] as const)[n % 3]!],
  fileRetry: (_n) => ['Ada'],
  fileRetryError: (_n) => ['Ada', 'Timeout'],
  fileCancelUpload: (_n) => ['Ada'],
  fileUploading: (_n) => ['Ada'],
  avatarUnsupported: (_n) => ['Ada', 'Ada'],
  avatarPhotoOf: (_n) => ['Ada'],
  avatarStackNames: (n) => [PEOPLE.slice(0, Math.min(Math.max(n, 1), 5))],
  avatarStackShowAll: (n) => [n, 'Ada'],
  accountMenu: (_n) => ['Ada'],
  workspaceCreateNamed: (_n) => ['Ada', 'Ada'],
  workspaceSwitch: (_n) => ['Ada'],
  codeBlock: (_n) => ['Ada'],
  diffSummary: (n) => [n, n + 1],
  diffAddedLine: (n) => [n],
  diffRemovedLine: (n) => [n],
  diffUnchanged: (n) => [n],
  diffChange: (n) => [n, n + 2],
  diffChanges: (n) => [n],
  sortableReorderItem: (_n) => ['Ada'],
  sortablePosition: (n) => [n, n],
  sortablePickedUp: (_n) => ['Ada', 'Ada'],
  sortablePickedUpKeyboard: (_n) => ['Ada', 'Ada'],
  sortableMoved: (_n) => ['Ada', 'Ada'],
  sortableDropped: (_n) => ['Ada', 'Ada'],
  sortableCancelled: (_n) => ['Ada', 'Ada'],
  shareOfTotal: (_n) => ['42%'],
  treemapItem: (n) => ['Ada', '182 GB', '42%', n % 2 === 1],
  treemapSummary: (n) => [n, '431 GB', 'Ada', '42%'],
  bucketValueText: (n) => [String(n), String(n), String(n)],
  bucketUnderBurst: (n) => [String(n)],
  latencySloAt: (_n) => ['300 ms'],
  latencySummary: (n) => [n, 'p50 84 ms, p90 212 ms, p99 1.2 s'],
  latencyWithin: (_n) => ['97.4%', '300 ms'],
  uptimeDay: (_n) => [DATE, '99.98%'],
  uptimeNoData: (_n) => [DATE],
  uptimeIncidents: (n) => [n],
  uptimeDowntime: (_n) => ['12 min'],
  uptimeSummary: (n) => [n, '99.95%', n],
  forecastCrosses: (_n) => [DATE],
  forecastSummary: (n) => [String(n), String(n + 1), String(n + 2), String(n + 3), String(n + 4)],
  shareRingPart: (_n) => ['Ada', '42%'],
  activityRingsValue: (n) => ['Ada', String(n), `${n + 1} kcal`, '84%'],
  shareRingSummary: (n) => ['1,240 kcal', PEOPLE.slice(0, Math.min(Math.max(n, 1), 5)).map((p) => `${p} 20%`)],
  slotGridLeft: (n) => [n],
  slotGridCell: (_n) => ['Tue 29 Sep', '10:00', 'Ada'],
  slotGridOpenCount: (n) => [n],
  waveformPosition: (n) => ['12:34', '42:10', n % 2 ? 'Ada' : undefined],
  transferPause: (_n) => ['Ada'],
  transferResume: (_n) => ['Ada'],
  transferCancel: (_n) => ['Ada'],
  transferProgress: (_n) => ['48 MB', '120 MB'],
  transferLeft: (_n) => ['0:42'],
  transferFinished: (_n) => ['Ada'],
  transferFailed: (_n) => ['Ada'],
  transferFiles: (n) => [n, n],
  lessonItem: (n) => ['Ada', n, n + 1, 'Grace', n % 5, 4],
  milestoneItem: (_n) => ['Ada', 'Grace'],
  sectionProgress: (n) => [n, n + 1],
  intervalRoundOf: (n) => [n, n + 1],
  intervalLeft: (_n) => ['0:24'],
  intervalStarted: (n) => ['Ada', '0:30', n % 2 ? 'Grace' : undefined],
  seatItem: (n) => ['F', n, '€48', 'Ada'],
  seatRow: (_n) => ['F'],
  seatNumber: (n) => [n],
  seatAdded: (n) => ['F', n],
  seatRemoved: (n) => ['F', n],
  seatLimit: (n) => [n],
  dialValueNow: (_n) => ['21.5 °C', '19.8 °C'],
  dialMark: (_n) => ['Ada', '17 °C'],
  rotaShift: (n) => ['Ada', 'Mon 09:00', 'Tue 09:00', n % 2 === 1],
  rotaHandoff: (_n) => ['Ada'],
  diffBetter: (_n) => ['Ada', '22%'],
  streakDay: (_n) => ['Mon 28 Sep', 'Done'],
  streakPartial: (n) => [n, n],
  streakTodayDone: (n) => [n],
  streakDays: (n) => [n],
  streakFreezesLeft: (n) => [n],
  streakMilestone: (n) => [n],
  envelopeLeft: (_n) => ['€212'],
  envelopeOver: (_n) => ['€38'],
  envelopeOf: (_n) => ['€212', '€400'],
  envelopeRollover: (_n) => ['€40'],
  envelopePickedUp: (_n) => ['€20', 'Ada'],
  envelopeTarget: (_n) => ['€20', 'Ada', 'Grace'],
  envelopeMoved: (_n) => ['€20', 'Ada', 'Grace'],
  itineraryDay: (n) => [n],
  itineraryLeg: (_n) => ['Ada', 'Grace', '09:40', '12:55'],
  itineraryTimeShift: (_n) => ['+1 h'],
  itineraryNights: (n) => [n],
  gradientSliderValue: (n) => ['0.62', n % 2 ? 'Ada' : undefined],
  presenceSetTo: (_n) => ['Ada'],
  pagesFound: (n) => [n],
  pagesNoMatch: (_n) => ['Ada'],
  flowGraphNode: (n) => ['git.log', 'Ada', n % 2 ? '1.2 s' : undefined],
  flowGraphAfter: (_n) => ['plan, git.log'],
  flowGraphThen: (_n) => ['notes.draft'],
  flowGraphAttempts: (n) => [n],
  trackTimelineClip: (_n) => ['Ada', '0:12.5–0:24.0', 'Grace'],
  trackTimelineRange: (_n) => ['0:12.5', '0:24.0'],
  trackTimelineClipStart: (_n) => ['Ada'],
  trackTimelineClipEnd: (_n) => ['Ada'],
  trackTimelineMute: (_n) => ['Ada'],
  trackTimelineSolo: (_n) => ['Ada'],
  groupedBy: (_n) => ['Ada'],
  showDetails: (_n) => ['Ada'],
  hideDetails: (_n) => ['Ada'],
  copyValue: (_n) => ['Ada'],
  valueOfMax: (n) => [String(n), String(n + 1)],
  recordOf: (n) => [String(n), String(n + 1)],
  editProperty: (_n) => ['Ada'],
  stepDetour: (n) => [n],
  unitChartItem: (n) => ['Ada', String(n), n % 2 === 1],
  unitChartSummary: (n) => [n, '312 covers', 'Ada', '28'],
  forecastScenarioSummary: (n) => ['Ada', String(n)],
  flowLanesItem: (n) => ['Kestrel', `${n}/s`, `${n}%`],
  flowLanesSummary: (n) => ['Gateway', n, '333/s'],
  cellBarItem: (n) => ['Mar', `$${n}`, n % 2 === 1],
  cellBarSummary: (n) => [`$${n}`],
  cellBarProjected: (n) => [`$${n}`],
  cellBarTarget: (n) => [`$${n}`],
  lollipopChartSummary: (n) => [n, '-82%', '+36%'],
  signatureSignedAt: () => ['14:32'],
  whiteboardSummary: (n) => [n],
  whiteboardSelected: (n) => [n],
  whiteboardAdded: (_n) => ['Ada'],
  whiteboardDeleted: (n) => [n],
  whiteboardShapeText: (_n) => ['Ada', 'Grace'],
  whiteboardConnects: (_n) => ['Ada', 'Grace'],
  whiteboardPin: (n) => [n, 'Ada'],
  voiceOrbState: (_n) => ['Ada', 'Listening'],
  audioRecorderLimit: (n) => [`${n}:00`],
  audioRecorderRemaining: (n) => [`0:${n}`],
  audioRecorderStopped: (n) => [`0:${n}`],
  voiceOrbMuted: (_n) => ['Listening'],
  worldClockTime: (n) => [String(n), 'Ada', 'tomorrow'],
  worldClockSummary: (_n) => ['Ada', 'Grace'],
  worldClockOverlap: (_n) => ['14:00 – 16:00'],
  liveCursorsJoined: (_n) => ['Ada'],
  liveCursorsLeft: (_n) => ['Ada'],
  liveCursorsFollow: (_n) => ['Ada'],
  liveCursorsFollowing: (_n) => ['Ada'],
  liveCursorsMore: (n) => [n],
  tourStepOf: (n) => [n, 5],
  tourStepAnnounce: (n) => [n, 5, 'Ada'],
  hierarchyChartHidden: (n) => [n],
  hierarchyChartExpand: (_n) => ['Ada'],
  hierarchyChartCollapse: (_n) => ['Ada'],
  radialMenuChosen: (_n) => ['Ada'],
  imageCompareValue: (n) => ['Before', `${n}%`, 'After', `${100 - n}%`],
  currencySwapResult: (n) => [`${n} ETH`],
  currencySwapRate: (n) => ['1 BTC', `${n} ETH`],
  hoursDialValue: (n) => [`${n}:30 PM`, `${n} hours, 30 minutes`],
  toolApprovalAlwaysAllow: (_n) => ['Ada'],
  toolApprovalShowValue: (_n) => ['Ada'],
  toolApprovalHideValue: (_n) => ['Ada'],
  toolApprovalApprovedBy: (_n) => ['Ada'],
  toolApprovalDeniedBy: (_n) => ['Ada'],
  toolApprovalDeniedReason: (_n) => ['Ada'],
  toolApprovalAnnounce: (_n) => ['Ada', 'Grace'],
  shareDialogTitle: (_n) => ['Roadmap'],
  shareDialogInvited: (n) => [n],
  shareDialogNotEmail: (_n) => ['ada@'],
  shareDialogHasAccess: (_n) => ['Ada'],
  shareDialogRemoveRecipient: (_n) => ['Ada'],
  shareDialogGroupSize: (n) => [n],
  shareDialogPeopleCount: (n) => [n],
  shareDialogResendTo: (_n) => ['Ada'],
  shareDialogCancelInvite: (_n) => ['Ada'],
  shareDialogRemoveAccess: (_n) => ['Ada'],
  shareDialogRoleOf: (_n) => ['Ada'],
  shareDialogOrganization: (_n) => ['Acme'],
  shareDialogOrganizationHint: (_n) => ['Acme'],
  shareDialogRemoved: (_n) => ['Ada'],
  shareDialogRoleChanged: (_n) => ['Ada', 'Editor'],
  shareDialogAccessChanged: (_n) => ['Restricted'],
  sessionTimeoutWarning: (n) => [`${n}:42`],
  filterRuleN: (n) => [n],
  filterGroupN: (n) => [n],
  filterDuplicate: (_n) => ['Ada'],
  filterGroupActions: (_n) => ['Ada'],
  importMapperDropHint: (n) => [String(n)],
  importMapperTooLarge: (n) => [String(n), String(n)],
  importMapperUnclosedQuote: (n) => [String(n)],
  importMapperRaggedRow: (n) => [String(n), String(n), String(n)],
  importMapperProblemsMore: (n) => [String(n)],
  importMapperMapped: (n) => ['Ada', String(n)],
  importMapperNotImported: (_n) => ['Ada'],
  importMapperEditCell: (n) => [String(n), 'Ada'],
  importMapperShowing: (n) => [String(n), String(n)],
  importMapperProgress: (n) => [String(n), String(n)],
  importMapperFailed: (_n) => ['Ada'],
  importMapperFileMeta: (n) => [n, n, '12 KB'],
  importMapperNotMatched: (_n) => ['Ada'],
  importMapperPickColumnFor: (_n) => ['Ada'],
  importMapperBlocked: (_n) => ['Ada'],
  importMapperItems: (n) => [n],
  importMapperImport: (n) => [String(n)],
  importMapperIssueMissing: (n) => [n, 'Ada'],
  importMapperIssueInvalid: (n) => [n, 'Ada'],
  importMapperSkipThem: (n) => [n],
  importMapperSkippedNote: (n) => [n],
  importMapperDuplicatesFound: (n) => [n],
  importMapperCountsAnnounce: (n) => [String(n), n],
  importMapperLeft: (n) => [n],
  importMapperImported: (n) => [String(n)],
  importMapperUpdatedCount: (n) => [n],
  importMapperSkippedCount: (n) => [n],
  importMapperDoneAnnounce: (n) => [String(n), n],
  portfolioReading: (n) => [`$${n}.00`, 'Mar 3'],
  portfolioUp: (n) => [`${n}%`],
  portfolioDown: (n) => [`${n}%`],
  portfolioFlat: (n) => [`${n}%`],
  growthYear: (n) => [String(n)],
  growthBar: (n) => [String(n), `$${n}.00`, `$${n}.00`],
  exportColumnsAll: (n) => [n],
  exportColumnsSome: (n) => [n, n + 4],
  exportAs: (_n) => ['CSV'],
  exportEmailedTo: (_n) => ['ada@example.com'],
  radialGraphHops: (n) => [n],
  radialGraphItem: (n) => ['Ada', `${n} hops`],
  radialGraphSummary: (n) => ['Ada', n, '2 hops'],
  densityLanesSummary: (n) => [n, '3,624 alerts', '12:30', '504'],
  coverageMatrixSummary: (n) => [n, n + 10],
  milestoneRulerItem: (n) => ['Version 2', `Nov ${n}`, 'Upcoming'],
  milestoneRulerCount: (n) => [n],
  milestoneRulerMore: (n) => [n],
  milestoneRulerSummary: (n) => [n + 2, n],
  scoreRingValue: (n) => [String(n), '100'],
  scoreRingGrade: (_n) => ['B'],
}

/** Keys whose English is also the right word in that language (loanwords, key caps, product terms). */
const sameAsEnglish: Record<Language, (keyof YoujLabels)[]> = {
  de: ['dock', 'dayPeriod', 'optional', 'viewName', 'chatSystem', 'colorModeSystem', 'presenceOnline', 'presenceOffline', 'timelineCommit', 'timelineMerge', 'timelineDetails', 'avatarZoom', 'code', 'presenceStatus', 'runsIn', 'bucketBurst', 'latencySloAt', 'forecastBudget', 'rolloutBeta', 'permissionAdmin', 'escKey', 'whiteboardHand', 'whiteboardEllipse', 'whiteboardText', 'worldClockTime', 'filterBuilder', 'filterOperator', 'exportFormat'],
  fr: ['actions', 'dock', 'pagination', 'menu', 'ctrlKey', 'minutes', 'dayPeriod', 'regionEurope', 'translationSource', 'chatSources', 'chatToolArguments', 'chatConversation', 'chatAssistant', 'chatPromptLabel', 'notifications', 'notificationsMentions', 'timelineCommit', 'timelinePullRequest', 'fileListImages', 'avatarZoom', 'code', 'presenceInvisible', 'pages', 'latencySloAt', 'forecastBudget', 'uptimeIncidents', 'permissionAdmin', 'groupTotal', 'signaturePad', 'whiteboardRectangle', 'whiteboardEllipse', 'whiteboardAccent', 'shareDialogSuggestions', 'exportOptions', 'exportFormat', 'importMapperItems'],
  es: ['dock', 'ctrlKey', 'chatToolError', 'timelineCommit', 'timelinePullRequest', 'avatarZoom', 'presenceInvisible', 'latencySloAt', 'rolloutBeta', 'permissionAdmin', 'booleanNo', 'groupTotal', 'colour', 'escKey', 'shareDialogEditor', 'exportTimeZoneLocal'],
  'pt-BR': ['dock', 'slide', 'slideNumber', 'menu', 'ctrlKey', 'dayPeriod', 'timelineCommit', 'timelineDeploy', 'timelineMerge', 'timelinePullRequest', 'avatarZoom', 'presenceOnline', 'presenceOffline', 'presenceStatus', 'latencySloAt', 'rolloutBeta', 'permissionAdmin', 'envelopes', 'groupTotal', 'escKey', 'shareDialogEditor', 'exportTimeZoneLocal', 'blueprintLink', 'renderPassesLayout'],
  it: ['dock', 'menu', 'ctrlKey', 'dayPeriod', 'timelineCommit', 'timelineDeploy', 'timelineMerge', 'timelinePullRequest', 'avatarZoom', 'presenceOnline', 'presenceOffline', 'accountMenu', 'latencySloAt', 'forecastBudget', 'rolloutBeta', 'permissionAdmin', 'booleanNo', 'escKey', 'forecastScenario', 'shareDialogEditor', 'blueprintMedia', 'blueprintLink', 'renderPassesLayout'],
  nl: ['records', 'dock', 'menu', 'ctrlKey', 'dayPeriod', 'presenceOnline', 'presenceOffline', 'timelineCommit', 'timelineDeploy', 'timelineMerge', 'timelinePullRequest', 'timelineDetails', 'code', 'presenceStatus', 'bucketTokens', 'latencySloAt', 'forecastBudget', 'escKey', 'forecastScenario', 'whiteboardHand', 'whiteboardPen', 'whiteboardAccent', 'whiteboardAmber', 'worldClockTime', 'worldClockSummary', 'filterBuilder', 'filterOperator', 'filterOpIs', 'importMapperItems', 'blueprintFrame', 'blueprintMedia', 'blueprintLink', 'renderPassesLayout', 'renderPassesPaint', 'renderPassesComposite'],
  ja: ['ctrlKey', 'latencySloAt', 'escKey'],
  'zh-CN': ['ctrlKey', 'latencySloAt', 'escKey'],
  ko: ['ctrlKey', 'latencySloAt', 'escKey'],
  ar: ['ctrlKey', 'escKey'],
  he: ['ctrlKey', 'escKey'],
  pl: ['filterOperator', 'menu', 'ctrlKey', 'dayPeriod', 'chatSystem', 'presenceOnline', 'presenceOffline', 'timelineCommit', 'timelineAlert', 'timelinePullRequest', 'presenceStatus', 'allowanceLimit', 'latencySloAt', 'rolloutBeta', 'permissionAdmin', 'escKey', 'exportFormat', 'blueprintLink'],
  sv: ['filterBuilder', 'filterOperator', 'ctrlKey', 'chatSystem', 'colorModeSystem', 'presenceOnline', 'presenceOffline', 'timelineCommit', 'timelinePullRequest', 'presenceStatus', 'bucketFull', 'latencySloAt', 'forecastBudget', 'rolloutBeta', 'permissionAdmin', 'escKey', 'forecastScenario', 'whiteboardHand', 'whiteboardText', 'whiteboardAccent', 'exportFormat', 'blueprintText', 'blueprintMedia', 'renderPassesLayout'],
  tr: ['dock', 'ctrlKey', 'timelineCommit', 'latencySloAt', 'rolloutBeta', 'escKey'],
}

const fnKeys = Object.keys(args) as FunctionKey[]
/** SI unit symbols ("450 ms") read the same in most languages. */
const UNIT_KEYS = new Set<string>(['chatToolDuration'])
const call = (labels: YoujLabels, key: FunctionKey, n: number) => (labels[key] as (...a: unknown[]) => string)(...args[key](n))

/** Whether the English adds words around its values; text that's only values and punctuation may read the same translated. */
function hasWords(key: FunctionKey, n: number) {
  let rest = call(defaultLabels, key, n)
  for (const a of args[key](n).flat()) if (typeof a === 'string') rest = rest.replaceAll(a, '')
  return /\p{L}{2,}/u.test(rest)
}

it('types the German pack with exactly the English keys', () => {
  expectTypeOf<keyof typeof de>().toEqualTypeOf<keyof YoujLabels>()
})

it('ships every promised language', () => {
  expect(packs.map(([code]) => code).sort()).toEqual([...LANGUAGES].sort())
})

it('has sample arguments for every function key', () => {
  const english = (Object.keys(defaultLabels) as (keyof YoujLabels)[]).filter((k) => typeof defaultLabels[k] === 'function')
  expect([...fnKeys].sort()).toEqual(english.sort())
})

describe.each(packs)('%s', (code, labels) => {
  const allowed = new Set<string>(sameAsEnglish[code as Language])

  it('has exactly the English keys, each of the same kind', () => {
    expect(Object.keys(labels).sort()).toEqual(Object.keys(defaultLabels).sort())
    for (const key of Object.keys(defaultLabels) as (keyof YoujLabels)[]) expect(typeof labels[key], key).toBe(typeof defaultLabels[key])
  })

  it('returns a non-empty string from every function key, for every plural form', () => {
    for (const key of fnKeys) {
      for (const n of COUNTS) {
        const text = call(labels, key, n)
        expect(typeof text, `${key}(${n})`).toBe('string')
        expect(text.trim(), `${key}(${n})`).not.toBe('')
        expect(text, `${key}(${n})`).not.toMatch(/\bundefined\b|\bNaN\b|\[object|\bnull\b/)
      }
    }
  })

  it('translates every string key, keeping English only where it is the word', () => {
    const keys = Object.keys(defaultLabels) as (keyof YoujLabels)[]
    expect(keys.filter((key) => typeof defaultLabels[key] === 'string' && labels[key] === defaultLabels[key] && !allowed.has(key))).toEqual([])
  })

  it('translates the words around every function key’s values', () => {
    expect(fnKeys.filter((key) => !allowed.has(key) && !UNIT_KEYS.has(key) && [1, 5].some((n) => hasWords(key, n) && call(labels, key, n) === call(defaultLabels, key, n)))).toEqual([])
  })

  it('allows English only for keys that still read as English', () => {
    expect([...allowed].filter((key) => typeof defaultLabels[key as keyof YoujLabels] === 'string' && labels[key as keyof YoujLabels] !== defaultLabels[key as keyof YoujLabels])).toEqual([])
  })
})

describe('plural forms', () => {
  const pack = (code: string) => packs.find(([c]) => c === code)?.[1]

  it.each([
    // Polish: one (1), few (2–4, 22–24), many (5–21, 25…)
    ['pl', [1, 2, 5, 22]],
    // Arabic: zero, one, two, few (3–10), many (11–99), other (100…)
    ['ar', [0, 1, 2, 3, 11, 100]],
    // Hebrew: one, two, other
    ['he', [1, 2, 5]],
  ] as const)('%s words each plural category differently', (code, counts) => {
    const labels = pack(code)
    if (!labels) return
    const rules = new Intl.PluralRules(code)
    const byCategory = new Map(counts.map((n) => [rules.select(n), labels.filesAdded(n).replace(/[\d٠-٩]+/g, '#')]))
    expect(new Set(byCategory.values()).size, [...byCategory].join(' | ')).toBe(byCategory.size)
  })

  it('formats counts with the language’s separators', () => {
    expect(pack('de')?.filesAdded(1234)).toBe('1.234 Dateien hinzugefügt')
    expect(pack('de')?.filesAdded(1)).toBe('1 Datei hinzugefügt')
  })
})
