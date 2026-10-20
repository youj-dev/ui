import type { YoujLabels } from './labels-types'

// Individual exports let components carry only the English strings they use.
export const close: YoujLabels['close'] = 'Close'
export const dismiss: YoujLabels['dismiss'] = 'Dismiss'
export const cancel: YoujLabels['cancel'] = 'Cancel'
export const save: YoujLabels['save'] = 'Save'
export const add: YoujLabels['add'] = 'Add'
export const edit: YoujLabels['edit'] = 'Edit'
export const send: YoujLabels['send'] = 'Send'
export const retry: YoujLabels['retry'] = 'Retry'
export const clear: YoujLabels['clear'] = 'Clear'
export const back: YoujLabels['back'] = 'Back'
export const search: YoujLabels['search'] = 'Search'
export const searchPlaceholder: YoujLabels['searchPlaceholder'] = 'Search…'
export const selectPlaceholder: YoujLabels['selectPlaceholder'] = 'Select…'
export const loading: YoujLabels['loading'] = 'Loading'
export const loadingEllipsis: YoujLabels['loadingEllipsis'] = 'Loading…'
export const empty: YoujLabels['empty'] = 'Empty'
export const actions: YoujLabels['actions'] = 'Actions'
export const presets: YoujLabels['presets'] = 'Presets'
export const progress: YoujLabels['progress'] = 'Progress'
export const clearSelection: YoujLabels['clearSelection'] = 'Clear selection'
export const remove: YoujLabels['remove'] = (name) => `Remove ${name}`
export const working: YoujLabels['working'] = 'Working…'
export const done: YoujLabels['done'] = 'Done'
export const failed: YoujLabels['failed'] = 'Failed'
export const scrollProgress: YoujLabels['scrollProgress'] = 'Scroll progress'
export const dock: YoujLabels['dock'] = 'Dock'
export const blueprintFrame: YoujLabels['blueprintFrame'] = 'frame'
export const blueprintRegion: YoujLabels['blueprintRegion'] = 'region'
export const blueprintBox: YoujLabels['blueprintBox'] = 'box'
export const blueprintText: YoujLabels['blueprintText'] = 'text'
export const blueprintButton: YoujLabels['blueprintButton'] = 'button'
export const blueprintField: YoujLabels['blueprintField'] = 'field'
export const blueprintIcon: YoujLabels['blueprintIcon'] = 'icon'
export const blueprintChart: YoujLabels['blueprintChart'] = 'chart'
export const blueprintMedia: YoujLabels['blueprintMedia'] = 'media'
export const blueprintRule: YoujLabels['blueprintRule'] = 'rule'
export const blueprintRow: YoujLabels['blueprintRow'] = 'row'
export const blueprintLink: YoujLabels['blueprintLink'] = 'link'
export const blueprintBuild: YoujLabels['blueprintBuild'] = 'Build'
export const blueprintValues: YoujLabels['blueprintValues'] = 'Values'
export const blueprintGrid: YoujLabels['blueprintGrid'] = 'grid'
export const blueprintInk: YoujLabels['blueprintInk'] = 'ink'
export const blueprintTone: YoujLabels['blueprintTone'] = 'tone'
export const blueprintSet: YoujLabels['blueprintSet'] = 'set'
export const layersFrame: YoujLabels['layersFrame'] = 'frame'
export const layersRegions: YoujLabels['layersRegions'] = 'regions'
export const layersBoxes: YoujLabels['layersBoxes'] = 'boxes'
export const layersContent: YoujLabels['layersContent'] = 'content'
export const renderPassesLayout: YoujLabels['renderPassesLayout'] = 'layout'
export const renderPassesPaint: YoujLabels['renderPassesPaint'] = 'paint'
export const renderPassesComposite: YoujLabels['renderPassesComposite'] = 'composite'
export const confirming: YoujLabels['confirming'] = 'Working'
export const phraseMatches: YoujLabels['phraseMatches'] = 'Phrase matches'
export const typeToConfirm: YoujLabels['typeToConfirm'] = 'Type this phrase to confirm'
export const copyPhrase: YoujLabels['copyPhrase'] = 'Copy phrase'
export const somethingWentWrong: YoujLabels['somethingWentWrong'] = 'Something went wrong. Try again.'
export const sidebar: YoujLabels['sidebar'] = 'Sidebar'
export const toggleSidebar: YoujLabels['toggleSidebar'] = 'Toggle sidebar'
export const pagination: YoujLabels['pagination'] = 'Pagination'
export const previous: YoujLabels['previous'] = 'Previous'
export const next: YoujLabels['next'] = 'Next'
export const goToPreviousPage: YoujLabels['goToPreviousPage'] = 'Go to previous page'
export const goToNextPage: YoujLabels['goToNextPage'] = 'Go to next page'
export const breadcrumb: YoujLabels['breadcrumb'] = 'Breadcrumb'
export const showMoreCount: YoujLabels['showMoreCount'] = (count) => `Show ${count} more`
export const carousel: YoujLabels['carousel'] = 'carousel'
export const slide: YoujLabels['slide'] = 'slide'
export const slidePosition: YoujLabels['slidePosition'] = (position, total) => `${position} of ${total}`
export const slideOf: YoujLabels['slideOf'] = (position, total) => `Slide ${position} of ${total}`
export const slideNumber: YoujLabels['slideNumber'] = (position) => `Slide ${position}`
export const previousSlide: YoujLabels['previousSlide'] = 'Previous slide'
export const nextSlide: YoujLabels['nextSlide'] = 'Next slide'
export const chooseSlide: YoujLabels['chooseSlide'] = 'Choose slide'
export const slideThumbnails: YoujLabels['slideThumbnails'] = 'Slide thumbnails'
export const pauseSlideRotation: YoujLabels['pauseSlideRotation'] = 'Pause slide rotation'
export const startSlideRotation: YoujLabels['startSlideRotation'] = 'Start slide rotation'
export const commandPalette: YoujLabels['commandPalette'] = 'Command palette'
export const commandPaletteDescription: YoujLabels['commandPaletteDescription'] = 'Search for a command to run'
export const commandPalettePlaceholder: YoujLabels['commandPalettePlaceholder'] = 'Type a command or search…'
export const commandPalettePage: YoujLabels['commandPalettePage'] = (page) => `${page} page`
export const home: YoujLabels['home'] = 'Home'
export const navigate: YoujLabels['navigate'] = 'Navigate'
export const open: YoujLabels['open'] = 'Open'
export const menu: YoujLabels['menu'] = 'Menu'
export const openMenu: YoujLabels['openMenu'] = (menu) => `Open ${menu.toLowerCase()}`
export const closeMenu: YoujLabels['closeMenu'] = (menu) => `Close ${menu.toLowerCase()}`
export const ctrlKey: YoujLabels['ctrlKey'] = 'Ctrl'
export const escKey: YoujLabels['escKey'] = 'Esc'
export const onThisPage: YoujLabels['onThisPage'] = 'On this page'
export const primaryNavigation: YoujLabels['primaryNavigation'] = 'Primary'
export const badgeNew: YoujLabels['badgeNew'] = 'new'
export const badgeNewCount: YoujLabels['badgeNewCount'] = (count) => `${count} new`
export const viewData: YoujLabels['viewData'] = 'View data'
export const hideData: YoujLabels['hideData'] = 'Hide data'
export const trendUp: YoujLabels['trendUp'] = 'Up'
export const trendDown: YoujLabels['trendDown'] = 'Down'
export const trendFlat: YoujLabels['trendFlat'] = 'No change,'
export const loadingNamed: YoujLabels['loadingNamed'] = (name) => `Loading ${name}`
export const meterWarning: YoujLabels['meterWarning'] = 'Warning'
export const meterCritical: YoujLabels['meterCritical'] = 'Critical'
export const allowanceRemaining: YoujLabels['allowanceRemaining'] = 'Remaining'
export const allowanceSpent: YoujLabels['allowanceSpent'] = 'Spent'
export const allowanceLimit: YoujLabels['allowanceLimit'] = 'Limit'
export const allowanceOverLimit: YoujLabels['allowanceOverLimit'] = 'Over limit'
export const allowanceValueText: YoujLabels['allowanceValueText'] = (spent, limit, remaining) => `${spent} spent of ${limit}, ${remaining} left`
export const allowanceOverText: YoujLabels['allowanceOverText'] = (spent, limit, over) => `${spent} spent of ${limit}, ${over} over`
export const allowanceMarkerAt: YoujLabels['allowanceMarkerAt'] = (name, value) => `${name} at ${value}`
export const dotMap: YoujLabels['dotMap'] = 'World map'
export const dotMapSummary: YoujLabels['dotMapSummary'] = (count, largest, value) =>
  `${count} ${count === 1 ? 'region' : 'regions'} marked. The largest is ${largest}, at ${value}.`
export const rollout: YoujLabels['rollout'] = 'Rollout'
export const rolloutOff: YoujLabels['rolloutOff'] = 'Off'
export const rolloutInternal: YoujLabels['rolloutInternal'] = 'Internal'
export const rolloutBeta: YoujLabels['rolloutBeta'] = 'Beta'
export const rolloutGeneral: YoujLabels['rolloutGeneral'] = 'GA'
export const rolloutStageAt: YoujLabels['rolloutStageAt'] = (stage, percent) => `${stage} at ${percent}`
export const permissions: YoujLabels['permissions'] = 'Permissions'
export const permissionNone: YoujLabels['permissionNone'] = 'None'
export const permissionRead: YoujLabels['permissionRead'] = 'Read'
export const permissionWrite: YoujLabels['permissionWrite'] = 'Write'
export const permissionAdmin: YoujLabels['permissionAdmin'] = 'Admin'
export const permissionSelectRow: YoujLabels['permissionSelectRow'] = (role) => `Select all ${role} permissions`
export const permissionSelectColumn: YoujLabels['permissionSelectColumn'] = (resource) => `Select ${resource} for every role`
export const permissionSelectAll: YoujLabels['permissionSelectAll'] = 'Select every permission'
export const permissionSelected: YoujLabels['permissionSelected'] = (count) => `${count} selected`
export const permissionSetSelected: YoujLabels['permissionSetSelected'] = 'Set selected to'
export const permissionBulkSet: YoujLabels['permissionBulkSet'] = (count, level) =>
  `${count} ${count === 1 ? 'permission' : 'permissions'} set to ${level}`
export const permissionChanged: YoujLabels['permissionChanged'] = (role, resource, level) => `${role}, ${resource}: ${level}`
export const permissionWas: YoujLabels['permissionWas'] = (level) => `changed from ${level}`
export const permissionLocked: YoujLabels['permissionLocked'] = 'Locked'
export const permissionHint: YoujLabels['permissionHint'] = 'Arrow keys move between cells. Space changes the access level.'
export const stageRail: YoujLabels['stageRail'] = 'Pipeline stages'
export const stageQueued: YoujLabels['stageQueued'] = 'Queued'
export const stageRunning: YoujLabels['stageRunning'] = 'Running'
export const stagePassed: YoujLabels['stagePassed'] = 'Passed'
export const stageFailed: YoujLabels['stageFailed'] = 'Failed'
export const stageSkipped: YoujLabels['stageSkipped'] = 'Skipped'
export const stageItem: YoujLabels['stageItem'] = (name, status, duration) => (duration ? `${name}, ${status}, ${duration}` : `${name}, ${status}`)
export const severityTimeline: YoujLabels['severityTimeline'] = 'Incident timeline'
export const severity: YoujLabels['severity'] = (level) => `Severity ${level}`
export const milestoneAcknowledged: YoujLabels['milestoneAcknowledged'] = 'Acknowledged'
export const milestoneMitigated: YoujLabels['milestoneMitigated'] = 'Mitigated'
export const milestoneResolved: YoujLabels['milestoneResolved'] = 'Resolved'
export const sinceStart: YoujLabels['sinceStart'] = (duration) => `${duration} after start`
export const ongoing: YoujLabels['ongoing'] = 'Ongoing'
export const incidentNoEvents: YoujLabels['incidentNoEvents'] = 'No events yet'
export const laneMeter: YoujLabels['laneMeter'] = 'Queue load'
export const laneOf: YoujLabels['laneOf'] = (value, max) => `${value} of ${max}`
export const laneItemAction: YoujLabels['laneItemAction'] = (action, item) => `${action} ${item}`
export const dayRing: YoujLabels['dayRing'] = 'Daily schedule'
export const nextRun: YoujLabels['nextRun'] = 'Next run'
export const runsIn: YoujLabels['runsIn'] = (countdown) => `in ${countdown}`
export const scheduleRunAt: YoujLabels['scheduleRunAt'] = (name, time) => `${name} at ${time}`
export const scheduleRuns: YoujLabels['scheduleRuns'] = (count) => (count === 1 ? '1 run a day' : `${count.toLocaleString('en-US')} runs a day`)
export const scheduleOverlaps: YoujLabels['scheduleOverlaps'] = (count) =>
  count === 0 ? 'no overlaps' : count === 1 ? '1 overlap' : `${count.toLocaleString('en-US')} overlaps`
export const scheduleOverlapAt: YoujLabels['scheduleOverlapAt'] = (names, time) => `${names} overlap at ${time}`
export const now: YoujLabels['now'] = 'Now'
export const chooseDate: YoujLabels['chooseDate'] = 'Choose date'
export const chooseDates: YoujLabels['chooseDates'] = 'Choose dates'
export const startDate: YoujLabels['startDate'] = 'Start date'
export const endDate: YoujLabels['endDate'] = 'End date'
export const pickStartDate: YoujLabels['pickStartDate'] = 'Pick a start date.'
export const pickEndDate: YoujLabels['pickEndDate'] = 'Pick an end date.'
export const dateRangeSummary: YoujLabels['dateRangeSummary'] = (days, from, to) => `${days} ${days === 1 ? 'day' : 'days'}: ${from} – ${to}`
export const yesterday: YoujLabels['yesterday'] = 'Yesterday'
export const lastMonth: YoujLabels['lastMonth'] = 'Last month'
export const yearToDate: YoujLabels['yearToDate'] = 'Year to date'
export const nextMonth: YoujLabels['nextMonth'] = 'Go to the Next Month'
export const previousMonth: YoujLabels['previousMonth'] = 'Go to the Previous Month'
export const calendarDay: YoujLabels['calendarDay'] = (date, today, selected) => `${today ? `Today, ${date}` : date}${selected ? ', selected' : ''}`
export const hours: YoujLabels['hours'] = 'Hours'
export const minutes: YoujLabels['minutes'] = 'Minutes'
export const dayPeriod: YoujLabels['dayPeriod'] = 'AM/PM'
export const increase: YoujLabels['increase'] = 'Increase'
export const decrease: YoujLabels['decrease'] = 'Decrease'
export const showPassword: YoujLabels['showPassword'] = 'Show password'
export const capsLockOn: YoujLabels['capsLockOn'] = 'Caps Lock is on'
export const passwordStrength: YoujLabels['passwordStrength'] = 'Password strength'
export const passwordStrengthIs: YoujLabels['passwordStrengthIs'] = (strength) => `Password strength: ${strength}`
export const noPassword: YoujLabels['noPassword'] = 'No password'
export const passwordVeryWeak: YoujLabels['passwordVeryWeak'] = 'Very weak'
export const passwordWeak: YoujLabels['passwordWeak'] = 'Weak'
export const passwordFair: YoujLabels['passwordFair'] = 'Fair'
export const passwordGood: YoujLabels['passwordGood'] = 'Good'
export const passwordStrong: YoujLabels['passwordStrong'] = 'Strong'
export const passwordMinLength: YoujLabels['passwordMinLength'] = 'At least 8 characters'
export const passwordMixedCase: YoujLabels['passwordMixedCase'] = 'Upper and lower case'
export const passwordNumber: YoujLabels['passwordNumber'] = 'A number'
export const passwordSymbol: YoujLabels['passwordSymbol'] = 'A symbol'
export const requirementMet: YoujLabels['requirementMet'] = 'Done'
export const requirementUnmet: YoujLabels['requirementUnmet'] = 'Not yet'
export const noResults: YoujLabels['noResults'] = 'No results.'
export const createOption: YoujLabels['createOption'] = (text) => `Create “${text}”`
export const selectedItems: YoujLabels['selectedItems'] = 'Selected'
export const selectAll: YoujLabels['selectAll'] = 'Select all'
export const selectedSummary: YoujLabels['selectedSummary'] = (count, names) => `${count} selected: ${names}`
export const allSelected: YoujLabels['allSelected'] = (count) => `All ${count} selected`
export const allDeselected: YoujLabels['allDeselected'] = 'All deselected'
export const countOfMaxSelected: YoujLabels['countOfMaxSelected'] = (count, max) => `${count} of ${max} selected`
export const optionsShown: YoujLabels['optionsShown'] = (shown, total) => `Showing ${shown} of ${total}. Keep typing to narrow the results.`
export const limitReached: YoujLabels['limitReached'] = 'Limit reached'
export const limitOfReached: YoujLabels['limitOfReached'] = (max) => `Limit of ${max} reached`
export const removed: YoujLabels['removed'] = (name) => `Removed ${name}`
export const tags: YoujLabels['tags'] = 'Tags'
export const addTag: YoujLabels['addTag'] = 'Add a tag…'
export const tagHint: YoujLabels['tagHint'] = 'Backspace to remove. Alt and arrow keys to move.'
export const upToTags: YoujLabels['upToTags'] = (max) => `Up to ${max} tags.`
export const added: YoujLabels['added'] = (name) => `Added ${name}`
export const addedTags: YoujLabels['addedTags'] = (count) => `Added ${count} tags`
export const alreadyAdded: YoujLabels['alreadyAdded'] = (name) => `${name} is already added`
export const movedTo: YoujLabels['movedTo'] = (name, position, total) => `Moved ${name} to position ${position} of ${total}`
export const queryPlaceholder: YoujLabels['queryPlaceholder'] = 'Add a filter…'
export const queryAddAnother: YoujLabels['queryAddAnother'] = 'Add a filter…'
export const queryChipHint: YoujLabels['queryChipHint'] = 'Enter to edit. Backspace to remove.'
export const valueRange: YoujLabels['valueRange'] = (from, to) => `${from} to ${to}`
export const colour: YoujLabels['colour'] = 'Color'
export const hue: YoujLabels['hue'] = 'Hue'
export const swatches: YoujLabels['swatches'] = 'Swatches'
export const accentSwatch: YoujLabels['accentSwatch'] = (theme) => `${theme} accent`
export const saturationBrightness: YoujLabels['saturationBrightness'] = 'Saturation and brightness'
export const saturationBrightnessValue: YoujLabels['saturationBrightnessValue'] = (saturation, brightness) => `Saturation ${saturation}, brightness ${brightness}`
export const pickColourFromScreen: YoujLabels['pickColourFromScreen'] = 'Pick a color from the screen'
export const verifyingCode: YoujLabels['verifyingCode'] = 'Verifying code…'
export const codeVerified: YoujLabels['codeVerified'] = 'Code verified'
export const codeInvalid: YoujLabels['codeInvalid'] = 'That code didn’t work'
export const resendCode: YoujLabels['resendCode'] = 'Resend code'
export const resendIn: YoujLabels['resendIn'] = (time) => `Resend in ${time}`
export const sending: YoujLabels['sending'] = 'Sending…'
export const sent: YoujLabels['sent'] = 'Sent'
export const sendFailed: YoujLabels['sendFailed'] = 'Couldn’t send'
export const language: YoujLabels['language'] = 'Language'
export const allLanguages: YoujLabels['allLanguages'] = 'All languages'
export const moreLanguages: YoujLabels['moreLanguages'] = (count) => (count === 1 ? '1 more language' : `${count} more languages`)
export const searchLanguages: YoujLabels['searchLanguages'] = (count) => `Search ${count} languages…`
export const noLanguageMatches: YoujLabels['noLanguageMatches'] = 'No language matches.'
export const needsWork: YoujLabels['needsWork'] = 'Needs work'
export const nothingToTranslate: YoujLabels['nothingToTranslate'] = 'Nothing left to translate.'
export const pinnedLanguages: YoujLabels['pinnedLanguages'] = 'Pinned'
export const recentLanguages: YoujLabels['recentLanguages'] = 'Recent'
export const regionAmericas: YoujLabels['regionAmericas'] = 'Americas'
export const regionEurope: YoujLabels['regionEurope'] = 'Europe'
export const regionMiddleEastAfrica: YoujLabels['regionMiddleEastAfrica'] = 'Middle East & Africa'
export const regionAsiaPacific: YoujLabels['regionAsiaPacific'] = 'Asia Pacific'
export const regionOther: YoujLabels['regionOther'] = 'Other'
export const translationSource: YoujLabels['translationSource'] = 'Source'
export const translationComplete: YoujLabels['translationComplete'] = 'Complete'
export const translationReview: YoujLabels['translationReview'] = 'Needs review'
export const translationOutdated: YoujLabels['translationOutdated'] = 'Outdated'
export const translationMissing: YoujLabels['translationMissing'] = 'Missing'
export const translationCount: YoujLabels['translationCount'] = (count, status) => `${count} ${status === 'review' ? 'to review' : status}`
export const previousToTranslate: YoujLabels['previousToTranslate'] = 'Previous language to translate'
export const nextToTranslate: YoujLabels['nextToTranslate'] = 'Next language to translate'
export const translationProgress: YoujLabels['translationProgress'] = 'Translation progress'
export const languagesComplete: YoujLabels['languagesComplete'] = (complete, total) => `${complete} of ${total} languages complete`
export const fieldsComplete: YoujLabels['fieldsComplete'] = (complete, total) => `${complete} of ${total} fields complete`
export const copyFrom: YoujLabels['copyFrom'] = (language) => `Copy from ${language}`
export const copiedFrom: YoujLabels['copiedFrom'] = (language) => `Copied from ${language}`
export const useSuggestion: YoujLabels['useSuggestion'] = 'Use suggestion'
export const suggestionUsed: YoujLabels['suggestionUsed'] = 'Suggestion used. Review it before publishing.'
export const markReviewed: YoujLabels['markReviewed'] = 'Mark reviewed'
export const markedReviewed: YoujLabels['markedReviewed'] = (language) => `${language} marked reviewed`
export const sourceChanged: YoujLabels['sourceChanged'] = (source) => `${source} changed since this was translated.`
export const filledAutomatically: YoujLabels['filledAutomatically'] = 'Filled automatically. Check it, then mark it reviewed.'
export const requiredIn: YoujLabels['requiredIn'] = (language) => `Required in ${language}.`
export const characterCount: YoujLabels['characterCount'] = (count, limit) => `${count} of ${limit} characters`
export const charactersOver: YoujLabels['charactersOver'] = (over) => `${over} ${over === 1 ? 'character' : 'characters'} over the limit.`
export const editingLanguage: YoujLabels['editingLanguage'] = (language, state) => `${language}, ${state}`
export const everyLanguageComplete: YoujLabels['everyLanguageComplete'] = 'Every language is complete.'
export const translationActions: YoujLabels['translationActions'] = 'Translation actions'
export const fillFromSource: YoujLabels['fillFromSource'] = (language) => `Fill empty fields from ${language}`
export const markAllReviewed: YoujLabels['markAllReviewed'] = 'Mark all reviewed'
export const clearLanguage: YoujLabels['clearLanguage'] = (language) => `Clear ${language}`
export const clearLanguageDescription: YoujLabels['clearLanguageDescription'] = (language, fields) => `This removes the ${language} text from ${fields} ${fields === 1 ? 'field' : 'fields'}.`
export const translationBulkDone: YoujLabels['translationBulkDone'] = (action, language, fields) =>
    `${action === 'copy' ? 'Filled' : action === 'review' ? 'Marked reviewed:' : 'Cleared'} ${language} in ${fields} ${fields === 1 ? 'field' : 'fields'}`
export const phoneCountry: YoujLabels['phoneCountry'] = (country, dial) => `Country, ${country} ${dial}`
export const stars: YoujLabels['stars'] = 'stars'
export const noRating: YoujLabels['noRating'] = 'No rating'
export const notRated: YoujLabels['notRated'] = 'Not rated'
export const ratingValue: YoujLabels['ratingValue'] = (value, max, unit) => `${value} of ${max} ${unit}`
export const ratedOutOf: YoujLabels['ratedOutOf'] = (value, max) => `Rated ${value} out of ${max}`
export const checkForm: YoujLabels['checkForm'] = 'Check the form'
export const stepOf: YoujLabels['stepOf'] = (step, total) => `Step ${step} of ${total}`
export const skip: YoujLabels['skip'] = 'Skip'
export const continueLabel: YoujLabels['continue'] = 'Continue'
export const finish: YoujLabels['finish'] = 'Finish'
export const finishing: YoujLabels['finishing'] = 'Finishing…'
export const checking: YoujLabels['checking'] = 'Checking'
export const checkStep: YoujLabels['checkStep'] = 'Check this step'
export const optional: YoujLabels['optional'] = 'Optional'
export const steps: YoujLabels['steps'] = 'Steps'
export const stepCompleted: YoujLabels['stepCompleted'] = 'completed'
export const stepCurrent: YoujLabels['stepCurrent'] = 'current step'
export const stepUpcoming: YoujLabels['stepUpcoming'] = 'not started'
export const stepError: YoujLabels['stepError'] = 'has an error'
export const rowsNoun: YoujLabels['rowsNoun'] = 'rows'
export const row: YoujLabels['row'] = 'row'
export const rowNumber: YoujLabels['rowNumber'] = (n) => `row ${n}`
export const columns: YoujLabels['columns'] = 'Columns'
export const hiddenColumns: YoujLabels['hiddenColumns'] = (n) => `${n} hidden`
export const toggleColumns: YoujLabels['toggleColumns'] = 'Toggle columns'
export const resetColumns: YoujLabels['resetColumns'] = 'Reset columns'
export const columnOptions: YoujLabels['columnOptions'] = (column) => `${column} column options`
export const sortAscending: YoujLabels['sortAscending'] = 'Sort ascending'
export const sortDescending: YoujLabels['sortDescending'] = 'Sort descending'
export const clearSort: YoujLabels['clearSort'] = 'Clear sort'
export const pinToStart: YoujLabels['pinToStart'] = 'Pin to start'
export const pinToEnd: YoujLabels['pinToEnd'] = 'Pin to end'
export const unpinned: YoujLabels['unpinned'] = 'Unpinned'
export const moveLeft: YoujLabels['moveLeft'] = 'Move left'
export const moveRight: YoujLabels['moveRight'] = 'Move right'
export const hideColumn: YoujLabels['hideColumn'] = 'Hide column'
export const rowActions: YoujLabels['rowActions'] = (row) => `Actions for ${row}`
export const rowDensity: YoujLabels['rowDensity'] = 'Row density'
export const compactRows: YoujLabels['compactRows'] = 'Compact rows'
export const standardRows: YoujLabels['standardRows'] = 'Standard rows'
export const comfortableRows: YoujLabels['comfortableRows'] = 'Comfortable rows'
export const exportLabel: YoujLabels['export'] = 'Export'
export const clearSearch: YoujLabels['clearSearch'] = 'Clear search'
export const filterBy: YoujLabels['filterBy'] = (column) => `Filter by ${column}`
export const filterNoOptions: YoujLabels['filterNoOptions'] = (column) => `No ${column.toLowerCase()} found.`
export const clearFilter: YoujLabels['clearFilter'] = 'Clear filter'
export const clearFilters: YoujLabels['clearFilters'] = 'Clear filters'
export const clearAll: YoujLabels['clearAll'] = 'Clear all'
export const activeFilters: YoujLabels['activeFilters'] = 'Active filters'
export const removeFilter: YoujLabels['removeFilter'] = (filter) => `Remove ${filter} filter`
export const quoted: YoujLabels['quoted'] = (text) => `“${text}”`
export const today: YoujLabels['today'] = 'Today'
export const last7Days: YoujLabels['last7Days'] = 'Last 7 days'
export const last30Days: YoujLabels['last30Days'] = 'Last 30 days'
export const thisMonth: YoujLabels['thisMonth'] = 'This month'
export const thisYear: YoujLabels['thisYear'] = 'This year'
export const dateFrom: YoujLabels['dateFrom'] = 'From'
export const dateTo: YoujLabels['dateTo'] = 'To'
export const filterFrom: YoujLabels['filterFrom'] = (date) => `From ${date}`
export const filterUntil: YoujLabels['filterUntil'] = (date) => `Until ${date}`
export const rangeMin: YoujLabels['rangeMin'] = 'Min'
export const rangeMax: YoujLabels['rangeMax'] = 'Max'
export const minimumOf: YoujLabels['minimumOf'] = (column) => `Minimum ${column.toLowerCase()}`
export const maximumOf: YoujLabels['maximumOf'] = (column) => `Maximum ${column.toLowerCase()}`
export const rowsPerPage: YoujLabels['rowsPerPage'] = 'Rows per page'
export const tableScrollRegion: YoujLabels['tableScrollRegion'] = 'Table, scrolls sideways'
export const firstPage: YoujLabels['firstPage'] = 'First page'
export const previousPage: YoujLabels['previousPage'] = 'Previous page'
export const nextPage: YoujLabels['nextPage'] = 'Next page'
export const lastPage: YoujLabels['lastPage'] = 'Last page'
export const rangeOf: YoujLabels['rangeOf'] = (range, total, noun) => `${range} of ${total} ${noun}`
export const pageOf: YoujLabels['pageOf'] = (page, total) => `Page ${page} of ${total}`
export const noItems: YoujLabels['noItems'] = (noun) => `No ${noun}`
export const selectionActions: YoujLabels['selectionActions'] = 'Selection actions'
export const selected: YoujLabels['selected'] = 'selected'
export const selectAllCount: YoujLabels['selectAllCount'] = (count, noun) => `Select all ${count} ${noun}`
export const clearSelectionShortcut: YoujLabels['clearSelectionShortcut'] = 'Clear selection (Esc)'
export const selectRow: YoujLabels['selectRow'] = (row) => `Select ${row}`
export const selectAllRows: YoujLabels['selectAllRows'] = 'Select all rows'
export const selectAllOnPage: YoujLabels['selectAllOnPage'] = 'Select all rows on this page'
export const sortedBy: YoujLabels['sortedBy'] = (columns) => `Sorted by ${columns.join(', then ')}`
export const sortedColumn: YoujLabels['sortedColumn'] = (column, descending) => `${column}, ${descending ? 'descending' : 'ascending'}`
export const sortCleared: YoujLabels['sortCleared'] = 'Sort cleared'
export const selectionCleared: YoujLabels['selectionCleared'] = 'Selection cleared'
export const selectedRows: YoujLabels['selectedRows'] = (count, n) => `${count} ${n === 1 ? 'row' : 'rows'} selected`
export const matchCount: YoujLabels['matchCount'] = (count, n, noun) => `${count} ${nounFor(n, noun)} ${n === 1 ? 'matches' : 'match'}`
export const totalCount: YoujLabels['totalCount'] = (count, n, noun) => `${count} ${nounFor(n, noun)} in total`
export const columnWidth: YoujLabels['columnWidth'] = (column, px) => `${column} column, ${px} pixels wide`
export const cellOf: YoujLabels['cellOf'] = (column, row) => `${column} for ${row}`
export const cellSaved: YoujLabels['cellSaved'] = (cell) => `Saved ${cell}`
export const cellSaveFailed: YoujLabels['cellSaveFailed'] = (cell, detail) => `Couldn't save ${cell}.${detail ? ` ${detail}` : ''} The previous value is back.`
export const gridHintArrows: YoujLabels['gridHintArrows'] = 'Arrow keys move between cells.'
export const gridHintSelect: YoujLabels['gridHintSelect'] = 'Space selects a row, Shift+Space selects a range.'
export const gridHintEdit: YoujLabels['gridHintEdit'] = 'Enter edits a cell.'
export const gridHintSort: YoujLabels['gridHintSort'] = 'On a column header, Enter sorts and Shift+Enter adds to the sort.'
export const gridHintResize: YoujLabels['gridHintResize'] = 'Shift+Left and Shift+Right resize a column.'
export const gridHintMenu: YoujLabels['gridHintMenu'] = 'Alt+Down on a header opens its column menu.'
export const loadFailed: YoujLabels['loadFailed'] = (noun) => `Couldn't load ${noun}`
export const tryAgain: YoujLabels['tryAgain'] = 'Try again'
export const noMatches: YoujLabels['noMatches'] = (noun) => `No matching ${noun}`
export const noMatchesHint: YoujLabels['noMatchesHint'] = 'Try a different search, or clear the filters.'
export const emptyHint: YoujLabels['emptyHint'] = (noun) => `There are no ${noun} to show yet.`
export const enterNumber: YoujLabels['enterNumber'] = 'Enter a number'
export const enterAtLeast: YoujLabels['enterAtLeast'] = (min) => `Enter ${min} or more`
export const enterAtMost: YoujLabels['enterAtMost'] = (max) => `Enter ${max} or less`
export const cannotBeUndone: YoujLabels['cannotBeUndone'] = "This can't be undone."
export const itemCount: YoujLabels['itemCount'] = (count, n, noun) => `${count} ${nounFor(n, noun)}`
export const confirmTitle: YoujLabels['confirmTitle'] = (action, what) => `${action} ${what}?`
export const confirmAction: YoujLabels['confirmAction'] = (action, what) => `${action} ${what}`
export const confirmPending: YoujLabels['confirmPending'] = (action, what) => `${action} ${what}: in progress`
export const views: YoujLabels['views'] = 'Views'
export const viewModified: YoujLabels['viewModified'] = ', modified'
export const savedViews: YoujLabels['savedViews'] = 'Saved views'
export const savedViewsEmpty: YoujLabels['savedViewsEmpty'] = 'Save the filters and columns you use most.'
export const saveViewChanges: YoujLabels['saveViewChanges'] = (view) => `Save changes to “${view}”`
export const revertChanges: YoujLabels['revertChanges'] = 'Revert changes'
export const saveAsNewView: YoujLabels['saveAsNewView'] = 'Save as new view…'
export const deleteView: YoujLabels['deleteView'] = (view) => `Delete “${view}”`
export const saveView: YoujLabels['saveView'] = 'Save view'
export const saveViewDescription: YoujLabels['saveViewDescription'] = 'Keeps the filters, sort, columns and density as they are now.'
export const viewName: YoujLabels['viewName'] = 'Name'
export const viewNamePlaceholder: YoujLabels['viewNamePlaceholder'] = 'Unpaid this week'
export const viewNameTaken: YoujLabels['viewNameTaken'] = 'A view with that name exists.'
export const copy: YoujLabels['copy'] = 'Copy'
export const copied: YoujLabels['copied'] = 'Copied'
export const copyFailed: YoujLabels['copyFailed'] = 'Couldn’t copy'
export const saving: YoujLabels['saving'] = 'Saving…'
export const saved: YoujLabels['saved'] = 'Saved'
export const saveFailed: YoujLabels['saveFailed'] = 'Couldn’t save'
export const justNow: YoujLabels['justNow'] = 'just now'
export const chatSources: YoujLabels['chatSources'] = 'Sources'
export const chatSuggestions: YoujLabels['chatSuggestions'] = 'Suggested prompts'
export const chatThinking: YoujLabels['chatThinking'] = 'Thinking…'
export const chatReasoning: YoujLabels['chatReasoning'] = 'Reasoning'
export const chatThoughtFor: YoujLabels['chatThoughtFor'] = (seconds) =>
    `Thought for ${seconds < 60 ? `${Math.max(1, Math.round(seconds))}s` : `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`}`
export const chatToolQueued: YoujLabels['chatToolQueued'] = 'Queued'
export const chatToolRunning: YoujLabels['chatToolRunning'] = 'Running'
export const chatToolDuration: YoujLabels['chatToolDuration'] = (ms) => (ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`)
export const chatToolFailed: YoujLabels['chatToolFailed'] = (tool, error) => `${tool} failed${error ? `: ${error}` : ''}`
export const chatToolArguments: YoujLabels['chatToolArguments'] = 'Arguments'
export const chatToolResult: YoujLabels['chatToolResult'] = 'Result'
export const chatToolError: YoujLabels['chatToolError'] = 'Error'
export const toolApproval: YoujLabels['toolApproval'] = 'Approval request'
export const toolApprovalRiskLow: YoujLabels['toolApprovalRiskLow'] = 'Low risk'
export const toolApprovalRiskMedium: YoujLabels['toolApprovalRiskMedium'] = 'Medium risk'
export const toolApprovalRiskHigh: YoujLabels['toolApprovalRiskHigh'] = 'High risk'
export const toolApprovalReason: YoujLabels['toolApprovalReason'] = 'Why the agent wants this'
export const toolApprovalAllowOnce: YoujLabels['toolApprovalAllowOnce'] = 'Allow once'
export const toolApprovalAlwaysAllow: YoujLabels['toolApprovalAlwaysAllow'] = (s) => `Always allow for ${s}`
export const toolApprovalDeny: YoujLabels['toolApprovalDeny'] = 'Deny'
export const toolApprovalEdited: YoujLabels['toolApprovalEdited'] = 'Edited'
export const toolApprovalShowMore: YoujLabels['toolApprovalShowMore'] = 'Show more'
export const toolApprovalShowLess: YoujLabels['toolApprovalShowLess'] = 'Show less'
export const toolApprovalShowValue: YoujLabels['toolApprovalShowValue'] = (n) => `Show ${n}`
export const toolApprovalHideValue: YoujLabels['toolApprovalHideValue'] = (n) => `Hide ${n}`
export const toolApprovalHidden: YoujLabels['toolApprovalHidden'] = 'Hidden'
export const toolApprovalPending: YoujLabels['toolApprovalPending'] = 'Needs approval'
export const toolApprovalApproved: YoujLabels['toolApprovalApproved'] = 'Approved'
export const toolApprovalDenied: YoujLabels['toolApprovalDenied'] = 'Denied'
export const toolApprovalExpired: YoujLabels['toolApprovalExpired'] = 'Expired'
export const toolApprovalApprovedBy: YoujLabels['toolApprovalApprovedBy'] = (w) => `Approved by ${w}`
export const toolApprovalDeniedBy: YoujLabels['toolApprovalDeniedBy'] = (w) => `Denied by ${w}`
export const toolApprovalNotRun: YoujLabels['toolApprovalNotRun'] = 'The agent did not run this.'
export const toolApprovalDeniedReason: YoujLabels['toolApprovalDeniedReason'] = (r) => `Reason: ${r}`
export const toolApprovalRequired: YoujLabels['toolApprovalRequired'] = 'Enter a value'
export const toolApprovalNotNumber: YoujLabels['toolApprovalNotNumber'] = 'Enter a number'
export const toolApprovalNotJson: YoujLabels['toolApprovalNotJson'] = 'Enter valid JSON'
export const toolApprovalNotBoolean: YoujLabels['toolApprovalNotBoolean'] = 'Enter true or false'
export const toolApprovalAnnounce: YoujLabels['toolApprovalAnnounce'] = (t, r) => `${t} needs your approval. ${r}.`
export const chatTable: YoujLabels['chatTable'] = 'Table'
export const chatConversation: YoujLabels['chatConversation'] = 'Conversation'
export const chatJumpToLatest: YoujLabels['chatJumpToLatest'] = 'Jump to latest'
export const chatAssistant: YoujLabels['chatAssistant'] = 'Assistant'
export const chatYou: YoujLabels['chatYou'] = 'You'
export const chatSystem: YoujLabels['chatSystem'] = 'System'
export const chatResponding: YoujLabels['chatResponding'] = (name) => `${name} is responding…`
export const chatResponseFailed: YoujLabels['chatResponseFailed'] = (name, error) => `${name}’s response failed: ${error}`
export const chatRegenerate: YoujLabels['chatRegenerate'] = 'Regenerate'
export const chatGoodResponse: YoujLabels['chatGoodResponse'] = 'Good response'
export const chatBadResponse: YoujLabels['chatBadResponse'] = 'Bad response'
export const chatMessageActions: YoujLabels['chatMessageActions'] = 'Message actions'
export const chatEditMessage: YoujLabels['chatEditMessage'] = 'Edit message'
export const chatPromptPlaceholder: YoujLabels['chatPromptPlaceholder'] = 'Ask anything…'
export const chatPromptLabel: YoujLabels['chatPromptLabel'] = 'Message'
export const chatAttachFiles: YoujLabels['chatAttachFiles'] = 'Attach files'
export const chatAttachments: YoujLabels['chatAttachments'] = 'Attachments'
export const chatStopGenerating: YoujLabels['chatStopGenerating'] = 'Stop generating'
export const chatSendMessage: YoujLabels['chatSendMessage'] = 'Send message'
export const chatStop: YoujLabels['chatStop'] = 'Stop'
export const chatCharacters: YoujLabels['chatCharacters'] = 'characters'
export const chatOverLimit: YoujLabels['chatOverLimit'] = (count, unit) => `${count} ${unit} over the limit`
export const chatLeft: YoujLabels['chatLeft'] = (count, unit) => `${count} ${unit} left`
export const chatUploading: YoujLabels['chatUploading'] = 'Uploading…'
export const chatUploadFailed: YoujLabels['chatUploadFailed'] = 'Failed to upload'
export const chatPastedImage: YoujLabels['chatPastedImage'] = 'Pasted image'
export const kanbanBoard: YoujLabels['kanbanBoard'] = 'Board'
export const kanbanRoleBoard: YoujLabels['kanbanRoleBoard'] = 'board'
export const kanbanRoleCard: YoujLabels['kanbanRoleCard'] = 'draggable card'
export const kanbanInstructions: YoujLabels['kanbanInstructions'] = 'Press Space to pick up a card. While it is lifted, use the arrow keys to move it, Space to drop it, or Escape to cancel. Press Enter to open it.'
export const kanbanLane: YoujLabels['kanbanLane'] = (lane) => `${lane} lane`
export const kanbanPlace: YoujLabels['kanbanPlace'] = (column, lane, position, count, overLimit) =>
    `${column}${lane ? `, ${lane} lane` : ''}, position ${position} of ${count}.${overLimit !== undefined ? ` Over the limit of ${overLimit}.` : ''}`
export const kanbanPickedUp: YoujLabels['kanbanPickedUp'] = (card, place) => `Picked up ${card}. ${place}`
export const kanbanPickedUpKeyboard: YoujLabels['kanbanPickedUpKeyboard'] = (card, place) => `Picked up ${card}. ${place} Use the arrow keys to move it, Space to drop it, Escape to cancel.`
export const kanbanDropped: YoujLabels['kanbanDropped'] = (card, place) => `Dropped ${card} in ${place}`
export const kanbanCancelled: YoujLabels['kanbanCancelled'] = (card, place) => `Canceled. ${card} is back in ${place}`
export const kanbanMoveFailed: YoujLabels['kanbanMoveFailed'] = (card, column) => `Couldn't move ${card}. It's back in ${column}.`
export const kanbanExpand: YoujLabels['kanbanExpand'] = (column) => `Expand ${column}`
export const kanbanCollapse: YoujLabels['kanbanCollapse'] = (column) => `Collapse ${column}`
export const kanbanCardCount: YoujLabels['kanbanCardCount'] = (count, limit, over) =>
    limit === undefined ? `${count} cards` : `${count} of ${limit} cards${over ? ', over the limit' : ''}`
export const kanbanNoCards: YoujLabels['kanbanNoCards'] = 'No cards'
export const kanbanAddCard: YoujLabels['kanbanAddCard'] = 'Add card'
export const kanbanNewCard: YoujLabels['kanbanNewCard'] = (column) => `New card in ${column}`
export const kanbanCardTitle: YoujLabels['kanbanCardTitle'] = 'Card title'
export const treeLoadingItem: YoujLabels['treeLoadingItem'] = (name) => `Loading ${name}`
export const treeLoaded: YoujLabels['treeLoaded'] = (name) => `${name} loaded`
export const treeLoadFailed: YoujLabels['treeLoadFailed'] = (name) => `Couldn't load ${name}`
export const treeRename: YoujLabels['treeRename'] = (name) => `Rename ${name}`
export const treeRenamed: YoujLabels['treeRenamed'] = (name) => `Renamed to ${name}`
export const notifications: YoujLabels['notifications'] = 'Notifications'
export const notificationsUnread: YoujLabels['notificationsUnread'] = (count) => `Notifications, ${count} unread`
export const notificationNew: YoujLabels['notificationNew'] = (text) => `New notification: ${text}`
export const notificationsNew: YoujLabels['notificationsNew'] = (count) => `${count} new ${count === 1 ? 'notification' : 'notifications'}`
export const notificationsMarkAllRead: YoujLabels['notificationsMarkAllRead'] = 'Mark all as read'
export const notificationsMarkRead: YoujLabels['notificationsMarkRead'] = 'Mark as read'
export const notificationsAll: YoujLabels['notificationsAll'] = 'All'
export const notificationsUnreadTab: YoujLabels['notificationsUnreadTab'] = 'Unread'
export const notificationsMentions: YoujLabels['notificationsMentions'] = 'Mentions'
export const notificationsEmptyTitle: YoujLabels['notificationsEmptyTitle'] = 'No notifications'
export const notificationsEmptyDescription: YoujLabels['notificationsEmptyDescription'] = 'Mentions, deploys and invites will show up here.'
export const notificationsCaughtUpTitle: YoujLabels['notificationsCaughtUpTitle'] = "You're all caught up"
export const notificationsCaughtUpDescription: YoujLabels['notificationsCaughtUpDescription'] = 'New notifications will land here.'
export const notificationsNoMentionsTitle: YoujLabels['notificationsNoMentionsTitle'] = 'No mentions'
export const notificationsNoMentionsDescription: YoujLabels['notificationsNoMentionsDescription'] = 'When someone @mentions you, you will see it here.'
export const notificationsRecent: YoujLabels['notificationsRecent'] = 'Recent'
export const notificationsEarlier: YoujLabels['notificationsEarlier'] = 'Earlier'
export const notificationUnreadPrefix: YoujLabels['notificationUnreadPrefix'] = 'Unread: '
export const timelineCommit: YoujLabels['timelineCommit'] = 'Commit'
export const timelineComment: YoujLabels['timelineComment'] = 'Comment'
export const timelineDeploy: YoujLabels['timelineDeploy'] = 'Deploy'
export const timelineAlert: YoujLabels['timelineAlert'] = 'Alert'
export const timelineMerge: YoujLabels['timelineMerge'] = 'Merge'
export const timelinePullRequest: YoujLabels['timelinePullRequest'] = 'Pull request'
export const timelineActivity: YoujLabels['timelineActivity'] = 'Activity'
export const timelineEmptyTitle: YoujLabels['timelineEmptyTitle'] = 'No activity yet'
export const timelineEmptyDescription: YoujLabels['timelineEmptyDescription'] = 'Commits, deploys and comments will show up here.'
export const timelineLoadMore: YoujLabels['timelineLoadMore'] = 'Load more'
export const timelineLoadingOlder: YoujLabels['timelineLoadingOlder'] = 'Loading older activity'
export const timelineEnd: YoujLabels['timelineEnd'] = "That's everything."
export const timelineDetails: YoujLabels['timelineDetails'] = 'Details'
export const timelineHideDetails: YoujLabels['timelineHideDetails'] = 'Hide details'
export const fileUploaded: YoujLabels['fileUploaded'] = (name) => `${name} uploaded`
export const fileUploadedTile: YoujLabels['fileUploadedTile'] = (name) => `${name}, uploaded`
export const fileUploadFailed: YoujLabels['fileUploadFailed'] = 'Upload failed'
export const fileFailedToUpload: YoujLabels['fileFailedToUpload'] = (name, error) => `${name} failed to upload: ${error}`
export const fileUnsupported: YoujLabels['fileUnsupported'] = (name, types) => `${name} isn’t a supported file type${types ? ` (${types})` : ''}.`
export const fileTooLarge: YoujLabels['fileTooLarge'] = (name, size, limit) => `${name} is ${size}; the limit is ${limit}.`
export const fileDuplicate: YoujLabels['fileDuplicate'] = (name) => `${name} is already added.`
export const fileTooMany: YoujLabels['fileTooMany'] = (name, max) => `${name} wasn’t added: ${max} file${max === 1 ? '' : 's'} at most.`
export const filesAdded: YoujLabels['filesAdded'] = (count) => `${count} file${count === 1 ? '' : 's'} added`
export const filesRejected: YoujLabels['filesRejected'] = (count) => `${count} rejected`
export const fileRemoved: YoujLabels['fileRemoved'] = (name) => `${name} removed`
export const fileRetrying: YoujLabels['fileRetrying'] = (name) => `Retrying ${name}`
export const fileTypeList: YoujLabels['fileTypeList'] = (types) => (types.length > 1 ? `${types.slice(0, -1).join(', ')} or ${types.at(-1)}` : (types[0] ?? ''))
export const fileTypeGroup: YoujLabels['fileTypeGroup'] = (type) => `${type}s`
export const fileMaxSize: YoujLabels['fileMaxSize'] = (size, each) => `up to ${size}${each ? ' each' : ''}`
export const fileMaxFiles: YoujLabels['fileMaxFiles'] = (max) => `${max} files max`
export const fileDropToUpload: YoujLabels['fileDropToUpload'] = 'Drop to upload'
export const fileDropPrompt: YoujLabels['fileDropPrompt'] = (kind) => `Drop ${kind === 'file' ? 'a file' : kind} here or`
export const fileBrowse: YoujLabels['fileBrowse'] = 'browse'
export const fileListImages: YoujLabels['fileListImages'] = 'Images'
export const fileListFiles: YoujLabels['fileListFiles'] = 'Files'
export const fileStatusUploaded: YoujLabels['fileStatusUploaded'] = 'Uploaded'
export const fileRetry: YoujLabels['fileRetry'] = (name) => `Retry ${name}`
export const fileRetryError: YoujLabels['fileRetryError'] = (name, error) => `Retry ${name}: ${error}`
export const fileCancelUpload: YoujLabels['fileCancelUpload'] = (name) => `Cancel upload of ${name}`
export const fileUploading: YoujLabels['fileUploading'] = (name) => `Uploading ${name}`
export const avatarUnsupported: YoujLabels['avatarUnsupported'] = (name, types) => `${name} isn’t a supported image (${types}).`
export const avatarChangePhoto: YoujLabels['avatarChangePhoto'] = 'Change photo'
export const avatarUploadPhoto: YoujLabels['avatarUploadPhoto'] = 'Upload photo'
export const avatarPhotoOf: YoujLabels['avatarPhotoOf'] = (name) => `${name}’s photo`
export const avatarProfilePhoto: YoujLabels['avatarProfilePhoto'] = 'Profile photo'
export const avatarRemove: YoujLabels['avatarRemove'] = 'Remove'
export const avatarCropTitle: YoujLabels['avatarCropTitle'] = 'Crop your photo'
export const avatarCropDescription: YoujLabels['avatarCropDescription'] = 'Drag to reposition. Scroll, pinch or use the slider to zoom.'
export const avatarCropArea: YoujLabels['avatarCropArea'] = 'crop area'
export const avatarCropLabel: YoujLabels['avatarCropLabel'] = 'Photo position and zoom'
export const avatarCropInstructions: YoujLabels['avatarCropInstructions'] = 'Arrow keys move the photo, plus and minus zoom, 0 resets.'
export const avatarReadFailed: YoujLabels['avatarReadFailed'] = 'That image couldn’t be read. Try another file.'
export const avatarZoom: YoujLabels['avatarZoom'] = 'Zoom'
export const avatarZoomIn: YoujLabels['avatarZoomIn'] = 'Zoom in'
export const avatarZoomOut: YoujLabels['avatarZoomOut'] = 'Zoom out'
export const avatarSavePhoto: YoujLabels['avatarSavePhoto'] = 'Save photo'
export const avatarStackPeople: YoujLabels['avatarStackPeople'] = 'People'
export const avatarStackNames: YoujLabels['avatarStackNames'] = (names) =>
    names.length <= 2 ? names.join(' and ') : `${names.slice(0, 2).join(', ')} and ${names.length - 2} others`
export const avatarStackShowAll: YoujLabels['avatarStackShowAll'] = (count, label) => `Show all ${count} ${label.toLowerCase()}`
export const presenceOnline: YoujLabels['presenceOnline'] = 'Online'
export const presenceAway: YoujLabels['presenceAway'] = 'Away'
export const presenceBusy: YoujLabels['presenceBusy'] = 'Busy'
export const presenceOffline: YoujLabels['presenceOffline'] = 'Offline'
export const presenceDoNotDisturb: YoujLabels['presenceDoNotDisturb'] = 'Do not disturb'
export const presenceInvisible: YoujLabels['presenceInvisible'] = 'Invisible'
export const presenceStatus: YoujLabels['presenceStatus'] = 'Status'
export const presenceSetTo: YoujLabels['presenceSetTo'] = (status) => `Status set to ${status}`
export const pages: YoujLabels['pages'] = 'Pages'
export const pagesFound: YoujLabels['pagesFound'] = (count) => `${count} ${count === 1 ? 'page' : 'pages'}`
export const pagesNoMatch: YoujLabels['pagesNoMatch'] = (query) => `No pages match “${query}”`
export const filterPages: YoujLabels['filterPages'] = 'Filter pages'
export const filterPagesPlaceholder: YoujLabels['filterPagesPlaceholder'] = 'Filter pages…'
export const searchEverything: YoujLabels['searchEverything'] = 'Press Enter to search everything.'
export const accountMenu: YoujLabels['accountMenu'] = (name) => `Account: ${name}`
export const accountTheme: YoujLabels['accountTheme'] = 'Theme'
export const accountPreset: YoujLabels['accountPreset'] = 'Preset'
export const accountAppearance: YoujLabels['accountAppearance'] = 'Appearance'
export const colorModeLight: YoujLabels['colorModeLight'] = 'Light'
export const colorModeDark: YoujLabels['colorModeDark'] = 'Dark'
export const colorModeSystem: YoujLabels['colorModeSystem'] = 'System'
export const signOut: YoujLabels['signOut'] = 'Sign out'
export const workspaces: YoujLabels['workspaces'] = 'Workspaces'
export const workspaceCreate: YoujLabels['workspaceCreate'] = 'Create workspace'
export const workspaceCreateNamed: YoujLabels['workspaceCreateNamed'] = (label, name) => `${label} “${name}”`
export const workspaceSearch: YoujLabels['workspaceSearch'] = 'Find a workspace…'
export const workspaceSwitch: YoujLabels['workspaceSwitch'] = (name) => `${name}, switch workspace`
export const workspaceChoose: YoujLabels['workspaceChoose'] = 'Choose a workspace'
export const workspaceNoMatch: YoujLabels['workspaceNoMatch'] = 'No workspace matches.'
export const announcement: YoujLabels['announcement'] = 'Announcement'
export const dismissAnnouncement: YoujLabels['dismissAnnouncement'] = 'Dismiss announcement'
export const code: YoujLabels['code'] = 'Code'
export const codeBlock: YoujLabels['codeBlock'] = (language) => `${language} code`
export const copyCode: YoujLabels['copyCode'] = 'Copy code'
export const diffViewer: YoujLabels['diffViewer'] = 'File changes'
export const diffSummary: YoujLabels['diffSummary'] = (additions, deletions) =>
  `${additions} ${additions === 1 ? 'addition' : 'additions'}, ${deletions} ${deletions === 1 ? 'deletion' : 'deletions'}`
export const diffView: YoujLabels['diffView'] = 'Diff view'
export const diffUnified: YoujLabels['diffUnified'] = 'Unified'
export const diffSplit: YoujLabels['diffSplit'] = 'Split'
export const diffWrap: YoujLabels['diffWrap'] = 'Wrap lines'
export const diffAddedLine: YoujLabels['diffAddedLine'] = (line) => `Added line ${line}`
export const diffRemovedLine: YoujLabels['diffRemovedLine'] = (line) => `Removed line ${line}`
export const diffUnchanged: YoujLabels['diffUnchanged'] = (count) => `${count} unchanged ${count === 1 ? 'line' : 'lines'}`
export const diffChange: YoujLabels['diffChange'] = (index, total) => `Change ${index} of ${total}`
export const diffChanges: YoujLabels['diffChanges'] = (count) => `${count} ${count === 1 ? 'change' : 'changes'}`
export const diffNextChange: YoujLabels['diffNextChange'] = 'Next change'
export const diffPreviousChange: YoujLabels['diffPreviousChange'] = 'Previous change'
export const diffNoChanges: YoujLabels['diffNoChanges'] = 'No changes'
export const diffNoNewline: YoujLabels['diffNoNewline'] = 'No newline at end of file'
export const diffBefore: YoujLabels['diffBefore'] = 'Before'
export const diffAfter: YoujLabels['diffAfter'] = 'After'
export const diffHint: YoujLabels['diffHint'] = 'Press J or K to move between changes.'
export const sortableInstructions: YoujLabels['sortableInstructions'] = 'To reorder, press Space or Enter on a handle to pick the item up, the arrow keys to move it, Space or Enter to drop it, or Escape to cancel.'
export const sortableRoleItem: YoujLabels['sortableRoleItem'] = 'sortable item'
export const sortableReorder: YoujLabels['sortableReorder'] = 'Reorder'
export const sortableReorderItem: YoujLabels['sortableReorderItem'] = (item) => `Reorder ${item}`
export const sortablePosition: YoujLabels['sortablePosition'] = (position, count) => `position ${position} of ${count}`
export const sortablePickedUp: YoujLabels['sortablePickedUp'] = (item, place) => `Picked up ${item}, ${place}.`
export const sortablePickedUpKeyboard: YoujLabels['sortablePickedUpKeyboard'] = (item, place) => `Picked up ${item}, ${place}. Use the arrow keys to move it, Space to drop it, Escape to cancel.`
export const sortableMoved: YoujLabels['sortableMoved'] = (item, place) => `${item}: ${place}.`
export const sortableDropped: YoujLabels['sortableDropped'] = (item, place) => `Dropped ${item} at ${place}.`
export const sortableCancelled: YoujLabels['sortableCancelled'] = (item, place) => `Canceled. ${item} is back at ${place}.`
export const treemap: YoujLabels['treemap'] = 'Treemap'
export const noData: YoujLabels['noData'] = 'No data'
export const shareOfTotal: YoujLabels['shareOfTotal'] = (share) => `${share} of total`
export const treemapItem: YoujLabels['treemapItem'] = (name, value, share, highlighted) =>
  `${name}: ${value}, ${share} of total${highlighted ? ', highlighted' : ''}`
export const treemapSummary: YoujLabels['treemapSummary'] = (count, total, largest, share) =>
  `${count} ${count === 1 ? 'part' : 'parts'}, ${total} in all. The largest is ${largest}, at ${share}.`
export const shareRingPart: YoujLabels['shareRingPart'] = (name, share) => `${name} ${share}`
export const shareRingSummary: YoujLabels['shareRingSummary'] = (total, parts) =>
  `${total}: ${new Intl.ListFormat('en', { type: 'conjunction' }).format(parts)}`
export const activityRings: YoujLabels['activityRings'] = 'Activity rings'
export const activityRingsValue: YoujLabels['activityRingsValue'] = (name, value, max, percent) => `${name}: ${value} of ${max}, ${percent}`
export const slotGrid: YoujLabels['slotGrid'] = 'Available times'
export const slotGridHint: YoujLabels['slotGridHint'] = 'Arrow keys move between times; Enter picks one.'
export const slotGridLeft: YoujLabels['slotGridLeft'] = (left) => `${left} left`
export const slotGridFull: YoujLabels['slotGridFull'] = 'Full'
export const slotGridClosed: YoujLabels['slotGridClosed'] = 'Unavailable'
export const slotGridFew: YoujLabels['slotGridFew'] = 'Few left'
export const slotGridOpen: YoujLabels['slotGridOpen'] = 'Open'
export const slotGridMine: YoujLabels['slotGridMine'] = 'Yours'
export const slotGridCell: YoujLabels['slotGridCell'] = (day, time, status) => `${day}, ${time}, ${status}`
export const slotGridDays: YoujLabels['slotGridDays'] = 'Days'
export const slotGridOpenCount: YoujLabels['slotGridOpenCount'] = (count) => `${count} open`
export const waveformSeek: YoujLabels['waveformSeek'] = 'Seek'
export const waveformPosition: YoujLabels['waveformPosition'] = (time, total, chapter) => `${time} of ${total}${chapter ? `, ${chapter}` : ''}`
export const waveformClipStart: YoujLabels['waveformClipStart'] = 'Clip start'
export const waveformClipEnd: YoujLabels['waveformClipEnd'] = 'Clip end'

export const bucketTokens: YoujLabels['bucketTokens'] = 'Tokens'
export const bucketRefill: YoujLabels['bucketRefill'] = 'Refill'
export const bucketFullIn: YoujLabels['bucketFullIn'] = 'Full in'
export const bucketFull: YoujLabels['bucketFull'] = 'Full'
export const bucketEmpty: YoujLabels['bucketEmpty'] = 'Empty'
export const bucketBurst: YoujLabels['bucketBurst'] = 'Burst'
export const bucketValueText: YoujLabels['bucketValueText'] = (tokens, capacity, rate) => `${tokens} of ${capacity} tokens, refilling ${rate} a second`
export const bucketUnderBurst: YoujLabels['bucketUnderBurst'] = (burst) => `under the burst of ${burst}`
export const latencyDistribution: YoujLabels['latencyDistribution'] = 'Latency distribution'
export const latencyWithinSlo: YoujLabels['latencyWithinSlo'] = 'Within SLO'
export const latencySloAt: YoujLabels['latencySloAt'] = (value) => `SLO ${value}`
export const latencySummary: YoujLabels['latencySummary'] = (count, percentiles) => `${count} ${count === 1 ? 'request' : 'requests'} sampled: ${percentiles}.`
export const latencyWithin: YoujLabels['latencyWithin'] = (share, slo) => `${share} within the ${slo} SLO.`
export const uptime: YoujLabels['uptime'] = 'Uptime'
export const uptimeDay: YoujLabels['uptimeDay'] = (date, uptime) => `${date}: ${uptime} uptime`
export const uptimeNoData: YoujLabels['uptimeNoData'] = (date) => `${date}: no data`
export const uptimeIncidents: YoujLabels['uptimeIncidents'] = (count) => (count === 0 ? 'No incidents' : `${count} ${count === 1 ? 'incident' : 'incidents'}`)
export const uptimeDowntime: YoujLabels['uptimeDowntime'] = (duration) => `${duration} down`
export const uptimeSummary: YoujLabels['uptimeSummary'] = (days, average, affected) =>
  `${days} days at ${average} uptime on average. ${affected} ${affected === 1 ? 'day' : 'days'} with downtime.`
export const forecast: YoujLabels['forecast'] = 'Spend forecast'
export const forecastActual: YoujLabels['forecastActual'] = 'Actual'
export const forecastProjected: YoujLabels['forecastProjected'] = 'Forecast'
export const forecastRange: YoujLabels['forecastRange'] = 'Likely range'
export const forecastBudget: YoujLabels['forecastBudget'] = 'Budget'
export const forecastCrosses: YoujLabels['forecastCrosses'] = (date) => `Crosses budget ${date}`
export const forecastSummary: YoujLabels['forecastSummary'] = (spent, budget, projected, low, high) =>
  `${spent} spent of ${budget}. Forecast ${projected} by the end of the period, likely between ${low} and ${high}.`
export const forecastWithin: YoujLabels['forecastWithin'] = 'Stays within budget'
export const transfers: YoujLabels['transfers'] = 'Transfers'
export const transferPause: YoujLabels['transferPause'] = (name) => `Pause ${name}`
export const transferResume: YoujLabels['transferResume'] = (name) => `Resume ${name}`
export const transferCancel: YoujLabels['transferCancel'] = (name) => `Cancel ${name}`
export const transferProgress: YoujLabels['transferProgress'] = (done, total) => `${done} of ${total}`
export const transferLeft: YoujLabels['transferLeft'] = (time) => `${time} left`
export const transferQueued: YoujLabels['transferQueued'] = 'Queued'
export const transferPaused: YoujLabels['transferPaused'] = 'Paused'
export const transferFinished: YoujLabels['transferFinished'] = (name) => `${name} finished`
export const transferFailed: YoujLabels['transferFailed'] = (name) => `${name} failed`
export const transferFiles: YoujLabels['transferFiles'] = (done, total) => `${done} of ${total} ${total === 1 ? 'file' : 'files'}`
export const transferRate: YoujLabels['transferRate'] = 'Rate'
export const transferTimeLeft: YoujLabels['transferTimeLeft'] = 'Time left'
export const transferPauseAll: YoujLabels['transferPauseAll'] = 'Pause all'
export const transferResumeAll: YoujLabels['transferResumeAll'] = 'Resume all'
export const transferCancelAll: YoujLabels['transferCancelAll'] = 'Cancel all'
export const showFewer: YoujLabels['showFewer'] = 'Show fewer'
export const progressPath: YoujLabels['progressPath'] = 'Progress path'
export const progressPathHint: YoujLabels['progressPathHint'] = 'Arrow keys move between lessons; Enter opens one.'
export const lessonItem: YoujLabels['lessonItem'] = (title, position, count, status, mastery, levels) =>
  `${title}, lesson ${position} of ${count}, ${status}, mastery ${mastery} of ${levels}`
export const milestoneItem: YoujLabels['milestoneItem'] = (title, status) => `${title}, milestone, ${status}`
export const lessonDone: YoujLabels['lessonDone'] = 'complete'
export const lessonCurrent: YoujLabels['lessonCurrent'] = 'up next'
export const lessonLocked: YoujLabels['lessonLocked'] = 'locked'
export const lessonStart: YoujLabels['lessonStart'] = 'Start'
export const sectionProgress: YoujLabels['sectionProgress'] = (done, total) => `${done} of ${total} ${total === 1 ? 'lesson' : 'lessons'}`
export const intervalTimer: YoujLabels['intervalTimer'] = 'Interval timer'
export const intervalWork: YoujLabels['intervalWork'] = 'Work'
export const intervalRest: YoujLabels['intervalRest'] = 'Rest'
export const intervalWarmup: YoujLabels['intervalWarmup'] = 'Warm-up'
export const intervalCooldown: YoujLabels['intervalCooldown'] = 'Cool-down'
export const intervalRound: YoujLabels['intervalRound'] = 'Round'
export const intervalRoundOf: YoujLabels['intervalRoundOf'] = (round, rounds) => `Round ${round} of ${rounds}`
export const intervalLeft: YoujLabels['intervalLeft'] = (time) => `${time} left`
export const intervalStarted: YoujLabels['intervalStarted'] = (phase, time, next) => `${phase}, ${time}.${next ? ` Next: ${next}.` : ''}`
export const intervalFinished: YoujLabels['intervalFinished'] = 'Workout complete'
export const intervalNext: YoujLabels['intervalNext'] = 'Next'
export const seatMap: YoujLabels['seatMap'] = 'Seat map'
export const seatMapHint: YoujLabels['seatMapHint'] = 'Arrow keys move between seats; Space or Enter picks one.'
export const seatMapStage: YoujLabels['seatMapStage'] = 'Stage'
export const seatItem: YoujLabels['seatItem'] = (row, seat, price, status) => `Row ${row}, seat ${seat}, ${price}, ${status}`
export const seatAvailable: YoujLabels['seatAvailable'] = 'available'
export const seatUnavailable: YoujLabels['seatUnavailable'] = 'unavailable'
export const seatSelected: YoujLabels['seatSelected'] = 'selected'
export const seatRow: YoujLabels['seatRow'] = (row) => `Row ${row}`
export const seatNumber: YoujLabels['seatNumber'] = (seat) => `Seat ${seat}`
export const seatAdded: YoujLabels['seatAdded'] = (row, seat) => `Row ${row}, seat ${seat} added`
export const seatRemoved: YoujLabels['seatRemoved'] = (row, seat) => `Row ${row}, seat ${seat} removed`
export const seatLimit: YoujLabels['seatLimit'] = (max) => `You can pick up to ${max} ${max === 1 ? 'seat' : 'seats'}`
export const dial: YoujLabels['dial'] = 'Dial'
export const dialNow: YoujLabels['dialNow'] = 'Now'
export const dialValueNow: YoujLabels['dialValueNow'] = (value, now) => `${value}, now ${now}`
export const dialMark: YoujLabels['dialMark'] = (label, value) => `${label}: ${value}`
export const rota: YoujLabels['rota'] = 'On-call rota'
export const rotaNow: YoujLabels['rotaNow'] = 'Now'
export const rotaShift: YoujLabels['rotaShift'] = (name, start, end, override) => `${name}, ${start} to ${end}${override ? ', override' : ''}`
export const rotaOverride: YoujLabels['rotaOverride'] = 'Override'
export const rotaHandoff: YoujLabels['rotaHandoff'] = (name) => `Hands off to ${name}`
export const rotaHint: YoujLabels['rotaHint'] = 'Arrow keys move between shifts; Enter opens one.'
export const rotaOnCall: YoujLabels['rotaOnCall'] = 'On call now'
export const rotaUpcoming: YoujLabels['rotaUpcoming'] = 'Upcoming'
export const rotaEnded: YoujLabels['rotaEnded'] = 'Ended'
export const diffBetter: YoujLabels['diffBetter'] = (name, by) => `${name} is better by ${by}`
export const diffEven: YoujLabels['diffEven'] = 'Even'
export const calendarHeatmap: YoujLabels['calendarHeatmap'] = 'Daily history'
export const streakDay: YoujLabels['streakDay'] = (date, state) => `${date}, ${state}`
export const streakDone: YoujLabels['streakDone'] = 'Done'
export const streakMissed: YoujLabels['streakMissed'] = 'Missed'
export const streakFrozen: YoujLabels['streakFrozen'] = 'Frozen'
export const streakPartial: YoujLabels['streakPartial'] = (done, total) => `${done} of ${total} done`
export const streakToday: YoujLabels['streakToday'] = 'Today'
export const streakMarkDone: YoujLabels['streakMarkDone'] = 'Mark done'
export const streakTodayDone: YoujLabels['streakTodayDone'] = (days) => `Done for today. Streak: ${days} ${days === 1 ? 'day' : 'days'}`
export const streakTodayUndone: YoujLabels['streakTodayUndone'] = 'Today isn’t done yet'
export const streakCurrent: YoujLabels['streakCurrent'] = 'Current streak'
export const streakLongest: YoujLabels['streakLongest'] = 'Longest'
export const streakRate: YoujLabels['streakRate'] = 'Completion'
export const streakFreezes: YoujLabels['streakFreezes'] = 'Freezes'
export const streakDays: YoujLabels['streakDays'] = (days) => `${days} ${days === 1 ? 'day' : 'days'}`
export const streakFreezesLeft: YoujLabels['streakFreezesLeft'] = (left) => `${left} left`
export const streakMilestone: YoujLabels['streakMilestone'] = (days) => `${days}-day milestone`
export const streakLess: YoujLabels['streakLess'] = 'Less'
export const streakMore: YoujLabels['streakMore'] = 'More'
export const envelopes: YoujLabels['envelopes'] = 'Envelopes'
export const envelopeLeft: YoujLabels['envelopeLeft'] = (amount) => `${amount} left`
export const envelopeOver: YoujLabels['envelopeOver'] = (amount) => `${amount} over`
export const envelopeOf: YoujLabels['envelopeOf'] = (left, budget) => `${left} left of ${budget}`
export const envelopeRollover: YoujLabels['envelopeRollover'] = (amount) => `${amount} rolled over`
export const envelopeRolloverTag: YoujLabels['envelopeRolloverTag'] = 'Rollover'
export const envelopeOverspentTag: YoujLabels['envelopeOverspentTag'] = 'Overspent'
export const envelopeHint: YoujLabels['envelopeHint'] =
  'Space picks up money from an envelope. Arrow keys choose where it goes, Up and Down change the amount, Enter moves it and Escape cancels.'
export const envelopePickedUp: YoujLabels['envelopePickedUp'] = (amount, from) => `Moving ${amount} from ${from}. Choose an envelope.`
export const envelopeTarget: YoujLabels['envelopeTarget'] = (amount, from, to) => `Move ${amount} from ${from} to ${to}`
export const envelopeMoved: YoujLabels['envelopeMoved'] = (amount, from, to) => `Moved ${amount} from ${from} to ${to}`
export const envelopeMoveCancelled: YoujLabels['envelopeMoveCancelled'] = 'Move canceled'
export const itinerary: YoujLabels['itinerary'] = 'Itinerary'
export const itineraryDay: YoujLabels['itineraryDay'] = (day) => `Day ${day}`
export const itineraryLeg: YoujLabels['itineraryLeg'] = (from, to, depart, arrive) => `${from} to ${to}, ${depart} to ${arrive}`
export const itineraryTimeShift: YoujLabels['itineraryTimeShift'] = (shift) => `Local time ${shift}`
export const itineraryNights: YoujLabels['itineraryNights'] = (nights) => `${nights} ${nights === 1 ? 'night' : 'nights'}`
export const itineraryNow: YoujLabels['itineraryNow'] = 'Now'
export const itineraryInTransit: YoujLabels['itineraryInTransit'] = 'In transit'
export const play: YoujLabels['play'] = 'Play'
export const pause: YoujLabels['pause'] = 'Pause'
export const previousTrack: YoujLabels['previousTrack'] = 'Previous track'
export const nextTrack: YoujLabels['nextTrack'] = 'Next track'
export const gradientSliderValue: YoujLabels['gradientSliderValue'] = (value, zone) => (zone ? `${value}, ${zone}` : value)

export const zoomIn: YoujLabels['zoomIn'] = 'Zoom in'
export const zoomOut: YoujLabels['zoomOut'] = 'Zoom out'
export const zoomToFit: YoujLabels['zoomToFit'] = 'Fit to view'
export const flowGraph: YoujLabels['flowGraph'] = 'Flow graph'
export const flowGraphHint: YoujLabels['flowGraphHint'] = 'Arrow keys follow the edges to the next or previous step, Enter opens a step. Plus and minus zoom, 0 fits the graph.'
export const flowQueued: YoujLabels['flowQueued'] = 'Queued'
export const flowRunning: YoujLabels['flowRunning'] = 'Running'
export const flowSucceeded: YoujLabels['flowSucceeded'] = 'Succeeded'
export const flowFailed: YoujLabels['flowFailed'] = 'Failed'
export const flowRetried: YoujLabels['flowRetried'] = 'Retried'
export const flowSkipped: YoujLabels['flowSkipped'] = 'Skipped'
export const flowGraphNode: YoujLabels['flowGraphNode'] = (name, status, detail) => `${name}, ${status}${detail ? `, ${detail}` : ''}`
export const flowGraphAfter: YoujLabels['flowGraphAfter'] = (names) => `After ${names}`
export const flowGraphThen: YoujLabels['flowGraphThen'] = (names) => `Then ${names}`
export const flowGraphAttempts: YoujLabels['flowGraphAttempts'] = (count) => `${count} ${count === 1 ? 'attempt' : 'attempts'}`
export const trackTimeline: YoujLabels['trackTimeline'] = 'Timeline'
export const trackTimelineHint: YoujLabels['trackTimelineHint'] = 'Arrow keys move the clip, with Shift ten times as far. Tab on to its edges to trim them.'
export const trackTimelineClip: YoujLabels['trackTimelineClip'] = (name, range, track) => `${name}, ${range}, ${track}`
export const trackTimelineRange: YoujLabels['trackTimelineRange'] = (start, end) => `${start} to ${end}`
export const trackTimelineClipStart: YoujLabels['trackTimelineClipStart'] = (name) => `Start of ${name}`
export const trackTimelineClipEnd: YoujLabels['trackTimelineClipEnd'] = (name) => `End of ${name}`
export const trackTimelineMute: YoujLabels['trackTimelineMute'] = (track) => `Mute ${track}`
export const trackTimelineSolo: YoujLabels['trackTimelineSolo'] = (track) => `Solo ${track}`
export const trackTimelinePlayhead: YoujLabels['trackTimelinePlayhead'] = 'Playhead'

export const spaciousRows: YoujLabels['spaciousRows'] = 'Spacious rows'
export const groupBy: YoujLabels['groupBy'] = 'Group by'
export const noGrouping: YoujLabels['noGrouping'] = 'No grouping'
export const groupedBy: YoujLabels['groupedBy'] = (column) => `Grouped by ${column}`
export const groupingCleared: YoujLabels['groupingCleared'] = 'Grouping cleared'
export const showDetails: YoujLabels['showDetails'] = (row) => `Show details for ${row}`
export const hideDetails: YoujLabels['hideDetails'] = (row) => `Hide details for ${row}`
export const copyValue: YoujLabels['copyValue'] = (value) => `Copy ${value}`
export const sortBy: YoujLabels['sortBy'] = 'Sort by'
export const addFilter: YoujLabels['addFilter'] = 'Filter'
export const booleanYes: YoujLabels['booleanYes'] = 'Yes'
export const booleanNo: YoujLabels['booleanNo'] = 'No'
export const valueOfMax: YoujLabels['valueOfMax'] = (value, max) => `${value} of ${max}`
export const gridHintOpen: YoujLabels['gridHintOpen'] = 'Enter opens a row.'
export const groupTotal: YoujLabels['groupTotal'] = 'Total'
export const groupAverage: YoujLabels['groupAverage'] = 'Average'
export const records: YoujLabels['records'] = 'Records'
export const previousRecord: YoujLabels['previousRecord'] = 'Previous record'
export const nextRecord: YoujLabels['nextRecord'] = 'Next record'
export const recordOf: YoujLabels['recordOf'] = (position, total) => `${position} of ${total}`
export const proposed: YoujLabels['proposed'] = 'Proposed'
export const stepDetour: YoujLabels['stepDetour'] = (step) => `Detour, rejoins at step ${step}`
export const routeMap: YoujLabels['routeMap'] = 'Route map'
export const routeOnTime: YoujLabels['routeOnTime'] = 'On time'
export const routeDelayed: YoujLabels['routeDelayed'] = 'Delayed'
export const routeDone: YoujLabels['routeDone'] = 'Traveled'
export const routeOrigin: YoujLabels['routeOrigin'] = 'Origin'
export const routeDestination: YoujLabels['routeDestination'] = 'Destination'
export const routeCurrent: YoujLabels['routeCurrent'] = 'Current position'
export const routeStop: YoujLabels['routeStop'] = 'Stop'
export const annotations: YoujLabels['annotations'] = 'Annotations'
export const imageAccordion: YoujLabels['imageAccordion'] = 'Gallery'
export const editProperty: YoujLabels['editProperty'] = (label) => `Edit ${label}`

export const unitChart: YoujLabels['unitChart'] = 'Unit chart'
export const unitChartItem: YoujLabels['unitChartItem'] = (label, value, highlighted) => `${label}: ${value}${highlighted ? ', highlighted' : ''}`
export const unitChartSummary: YoujLabels['unitChartSummary'] = (count, total, peak, value) =>
  `${count} ${count === 1 ? 'column' : 'columns'}, ${total} in all. The peak is ${peak}, at ${value}.`

export const waffleChart: YoujLabels['waffleChart'] = 'Waffle chart'

export const radarChart: YoujLabels['radarChart'] = 'Radar chart'

export const radarChartAxis: YoujLabels['radarChartAxis'] = 'Axis'

export const radialGraph: YoujLabels['radialGraph'] = 'Radial graph'
export const radialGraphHops: YoujLabels['radialGraphHops'] = (hops) => `${hops} ${hops === 1 ? 'hop' : 'hops'}`
export const radialGraphItem: YoujLabels['radialGraphItem'] = (label, hops) => `${label}, ${hops} away`
export const radialGraphSummary: YoujLabels['radialGraphSummary'] = (center, count, hops) => `${count} linked to ${center} within ${hops}.`

export const densityLanes: YoujLabels['densityLanes'] = 'Density lanes'
export const densityLanesSummary: YoujLabels['densityLanesSummary'] = (lanes, total, peak, value) =>
  `${lanes} ${lanes === 1 ? 'lane' : 'lanes'}, ${total} in all. The busiest column is ${peak}, with ${value}.`

export const coverageMatrix: YoujLabels['coverageMatrix'] = 'Coverage matrix'
export const coverageMatrixNone: YoujLabels['coverageMatrixNone'] = 'None'
export const coverageMatrixDepth: YoujLabels['coverageMatrixDepth'] = 'Fill shows depth'
export const coverageMatrixSummary: YoujLabels['coverageMatrixSummary'] = (covered, total) => `${covered} of ${total} covered.`

export const milestoneRuler: YoujLabels['milestoneRuler'] = 'Milestones'
export const milestoneRulerDone: YoujLabels['milestoneRulerDone'] = 'Done'
export const milestoneRulerUpcoming: YoujLabels['milestoneRulerUpcoming'] = 'Upcoming'
export const milestoneRulerAtRisk: YoujLabels['milestoneRulerAtRisk'] = 'At risk'
export const milestoneRulerItem: YoujLabels['milestoneRulerItem'] = (title, date, status) => `${title}, ${date}, ${status}`
export const milestoneRulerCount: YoujLabels['milestoneRulerCount'] = (count) => `${count} ${count === 1 ? 'milestone' : 'milestones'}`
export const milestoneRulerMore: YoujLabels['milestoneRulerMore'] = (count) => `+${count} more`
export const milestoneRulerSummary: YoujLabels['milestoneRulerSummary'] = (count, done) =>
  `${count} ${count === 1 ? 'milestone' : 'milestones'}, ${done} done.`
export const milestoneRulerEmpty: YoujLabels['milestoneRulerEmpty'] = 'No milestones'

export const scoreRing: YoujLabels['scoreRing'] = 'Score'
export const scoreRingValue: YoujLabels['scoreRingValue'] = (value, max) => `${value} of ${max}`
export const scoreRingGrade: YoujLabels['scoreRingGrade'] = (grade) => `grade ${grade}`

export const forecastScenario: YoujLabels['forecastScenario'] = 'Scenario'
export const forecastScenarioSummary: YoujLabels['forecastScenarioSummary'] = (name, projected) => `${name}: ${projected} by the end of the period.`

export const flowLanes: YoujLabels['flowLanes'] = 'Flow lanes'
export const flowLanesItem: YoujLabels['flowLanesItem'] = (label, value, share) => `${label}: ${value}, ${share}`
export const flowLanesSummary: YoujLabels['flowLanesSummary'] = (source, lanes, total) => `${source} to ${lanes} ${lanes === 1 ? 'lane' : 'lanes'}, ${total} in all.`

export const cellBar: YoujLabels['cellBar'] = 'Cell bar'
export const cellBarItem: YoujLabels['cellBarItem'] = (label, value, projected) => `${label}: ${value}${projected ? ', projected' : ''}`
export const cellBarSummary: YoujLabels['cellBarSummary'] = (total) => `${total} in all.`
export const cellBarProjected: YoujLabels['cellBarProjected'] = (amount) => `${amount} of it projected.`
export const cellBarTarget: YoujLabels['cellBarTarget'] = (target) => `Target ${target}.`

export const lollipopChart: YoujLabels['lollipopChart'] = 'Lollipop chart'
export const lollipopChartSummary: YoujLabels['lollipopChartSummary'] = (count, low, high) => `${count} ${count === 1 ? 'point' : 'points'}, from ${low} to ${high}.`

export const undo: YoujLabels['undo'] = 'Undo'
export const redo: YoujLabels['redo'] = 'Redo'
export const zoomReset: YoujLabels['zoomReset'] = 'Reset zoom'

export const signaturePad: YoujLabels['signaturePad'] = 'Signature'
export const signaturePadHint: YoujLabels['signaturePadHint'] = 'Draw with a mouse, pen or finger. Press Enter to type your name instead.'
export const signHere: YoujLabels['signHere'] = 'Sign here'
export const signatureMethod: YoujLabels['signatureMethod'] = 'Signature method'
export const signatureDraw: YoujLabels['signatureDraw'] = 'Draw'
export const signatureType: YoujLabels['signatureType'] = 'Sign by typing'
export const signatureTypedName: YoujLabels['signatureTypedName'] = 'Your full name'
export const signatureCleared: YoujLabels['signatureCleared'] = 'Signature cleared'
export const signatureSigned: YoujLabels['signatureSigned'] = 'Signed'
export const signatureAccept: YoujLabels['signatureAccept'] = 'Accept signature'
export const signatureAccepting: YoujLabels['signatureAccepting'] = 'Accepting…'
export const signatureAccepted: YoujLabels['signatureAccepted'] = 'Signature accepted'
export const signatureSignedAt: YoujLabels['signatureSignedAt'] = (time) => `Signed ${time}`
export const signatureLocked: YoujLabels['signatureLocked'] = 'Signature locked. Choose Re-sign to change it.'
export const signatureResign: YoujLabels['signatureResign'] = 'Re-sign'
export const signatureUnlocked: YoujLabels['signatureUnlocked'] = 'Signature unlocked'

export const whiteboard: YoujLabels['whiteboard'] = 'Whiteboard'
export const whiteboardHint: YoujLabels['whiteboardHint'] =
  'Tab moves between shapes. Arrow keys move the selected shape, with Shift further, and Delete removes it. Press a tool’s key to switch tools, then Enter to place its shape.'
export const whiteboardTools: YoujLabels['whiteboardTools'] = 'Drawing tools'
export const whiteboardSelect: YoujLabels['whiteboardSelect'] = 'Select'
export const whiteboardHand: YoujLabels['whiteboardHand'] = 'Hand'
export const whiteboardPen: YoujLabels['whiteboardPen'] = 'Pen'
export const whiteboardLine: YoujLabels['whiteboardLine'] = 'Line'
export const whiteboardArrow: YoujLabels['whiteboardArrow'] = 'Arrow'
export const whiteboardRectangle: YoujLabels['whiteboardRectangle'] = 'Rectangle'
export const whiteboardEllipse: YoujLabels['whiteboardEllipse'] = 'Ellipse'
export const whiteboardText: YoujLabels['whiteboardText'] = 'Text'
export const whiteboardColor: YoujLabels['whiteboardColor'] = 'Stroke color'
export const whiteboardWidth: YoujLabels['whiteboardWidth'] = 'Stroke width'
export const whiteboardThin: YoujLabels['whiteboardThin'] = 'Thin'
export const whiteboardMedium: YoujLabels['whiteboardMedium'] = 'Medium'
export const whiteboardBold: YoujLabels['whiteboardBold'] = 'Bold'
export const whiteboardInk: YoujLabels['whiteboardInk'] = 'Ink'
export const whiteboardAccent: YoujLabels['whiteboardAccent'] = 'Accent'
export const whiteboardRed: YoujLabels['whiteboardRed'] = 'Red'
export const whiteboardAmber: YoujLabels['whiteboardAmber'] = 'Amber'
export const whiteboardGreen: YoujLabels['whiteboardGreen'] = 'Green'
export const whiteboardBlue: YoujLabels['whiteboardBlue'] = 'Blue'
export const whiteboardDelete: YoujLabels['whiteboardDelete'] = 'Delete selection'
export const whiteboardTextPlaceholder: YoujLabels['whiteboardTextPlaceholder'] = 'Type text'
export const whiteboardSummary: YoujLabels['whiteboardSummary'] = (count) => (count === 0 ? 'Empty board' : `${count} ${count === 1 ? 'shape' : 'shapes'}`)
export const whiteboardSelected: YoujLabels['whiteboardSelected'] = (count) => (count === 0 ? 'Nothing selected' : `${count} selected`)
export const whiteboardAdded: YoujLabels['whiteboardAdded'] = (shape) => `${shape} added`
export const whiteboardDeleted: YoujLabels['whiteboardDeleted'] = (count) => `${count} ${count === 1 ? 'shape' : 'shapes'} deleted`
export const whiteboardShapeText: YoujLabels['whiteboardShapeText'] = (shape, text) => `${shape}: ${text}`
export const whiteboardSticky: YoujLabels['whiteboardSticky'] = 'Sticky note'
export const whiteboardConnector: YoujLabels['whiteboardConnector'] = 'Connector'
export const whiteboardComment: YoujLabels['whiteboardComment'] = 'Comment'
export const whiteboardEmbed: YoujLabels['whiteboardEmbed'] = 'Embed'
export const whiteboardRoute: YoujLabels['whiteboardRoute'] = 'Connector route'
export const whiteboardStraight: YoujLabels['whiteboardStraight'] = 'Straight'
export const whiteboardElbow: YoujLabels['whiteboardElbow'] = 'Elbow'
export const whiteboardConnects: YoujLabels['whiteboardConnects'] = (from, to) => `${from} to ${to}`
export const whiteboardPoint: YoujLabels['whiteboardPoint'] = 'a point'
export const whiteboardArrange: YoujLabels['whiteboardArrange'] = 'Arrange'
export const whiteboardAlignLeft: YoujLabels['whiteboardAlignLeft'] = 'Align left'
export const whiteboardAlignCenter: YoujLabels['whiteboardAlignCenter'] = 'Align center'
export const whiteboardAlignRight: YoujLabels['whiteboardAlignRight'] = 'Align right'
export const whiteboardAlignTop: YoujLabels['whiteboardAlignTop'] = 'Align top'
export const whiteboardAlignMiddle: YoujLabels['whiteboardAlignMiddle'] = 'Align middle'
export const whiteboardAlignBottom: YoujLabels['whiteboardAlignBottom'] = 'Align bottom'
export const whiteboardDistributeHorizontal: YoujLabels['whiteboardDistributeHorizontal'] = 'Distribute horizontally'
export const whiteboardDistributeVertical: YoujLabels['whiteboardDistributeVertical'] = 'Distribute vertically'
export const whiteboardView: YoujLabels['whiteboardView'] = 'View options'
export const whiteboardZoomToSelection: YoujLabels['whiteboardZoomToSelection'] = 'Zoom to selection'
export const whiteboardMinimap: YoujLabels['whiteboardMinimap'] = 'Minimap'
export const whiteboardSnapToGrid: YoujLabels['whiteboardSnapToGrid'] = 'Snap to grid'
export const whiteboardShortcuts: YoujLabels['whiteboardShortcuts'] = 'Keyboard shortcuts'
export const whiteboardPan: YoujLabels['whiteboardPan'] = 'Pan'
export const whiteboardNudge: YoujLabels['whiteboardNudge'] = 'Nudge the selection'
export const whiteboardSelectAll: YoujLabels['whiteboardSelectAll'] = 'Select all'
export const whiteboardComments: YoujLabels['whiteboardComments'] = 'Comments'
export const whiteboardPin: YoujLabels['whiteboardPin'] = (index, author) => (author ? `Comment ${index} by ${author}` : `Comment ${index}`)
export const whiteboardResolve: YoujLabels['whiteboardResolve'] = 'Resolve'
export const whiteboardReopen: YoujLabels['whiteboardReopen'] = 'Reopen'
export const whiteboardResolved: YoujLabels['whiteboardResolved'] = 'Resolved'
export const whiteboardDeleteComment: YoujLabels['whiteboardDeleteComment'] = 'Delete comment'
export const whiteboardCommentPlaceholder: YoujLabels['whiteboardCommentPlaceholder'] = 'Add a comment'
export const voiceOrb: YoujLabels['voiceOrb'] = 'Voice agent'
export const voiceOrbIdle: YoujLabels['voiceOrbIdle'] = 'Idle'
export const voiceOrbListening: YoujLabels['voiceOrbListening'] = 'Listening'
export const voiceOrbThinking: YoujLabels['voiceOrbThinking'] = 'Thinking'
export const voiceOrbSpeaking: YoujLabels['voiceOrbSpeaking'] = 'Speaking'
export const voiceOrbMuted: YoujLabels['voiceOrbMuted'] = (state) => `${state}, microphone off`
export const voiceOrbState: YoujLabels['voiceOrbState'] = (name, state) => `${name}: ${state}`

export const worldClock: YoujLabels['worldClock'] = 'World clock'
export const worldClockCursor: YoujLabels['worldClockCursor'] = 'Proposed time'
export const worldClockHint: YoujLabels['worldClockHint'] =
  'Arrow keys move the time a step, Shift or Page Up and Page Down an hour, and Home and End go to the ends of the day.'
export const worldClockTime: YoujLabels['worldClockTime'] = (time, place, day) => (day ? `${time} ${day} in ${place}` : `${time} in ${place}`)
export const worldClockSummary: YoujLabels['worldClockSummary'] = (first, others) => `${first} is ${others}`
export const worldClockOverlap: YoujLabels['worldClockOverlap'] = (ranges) => `Everyone in working hours: ${ranges}`
export const worldClockNoOverlap: YoujLabels['worldClockNoOverlap'] = 'No hours when everyone is working'
export const worldClockWorkingHours: YoujLabels['worldClockWorkingHours'] = 'Working hours'
export const worldClockOutsideHours: YoujLabels['worldClockOutsideHours'] = 'Outside working hours'
export const worldClockNight: YoujLabels['worldClockNight'] = 'Night'
export const worldClockDaytime: YoujLabels['worldClockDaytime'] = 'Daytime'
export const worldClockEveryone: YoujLabels['worldClockEveryone'] = 'Everyone working'

export const liveCursorsJoined: YoujLabels['liveCursorsJoined'] = (names) => `${names} joined`
export const liveCursorsLeft: YoujLabels['liveCursorsLeft'] = (names) => `${names} left`
export const liveCursorsPeople: YoujLabels['liveCursorsPeople'] = 'People here'
export const liveCursorsViewing: YoujLabels['liveCursorsViewing'] = 'Viewing'
export const liveCursorsEditing: YoujLabels['liveCursorsEditing'] = 'Editing'
export const liveCursorsFollow: YoujLabels['liveCursorsFollow'] = (name) => `Follow ${name}`
export const liveCursorsFollowing: YoujLabels['liveCursorsFollowing'] = (name) => `Following ${name}`
export const liveCursorsMore: YoujLabels['liveCursorsMore'] = (count) => `${count} more`
export const tourStepOf: YoujLabels['tourStepOf'] = (step, total) => `${step} of ${total}`
export const tourStepAnnounce: YoujLabels['tourStepAnnounce'] = (step, total, title) => `Step ${step} of ${total}: ${title}`
export const tourHint: YoujLabels['tourHint'] = 'Use the arrow keys to move between steps. Press Escape to end the tour.'
export const tourStart: YoujLabels['tourStart'] = 'Start the tour'
export const audioRecorder: YoujLabels['audioRecorder'] = 'Audio recorder'
export const audioRecorderHint: YoujLabels['audioRecorderHint'] = 'Record a voice note'
export const audioRecorderLimit: YoujLabels['audioRecorderLimit'] = (max) => `Up to ${max}`
export const audioRecorderStart: YoujLabels['audioRecorderStart'] = 'Start recording'
export const audioRecorderStop: YoujLabels['audioRecorderStop'] = 'Stop recording'
export const audioRecorderPause: YoujLabels['audioRecorderPause'] = 'Pause recording'
export const audioRecorderResume: YoujLabels['audioRecorderResume'] = 'Resume recording'
export const audioRecorderElapsed: YoujLabels['audioRecorderElapsed'] = 'Recording time'
export const audioRecorderRemaining: YoujLabels['audioRecorderRemaining'] = (time) => `${time} left`
export const audioRecorderRecording: YoujLabels['audioRecorderRecording'] = 'Recording'
export const audioRecorderPaused: YoujLabels['audioRecorderPaused'] = 'Recording paused'
export const audioRecorderStopped: YoujLabels['audioRecorderStopped'] = (duration) => `Recording stopped, ${duration}`
export const audioRecorderLimitReached: YoujLabels['audioRecorderLimitReached'] = 'Time limit reached'
export const audioRecorderRequesting: YoujLabels['audioRecorderRequesting'] = 'Waiting for microphone access…'
export const audioRecorderDenied: YoujLabels['audioRecorderDenied'] = 'Microphone access is blocked. Allow it in your browser’s site settings, then try again.'
export const audioRecorderNoDevice: YoujLabels['audioRecorderNoDevice'] = 'No microphone found. Connect one, then try again.'
export const audioRecorderUnsupported: YoujLabels['audioRecorderUnsupported'] = 'This browser can’t record audio.'
export const audioRecorderFailed: YoujLabels['audioRecorderFailed'] = 'The microphone couldn’t start. Check that no other app is using it, then try again.'
export const audioRecorderDiscard: YoujLabels['audioRecorderDiscard'] = 'Discard recording'
export const audioRecorderDiscarded: YoujLabels['audioRecorderDiscarded'] = 'Recording discarded'
export const audioRecorderRestored: YoujLabels['audioRecorderRestored'] = 'Recording restored'
export const audioRecorderSave: YoujLabels['audioRecorderSave'] = 'Save'
export const audioRecorderSaving: YoujLabels['audioRecorderSaving'] = 'Saving…'
export const audioRecorderSaved: YoujLabels['audioRecorderSaved'] = 'Saved'

/** English plurals as the data table's `noun` prop takes them: "orders", "order" for one. */
function nounFor(n: number, noun: string) {
  return n === 1 ? noun.replace(/s$/, '') : noun
}
export const holdToConfirm: YoujLabels['holdToConfirm'] = 'Hold to confirm'
export const slideToConfirm: YoujLabels['slideToConfirm'] = 'Slide to confirm'
export const slideToConfirmHint: YoujLabels['slideToConfirmHint'] = 'Use the arrow keys or End to reach the end, then press Enter.'
export const confirmed: YoujLabels['confirmed'] = 'Confirmed'
export const inlineConfirmPrompt: YoujLabels['inlineConfirmPrompt'] = 'Are you sure?'
export const sessionTimeoutTitle: YoujLabels['sessionTimeoutTitle'] = 'You\'re about to be signed out'
export const sessionTimeoutWarning: YoujLabels['sessionTimeoutWarning'] = (time) => `You'll be signed out in ${time}.`
export const sessionTimeoutReason: YoujLabels['sessionTimeoutReason'] = 'We do this to keep your information safe, because you have not done anything for a while.'
export const sessionTimeoutStay: YoujLabels['sessionTimeoutStay'] = 'Stay signed in'
export const sessionTimeoutSignOut: YoujLabels['sessionTimeoutSignOut'] = 'Sign out now'
export const sessionTimeoutDoneTitle: YoujLabels['sessionTimeoutDoneTitle'] = 'You\'ve been signed out'
export const sessionTimeoutDoneBody: YoujLabels['sessionTimeoutDoneBody'] = 'You were inactive for too long, so we signed you out to keep your information safe.'
export const sessionTimeoutSignIn: YoujLabels['sessionTimeoutSignIn'] = 'Sign in again'
export const filterBuilder: YoujLabels['filterBuilder'] = 'Filter'
export const filterAnd: YoujLabels['filterAnd'] = 'And'
export const filterOr: YoujLabels['filterOr'] = 'Or'
export const filterCombinator: YoujLabels['filterCombinator'] = 'Combine rules with'
export const filterAddRule: YoujLabels['filterAddRule'] = 'Add filter'
export const filterAddGroup: YoujLabels['filterAddGroup'] = 'Add group'
export const filterRuleN: YoujLabels['filterRuleN'] = (position) => `Rule ${position}`
export const filterGroupN: YoujLabels['filterGroupN'] = (position) => `Group ${position}`
export const filterDuplicate: YoujLabels['filterDuplicate'] = (name) => `Duplicate ${name}`
export const filterField: YoujLabels['filterField'] = 'Field'
export const filterOperator: YoujLabels['filterOperator'] = 'Operator'
export const filterValue: YoujLabels['filterValue'] = 'Value'
export const filterValueFrom: YoujLabels['filterValueFrom'] = 'From'
export const filterValueTo: YoujLabels['filterValueTo'] = 'To'
export const filterDays: YoujLabels['filterDays'] = 'days'
export const filterApply: YoujLabels['filterApply'] = 'Apply'
export const filterReset: YoujLabels['filterReset'] = 'Reset'
export const filterUnapplied: YoujLabels['filterUnapplied'] = 'Changes not applied'
export const filterApplied: YoujLabels['filterApplied'] = 'Filter applied'
export const filterDiscarded: YoujLabels['filterDiscarded'] = 'Changes discarded'
export const filterIncomplete: YoujLabels['filterIncomplete'] = 'Choose a value'
export const filterEmpty: YoujLabels['filterEmpty'] = 'No rules yet'
export const filterSummary: YoujLabels['filterSummary'] = 'Summary'
export const filterSummaryNone: YoujLabels['filterSummaryNone'] = 'No filter applied'
export const filterShowChips: YoujLabels['filterShowChips'] = 'Show as chips'
export const filterShowSentence: YoujLabels['filterShowSentence'] = 'Show as sentence'
export const filterOpIs: YoujLabels['filterOpIs'] = 'is'
export const filterOpIsNot: YoujLabels['filterOpIsNot'] = 'is not'
export const filterOpContains: YoujLabels['filterOpContains'] = 'contains'
export const filterOpStartsWith: YoujLabels['filterOpStartsWith'] = 'starts with'
export const filterOpGt: YoujLabels['filterOpGt'] = 'is greater than'
export const filterOpLt: YoujLabels['filterOpLt'] = 'is less than'
export const filterOpBetween: YoujLabels['filterOpBetween'] = 'is between'
export const filterOpBefore: YoujLabels['filterOpBefore'] = 'is before'
export const filterOpAfter: YoujLabels['filterOpAfter'] = 'is after'
export const filterOpInLast: YoujLabels['filterOpInLast'] = 'is in the last'
export const filterOpIsAnyOf: YoujLabels['filterOpIsAnyOf'] = 'is any of'
export const filterOpHasAny: YoujLabels['filterOpHasAny'] = 'has any of'
export const filterOpHasAll: YoujLabels['filterOpHasAll'] = 'has all of'
export const filterOpIsEmpty: YoujLabels['filterOpIsEmpty'] = 'is empty'
export const filterOpIsNotEmpty: YoujLabels['filterOpIsNotEmpty'] = 'is not empty'
export const filterOpIsTrue: YoujLabels['filterOpIsTrue'] = 'is yes'
export const filterOpIsFalse: YoujLabels['filterOpIsFalse'] = 'is no'
export const filterWhere: YoujLabels['filterWhere'] = 'Where'
export const filterUngroup: YoujLabels['filterUngroup'] = 'Ungroup'
export const filterGroupActions: YoujLabels['filterGroupActions'] = (name) => `${name} actions`
export const importMapperTitle: YoujLabels['importMapperTitle'] = 'Import data'
export const importMapperDescription: YoujLabels['importMapperDescription'] = 'Choose a CSV file and check how its columns match your fields.'
export const importMapperDropTitle: YoujLabels['importMapperDropTitle'] = 'Drop a CSV file here'
export const importMapperDropHint: YoujLabels['importMapperDropHint'] = (size) => `or choose a file, up to ${size}`
export const importMapperChoose: YoujLabels['importMapperChoose'] = 'Choose file'
export const importMapperReplace: YoujLabels['importMapperReplace'] = 'Replace'
export const importMapperRemove: YoujLabels['importMapperRemove'] = 'Remove'
export const importMapperStartOver: YoujLabels['importMapperStartOver'] = 'Start over'
export const importMapperSample: YoujLabels['importMapperSample'] = 'Use sample'
export const importMapperFileMeta: YoujLabels['importMapperFileMeta'] = (rows, columns, size) => `${rows} ${rows === 1 ? 'row' : 'rows'} · ${columns} ${columns === 1 ? 'column' : 'columns'} · ${size}`
export const importMapperTooLarge: YoujLabels['importMapperTooLarge'] = (size, max) => `That file is ${size}. The limit is ${max}.`
export const importMapperNotCsv: YoujLabels['importMapperNotCsv'] = 'Choose a .csv file.'
export const importMapperEmptyFile: YoujLabels['importMapperEmptyFile'] = 'The file has no rows to import.'
export const importMapperUnclosedQuote: YoujLabels['importMapperUnclosedQuote'] = (line) => `Line ${line}: a quoted value is never closed.`
export const importMapperRaggedRow: YoujLabels['importMapperRaggedRow'] = (line, found, expected) => `Line ${line}: ${found} values where the header has ${expected}.`
export const importMapperProblemsMore: YoujLabels['importMapperProblemsMore'] = (count) => `And ${count} more.`
export const importMapperColumn: YoujLabels['importMapperColumn'] = 'Column in your file'
export const importMapperTarget: YoujLabels['importMapperTarget'] = 'Field'
export const importMapperSkipColumn: YoujLabels['importMapperSkipColumn'] = 'Don’t import'
export const importMapperRequired: YoujLabels['importMapperRequired'] = 'Required'
export const importMapperCheck: YoujLabels['importMapperCheck'] = 'Check'
export const importMapperCheckWhy: YoujLabels['importMapperCheckWhy'] = 'We’re not sure about this match.'
export const importMapperNotMatched: YoujLabels['importMapperNotMatched'] = (field) => `${field} isn’t matched yet`
export const importMapperPickColumn: YoujLabels['importMapperPickColumn'] = 'Choose a column'
export const importMapperPickColumnFor: YoujLabels['importMapperPickColumnFor'] = (field) => `Column for ${field}`
export const importMapperBlocked: YoujLabels['importMapperBlocked'] = (names) => `Match ${names} to import.`
export const importMapperNothing: YoujLabels['importMapperNothing'] = 'No rows are left to import.'
export const importMapperMapped: YoujLabels['importMapperMapped'] = (column, target) => `${column} will be imported as ${target}.`
export const importMapperNotImported: YoujLabels['importMapperNotImported'] = (column) => `${column} will not be imported.`
export const importMapperBlank: YoujLabels['importMapperBlank'] = '(empty)'
export const importMapperItems: YoujLabels['importMapperItems'] = (count) => `${count} ${count === 1 ? 'contact' : 'contacts'}`
export const importMapperImport: YoujLabels['importMapperImport'] = (items) => `Import ${items}`
export const importMapperAllGood: YoujLabels['importMapperAllGood'] = 'Everything looks good.'
export const importMapperIssueMissing: YoujLabels['importMapperIssueMissing'] = (count, field) => `${field} is missing in ${count} ${count === 1 ? 'row' : 'rows'}`
export const importMapperIssueInvalid: YoujLabels['importMapperIssueInvalid'] = (count, field) => `${field} is invalid in ${count} ${count === 1 ? 'row' : 'rows'}`
export const importMapperReview: YoujLabels['importMapperReview'] = 'Review'
export const importMapperSkipThem: YoujLabels['importMapperSkipThem'] = (count): string => (count === 1 ? 'Skip it' : 'Skip them')
export const importMapperSkippedNote: YoujLabels['importMapperSkippedNote'] = (count) => `${count} ${count === 1 ? 'row' : 'rows'} skipped`
export const importMapperDuplicatesFound: YoujLabels['importMapperDuplicatesFound'] = (count) => `${count} ${count === 1 ? 'contact already exists' : 'contacts already exist'}`
export const importMapperPolicy: YoujLabels['importMapperPolicy'] = 'What should happen to them?'
export const importMapperPolicyUpdate: YoujLabels['importMapperPolicyUpdate'] = 'Update'
export const importMapperPolicyCreate: YoujLabels['importMapperPolicyCreate'] = 'Add as new'
export const importMapperMoreOptions: YoujLabels['importMapperMoreOptions'] = 'More options'
export const importMapperKey: YoujLabels['importMapperKey'] = 'Existing contacts are recognized by'
export const importMapperCountsAnnounce: YoujLabels['importMapperCountsAnnounce'] = (items, skipped) => `${items} will be imported. Skipped: ${skipped}.`
export const importMapperRow: YoujLabels['importMapperRow'] = 'Row'
export const importMapperErrorRequired: YoujLabels['importMapperErrorRequired'] = 'This value is required.'
export const importMapperErrorEmail: YoujLabels['importMapperErrorEmail'] = 'Enter a valid email address.'
export const importMapperErrorNumber: YoujLabels['importMapperErrorNumber'] = 'Enter a number.'
export const importMapperErrorDate: YoujLabels['importMapperErrorDate'] = 'Enter a date, such as 2026-03-14.'
export const importMapperEditCell: YoujLabels['importMapperEditCell'] = (row, field) => `${field}, row ${row}`
export const importMapperShowing: YoujLabels['importMapperShowing'] = (shown, total) => `Showing the first ${shown} of ${total}`
export const importMapperLeft: YoujLabels['importMapperLeft'] = (count) => `${count} ${count === 1 ? 'row' : 'rows'} left to fix`
export const importMapperRowFixed: YoujLabels['importMapperRowFixed'] = 'Looks good'
export const importMapperRowSkipped: YoujLabels['importMapperRowSkipped'] = 'Skipped'
export const importMapperSkipThisRow: YoujLabels['importMapperSkipThisRow'] = 'Skip this row'
export const importMapperImporting: YoujLabels['importMapperImporting'] = 'Importing…'
export const importMapperProgress: YoujLabels['importMapperProgress'] = (done, total) => `${done} of ${total}`
export const importMapperProgressLabel: YoujLabels['importMapperProgressLabel'] = 'Import progress'
export const importMapperImported: YoujLabels['importMapperImported'] = (items) => `${items} imported`
export const importMapperUpdatedCount: YoujLabels['importMapperUpdatedCount'] = (count) => `${count} updated`
export const importMapperSkippedCount: YoujLabels['importMapperSkippedCount'] = (count) => `${count} skipped`
export const importMapperDoneAnnounce: YoujLabels['importMapperDoneAnnounce'] = (items, skipped) => `Import finished. ${items} imported, ${skipped} skipped.`
export const importMapperErrorReport: YoujLabels['importMapperErrorReport'] = 'Download skipped rows'
export const importMapperImportAnother: YoujLabels['importMapperImportAnother'] = 'Import another file'
export const importMapperFailed: YoujLabels['importMapperFailed'] = (message) => `The import stopped: ${message}`
export const importMapperReportField: YoujLabels['importMapperReportField'] = 'Field'
export const importMapperReportValue: YoujLabels['importMapperReportValue'] = 'Value'
export const importMapperReportProblem: YoujLabels['importMapperReportProblem'] = 'Problem'
export const inspectorEnable: YoujLabels['inspectorEnable'] = 'Enable'
export const inspectorShow: YoujLabels['inspectorShow'] = 'Show'
export const inspectorHide: YoujLabels['inspectorHide'] = 'Hide'
export const inspectorCollapse: YoujLabels['inspectorCollapse'] = 'Collapse'
export const inspectorExpand: YoujLabels['inspectorExpand'] = 'Expand'
export const inspectorChangeType: YoujLabels['inspectorChangeType'] = 'Change type'
export const hexColour: YoujLabels['hexColour'] = 'Hex color'
export const opacity: YoujLabels['opacity'] = 'Opacity'
export const hierarchyChart: YoujLabels['hierarchyChart'] = 'Hierarchy chart'
export const hierarchyChartHint: YoujLabels['hierarchyChartHint'] = 'Up and down arrows move through the chart, right opens a branch or steps into it, left closes it or goes to its parent. Enter opens or closes a branch, Space selects. Plus and minus zoom, 0 fits the chart.'
export const hierarchyChartHidden: YoujLabels['hierarchyChartHidden'] = (count) => `${count} hidden below`
export const hierarchyChartExpand: YoujLabels['hierarchyChartExpand'] = (name) => `Expand ${name}`
export const hierarchyChartCollapse: YoujLabels['hierarchyChartCollapse'] = (name) => `Collapse ${name}`
export const radialMenuHint: YoujLabels['radialMenuHint'] = 'Use the arrow keys to move around the ring, Enter to choose and Escape to close.'
export const radialMenuChosen: YoujLabels['radialMenuChosen'] = (label) => `${label} chosen`
export const imageCompare: YoujLabels['imageCompare'] = 'Comparison divider'
export const imageCompareBefore: YoujLabels['imageCompareBefore'] = 'Before'
export const imageCompareAfter: YoujLabels['imageCompareAfter'] = 'After'
export const imageCompareValue: YoujLabels['imageCompareValue'] = (before, beforePercent, after, afterPercent) => `${before} ${beforePercent}, ${after} ${afterPercent}`
export const currencySwapPay: YoujLabels['currencySwapPay'] = 'You pay'
export const currencySwapReceive: YoujLabels['currencySwapReceive'] = 'You receive'
export const currencySwapFlip: YoujLabels['currencySwapFlip'] = 'Swap currencies'
export const currencySwapFromAsset: YoujLabels['currencySwapFromAsset'] = 'Currency to pay with'
export const currencySwapToAsset: YoujLabels['currencySwapToAsset'] = 'Currency to receive'
export const currencySwapSubmit: YoujLabels['currencySwapSubmit'] = 'Swap'
export const currencySwapResult: YoujLabels['currencySwapResult'] = (amount) => `You receive ${amount}`
export const currencySwapRate: YoujLabels['currencySwapRate'] = (from, to) => `${from} = ${to}`
export const wheelPicker: YoujLabels['wheelPicker'] = 'Value'
export const hoursDial: YoujLabels['hoursDial'] = 'Time range'
export const hoursDialStart: YoujLabels['hoursDialStart'] = 'Start'
export const hoursDialEnd: YoujLabels['hoursDialEnd'] = 'End'
export const hoursDialValue: YoujLabels['hoursDialValue'] = (time, duration) => `${time}, ${duration} in all`
export const shareDialogTitle: YoujLabels['shareDialogTitle'] = (resource) => `Share “${resource}”`
export const shareDialogAddPeople: YoujLabels['shareDialogAddPeople'] = 'Add people, groups or emails'
export const shareDialogRole: YoujLabels['shareDialogRole'] = 'Role'
export const shareDialogMessage: YoujLabels['shareDialogMessage'] = 'Add a message (optional)'
export const shareDialogSend: YoujLabels['shareDialogSend'] = 'Send'
export const shareDialogSending: YoujLabels['shareDialogSending'] = 'Sending…'
export const shareDialogSent: YoujLabels['shareDialogSent'] = 'Sent'
export const shareDialogInvited: YoujLabels['shareDialogInvited'] = (count) => (count === 1 ? 'Invitation sent' : `Invitations sent: ${count}`)
export const shareDialogNotEmail: YoujLabels['shareDialogNotEmail'] = (value) => `${value} isn’t a valid email address`
export const shareDialogHasAccess: YoujLabels['shareDialogHasAccess'] = (name) => `${name} already has access`
export const shareDialogFixInvalid: YoujLabels['shareDialogFixInvalid'] = 'Remove the addresses marked invalid to send.'
export const shareDialogRemoveRecipient: YoujLabels['shareDialogRemoveRecipient'] = (name) => `Remove ${name}`
export const shareDialogSuggestions: YoujLabels['shareDialogSuggestions'] = 'Suggestions'
export const shareDialogGroupSize: YoujLabels['shareDialogGroupSize'] = (count) => `Group of ${count}`
export const shareDialogPeople: YoujLabels['shareDialogPeople'] = 'People with access'
export const shareDialogOwner: YoujLabels['shareDialogOwner'] = 'Owner'
export const shareDialogPending: YoujLabels['shareDialogPending'] = 'Pending'
export const shareDialogResend: YoujLabels['shareDialogResend'] = 'Resend'
export const shareDialogResendTo: YoujLabels['shareDialogResendTo'] = (name) => `Resend invitation to ${name}`
export const shareDialogCancelInvite: YoujLabels['shareDialogCancelInvite'] = (name) => `Cancel invitation for ${name}`
export const shareDialogRemoveAccess: YoujLabels['shareDialogRemoveAccess'] = (name) => `Remove access for ${name}`
export const shareDialogRoleOf: YoujLabels['shareDialogRoleOf'] = (name) => `Role for ${name}`
export const shareDialogLoading: YoujLabels['shareDialogLoading'] = 'Loading people…'
export const shareDialogGeneral: YoujLabels['shareDialogGeneral'] = 'General access'
export const shareDialogRestricted: YoujLabels['shareDialogRestricted'] = 'Restricted'
export const shareDialogRestrictedHint: YoujLabels['shareDialogRestrictedHint'] = 'Only people with access can open with the link.'
export const shareDialogOrganization: YoujLabels['shareDialogOrganization'] = (organization) => `Anyone at ${organization}`
export const shareDialogOrganizationHint: YoujLabels['shareDialogOrganizationHint'] = (organization) => `Anyone at ${organization} with the link can open.`
export const shareDialogAnyone: YoujLabels['shareDialogAnyone'] = 'Anyone with the link'
export const shareDialogAnyoneHint: YoujLabels['shareDialogAnyoneHint'] = 'Anyone on the internet with the link can open.'
export const shareDialogLinkRole: YoujLabels['shareDialogLinkRole'] = 'Role for people with the link'
export const shareDialogCopyLink: YoujLabels['shareDialogCopyLink'] = 'Copy link'
export const shareDialogCopied: YoujLabels['shareDialogCopied'] = 'Copied'
export const shareDialogLinkCopied: YoujLabels['shareDialogLinkCopied'] = 'Link copied'
export const shareDialogCopyFailed: YoujLabels['shareDialogCopyFailed'] = 'Couldn’t copy the link'
export const shareDialogDone: YoujLabels['shareDialogDone'] = 'Done'
export const shareDialogRemoved: YoujLabels['shareDialogRemoved'] = (name) => `${name} removed`
export const shareDialogRoleChanged: YoujLabels['shareDialogRoleChanged'] = (name, role) => `${name} is now ${role}`
export const shareDialogAccessChanged: YoujLabels['shareDialogAccessChanged'] = (access) => `General access: ${access}`
export const shareDialogFailed: YoujLabels['shareDialogFailed'] = 'That didn’t work. Try again.'
export const shareDialogViewer: YoujLabels['shareDialogViewer'] = 'Viewer'
export const shareDialogCommenter: YoujLabels['shareDialogCommenter'] = 'Commenter'
export const shareDialogEditor: YoujLabels['shareDialogEditor'] = 'Editor'
export const shareDialogInvitedOnly: YoujLabels['shareDialogInvitedOnly'] = 'Only people invited'
export const shareDialogPeopleCount: YoujLabels['shareDialogPeopleCount'] = (count) => (count === 1 ? '1 person has access' : `${count} people have access`)
export const portfolioPeriod: YoujLabels['portfolioPeriod'] = 'Time range'
export const portfolioChart: YoujLabels['portfolioChart'] = 'Value over time'
export const portfolioChartHint: YoujLabels['portfolioChartHint'] = 'Move along the chart with the arrow keys; Home and End jump to its ends.'
export const portfolioReading: YoujLabels['portfolioReading'] = (value, date) => `${date}: ${value}`
export const portfolioUp: YoujLabels['portfolioUp'] = (amount) => `Up ${amount}`
export const portfolioDown: YoujLabels['portfolioDown'] = (amount) => `Down ${amount}`
export const portfolioFlat: YoujLabels['portfolioFlat'] = (amount) => `Unchanged, ${amount}`
export const portfolioInfo: YoujLabels['portfolioInfo'] = 'About this value'
export const growthContribution: YoujLabels['growthContribution'] = 'Monthly contribution'
export const growthYears: YoujLabels['growthYears'] = 'Years'
export const growthRate: YoujLabels['growthRate'] = 'Annual return'
export const growthToday: YoujLabels['growthToday'] = 'Today'
export const growthYear: YoujLabels['growthYear'] = (year) => `Year ${year}`
export const growthBars: YoujLabels['growthBars'] = 'Projected balance by year'
export const growthBar: YoujLabels['growthBar'] = (year, total, contributed) => `${year}: ${total}, ${contributed} contributed`
export const exportDialogTitle: YoujLabels['exportDialogTitle'] = 'Export data'
export const exportPeriod: YoujLabels['exportPeriod'] = 'Date range'
export const exportCustom: YoujLabels['exportCustom'] = 'Custom'
export const exportCustomHint: YoujLabels['exportCustomHint'] = 'Choose a start and end date'
export const exportOptions: YoujLabels['exportOptions'] = 'Options'
export const exportFormat: YoujLabels['exportFormat'] = 'Format'
export const exportTimeZone: YoujLabels['exportTimeZone'] = 'Time zone'
export const exportTimeZoneLocal: YoujLabels['exportTimeZoneLocal'] = 'Local'
export const exportColumnsAll: YoujLabels['exportColumnsAll'] = (count) => `All ${count}`
export const exportColumnsSome: YoujLabels['exportColumnsSome'] = (shown, total) => `${shown} of ${total}`
export const exportSelectAll: YoujLabels['exportSelectAll'] = 'All'
export const exportSelectNone: YoujLabels['exportSelectNone'] = 'None'
export const exportColumnsPick: YoujLabels['exportColumnsPick'] = 'Choose columns'
export const exportAs: YoujLabels['exportAs'] = (format) => `Export ${format}`
export const exportNothing: YoujLabels['exportNothing'] = 'Nothing to export in this range'
export const exportQueued: YoujLabels['exportQueued'] = 'Queued'
export const exportEmailed: YoujLabels['exportEmailed'] = 'We’ll email it to you when it’s ready.'
export const exportEmailedTo: YoujLabels['exportEmailedTo'] = (email) => `We’ll email it to ${email} when it’s ready.`
export const exportFailedNote: YoujLabels['exportFailedNote'] = 'The export didn’t finish. Try again.'
