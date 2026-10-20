import pkg from '../package.json' with { type: 'json' }

/** The CLI releases in the same fixed group as the packages, so its version is the kit's. */
export const VERSION: string = pkg.version

export const THEMES = ['graphite', 'terminal', 'brutal', 'basalt', 'meadow', 'sandstone', 'cinnabar', 'umber', 'seaglass', 'heather'] as const
export type ThemeId = (typeof THEMES)[number]

/** The presets whose stylesheets the copied core holds; the others' are the youj-theme-<id> items. */
const CORE_THEME_SHEETS: readonly ThemeId[] = ['graphite', 'basalt']

/** The registry item that copies a preset's stylesheet in, or undefined for one the core holds already. */
export const themeSheetItem = (id: ThemeId) => (CORE_THEME_SHEETS.includes(id) ? undefined : `youj-theme-${id}`)

export const MOTIONS = ['precise', 'calm', 'lively'] as const
export type Motion = (typeof MOTIONS)[number]

export const QUALITIES = ['auto', 'high', 'low'] as const
export type Quality = (typeof QUALITIES)[number]

export const MODES = ['package', 'registry'] as const
export type Mode = (typeof MODES)[number]

/** Each preset's own motion personality: its style's (packages/core/src/lib/youj/theme/styles.ts). */
export const PRESET_MOTION: Record<ThemeId, Motion> = {
  graphite: 'precise',
  terminal: 'precise',
  brutal: 'precise',
  basalt: 'precise',
  meadow: 'precise',
  sandstone: 'precise',
  cinnabar: 'precise',
  umber: 'precise',
  seaglass: 'precise',
  heather: 'precise',
}

export const THEME_HINTS: Record<ThemeId, string> = {
  graphite: 'the Youj palette in the Clean style: Inter, rounded rectangles',
  terminal: 'the Youj palette in the Terminal style: monospace, square corners',
  brutal: 'the Youj palette in the Brutal style: ink outlines, hard shadows',
  basalt: 'the Youj palette in the Clean style: the default',
  meadow: 'a grass green, sky and gold, Clean style',
  sandstone: 'a raw sienna, a night blue, Clean style',
  cinnabar: 'an English red, ivory in the data, Clean style',
  umber: 'a brass signal, a slate blue, Clean style',
  seaglass: 'a deep sea blue, cream and aqua, Clean style',
  heather: 'a heather plum, old rose and sage, Clean style',
}

/** The peer range for motion (the npm package) of @youj/react, @youj/motion and the others. */
export const MOTION_RANGE = '^13.4.4 || ^14'

/** The peer range for Base UI (`@base-ui/react`) of @youj/react: the minors its Field internals were checked against. */
export const BASE_UI_RANGE = '>=1.8.0 <1.10.0'

/** The Base UI the CLI installs: the newest minor in BASE_UI_RANGE, as one range without spaces. */
export const BASE_UI_INSTALL = '~1.9.0'

/** Whether an installed Base UI version is inside BASE_UI_RANGE. */
export function baseUiSupported(version: string): boolean {
  const [major, minor] = version.split('.').map(Number)
  return major === 1 && minor !== undefined && minor >= 8 && minor < 10
}

/**
 * The motion the CLI installs: the newest major MOTION_RANGE allows, as one range
 * without spaces (on Windows installs run through a shell, where `||` would split them).
 */
export const MOTION_INSTALL = MOTION_RANGE.split('||').at(-1)!.trim()

export const REGISTRY_NAMESPACE = '@youj'

/** The docs site's registry. `/r/v<version>/` holds each release's items as published; `/r/` is the latest alias. */
export const REGISTRY_BASE = 'https://www.youj.dev/r'

/** Set (by `--latest`, or in the shell) to take items from the latest alias instead of this CLI's own version. */
export const REGISTRY_LATEST_ENV = 'YOUJ_REGISTRY_LATEST'

/** The registries the docs site serves: this CLI's version (the default) and the latest alias. */
export const DEFAULT_TEMPLATES = {
  versioned: `${REGISTRY_BASE}/v${VERSION}/{name}.json`,
  latest: `${REGISTRY_BASE}/{name}.json`,
} as const

const truthy = (value: string | undefined) => Boolean(value?.trim()) && !/^(0|false|no)$/i.test(value!.trim())

/**
 * Where registry items live: YOUJ_REGISTRY_URL (a template with {name}, or a base URL), else the
 * docs site at this CLI's version, so copied code matches the packages it installs and doesn't
 * change with each deploy. YOUJ_REGISTRY_LATEST (`--latest`) takes the latest alias instead.
 */
export function registryTemplate(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.YOUJ_REGISTRY_URL?.trim() || (truthy(env[REGISTRY_LATEST_ENV]) ? DEFAULT_TEMPLATES.latest : DEFAULT_TEMPLATES.versioned)
  return url.includes('{name}') ? url : `${url.replace(/\/$/, '')}/{name}.json`
}

/** The env var holding a private registry's bearer token (for a registry that needs a login). */
export const REGISTRY_TOKEN_ENV = 'YOUJ_REGISTRY_TOKEN'

/** Headers for the CLI's own registry fetches: `Authorization: Bearer …` when YOUJ_REGISTRY_TOKEN is set. */
export function registryHeaders(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const token = env[REGISTRY_TOKEN_ENV]?.trim()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const PACKAGES = {
  react: '@youj/react',
  core: '@youj/core',
  motion: '@youj/motion',
  loaders: '@youj/loaders',
  icons: '@youj/icons',
  illustrations: '@youj/illustrations',
  miniatures: '@youj/miniatures',
  sound: '@youj/sound',
} as const

/**
 * @youj/core holds YoujProvider's contexts, so it's a peer of every other Youj
 * package rather than a dependency: the app owns the one copy. An install that
 * names another Youj package names it too when package.json lacks it (Yarn
 * doesn't install peers, and a peer the app doesn't list can drift apart).
 * @youj/miniatures builds on nothing from Youj (React only), so it doesn't need it.
 */
export function withCorePeer(names: string[], deps: Record<string, string | undefined>): string[] {
  const needs = names.some((name) => name.startsWith(`${REGISTRY_NAMESPACE}/`) && name !== PACKAGES.core && name !== PACKAGES.miniatures)
  return needs && !deps[PACKAGES.core] && !names.includes(PACKAGES.core) ? [...names, PACKAGES.core] : names
}

/**
 * The package that ships a registry item as an entry of its own, for the items
 * of @youj/icons (the set, the engine, YoujIcon, IconSwap…),
 * @youj/illustrations (the scenes, the kit and the iso shapes) and
 * @youj/loaders (loader-<id> and loader-kit) and
 * @youj/miniatures (miniature-<id>). A test holds this to the
 * packages' registry fragments.
 */
export function sourcePackageOf(item: string): typeof PACKAGES.icons | typeof PACKAGES.illustrations | typeof PACKAGES.loaders | typeof PACKAGES.miniatures | undefined {
  if (/^(icons|icon-[\w-]+|youj-icon|use-icon-state)$/.test(item)) return PACKAGES.icons
  if (/^(illustrations|illustration-[\w-]+|iso-[\w-]+|grid-backdrops)$/.test(item)) return PACKAGES.illustrations
  if (/^loader-[\w-]+$/.test(item)) return PACKAGES.loaders
  if (/^miniature-[\w-]+$/.test(item)) return PACKAGES.miniatures
  return undefined
}

/**
 * Illustration items `add` copies in an app on the packages too: the kit, which
 * the package doesn't export, and the shapes the illustration builder's code
 * imports from beside it. Their imports of the scene point at the package, so
 * they share its IsoScene with everything else drawn from it.
 */
export const KIT_COPY_IN = new Set(['illustration-kit', 'iso-shapes', 'grid-backdrops'])

/**
 * The stylesheet lines an app on the packages needs, in order, after
 * `@import 'tailwindcss'`: the tokens (@youj/react's sheet, which brings
 * core's and the icons', or core's own), then a sheet for each package
 * whose built classes that one doesn't cover.
 */
export function packageStyles(deps: Record<string, string | undefined>): string[] {
  const has = (name: string) => Boolean(deps[name])
  if (!Object.values(PACKAGES).some(has)) return []
  return [
    has(PACKAGES.react) ? `${PACKAGES.react}/styles.css` : `${PACKAGES.core}/styles.css`,
    ...(has(PACKAGES.icons) && !has(PACKAGES.react) ? [`${PACKAGES.icons}/styles.css`] : []),
    ...(has(PACKAGES.illustrations) ? [`${PACKAGES.illustrations}/styles.css`] : []),
  ]
}
