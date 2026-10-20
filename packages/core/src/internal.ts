// @youj/core/internal: what the other @youj packages need from core and an app
// doesn't. No stability promise: it can change in any release, so don't import
// it from app code. It is a published entry only because a package build points
// a source-path import (`@youj/core/lib/youj/theme`) at the entry that exports
// its names (`sourceEntryImports`, scripts/youj-sources.mjs). The workspace's
// `@youj/core/labels` source path (src/labels.ts) is rewritten to this entry too.
export { SoundCueContext } from './lib/youj/sound-scope'
export { springPhysics } from './lib/youj/tokens'
export { CARD_SECTION_INK, ROLES, checkRoles, deriveRoles, type Role, type Roles } from './lib/youj/theme'
export { resolveInView, type ResolvedInView } from './lib/youj/in-view'
export { applyThemeMode, readThemeMode, subscribeThemeMode, THEME_STORAGE_KEY, useDefaultThemeMode } from './lib/youj/theme-mode'
export { themeScriptCode } from './lib/youj/theme-script'
export { observeOnScreen, type OnScreenOptions } from './lib/youj/on-screen'
// Each component's own English labels and the hook that resolves them, for @youj/react and @youj/motion. Apps translate through <YoujProvider labels>.
export { useComponentLabels } from './lib/youj/use-component-labels'
export * from './lib/youj/labels-components'
