/**
 * Every piece of built-in copy the components render or announce: button
 * names, screen-reader text, placeholders, empty states. Translate them once
 * with `<YoujProvider labels={{ close: 'Schließen' }}>`; keys you leave
 * out stay English. A component's own prop (`loadingLabel`, `aria-label`, …)
 * still wins over these.
 *
 * Keys are flat and shared where the text means the same thing (one `close`
 * for every close button). Text with values in it is a function, so each
 * language can put the value where its grammar wants it.
 */
export interface YoujLabels {
  // Shared: generic actions and states used across components
  close: string
  dismiss: string
  cancel: string
  save: string
  add: string
  edit: string
  send: string
  retry: string
  clear: string
  back: string
  search: string
  /** Visible placeholder of search fields. */
  searchPlaceholder: string
  /** Placeholder of pickers with nothing chosen. */
  selectPlaceholder: string
  /** Spoken while something loads (sr-only). */
  loading: string
  /** Shown as visible text while something loads. */
  loadingEllipsis: string
  empty: string
  actions: string
  presets: string
  progress: string
  clearSelection: string
  /** Names a remove button for one item: a tag, a file, a chip. */
  remove: (name: string) => string

  // Async feedback (AsyncFeedback, AsyncAnnouncer, Button onAction)
  working: string
  done: string
  failed: string

  // Motion primitives and pieces
  scrollProgress: string
  dock: string

  // Blueprint: the build column's words for what it drafts, and the side columns' titles
  blueprintFrame: string
  blueprintRegion: string
  blueprintBox: string
  blueprintText: string
  blueprintButton: string
  blueprintField: string
  blueprintIcon: string
  blueprintChart: string
  blueprintMedia: string
  blueprintRule: string
  blueprintRow: string
  blueprintLink: string
  blueprintBuild: string
  blueprintValues: string
  blueprintGrid: string
  blueprintInk: string
  blueprintTone: string
  blueprintSet: string
  layersFrame: string
  layersRegions: string
  layersBoxes: string
  layersContent: string
  renderPassesLayout: string
  renderPassesPaint: string
  renderPassesComposite: string

  // Confirm dialog
  /** Spoken while the confirm action runs. */
  confirming: string
  phraseMatches: string
  /** Beside the phrase to type. */
  typeToConfirm: string
  copyPhrase: string
  /** Shown when the action fails without a message of its own. */
  somethingWentWrong: string

  // Sidebar
  sidebar: string
  toggleSidebar: string

  // Pagination
  pagination: string
  previous: string
  next: string
  goToPreviousPage: string
  goToNextPage: string

  // Breadcrumb
  breadcrumb: string
  /** Names the button that expands collapsed crumbs. */
  showMoreCount: (count: number) => string

  // Carousel
  /** The carousel's aria-roledescription. */
  carousel: string
  /** Each slide's aria-roledescription. */
  slide: string
  /** A slide's name, e.g. "2 of 5". */
  slidePosition: (position: number, total: number) => string
  /** Announced as slides change, e.g. "Slide 2 of 5". */
  slideOf: (position: number, total: number) => string
  /** A dot's or thumbnail's name. */
  slideNumber: (position: number) => string
  previousSlide: string
  nextSlide: string
  chooseSlide: string
  slideThumbnails: string
  pauseSlideRotation: string
  startSlideRotation: string

  // Command and command palette
  commandPalette: string
  commandPaletteDescription: string
  commandPalettePlaceholder: string
  /** Announced when a nested page opens. */
  commandPalettePage: (page: string) => string
  home: string
  navigate: string
  open: string

  // App header
  menu: string
  openMenu: (menu: string) => string
  closeMenu: (menu: string) => string
  /** The Control key on shortcut hints (Apple devices show ⌘). */
  ctrlKey: string
  /** The Escape key on shortcut hints. */
  escKey: string

  // Anchor nav and bottom tab bar
  onThisPage: string
  primaryNavigation: string
  /** A tab's dot badge, read after its label. */
  badgeNew: string
  badgeNewCount: (count: number) => string

  // Chart and stat card
  viewData: string
  hideData: string
  trendUp: string
  trendDown: string
  trendFlat: string
  /** Announced while a named thing loads. */
  loadingNamed: (name: string) => string

  // Meters (Gauge, SegmentedMeter, LimitMeter)
  /** Spoken after a meter's value when it sits in a warning band that has no label of its own. */
  meterWarning: string
  /** Spoken after a meter's value when it sits in a danger band that has no label of its own. */
  meterCritical: string
  /** The limit meter's headline: what is left to spend. */
  allowanceRemaining: string
  allowanceSpent: string
  allowanceLimit: string
  /** Replaces "Remaining" once spending passes the limit. */
  allowanceOverLimit: string
  /** The limit meter's value, e.g. "€1,366.80 spent of €2,000.00, €633.20 left". */
  allowanceValueText: (spent: string, limit: string, remaining: string) => string
  /** Its value past the limit, e.g. "€2,140.00 spent of €2,000.00, €140.00 over". */
  allowanceOverText: (spent: string, limit: string, over: string) => string
  /** A named line on the ruler, e.g. "freeze at €1,800.00". */
  allowanceMarkerAt: (name: string, value: string) => string

  // Dot map. `value` arrives formatted ("12.4k").
  /** The map's name when the app gives none. */
  dotMap: string
  /** The map's description: how many regions it marks, and the largest. */
  dotMapSummary: (count: number, largest: string, value: string) => string

  // Rollout ruler. `percent` arrives formatted ("5%").
  /** The ruler's name when the app gives none. */
  rollout: string
  /** The stage at 0%: nobody has the feature. */
  rolloutOff: string
  /** The default first stage: the team's own accounts. */
  rolloutInternal: string
  rolloutBeta: string
  /** The default last stage, 100%: general availability, short. */
  rolloutGeneral: string
  /** A named stage as spoken: "Beta at 5%". */
  rolloutStageAt: (stage: string, percent: string) => string

  // Level matrix: roles by resources, each cell an access level.
  /** The grid's name when the app gives none. */
  permissions: string
  permissionNone: string
  permissionRead: string
  permissionWrite: string
  permissionAdmin: string
  /** A row header's checkbox: selects every cell of the role. */
  permissionSelectRow: (role: string) => string
  /** A column header's checkbox: selects the resource for every role. */
  permissionSelectColumn: (resource: string) => string
  permissionSelectAll: string
  /** The bulk bar's count of selected cells. */
  permissionSelected: (count: number) => string
  /** Names the bulk bar's level buttons. */
  permissionSetSelected: string
  /** Announced after a bulk change: "6 permissions set to Read". */
  permissionBulkSet: (count: number, level: string) => string
  /** Announced after a cell changes: "Editor, Billing: Write". */
  permissionChanged: (role: string, resource: string, level: string) => string
  /** A changed cell's description, until the change is applied: "changed from Read". */
  permissionWas: (level: string) => string
  /** A role whose cells can't be changed. */
  permissionLocked: string
  /** The grid's keyboard hint. */
  permissionHint: string
  // Operations instruments (StageRail, SeverityTimeline, LaneMeter, DayRing).
  // Durations, times and counts arrive formatted ("1 min 12 s", "02:00", "214").
  /** A stage rail's name when the app gives none. */
  stageRail: string
  stageQueued: string
  stageRunning: string
  stagePassed: string
  stageFailed: string
  stageSkipped: string
  /** A stage as spoken: its name, its state and, once it has one, its duration ("Test, Running, 48 s"). */
  stageItem: (name: string, status: string, duration: string) => string
  /** A severity timeline's name when the app gives none. */
  severityTimeline: string
  /** A severity level as spoken; the chip shows the code (SEV1). */
  severity: (level: number) => string
  milestoneAcknowledged: string
  milestoneMitigated: string
  milestoneResolved: string
  /** How long after the incident began an event came: "2 min after start". */
  sinceStart: (duration: string) => string
  /** A duration still running. */
  ongoing: string
  /** A timeline with nothing on it yet. */
  incidentNoEvents: string
  /** A lane meter's name when the app gives none. */
  laneMeter: string
  /** A lane's value against its capacity: "24 of 32". */
  laneOf: (value: string, max: string) => string
  /** An item's action as spoken: "Retry job-8f2a". */
  laneItemAction: (action: string, item: string) => string
  /** A day ring's name when the app gives none. */
  dayRing: string
  /** The ring's center: the run that comes next. */
  nextRun: string
  /** Its countdown: "in 1 h 12 min". */
  runsIn: (countdown: string) => string
  /** A run as spoken: "backup at 02:00". */
  scheduleRunAt: (name: string, time: string) => string
  /** How many runs the ring holds in a day. */
  scheduleRuns: (count: number) => string
  /** How many places runs collide. */
  scheduleOverlaps: (count: number) => string
  /** Jobs that collide, already joined as a list ("backup and reindex"), and when. */
  scheduleOverlapAt: (names: string, time: string) => string
  /** The ring's current-time hand. */
  now: string

  // Date and time pickers (today, last7Days, last30Days and thisMonth are shared with DataTable's date filter)
  chooseDate: string
  chooseDates: string
  startDate: string
  endDate: string
  pickStartDate: string
  pickEndDate: string
  /** The range picker's footer: "7 days: Jan 1, 2026 – Jan 7, 2026". */
  dateRangeSummary: (days: number, from: string, to: string) => string
  yesterday: string
  lastMonth: string
  yearToDate: string
  nextMonth: string
  previousMonth: string
  /** A calendar day's name; `date` is already formatted in the locale. */
  calendarDay: (date: string, today: boolean, selected: boolean) => string
  hours: string
  minutes: string
  dayPeriod: string

  // Number input
  increase: string
  decrease: string

  // Password input, strength meter and requirements
  showPassword: string
  capsLockOn: string
  passwordStrength: string
  passwordStrengthIs: (strength: string) => string
  noPassword: string
  passwordVeryWeak: string
  passwordWeak: string
  passwordFair: string
  passwordGood: string
  passwordStrong: string
  passwordMinLength: string
  passwordMixedCase: string
  passwordNumber: string
  passwordSymbol: string
  /** Read before a requirement that is met: "Done: A number". */
  requirementMet: string
  requirementUnmet: string

  // Combobox and multi-select
  noResults: string
  createOption: (text: string) => string
  /** Names the list of chosen chips. */
  selectedItems: string
  selectAll: string
  selectedSummary: (count: number, names: string) => string
  allSelected: (count: number) => string
  allDeselected: string
  countOfMaxSelected: (count: number, max: number) => string
  optionsShown: (shown: number, total: number) => string
  limitReached: string
  limitOfReached: (max: number) => string
  removed: (name: string) => string

  // Tag input
  tags: string
  addTag: string
  tagHint: string
  upToTags: (max: number) => string
  added: (name: string) => string
  addedTags: (count: number) => string
  alreadyAdded: (name: string) => string
  movedTo: (name: string, position: number, total: number) => string

  // Filter chips (added, removed and alreadyAdded are shared with the tag input; a chip's remove button is removeFilter)
  /** The field's placeholder while it holds no chips. */
  queryPlaceholder: string
  /** The field's placeholder after the chips. */
  queryAddAnother: string
  queryChipHint: string

  // Histogram range (its thumbs are minimumOf/maximumOf, or rangeMin/rangeMax without a label)
  /** A range as it's spoken, "€25 to €180"; both ends are already formatted. */
  valueRange: (from: string, to: string) => string

  // Color picker
  colour: string
  hue: string
  swatches: string
  accentSwatch: (theme: string) => string
  saturationBrightness: string
  saturationBrightnessValue: (saturation: string, brightness: string) => string
  pickColourFromScreen: string

  // One-time code input and resend
  verifyingCode: string
  codeVerified: string
  codeInvalid: string
  resendCode: string
  resendIn: (time: string) => string
  sending: string
  sent: string
  sendFailed: string

  // Multi-language input. `language` arguments are a locale's name in the
  // interface language ("German"); `fields` counts the fields of a form.
  language: string
  allLanguages: string
  /** The switcher's overflow key: "15 more languages". */
  moreLanguages: (count: number) => string
  searchLanguages: (count: number) => string
  noLanguageMatches: string
  /** The picker's filter: only locales with missing, outdated or unreviewed text. */
  needsWork: string
  nothingToTranslate: string
  pinnedLanguages: string
  recentLanguages: string
  regionAmericas: string
  regionEurope: string
  regionMiddleEastAfrica: string
  regionAsiaPacific: string
  regionOther: string
  translationSource: string
  translationComplete: string
  translationReview: string
  translationOutdated: string
  translationMissing: string
  /** Fields of a locale in one state: "2 missing", "1 outdated", "1 to review". */
  translationCount: (count: number, status: 'missing' | 'outdated' | 'review') => string
  previousToTranslate: string
  nextToTranslate: string
  translationProgress: string
  languagesComplete: (complete: number, total: number) => string
  /** One locale's progress across a form's fields. */
  fieldsComplete: (complete: number, total: number) => string
  copyFrom: (language: string) => string
  copiedFrom: (language: string) => string
  useSuggestion: string
  suggestionUsed: string
  markReviewed: string
  markedReviewed: (language: string) => string
  /** Under a translation made before the source last changed. */
  sourceChanged: (source: string) => string
  filledAutomatically: string
  requiredIn: (language: string) => string
  characterCount: (count: number, limit: number) => string
  charactersOver: (over: number) => string
  /** Announced when the edited language changes: "German, 2 missing". */
  editingLanguage: (language: string, state: string) => string
  everyLanguageComplete: string
  translationActions: string
  fillFromSource: (language: string) => string
  markAllReviewed: string
  clearLanguage: (language: string) => string
  clearLanguageDescription: (language: string, fields: number) => string
  translationBulkDone: (action: 'copy' | 'review' | 'clear', language: string, fields: number) => string

  // Phone input
  phoneCountry: (country: string, dial: string) => string

  // Rating
  stars: string
  noRating: string
  notRated: string
  ratingValue: (value: number, max: number, unit: string) => string
  ratedOutOf: (value: number, max: number) => string

  // Form submit
  checkForm: string

  // Wizard and stepper
  stepOf: (step: number, total: number) => string
  skip: string
  continue: string
  finish: string
  finishing: string
  checking: string
  checkStep: string
  optional: string
  steps: string
  stepCompleted: string
  stepCurrent: string
  stepUpcoming: string
  stepError: string

  // Data table. `count` arguments are the number already formatted in the
  // locale; `n` is the same number, to choose a plural. `noun` is the table's
  // `noun` prop (or `rowsNoun`), plural.
  rowsNoun: string
  /** Names a row that has no label of its own. */
  row: string
  rowNumber: (n: number) => string
  columns: string
  hiddenColumns: (n: number) => string
  toggleColumns: string
  resetColumns: string
  columnOptions: (column: string) => string
  sortAscending: string
  sortDescending: string
  clearSort: string
  pinToStart: string
  pinToEnd: string
  unpinned: string
  moveLeft: string
  moveRight: string
  hideColumn: string
  rowActions: (row: string) => string
  rowDensity: string
  compactRows: string
  standardRows: string
  comfortableRows: string
  export: string
  clearSearch: string
  filterBy: (column: string) => string
  filterNoOptions: (column: string) => string
  clearFilter: string
  clearFilters: string
  clearAll: string
  activeFilters: string
  removeFilter: (filter: string) => string
  /** A search term as a filter chip shows it. */
  quoted: (text: string) => string
  today: string
  last7Days: string
  last30Days: string
  thisMonth: string
  thisYear: string
  dateFrom: string
  dateTo: string
  filterFrom: (date: string) => string
  filterUntil: (date: string) => string
  rangeMin: string
  rangeMax: string
  minimumOf: (column: string) => string
  maximumOf: (column: string) => string
  rowsPerPage: string
  /** Names a table's scroll container when it overflows sideways. */
  tableScrollRegion: string
  firstPage: string
  previousPage: string
  nextPage: string
  lastPage: string
  /** The range in view, "1–10 of 240 rows"; `range` is already formatted. */
  rangeOf: (range: string, total: string, noun: string) => string
  pageOf: (page: string, total: string) => string
  noItems: (noun: string) => string
  selectionActions: string
  /** Follows the selected count in the bulk bar: "3 selected". */
  selected: string
  selectAllCount: (count: string, noun: string) => string
  clearSelectionShortcut: string
  selectRow: (row: string) => string
  selectAllRows: string
  selectAllOnPage: string
  sortedBy: (columns: string[]) => string
  sortedColumn: (column: string, descending: boolean) => string
  sortCleared: string
  selectionCleared: string
  selectedRows: (count: string, n: number) => string
  matchCount: (count: string, n: number, noun: string) => string
  totalCount: (count: string, n: number, noun: string) => string
  columnWidth: (column: string, px: number) => string
  cellOf: (column: string, row: string) => string
  cellSaved: (cell: string) => string
  /** `detail` is the failure's message, or ''. */
  cellSaveFailed: (cell: string, detail: string) => string
  gridHintArrows: string
  gridHintSelect: string
  gridHintEdit: string
  gridHintSort: string
  gridHintResize: string
  gridHintMenu: string
  loadFailed: (noun: string) => string
  tryAgain: string
  noMatches: (noun: string) => string
  noMatchesHint: string
  emptyHint: (noun: string) => string
  enterNumber: string
  enterAtLeast: (min: number) => string
  enterAtMost: (max: number) => string
  cannotBeUndone: string
  itemCount: (count: string, n: number, noun: string) => string
  confirmTitle: (action: string, what: string) => string
  confirmAction: (action: string, what: string) => string
  confirmPending: (action: string, what: string) => string
  views: string
  /** Read after a view's name when it has unsaved changes. */
  viewModified: string
  savedViews: string
  savedViewsEmpty: string
  saveViewChanges: (view: string) => string
  revertChanges: string
  saveAsNewView: string
  deleteView: (view: string) => string
  saveView: string
  saveViewDescription: string
  viewName: string
  viewNamePlaceholder: string
  viewNameTaken: string

  // Copy and save feedback (chat copy buttons, avatar upload)
  copy: string
  copied: string
  copyFailed: string
  saving: string
  saved: string
  saveFailed: string
  /** Under a minute ago, in relative times ("just now"). */
  justNow: string

  // Chat
  chatSources: string
  chatSuggestions: string
  chatThinking: string
  chatReasoning: string
  /** The folded reasoning's label; `seconds` is how long it thought. */
  chatThoughtFor: (seconds: number) => string
  chatToolQueued: string
  chatToolRunning: string
  /** A tool call's run time, from milliseconds. */
  chatToolDuration: (ms: number) => string
  chatToolFailed: (tool: string, error?: string) => string
  chatToolArguments: string
  chatToolResult: string
  chatToolError: string
  // ToolApproval: an agent asks before a risky action
  /** The approval card's accessible name. */
  toolApproval: string
  toolApprovalRiskLow: string
  toolApprovalRiskMedium: string
  toolApprovalRiskHigh: string
  /** The label above the agent's stated reason. */
  toolApprovalReason: string
  toolApprovalAllowOnce: string
  /** Allow every later call within `scope` ("this project"). */
  toolApprovalAlwaysAllow: (scope: string) => string
  toolApprovalDeny: string
  toolApprovalEdited: string
  toolApprovalShowMore: string
  toolApprovalShowLess: string
  /** Reveals a masked argument; `name` is its key. */
  toolApprovalShowValue: (name: string) => string
  toolApprovalHideValue: (name: string) => string
  /** Read out in place of a masked value. */
  toolApprovalHidden: string
  toolApprovalPending: string
  toolApprovalApproved: string
  toolApprovalDenied: string
  toolApprovalExpired: string
  /** The resolved line when the approver is known. */
  toolApprovalApprovedBy: (who: string) => string
  toolApprovalDeniedBy: (who: string) => string
  /** Under a denied or expired request: nothing ran. */
  toolApprovalNotRun: string
  toolApprovalDeniedReason: (reason: string) => string
  toolApprovalRequired: string
  toolApprovalNotNumber: string
  toolApprovalNotJson: string
  toolApprovalNotBoolean: string
  /** Spoken when a request appears; `risk` is the risk tier's label. */
  toolApprovalAnnounce: (tool: string, risk: string) => string
  chatTable: string
  chatConversation: string
  chatJumpToLatest: string
  chatAssistant: string
  chatYou: string
  chatSystem: string
  chatResponding: (name: string) => string
  chatResponseFailed: (name: string, error: string) => string
  chatRegenerate: string
  chatGoodResponse: string
  chatBadResponse: string
  chatMessageActions: string
  chatEditMessage: string
  chatPromptPlaceholder: string
  chatPromptLabel: string
  chatAttachFiles: string
  chatAttachments: string
  chatStopGenerating: string
  chatSendMessage: string
  chatStop: string
  /** The prompt counter's default unit. */
  chatCharacters: string
  chatOverLimit: (count: number, unit: string) => string
  chatLeft: (count: number, unit: string) => string
  chatUploading: string
  chatUploadFailed: string
  /** The name of an image pasted without a file name. */
  chatPastedImage: string

  // Kanban
  kanbanBoard: string
  /** aria-roledescription of the board and its cards. */
  kanbanRoleBoard: string
  kanbanRoleCard: string
  kanbanInstructions: string
  kanbanLane: (lane: string) => string
  /** Where a card is; `overLimit` is the column's limit when it's exceeded. */
  kanbanPlace: (column: string, lane: string | undefined, position: number, count: number, overLimit?: number) => string
  kanbanPickedUp: (card: string, place: string) => string
  kanbanPickedUpKeyboard: (card: string, place: string) => string
  kanbanDropped: (card: string, place: string) => string
  kanbanCancelled: (card: string, place: string) => string
  kanbanMoveFailed: (card: string, column: string) => string
  kanbanExpand: (column: string) => string
  kanbanCollapse: (column: string) => string
  kanbanCardCount: (count: number, limit?: number, over?: boolean) => string
  kanbanNoCards: string
  kanbanAddCard: string
  kanbanNewCard: (column: string) => string
  kanbanCardTitle: string

  // Tree view
  treeLoadingItem: (name: string) => string
  treeLoaded: (name: string) => string
  treeLoadFailed: (name: string) => string
  treeRename: (name: string) => string
  treeRenamed: (name: string) => string

  // Notification center
  notifications: string
  notificationsUnread: (count: number) => string
  notificationNew: (text: string) => string
  notificationsNew: (count: number) => string
  notificationsMarkAllRead: string
  notificationsMarkRead: string
  notificationsAll: string
  notificationsUnreadTab: string
  notificationsMentions: string
  notificationsEmptyTitle: string
  notificationsEmptyDescription: string
  notificationsCaughtUpTitle: string
  notificationsCaughtUpDescription: string
  notificationsNoMentionsTitle: string
  notificationsNoMentionsDescription: string
  notificationsRecent: string
  notificationsEarlier: string
  /** Spoken before an unread item's text. */
  notificationUnreadPrefix: string

  // Timeline
  timelineCommit: string
  timelineComment: string
  timelineDeploy: string
  timelineAlert: string
  timelineMerge: string
  timelinePullRequest: string
  timelineActivity: string
  timelineEmptyTitle: string
  timelineEmptyDescription: string
  timelineLoadMore: string
  timelineLoadingOlder: string
  timelineEnd: string
  timelineDetails: string
  timelineHideDetails: string

  // File and avatar upload
  fileUploaded: (name: string) => string
  fileUploadedTile: (name: string) => string
  fileUploadFailed: string
  fileFailedToUpload: (name: string, error: string) => string
  /** `types` is the accepted list, e.g. "PNG or JPG". */
  fileUnsupported: (name: string, types?: string) => string
  fileTooLarge: (name: string, size: string, limit: string) => string
  fileDuplicate: (name: string) => string
  fileTooMany: (name: string, max: number) => string
  filesAdded: (count: number) => string
  filesRejected: (count: number) => string
  fileRemoved: (name: string) => string
  fileRetrying: (name: string) => string
  /** "PNG, JPG or PDF". */
  fileTypeList: (types: string[]) => string
  /** A wildcard MIME group, e.g. image/* → "images". */
  fileTypeGroup: (type: string) => string
  fileMaxSize: (size: string, each: boolean) => string
  fileMaxFiles: (max: number) => string
  fileDropToUpload: string
  /** The drop zone's prompt, before the "browse" link. */
  fileDropPrompt: (kind: 'images' | 'files' | 'file') => string
  fileBrowse: string
  fileListImages: string
  fileListFiles: string
  fileStatusUploaded: string
  fileRetry: (name: string) => string
  fileRetryError: (name: string, error: string) => string
  fileCancelUpload: (name: string) => string
  fileUploading: (name: string) => string
  avatarUnsupported: (name: string, types: string) => string
  avatarChangePhoto: string
  avatarUploadPhoto: string
  avatarPhotoOf: (name: string) => string
  avatarProfilePhoto: string
  avatarRemove: string
  avatarCropTitle: string
  avatarCropDescription: string
  avatarCropArea: string
  avatarCropLabel: string
  avatarCropInstructions: string
  avatarReadFailed: string
  avatarZoom: string
  avatarZoomIn: string
  avatarZoomOut: string
  avatarSavePhoto: string

  // Avatar stack
  avatarStackPeople: string
  /** "Ada and Grace", "Ada, Grace and 3 others". */
  avatarStackNames: (names: string[]) => string
  avatarStackShowAll: (count: number, label: string) => string
  presenceOnline: string
  presenceAway: string
  presenceBusy: string
  presenceOffline: string

  // App frame: the account's status, page search and the docs tree's filter
  presenceDoNotDisturb: string
  presenceInvisible: string
  /** Heads the status choices. */
  presenceStatus: string
  /** Announced when the status changes: "Status set to Away". */
  presenceSetTo: (status: string) => string
  /** Names a list of an app's pages. */
  pages: string
  /** Announced as a search or filter finds pages: "3 pages". */
  pagesFound: (count: number) => string
  /** A page search that finds nothing: No pages match “atl”. */
  pagesNoMatch: (query: string) => string
  filterPages: string
  filterPagesPlaceholder: string
  /** Under a page search that found nothing, when Enter searches everything. */
  searchEverything: string

  // Account and workspace menus
  accountMenu: (name: string) => string
  accountTheme: string
  accountPreset: string
  accountAppearance: string
  colorModeLight: string
  colorModeDark: string
  colorModeSystem: string
  signOut: string
  workspaces: string
  workspaceCreate: string
  workspaceCreateNamed: (label: string, name: string) => string
  workspaceSearch: string
  workspaceSwitch: (name: string) => string
  workspaceChoose: string
  workspaceNoMatch: string

  // Banner
  announcement: string
  dismissAnnouncement: string

  // Code block (and chat's code)
  /** A code block's language when it has none. */
  code: string
  codeBlock: (language: string) => string
  copyCode: string

  // Diff viewer
  /** The diff's name when it has no file name. */
  diffViewer: string
  /** What the counts in the header say: "12 additions, 3 deletions". */
  diffSummary: (additions: number, deletions: number) => string
  /** The view switcher's name. */
  diffView: string
  diffUnified: string
  diffSplit: string
  diffWrap: string
  /** Read before an added line's text: "Added line 12". */
  diffAddedLine: (line: number) => string
  /** Read before a removed line's text: "Removed line 9". */
  diffRemovedLine: (line: number) => string
  /** A collapsed run of unchanged lines, as its button says it. */
  diffUnchanged: (count: number) => string
  /** Where the keyboard is among the changes: "Change 3 of 7". */
  diffChange: (index: number, total: number) => string
  /** How many changes there are, before one is chosen: "7 changes". */
  diffChanges: (count: number) => string
  diffNextChange: string
  diffPreviousChange: string
  diffNoChanges: string
  diffNoNewline: string
  /** The old and the new side's column names. */
  diffBefore: string
  diffAfter: string
  /** How to move between changes, described on the diff. */
  diffHint: string

  // Sortable list. `place` is sortablePosition's text.
  sortableInstructions: string
  sortableRoleItem: string
  sortableReorder: string
  sortableReorderItem: (item: string) => string
  sortablePosition: (position: number, count: number) => string
  sortablePickedUp: (item: string, place: string) => string
  sortablePickedUpKeyboard: (item: string, place: string) => string
  sortableMoved: (item: string, place: string) => string
  sortableDropped: (item: string, place: string) => string
  sortableCancelled: (item: string, place: string) => string

  // Treemap. `value`, `total` and `share` arrive formatted ("214 GB", "35%").
  /** The map's name when the app gives none. */
  treemap: string
  /** A chart with nothing to show. */
  noData: string
  /** A part's share, in its tooltip: "35% of total". */
  shareOfTotal: (share: string) => string
  /** A cell as spoken: its name, value and share, and whether it's highlighted. */
  treemapItem: (name: string, value: string, share: string, highlighted: boolean) => string
  /** The map's description: how many parts, their total, and the largest. */
  treemapSummary: (count: number, total: string, largest: string, share: string) => string
  // RefillMeter. `tokens`, `capacity`, `rate` and `burst` arrive formatted.
  /** The bucket's name and header label when the app gives none. */
  bucketTokens: string
  /** Over the refill rate: "Refill +10/s". */
  bucketRefill: string
  /** Over the time until the bucket is full again. */
  bucketFullIn: string
  /** In place of that time while the bucket is full. */
  bucketFull: string
  /** In place of that time while the bucket is empty and requests are refused. */
  bucketEmpty: string
  /** The burst marker's name. */
  bucketBurst: string
  /** The meter's value: "42 of 60 tokens, refilling 10 a second". */
  bucketValueText: (tokens: string, capacity: string, rate: string) => string
  /** Added to the value while the level is under the burst marker: "under the burst of 20". */
  bucketUnderBurst: (burst: string) => string

  // DistributionStrip. Values arrive formatted ("84 ms", "97.4%").
  /** The strip's name when the app gives none. */
  latencyDistribution: string
  /** Over the share of requests within the objective. */
  latencyWithinSlo: string
  /** The objective's line on the strip: "SLO 300 ms". */
  latencySloAt: (value: string) => string
  /** The strip's text summary: how many requests were sampled and their percentiles, already listed ("p50 84 ms, p90 212 ms"). */
  latencySummary: (count: number, percentiles: string) => string
  /** Added to the summary when there is an objective: "97.4% within the 300 ms SLO." */
  latencyWithin: (share: string, slo: string) => string

  // HistoryStrip. `date` arrives formatted in the locale, `uptime` and `average` as percentages.
  /** The strip's name when the app gives none. */
  uptime: string
  /** A day as spoken, and its tooltip's head: "Sep 12: 99.98% uptime". */
  uptimeDay: (date: string, uptime: string) => string
  /** A day without data. */
  uptimeNoData: (date: string) => string
  /** A day's incidents: "No incidents", "1 incident". */
  uptimeIncidents: (count: number) => string
  /** A day's downtime, already formatted as a duration: "12 min down". */
  uptimeDowntime: (duration: string) => string
  /** The strip's description: how many days, the average, and how many days had downtime. */
  uptimeSummary: (days: number, average: string, affected: number) => string

  // ForecastBand. Amounts and dates arrive formatted.
  /** The chart's name when the app gives none. */
  forecast: string
  /** The legend's name for spend so far. */
  forecastActual: string
  /** The legend's name for the projected line. */
  forecastProjected: string
  /** The legend's name for the confidence band. */
  forecastRange: string
  /** The budget line's name. */
  forecastBudget: string
  /** The crossing marker: "Crosses budget Sep 24". */
  forecastCrosses: (date: string) => string
  /** The chart's text summary. */
  forecastSummary: (spent: string, budget: string, projected: string, low: string, high: string) => string
  /** Added to the summary when the forecast stays under the budget. */
  forecastWithin: string

  // Share ring. `total` and `share` arrive formatted ("1,240 kcal", "28%").
  /** One part of the ring as spoken: "Protein 28%". */
  shareRingPart: (name: string, share: string) => string
  /** The ring as spoken: its total, then each part in order. */
  shareRingSummary: (total: string, parts: string[]) => string

  // Activity rings. `value`, `max` and `percent` arrive formatted ("420", "500 calories", "84%").
  /** The rings' name when the app gives none. */
  activityRings: string
  /** One ring as spoken: "Move: 420 of 500 calories, 84%". */
  activityRingsValue: (name: string, value: string, max: string, percent: string) => string

  // Slot grid. Days and times arrive formatted ("Tue 29 Sep", "10:00").
  /** The grid's name when the app gives none. */
  slotGrid: string
  /** How to move through the grid from the keyboard. */
  slotGridHint: string
  /** Spots still free in a slot, shown in the cell: "3 left". */
  slotGridLeft: (left: number) => string
  /** A slot with no spots left. */
  slotGridFull: string
  /** A time that isn't offered on that day. */
  slotGridClosed: string
  /** The legend's word for a slot with only a few spots left. */
  slotGridFew: string
  /** The legend's word for a slot with room. */
  slotGridOpen: string
  /** The slot the viewer has already booked. */
  slotGridMine: string
  /** A cell as spoken: the day, the time and its state ("3 left", "Full"). */
  slotGridCell: (day: string, time: string, status: string) => string
  /** The day picker's name in the one-day view. */
  slotGridDays: string
  /** Under a day in the day picker: how many slots still have room. */
  slotGridOpenCount: (count: number) => string

  // Waveform scrubber. Times arrive formatted ("12:34").
  /** The playhead's name when the app gives none. */
  waveformSeek: string
  /** The playhead's value as spoken: "12:34 of 42:10", then the chapter it's in. */
  waveformPosition: (time: string, total: string, chapter?: string) => string
  waveformClipStart: string
  waveformClipEnd: string

  // Progress list. Sizes, rates and times arrive formatted ("48 MB", "0:42").
  /** The list's name when the app gives none. */
  transfers: string
  transferPause: (name: string) => string
  transferResume: (name: string) => string
  transferCancel: (name: string) => string
  /** Bytes moved of the file's size: "48 MB of 120 MB". */
  transferProgress: (done: string, total: string) => string
  /** Time until a transfer finishes: "0:42 left". */
  transferLeft: (time: string) => string
  transferQueued: string
  transferPaused: string
  /** Announced when a transfer completes. */
  transferFinished: (name: string) => string
  /** Announced when a transfer fails. */
  transferFailed: (name: string) => string
  /** The overall meter's name: "3 of 14 files". */
  transferFiles: (done: number, total: number) => string
  transferRate: string
  transferTimeLeft: string
  transferPauseAll: string
  transferResumeAll: string
  transferCancelAll: string
  /** Folds a list shown in full back to its first rows. */
  showFewer: string

  // Progress path. `status` arrives as lessonDone, lessonCurrent or lessonLocked.
  /** The path's name when the app gives none. */
  progressPath: string
  /** How to move through the lessons from the keyboard. */
  progressPathHint: string
  /** A lesson as spoken: its title, its place in the course, its status and its mastery. */
  lessonItem: (title: string, position: number, count: number, status: string, mastery: number, levels: number) => string
  /** A milestone at a section's end, as spoken: "Café checkpoint, milestone, locked". */
  milestoneItem: (title: string, status: string) => string
  lessonDone: string
  lessonCurrent: string
  lessonLocked: string
  /** The callout over the current lesson. */
  lessonStart: string
  /** A section's progress: "3 of 6 lessons". */
  sectionProgress: (done: number, total: number) => string

  // Segmented ring. Times arrive formatted ("0:24").
  /** The timer's name when the app gives none. */
  intervalTimer: string
  intervalWork: string
  intervalRest: string
  intervalWarmup: string
  intervalCooldown: string
  intervalRound: string
  /** "Round 3 of 8". */
  intervalRoundOf: (round: number, rounds: number) => string
  /** Time left in the current interval: "0:24 left". */
  intervalLeft: (time: string) => string
  /** Announced as an interval starts: its phase, its length and what follows. */
  intervalStarted: (phase: string, time: string, next?: string) => string
  /** Announced when the last interval ends. */
  intervalFinished: string
  intervalNext: string

  // Seat map. Prices arrive formatted ("€48"); `status` as seatAvailable, seatUnavailable or seatSelected.
  /** The map's name when the app gives none. */
  seatMap: string
  /** How to move through the seats from the keyboard. */
  seatMapHint: string
  seatMapStage: string
  /** A seat as spoken: "Row F, seat 12, €48, available". */
  seatItem: (row: string, seat: number, price: string, status: string) => string
  seatAvailable: string
  seatUnavailable: string
  seatSelected: string
  seatRow: (row: string) => string
  seatNumber: (seat: number) => string
  /** Announced when a seat is picked. */
  seatAdded: (row: string, seat: number) => string
  /** Announced when a seat is let go. */
  seatRemoved: (row: string, seat: number) => string
  /** Announced when the limit stops a pick. */
  seatLimit: (max: number) => string

  // Dial. Values arrive formatted ("21.5 °C").
  /** The dial's name when the app gives none. */
  dial: string
  /** Over the measured value: "Now 19.8°". */
  dialNow: string
  /** The value as spoken with the measured one: "21.5 °C, now 19.8 °C". */
  dialValueNow: (value: string, now: string) => string
  /** A mark on the dial, spoken in its description: "Night: 17 °C". */
  dialMark: (label: string, value: string) => string

  // Time lanes. Times arrive formatted ("Mon 09:00").
  /** The rota's name when the app gives none. */
  rota: string
  rotaNow: string
  /** A shift as spoken: who, from and until when, and whether it's an override. */
  rotaShift: (name: string, start: string, end: string, override: boolean) => string
  rotaOverride: string
  /** In a shift's detail: who takes over when it ends. */
  rotaHandoff: (name: string) => string
  /** How to move through the lanes from the keyboard. */
  rotaHint: string
  rotaOnCall: string
  rotaUpcoming: string
  rotaEnded: string

  // Diff bar. `by` arrives formatted ("22%").
  /** The verdict: "B is better by 22%". */
  diffBetter: (name: string, by: string) => string
  /** Neither side is better. */
  diffEven: string

  // Calendar heatmap. Dates arrive formatted ("Mon 28 Sep").
  /** The grid's name when the app gives none. */
  calendarHeatmap: string
  /** A day as spoken: its date, then its state ("Mon 28 Sep, Done"). */
  streakDay: (date: string, state: string) => string
  streakDone: string
  streakMissed: string
  /** A day a freeze token covered: it keeps the streak alive. */
  streakFrozen: string
  /** A day of several habits: "3 of 5 done". */
  streakPartial: (done: number, total: number) => string
  streakToday: string
  streakMarkDone: string
  /** Announced when today is marked done, with the streak it makes. */
  streakTodayDone: (days: number) => string
  /** Announced when today's mark is taken back. */
  streakTodayUndone: string
  streakCurrent: string
  streakLongest: string
  streakRate: string
  streakFreezes: string
  /** A length in days, for the figures: "23 days". */
  streakDays: (days: number) => string
  /** Freeze tokens still in hand: "2 left". */
  streakFreezesLeft: (left: number) => string
  /** The flame meter's goal: "30-day milestone". */
  streakMilestone: (days: number) => string
  /** The legend's ends. */
  streakLess: string
  streakMore: string

  // Allocation meter. Amounts arrive formatted ("€212.40").
  /** The envelopes' name when the app gives none. */
  envelopes: string
  envelopeLeft: (amount: string) => string
  envelopeOver: (amount: string) => string
  /** An envelope's value as spoken: "€212 left of €400". */
  envelopeOf: (left: string, budget: string) => string
  envelopeRollover: (amount: string) => string
  envelopeRolloverTag: string
  envelopeOverspentTag: string
  /** How to move money from the keyboard. */
  envelopeHint: string
  /** Announced when money is picked up. */
  envelopePickedUp: (amount: string, from: string) => string
  /** Announced as the target or amount changes. */
  envelopeTarget: (amount: string, from: string, to: string) => string
  /** Announced when money lands. */
  envelopeMoved: (amount: string, from: string, to: string) => string
  envelopeMoveCancelled: string

  // Day rail. Places and times arrive formatted ("Lisbon", "09:40", "+1 h").
  /** The rail's name when the app gives none. */
  itinerary: string
  /** A day's tab: "Day 3". */
  itineraryDay: (day: number) => string
  /** A leg as spoken: from, to, and when. */
  itineraryLeg: (from: string, to: string, depart: string, arrive: string) => string
  /** The clock change on arrival: "Local time +1 h". */
  itineraryTimeShift: (shift: string) => string
  /** A stay's length: "3 nights". */
  itineraryNights: (nights: number) => string
  itineraryNow: string
  /** Now falls inside a leg. */
  itineraryInTransit: string

  // Capsules (CapsulePlayer) and the gradient slider.
  /** The play button’s name. */
  play: string
  pause: string
  previousTrack: string
  nextTrack: string
  /** A gradient slider’s value as spoken: the figure, then the zone it sits in ("0.62, Balanced"). */
  gradientSliderValue: (value: string, zone?: string) => string
  // Zoom, shared by the canvases that scale (FlowGraph, TrackTimeline).
  zoomIn: string
  zoomOut: string
  /** Scale and center the whole of the content in view. */
  zoomToFit: string

  // Flow graph. Step names arrive as given ("git.log"); lists of names arrive joined ("plan and git.log").
  /** The graph's name when the app gives none. */
  flowGraph: string
  /** How to move through the graph from the keyboard. */
  flowGraphHint: string
  flowQueued: string
  flowRunning: string
  flowSucceeded: string
  flowFailed: string
  flowRetried: string
  flowSkipped: string
  /** A step as spoken: its name, its state, then any figure the app gives ("1.2 s"). */
  flowGraphNode: (name: string, status: string, detail?: string) => string
  /** The steps a step waits on: "After plan and git.log". */
  flowGraphAfter: (names: string) => string
  /** The steps that follow it: "Then notes.draft". */
  flowGraphThen: (names: string) => string
  /** How many times a step ran: "2 attempts". */
  flowGraphAttempts: (count: number) => string

  // Track timeline. Times arrive formatted ("0:12.5").
  /** The timeline's name when the app gives none. */
  trackTimeline: string
  /** How to move and trim a clip from the keyboard. */
  trackTimelineHint: string
  /** A clip as spoken: its name, its range, then its track. */
  trackTimelineClip: (name: string, range: string, track: string) => string
  /** A clip's span: "0:12.5 to 0:24.0". */
  trackTimelineRange: (start: string, end: string) => string
  /** The handle that trims a clip's start. */
  trackTimelineClipStart: (name: string) => string
  /** The handle that trims a clip's end. */
  trackTimelineClipEnd: (name: string) => string
  trackTimelineMute: (track: string) => string
  trackTimelineSolo: (track: string) => string
  trackTimelinePlayhead: string

  // Data grid. It reuses the data table's keys; these are its own.
  spaciousRows: string
  groupBy: string
  noGrouping: string
  /** Announced when rows are grouped: "Grouped by Status". */
  groupedBy: (column: string) => string
  groupingCleared: string
  /** The expander of a row with a detail panel: "Show details for Northwind". */
  showDetails: (row: string) => string
  hideDetails: (row: string) => string
  /** A copy button's name: "Copy cus_8f2a91". */
  copyValue: (value: string) => string
  sortBy: string
  /** The toolbar key that adds a filter. */
  addFilter: string
  booleanYes: string
  booleanNo: string
  /** A meter's value in words: "18 of 25"; both are already formatted. */
  valueOfMax: (value: string, max: string) => string
  gridHintOpen: string
  /** Labels a group's footer figures. */
  groupTotal: string
  groupAverage: string

  // Item pager
  /** Names the stepper's group: "Records". */
  records: string
  previousRecord: string
  nextRecord: string
  /** Where the open record sits in the list: "5 of 48"; both are already formatted. */
  recordOf: (position: string, total: string) => string

  // Property list
  /** Names a row's edit button: "Edit Owner". */
  editProperty: (label: string) => string

  // Proposals, detours and routes
  /** A suggestion not yet accepted: a proposed shift, a proposed route. */
  proposed: string
  /** Read after the step a detour leaves from: "Detour, rejoins at step 4". */
  stepDetour: (step: number) => string
  /** The route map's name when the app gives none. */
  routeMap: string
  routeOnTime: string
  routeDelayed: string
  /** A stretch of route already driven. */
  routeDone: string
  routeOrigin: string
  routeDestination: string
  /** Where the vehicle is now. */
  routeCurrent: string
  routeStop: string
  /** Names an annotated image's list of callouts. */
  annotations: string
  /** Names an image accordion's group of panels when the app gives none. */
  imageAccordion: string

  // UnitChart. `value` and `total` arrive formatted ("28 covers").
  /** The chart's name when the app gives none. */
  unitChart: string
  /** A column as spoken: its label and value, and whether it's in the highlighted range. */
  unitChartItem: (label: string, value: string, highlighted: boolean) => string
  /** The chart's description: how many columns, their total, and the peak. */
  unitChartSummary: (count: number, total: string, peak: string, value: string) => string

  // WaffleChart. Its parts are spoken with `treemapItem` and described with `treemapSummary`.
  /** The chart's name when the app gives none. */
  waffleChart: string

  // ForecastBand's scenario. `projected` arrives formatted.
  /** The legend's name for a scenario path when the app gives none. */
  forecastScenario: string
  /** Added to the summary for a scenario: its name and where it ends. */
  forecastScenarioSummary: (name: string, projected: string) => string

  // FlowLanes. `value`, `share` and `total` arrive formatted ("57/s", "17%").
  /** The chart's name when the app gives none. */
  flowLanes: string
  /** A lane as spoken: its name, its rate and its share of the whole. */
  flowLanesItem: (label: string, value: string, share: string) => string
  /** The chart's description: the source, how many lanes it feeds and their total. */
  flowLanesSummary: (source: string, lanes: number, total: string) => string

  // CellBar. A cell is a period of the total: "Mar: $1,240". Amounts arrive formatted.
  /** The bar's name when the app gives none. */
  cellBar: string
  /** A cell as spoken: its period and amount, and whether it is projected rather than actual. */
  cellBarItem: (label: string, value: string, projected: boolean) => string
  /** The bar's description: its total. */
  cellBarSummary: (total: string) => string
  /** Added to the description when part of the total is projected. */
  cellBarProjected: (amount: string) => string
  /** Added to the description when the bar has a target (a plan, a budget). */
  cellBarTarget: (target: string) => string

  // LollipopChart. A point is spoken with `unitChartItem` (its label and value).
  /** The chart's name when the app gives none. */
  lollipopChart: string
  /** The chart's description: how many points, and the lowest and highest values. */
  lollipopChartSummary: (count: number, low: string, high: string) => string

  // History, shared by the editors that keep one (SignaturePad, Whiteboard).
  undo: string
  redo: string
  /** Back to the actual size (100%). */
  zoomReset: string

  // SignaturePad
  /** The pad's name when the app gives none. */
  signaturePad: string
  /** How to sign, from a pointer or the keyboard. */
  signaturePadHint: string
  /** Shown on the empty pad, over its line. */
  signHere: string
  /** Names the Draw / Sign by typing tabs. */
  signatureMethod: string
  signatureDraw: string
  signatureType: string
  /** The typed signature's field. */
  signatureTypedName: string
  /** Announced when the pad is cleared. */
  signatureCleared: string
  /** The seal on an accepted signature, and its state for assistive tech. */
  signatureSigned: string
  /** Accepts the signature and locks it. */
  signatureAccept: string
  /** Shown on the Accept button while the app takes the signature. */
  signatureAccepting: string
  /** Shown on the Accept button, and announced, once the signature is accepted. */
  signatureAccepted: string
  /** The accepted signature's state for assistive tech, with when it was signed. */
  signatureSignedAt: (time: string) => string
  /** Announced as the accepted signature locks. */
  signatureLocked: string
  /** Unlocks an accepted signature to sign again. */
  signatureResign: string
  /** Announced when Re-sign unlocks the signature. */
  signatureUnlocked: string

  // Whiteboard. Shape names arrive from the tool keys below ("Rectangle").
  /** The board's name when the app gives none. */
  whiteboard: string
  /** How to work the board from the keyboard. */
  whiteboardHint: string
  /** Names the toolbar. */
  whiteboardTools: string
  whiteboardSelect: string
  /** The tool that pans the view. */
  whiteboardHand: string
  whiteboardPen: string
  whiteboardLine: string
  whiteboardArrow: string
  whiteboardRectangle: string
  whiteboardEllipse: string
  whiteboardText: string
  whiteboardColor: string
  whiteboardWidth: string
  whiteboardThin: string
  whiteboardMedium: string
  whiteboardBold: string
  /** The palette: the theme's ink, its accent, then its status hues. */
  whiteboardInk: string
  whiteboardAccent: string
  whiteboardRed: string
  whiteboardAmber: string
  whiteboardGreen: string
  whiteboardBlue: string
  whiteboardDelete: string
  /** The placeholder of a text shape being written. */
  whiteboardTextPlaceholder: string
  /** The board's contents, spoken after each change: "3 shapes". */
  whiteboardSummary: (count: number) => string
  /** Announced when the selection changes: "2 selected". */
  whiteboardSelected: (count: number) => string
  /** Announced when a shape is drawn: "Rectangle added". */
  whiteboardAdded: (shape: string) => string
  /** Announced when shapes are deleted: "2 shapes deleted". */
  whiteboardDeleted: (count: number) => string
  /** A text shape as spoken: its kind, then what it says. */
  whiteboardShapeText: (shape: string, text: string) => string
  /** The tools that came with stickies, connectors and comments. */
  whiteboardSticky: string
  whiteboardConnector: string
  whiteboardComment: string
  /** A frame holding the app’s own content, as spoken: "Embed: Revenue". */
  whiteboardEmbed: string
  /** How a connector runs: straight or in right angles. */
  whiteboardRoute: string
  whiteboardStraight: string
  whiteboardElbow: string
  /** What a connector joins, as spoken: "Sign up to Verify email". */
  whiteboardConnects: (from: string, to: string) => string
  /** A connector end that is not attached to a shape. */
  whiteboardPoint: string
  /** The menu that lines up or spreads out the selection. */
  whiteboardArrange: string
  whiteboardAlignLeft: string
  whiteboardAlignCenter: string
  whiteboardAlignRight: string
  whiteboardAlignTop: string
  whiteboardAlignMiddle: string
  whiteboardAlignBottom: string
  whiteboardDistributeHorizontal: string
  whiteboardDistributeVertical: string
  /** The zoom menu’s name. */
  whiteboardView: string
  whiteboardZoomToSelection: string
  whiteboardMinimap: string
  whiteboardSnapToGrid: string
  whiteboardShortcuts: string
  /** Shortcut list rows. */
  whiteboardPan: string
  whiteboardNudge: string
  whiteboardSelectAll: string
  /** Names the comment pins. */
  whiteboardComments: string
  /** A comment pin as spoken: its number, and who started it when known. */
  whiteboardPin: (index: number, author?: string) => string
  whiteboardResolve: string
  whiteboardReopen: string
  whiteboardResolved: string
  whiteboardDeleteComment: string
  /** The placeholder of a new comment. */
  whiteboardCommentPlaceholder: string
  // VoiceOrb. The image's name is `voiceOrbState(name, state)`; a state change is announced as the state.
  /** The orb's name when the app gives none. */
  voiceOrb: string
  voiceOrbIdle: string
  voiceOrbListening: string
  voiceOrbThinking: string
  voiceOrbSpeaking: string
  /** A state while the person's microphone is off. */
  voiceOrbMuted: (state: string) => string
  /** The image's accessible name: the agent's name and what it's doing. */
  voiceOrbState: (name: string, state: string) => string

  // WorldClock. Times arrive formatted for the locale, the day as Intl's relative word ("tomorrow").
  /** The whole's name when the app gives none. */
  worldClock: string
  /** The cursor's name: the moment being proposed. */
  worldClockCursor: string
  /** How to move the cursor from the keyboard. */
  worldClockHint: string
  /** A moment at one place: "03:00 tomorrow in Los Angeles". `day` is empty on the first zone's day. */
  worldClockTime: (time: string, place: string, day: string) => string
  /** The first zone's time, then the others' as a list: "10:00 in London is 18:00 in Singapore and 02:00 tomorrow in Los Angeles". */
  worldClockSummary: (first: string, others: string) => string
  /** When everyone is in working hours, as ranges in the first zone: "14:00 – 16:00". */
  worldClockOverlap: (ranges: string) => string
  worldClockNoOverlap: string
  worldClockWorkingHours: string
  /** Waking hours outside work. */
  worldClockOutsideHours: string
  worldClockNight: string
  worldClockDaytime: string
  /** The legend's name for the hours everyone shares. */
  worldClockEveryone: string
  // Hold to confirm (Button hold), Slide to Confirm
  /** Describes a button that acts only after a press is held. */
  holdToConfirm: string
  /** The Slide to Confirm track's label and the thumb's name. */
  slideToConfirm: string
  /** How to confirm without a pointer. */
  slideToConfirmHint: string
  /** Shown and announced once the slide's action has finished. */
  confirmed: string
  /** Inline Confirm's question, shown beside its Cancel and confirm buttons and announced as it opens. */
  inlineConfirmPrompt: string
  /** The title of the dialog that warns an inactive session is about to end. */
  sessionTimeoutTitle: string
  /** The warning line, with the time left ("1:42"; read as words when announced). */
  sessionTimeoutWarning: (time: string) => string
  /** Why the session ends, under the warning. */
  sessionTimeoutReason: string
  /** Keeps the session going. */
  sessionTimeoutStay: string
  /** Ends the session now. */
  sessionTimeoutSignOut: string
  /** The signed-out page's title. */
  sessionTimeoutDoneTitle: string
  /** The signed-out page's explanation. */
  sessionTimeoutDoneBody: string
  /** Takes the person back to sign in. */
  sessionTimeoutSignIn: string
  // Filter builder
  /** Names the filter builder’s outer group. */
  filterBuilder: string
  /** The AND choice of a group’s switch, and the word between parts of the summary. */
  filterAnd: string
  /** The OR choice of a group’s switch, and the word between parts of the summary. */
  filterOr: string
  /** Names a group’s AND/OR switch. */
  filterCombinator: string
  /** Adds a rule to a group. */
  filterAddRule: string
  /** Adds a nested group. */
  filterAddGroup: string
  /** Names a rule by its place in its group: "Rule 2". */
  filterRuleN: (position: number) => string
  /** Names a nested group by its place: "Group 2". */
  filterGroupN: (position: number) => string
  /** Names the duplicate button of a rule or group: "Duplicate Rule 2". */
  filterDuplicate: (name: string) => string
  /** Names a rule’s field menu. */
  filterField: string
  /** Names a rule’s operator menu. */
  filterOperator: string
  /** Names a rule’s value input. */
  filterValue: string
  /** Names the first input of a between rule. */
  filterValueFrom: string
  /** Names the second input of a between rule. */
  filterValueTo: string
  /** The unit after the number of an "in the last" rule. */
  filterDays: string
  /** Applies the draft filter. */
  filterApply: string
  /** Discards the draft and returns to the applied filter. */
  filterReset: string
  /** Shown while the draft differs from the applied filter. */
  filterUnapplied: string
  /** Announced when Apply succeeds. */
  filterApplied: string
  /** Announced when Reset discards the draft. */
  filterDiscarded: string
  /** The reason an incomplete rule is flagged, and announced when Apply refuses it. */
  filterIncomplete: string
  /** Shown in a group with nothing in it. */
  filterEmpty: string
  /** Names the read-only summary. */
  filterSummary: string
  /** The summary of an empty filter. */
  filterSummaryNone: string
  /** Switches the summary to chips. */
  filterShowChips: string
  /** Switches the summary to a sentence. */
  filterShowSentence: string
  /** Operator: equals. */
  filterOpIs: string
  /** Operator: does not equal. */
  filterOpIsNot: string
  /** Operator: text contains. */
  filterOpContains: string
  /** Operator: text starts with. */
  filterOpStartsWith: string
  /** Operator: number greater than. */
  filterOpGt: string
  /** Operator: number less than. */
  filterOpLt: string
  /** Operator: between two values. */
  filterOpBetween: string
  /** Operator: date before. */
  filterOpBefore: string
  /** Operator: date after. */
  filterOpAfter: string
  /** Operator: date within the last N days. */
  filterOpInLast: string
  /** Operator: one of several options. */
  filterOpIsAnyOf: string
  /** Operator: a list holds at least one. */
  filterOpHasAny: string
  /** Operator: a list holds every one. */
  filterOpHasAll: string
  /** Operator: no value. */
  filterOpIsEmpty: string
  /** Operator: has a value. */
  filterOpIsNotEmpty: string
  /** Operator: boolean true. */
  filterOpIsTrue: string
  /** Operator: boolean false. */
  filterOpIsFalse: string
  /** Starts the first row of a group: "Where Stage is Lost". */
  filterWhere: string
  /** Replaces a nested group with its rules. */
  filterUngroup: string
  /** Names a nested group’s menu: "Group 2 actions". */
  filterGroupActions: (name: string) => string
  // Import mapper. Counts and sizes arrive already formatted for the locale.
  /** Import data */
  importMapperTitle: string
  /** Choose a CSV file and check how its columns match your fields. */
  importMapperDescription: string
  /** Drop a CSV file here */
  importMapperDropTitle: string
  /** or choose a file, up to {size} */
  importMapperDropHint: (size: string) => string
  /** Choose file */
  importMapperChoose: string
  /** Replace */
  importMapperReplace: string
  /** Remove */
  importMapperRemove: string
  importMapperStartOver: string
  /** Use sample */
  importMapperSample: string
  /** 48 rows · 7 columns · 12 KB */
  importMapperFileMeta: (rows: number, columns: number, size: string) => string
  /** That file is {size}. The limit is {max}. */
  importMapperTooLarge: (size: string, max: string) => string
  /** Choose a .csv file. */
  importMapperNotCsv: string
  /** The file has no rows to import. */
  importMapperEmptyFile: string
  /** Line {line}: a quoted value is never closed. */
  importMapperUnclosedQuote: (line: string) => string
  /** Line {line}: {found} values where the header has {expected}. */
  importMapperRaggedRow: (line: string, found: string, expected: string) => string
  /** And {count} more. */
  importMapperProblemsMore: (count: string) => string
  /** Column in your file */
  importMapperColumn: string
  /** Field */
  importMapperTarget: string
  /** Don’t import */
  importMapperSkipColumn: string
  /** Required */
  importMapperRequired: string
  /** Check */
  importMapperCheck: string
  /** We’re not sure about this match. */
  importMapperCheckWhy: string
  /** Email isn’t matched yet */
  importMapperNotMatched: (field: string) => string
  /** Choose a column */
  importMapperPickColumn: string
  /** Column for Email */
  importMapperPickColumnFor: (field: string) => string
  /** Match Email to import. */
  importMapperBlocked: (names: string) => string
  /** No rows are left to import. */
  importMapperNothing: string
  /** {column} will be imported as {target}. */
  importMapperMapped: (column: string, target: string) => string
  /** {column} will not be imported. */
  importMapperNotImported: (column: string) => string
  /** (empty) */
  importMapperBlank: string
  /** 48 contacts */
  importMapperItems: (count: number) => string
  /** Import 48 contacts */
  importMapperImport: (items: string) => string
  /** Everything looks good. */
  importMapperAllGood: string
  /** Email is missing in 3 rows */
  importMapperIssueMissing: (count: number, field: string) => string
  /** Email is invalid in 3 rows */
  importMapperIssueInvalid: (count: number, field: string) => string
  /** Review */
  importMapperReview: string
  /** Skip them */
  importMapperSkipThem: (count: number) => string
  /** 3 rows skipped */
  importMapperSkippedNote: (count: number) => string
  /** 4 contacts already exist */
  importMapperDuplicatesFound: (count: number) => string
  /** What should happen to them? */
  importMapperPolicy: string
  /** Update */
  importMapperPolicyUpdate: string
  /** Add as new */
  importMapperPolicyCreate: string
  /** More options */
  importMapperMoreOptions: string
  /** Existing contacts are recognized by */
  importMapperKey: string
  /** Announced when the counts settle */
  importMapperCountsAnnounce: (items: string, skipped: number) => string
  /** Row */
  importMapperRow: string
  /** This value is required. */
  importMapperErrorRequired: string
  /** Enter a valid email address. */
  importMapperErrorEmail: string
  /** Enter a number. */
  importMapperErrorNumber: string
  /** Enter a date, such as 2026-03-14. */
  importMapperErrorDate: string
  /** {field}, row {row} */
  importMapperEditCell: (row: string, field: string) => string
  /** Showing the first {shown} of {total} */
  importMapperShowing: (shown: string, total: string) => string
  /** 2 rows left to fix */
  importMapperLeft: (count: number) => string
  /** Looks good */
  importMapperRowFixed: string
  /** Skipped */
  importMapperRowSkipped: string
  /** Skip this row */
  importMapperSkipThisRow: string
  /** Importing… */
  importMapperImporting: string
  /** {done} of {total} */
  importMapperProgress: (done: string, total: string) => string
  /** Import progress */
  importMapperProgressLabel: string
  /** 45 contacts imported */
  importMapperImported: (items: string) => string
  /** 5 updated */
  importMapperUpdatedCount: (count: number) => string
  /** 3 skipped */
  importMapperSkippedCount: (count: number) => string
  /** Import finished. ${items} imported, ${skipped} skipped. */
  importMapperDoneAnnounce: (items: string, skipped: number) => string
  /** Download skipped rows */
  importMapperErrorReport: string
  /** Import another file */
  importMapperImportAnother: string
  /** The import stopped: {message} */
  importMapperFailed: (message: string) => string
  /** Field */
  importMapperReportField: string
  /** Value */
  importMapperReportValue: string
  /** Problem */
  importMapperReportProblem: string
  /** Names the enable checkbox in an inspector panel header. */
  inspectorEnable: string
  /** The visibility eye while the layer is hidden: shows it. */
  inspectorShow: string
  /** The visibility eye while the layer is shown: hides it. */
  inspectorHide: string
  /** Collapses an inspector panel. */
  inspectorCollapse: string
  /** Expands an inspector panel. */
  inspectorExpand: string
  /** Names the menu that changes the type of an inspector panel (Drop shadow, Inner shadow…). */
  inspectorChangeType: string
  /** Names the hex field of a color and opacity field. */
  hexColour: string
  /** Names the opacity percentage field of a color and opacity field. */
  opacity: string
  // Tour. The card's dialog is named by the step's title; Back, Next, Done and Skip are the shared keys.
  /** The step count on the card: "2 of 5". */
  tourStepOf: (step: number, total: number) => string
  /** Announced when the step changes: "Step 2 of 5: Filters". */
  tourStepAnnounce: (step: number, total: number, title: string) => string
  /** How to work the tour from the keyboard, read after the step's text. */
  tourHint: string
  /** TourBeacon's name when the app gives none. */
  tourStart: string
  // AudioRecorder. Times arrive formatted ("0:42"); play, pause and undo are shared.
  /** The recorder's name when the app gives none. */
  audioRecorder: string
  /** The idle caption beside the record button. */
  audioRecorderHint: string
  /** Added to the idle caption when there is a time limit: "Up to 1:00". */
  audioRecorderLimit: (max: string) => string
  audioRecorderStart: string
  audioRecorderStop: string
  audioRecorderPause: string
  audioRecorderResume: string
  /** The recording clock's name. */
  audioRecorderElapsed: string
  /** Time left under a limit: "0:48 left". */
  audioRecorderRemaining: (time: string) => string
  /** Announced as recording starts or resumes. */
  audioRecorderRecording: string
  audioRecorderPaused: string
  /** Announced when a take ends, with its length. */
  audioRecorderStopped: (duration: string) => string
  /** Announced when the limit ends a take. */
  audioRecorderLimitReached: string
  /** Shown while the browser asks for the microphone. */
  audioRecorderRequesting: string
  /** Microphone permission refused, and how to allow it. */
  audioRecorderDenied: string
  /** No microphone to record from. */
  audioRecorderNoDevice: string
  /** No MediaRecorder or getUserMedia here (an old browser, or a page that is not secure). */
  audioRecorderUnsupported: string
  /** The microphone is there but could not start (in use, or a hardware error). */
  audioRecorderFailed: string
  audioRecorderDiscard: string
  /** Shown with Undo after a discard, and announced. */
  audioRecorderDiscarded: string
  audioRecorderRestored: string
  /** Hands the take to the app; then the take is kept, read-only. */
  audioRecorderSave: string
  audioRecorderSaving: string
  /** The kept take's mark, and the save button's success. */
  audioRecorderSaved: string

  // LiveCursors and PresenceAvatars. Names arrive as one list formatted for the locale ("Ada and Grace").
  /** Announced when people arrive: "Ada joined". */
  liveCursorsJoined: (names: string) => string
  /** Announced when people go: "Ada left". */
  liveCursorsLeft: (names: string) => string
  /** The avatars' group name when the app gives none. */
  liveCursorsPeople: string
  liveCursorsViewing: string
  liveCursorsEditing: string
  /** An avatar's button: follow that person's cursor. */
  liveCursorsFollow: (name: string) => string
  /** Announced when following starts. */
  liveCursorsFollowing: (name: string) => string
  /** The name of the "+N" past the shown avatars. */
  liveCursorsMore: (count: number) => string
  // HierarchyChart. Zooming and fitting use the shared zoomIn, zoomOut and zoomToFit.
  /** The chart's accessible name when the app gives none. */
  hierarchyChart: string
  /** How to work the chart from the keyboard. */
  hierarchyChartHint: string
  /** Describes a closed branch: how many nodes it hides, all levels down. */
  hierarchyChartHidden: (count: number) => string
  /** The tooltip of a closed branch's count chip. */
  hierarchyChartExpand: (name: string) => string
  /** The tooltip of an open branch's chip. */
  hierarchyChartCollapse: (name: string) => string
  // RadialMenu. The ring's name is the shared `actions` unless the app gives one.
  /** How to work the ring from the keyboard, read when it opens. */
  radialMenuHint: string
  /** Announced when an action is chosen: "Pen chosen". */
  radialMenuChosen: (label: string) => string
  // ImageCompare. Percentages arrive formatted ("60%").
  /** The divider's accessible name. */
  imageCompare: string
  /** The default name of the side shown at the start (or top). */
  imageCompareBefore: string
  /** The default name of the side shown at the end (or bottom). */
  imageCompareAfter: string
  /** The divider's value text: how much of each side shows. */
  imageCompareValue: (before: string, beforePercent: string, after: string, afterPercent: string) => string
  // CurrencySwap. Amounts arrive formatted with their symbol ("1 BTC", "2,549.9 HYPE").
  /** The label over the amount being paid. */
  currencySwapPay: string
  /** The label over the amount received. */
  currencySwapReceive: string
  /** The round button that flips the two sides. */
  currencySwapFlip: string
  /** The name of the picker for the currency paid with. */
  currencySwapFromAsset: string
  /** The name of the picker for the currency received. */
  currencySwapToAsset: string
  /** The primary action's default label. */
  currencySwapSubmit: string
  /** Announced when the received amount settles: "You receive 2,549.9 HYPE". */
  currencySwapResult: (amount: string) => string
  /** The rate line: "1 BTC = 2,549.9 HYPE". */
  currencySwapRate: (from: string, to: string) => string
  // WheelPicker.
  /** The accessible name of a wheel's column when the app gives it no label. */
  wheelPicker: string
  // HoursDial. Times and durations arrive formatted in the locale ("10:30 PM", "7 hours, 30 minutes").
  /** The dial's accessible name, the group around its two handles. */
  hoursDial: string
  /** The start handle's name. */
  hoursDialStart: string
  /** The end handle's name. */
  hoursDialEnd: string
  /** A handle's value text: its time and the span's length. */
  hoursDialValue: (time: string, duration: string) => string
  // ShareDialog. Names, roles and counts arrive from the app.
  /** The dialog title, with the name of what is shared. */
  shareDialogTitle: (resource: string) => string
  /** The invite field’s name and placeholder. */
  shareDialogAddPeople: string
  /** The invite role select’s name. */
  shareDialogRole: string
  /** The optional message field. */
  shareDialogMessage: string
  /** The send button. */
  shareDialogSend: string
  /** The send button while it works. */
  shareDialogSending: string
  /** The send button once sent. */
  shareDialogSent: string
  /** Announced after invitations go out. */
  shareDialogInvited: (count: number) => string
  /** Why an address chip is marked invalid. */
  shareDialogNotEmail: (value: string) => string
  /** Why a chip for someone who already has access is marked invalid. */
  shareDialogHasAccess: (name: string) => string
  /** Shown when invalid chips block the send. */
  shareDialogFixInvalid: string
  /** A recipient chip’s remove button. */
  shareDialogRemoveRecipient: (name: string) => string
  /** The suggestions list’s name. */
  shareDialogSuggestions: string
  /** A group suggestion’s detail. */
  shareDialogGroupSize: (count: number) => string
  /** The people list’s heading. */
  shareDialogPeople: string
  /** The owner’s fixed role. */
  shareDialogOwner: string
  /** Marks an invitation not yet accepted. */
  shareDialogPending: string
  /** Resends a pending invitation. */
  shareDialogResend: string
  /** The resend button’s name. */
  shareDialogResendTo: (name: string) => string
  /** The cancel-invitation button’s name. */
  shareDialogCancelInvite: (name: string) => string
  /** The remove button’s name. */
  shareDialogRemoveAccess: (name: string) => string
  /** A person’s role select’s name. */
  shareDialogRoleOf: (name: string) => string
  /** Announced while the list loads. */
  shareDialogLoading: string
  /** The general access heading and select name. */
  shareDialogGeneral: string
  /** Only people added can open it. */
  shareDialogRestricted: string
  /** Restricted, explained. */
  shareDialogRestrictedHint: string
  /** Organization-wide access. */
  shareDialogOrganization: (organization: string) => string
  /** Organization access, explained. */
  shareDialogOrganizationHint: (organization: string) => string
  /** Public link access. */
  shareDialogAnyone: string
  /** Public link access, explained. */
  shareDialogAnyoneHint: string
  /** The link role select’s name. */
  shareDialogLinkRole: string
  /** The copy-link button. */
  shareDialogCopyLink: string
  /** The copy-link button after copying. */
  shareDialogCopied: string
  /** Announced after the link is copied. */
  shareDialogLinkCopied: string
  /** Shown when copying fails. */
  shareDialogCopyFailed: string
  /** Closes the dialog. */
  shareDialogDone: string
  /** Announced after access is removed. */
  shareDialogRemoved: (name: string) => string
  /** Announced after a role changes. */
  shareDialogRoleChanged: (name: string, role: string) => string
  /** Announced after general access changes. */
  shareDialogAccessChanged: (access: string) => string
  /** Shown when an action fails without a message. */
  shareDialogFailed: string
  /** The default viewer role. */
  shareDialogViewer: string
  /** The default commenter role. */
  shareDialogCommenter: string
  /** The default editor role. */
  shareDialogEditor: string
  shareDialogInvitedOnly: string
  shareDialogPeopleCount: (count: number) => string
  // Portfolio and GrowthForecast. Amounts and dates arrive formatted in the locale.
  /** The period switch's accessible name. */
  portfolioPeriod: string
  /** The value chart's accessible name. */
  portfolioChart: string
  /** How to move along the chart with the keyboard. */
  portfolioChartHint: string
  /** The scrubbed reading: the value on a date, both formatted. */
  portfolioReading: (value: string, date: string) => string
  /** A rise, spoken beside its arrow. */
  portfolioUp: (amount: string) => string
  /** A fall, spoken beside its arrow. */
  portfolioDown: (amount: string) => string
  /** No change, spoken. */
  portfolioFlat: (amount: string) => string
  /** The value's info button. */
  portfolioInfo: string
  /** The monthly contribution field. */
  growthContribution: string
  /** The years field. */
  growthYears: string
  /** The annual return field. */
  growthRate: string
  /** The starting balance's caption. */
  growthToday: string
  /** The last year's caption. */
  growthYear: (year: string) => string
  /** The bar chart's accessible name. */
  growthBars: string
  /** One year's bar: its balance and how much of it was contributed. */
  growthBar: (year: string, total: string, contributed: string) => string
  // ExportDialog. Reuses the preset names (today … yearToDate), columns, itemCount and rowsNoun, working, done, failed, cancel and close.
  /** The dialog's title when the app gives none. */
  exportDialogTitle: string
  /** Names the list of date ranges. */
  exportPeriod: string
  /** The row that opens the date range picker. */
  exportCustom: string
  /** Under Custom while no range is chosen. */
  exportCustomHint: string
  /** The heading over format, time zone and columns. */
  exportOptions: string
  exportFormat: string
  exportTimeZone: string
  /** The local time zone's name in the two-option switch (the other is UTC). */
  exportTimeZoneLocal: string
  /** The columns button when every column is chosen: "All 12". */
  exportColumnsAll: (count: number) => string
  /** The columns button when some are chosen: "8 of 12". */
  exportColumnsSome: (shown: number, total: number) => string
  /** The columns popover's button that chooses every column. */
  exportSelectAll: string
  /** The columns popover's button that clears them, and the columns button when none is chosen. */
  exportSelectNone: string
  /** Names the columns popover. */
  exportColumnsPick: string
  /** The export button: "Export CSV". The format arrives as the app names it. */
  exportAs: (format: string) => string
  /** The summary when the range holds nothing. */
  exportNothing: string
  /** The button once a large export was queued instead of finished. */
  exportQueued: string
  /** Said once an export was queued and will arrive by email. */
  exportEmailed: string
  /** The same, naming the address. */
  exportEmailedTo: (email: string) => string
  /** Said when the export failed and can be tried again. */
  exportFailedNote: string

  // RadarChart. Its points are spoken as "series, axis: value", and its legend buttons carry the series names.
  /** The chart's name when the app gives none. */
  radarChart: string
  /** The header of the axes column in the chart's hidden data table. */
  radarChartAxis: string

  // RadialGraph. A node is spoken with how far out it is, and described by its state and detail.
  /** The graph's name when the app gives none. */
  radialGraph: string
  /** A ring's name and a node's distance from the center: "1 hop", "2 hops". */
  radialGraphHops: (hops: number) => string
  /** A node as spoken: its label and how far out it is (`hops` from radialGraphHops). */
  radialGraphItem: (label: string, hops: string) => string
  /** The graph's description: how many nodes are linked to the center, and within how many hops. */
  radialGraphSummary: (center: string, count: number, hops: string) => string

  // DensityLanes. A cell is spoken with `unitChartItem` (its column, value and whether it is highlighted); its row header names the lane.
  /** The chart's name when the app gives none. */
  densityLanes: string
  /** The chart's description: how many lanes, their total, and the busiest column with its value. */
  densityLanesSummary: (lanes: number, total: string, peak: string, value: string) => string

  // CoverageMatrix. A cell is spoken as "column: value" (the app's `formatValue`, or `coverageMatrixNone`); its row header names the row.
  /** The grid's name when the app gives none. */
  coverageMatrix: string
  /** What a cell with no coverage says, and the key's name for the hatch. */
  coverageMatrixNone: string
  /** The key's name for a filled cell. */
  coverageMatrixDepth: string
  /** The grid's description: how many cells are covered, of how many. */
  coverageMatrixSummary: (covered: number, total: number) => string

  // MilestoneRuler. A pin is an option of a horizontal listbox, named by its milestone (or, where several share it, all of them).
  /** The ruler's name when the app gives none. */
  milestoneRuler: string
  /** A shipped milestone's status. */
  milestoneRulerDone: string
  /** A milestone still ahead. */
  milestoneRulerUpcoming: string
  /** A milestone that may slip. */
  milestoneRulerAtRisk: string
  /** A milestone as spoken: its title, its day and its status. */
  milestoneRulerItem: (title: string, date: string, status: string) => string
  /** Several milestones sharing one pin: "2 milestones". */
  milestoneRulerCount: (count: number) => string
  /** The ones a shared pin's callout leaves out: "+1 more". */
  milestoneRulerMore: (count: number) => string
  /** The ruler's description: how many milestones, and how many are done. */
  milestoneRulerSummary: (count: number, done: number) => string
  /** What the ruler says with no milestones. */
  milestoneRulerEmpty: string

  // ScoreRing. A meter whose value text is the score of the maximum, then its grade.
  /** The ring's name when the app gives none. */
  scoreRing: string
  /** The score as spoken: "77 of 100". */
  scoreRingValue: (value: string, max: string) => string
  /** The grade as spoken after the score: "grade B". */
  scoreRingGrade: (grade: string) => string
}
