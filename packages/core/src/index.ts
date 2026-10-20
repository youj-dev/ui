// @youj/core: the contract every Youj package builds on. Tokens, YoujProvider
// and its hooks, cn, themes, labels and the sound cue bus. Motion components
// are @youj/motion; per-component labels are '@youj/core/labels'. The token
// and motion-preset CSS is '@youj/core/styles.css' (in the workspace,
// '@youj/core/styles/youj.css', which imports the presets).

// Contract
export {
  durations,
  easings,
  springs,
  staggers,
  motionPersonalities,
  type DurationToken,
  type EasingToken,
  type MotionPersonality,
  type MotionTokens,
  type SpringToken,
  type StaggerToken,
} from './lib/youj/tokens'
export {
  YoujProvider,
  ThemeScope,
  useYouj,
  useYoujLayout,
  useYoujScope,
  useDevice,
  useDeviceSetting,
  useYoujLook,
  useLocale,
  useMotionBudget,
  usePortalContainer,
  useTheme,
  useDirection,
  useMode,
  type Direction,
  type DirectionSetting,
  type ModeState,
  type Youj,
  type YoujProviderProps,
  type YoujDensity,
  type YoujScaling,
  type YoujScopeProps,
  type MotionBudget,
  type ReducedMotionSetting,
  type ThemeScopeProps,
} from './lib/youj/provider'
// staggerScale: the stagger step multiplier (total cap and motion budget), for the motion components and custom staggers.
export { COLOR_MODES, type ColorMode, type ColorScheme } from './lib/youj/settings'
export { DENSITIES, SCALINGS } from './lib/youj/settings'
export { ModeScript, type ModeScriptProps } from './lib/youj/mode'
// The visitor's stored light/dark/system choice (ThemeToggle's, restored by ThemeScript), switched from code
export { setThemeMode, useThemeMode, type ThemeModeOptions, type ThemeModeState } from './lib/youj/theme-mode'
export { staggerScale, type QualitySetting, type QualityTier } from './lib/youj/budget'
// Style: how components are built (anatomy), independent of the theme
export { DEFAULT_LOOK, LOOKS, isYoujLook, lookById, looks, type YoujLook, type LookInfo } from './lib/youj/look'
// Device: how components are operated and presented (touch or pointer), independent of the viewport width
export { DEFAULT_DEVICE_SETTING, DEVICE_SETTINGS, isDeviceSetting, resolveDevice, type Device, type DeviceSetting } from './lib/youj/device'
export { defaultLabels, type YoujLabels } from './lib/youj/labels'
export { useLabels } from './lib/youj/use-labels'
export { cn } from './lib/youj/cn'
// The words every component shares: one size scale, one severity, one in-view prop (packages/ui/CLAUDE.md's checklist)
export type { InView, InViewOptions, Size, Status } from './lib/youj/vocabulary'
export { MotionFeatures, PresenceSettled, preloadMotionFeatures, type MotionFeatureSet, type MotionFeaturesProps } from './lib/youj/features'
// Sound: YoujProvider's `sound` takes a pack from @youj/sound; components emit cues, useSound reads and sets the mute
export { soundCues, type SoundCue, type SoundCueSink, type SoundProp, type SoundRuntime, type SoundSettings } from './lib/youj/sound-scope'
export { useSoundCue, useSound, type Sound } from './lib/youj/sound-cue'

// Theme: the contract, presets, the JS mirror of the CSS derivation, guardrails
export {
  defineTheme,
  themeProps,
  themeCss,
  themeVars,
  deriveTheme,
  checkTheme,
  themeErrors,
  isPerMode,
  observeThemeChange,
  shippedThemes as themes,
  presetById,
  DEFAULT_PRESET,
  graphite,
  terminal,
  brutal,
  basalt,
  meadow,
  sandstone,
  cinnabar,
  umber,
  seaglass,
  heather,
  // Palette × style: a theme's colour and its form, paired freely
  definePalette,
  defineStyle,
  composeTheme,
  palettes,
  paletteById,
  DEFAULT_PALETTE,
  youjPalette,
  meadowPalette,
  sandstonePalette,
  cinnabarPalette,
  umberPalette,
  seaglassPalette,
  heatherPalette,
  styles,
  styleById,
  DEFAULT_STYLE,
  bezelStyle,
  cleanStyle,
  classicStyle,
  brutalStyle,
  terminalStyle,
  type PaletteId,
  type PaletteInput,
  type StyleId,
  type StyleInput,
  type ThemePalette,
  type ThemeStyle,
  type ActionFill,
  type ControlShape,
  type FieldStyle,
  type ChartPalette,
  type BarTone,
  type ChromeTone,
  type OverlayTone,
  type PerMode,
  type ControlSize,
  type HeadingsInput,
  type LabelsInput,
  type NeutralInput,
  type RadiusScale,
  type ResolvedTheme,
  type ShadowStyle,
  type StrokeInput,
  type SurfacesInput,
  type Theme,
  type ThemeChart,
  type ThemeColor,
  type ThemeId,
  type ThemeInput,
  type ThemeIssue,
  type ThemeProps,
  type Tone,
  type ToneInput,
} from './lib/youj/theme'
