import { useEffect, useMemo } from 'react'
import type { Decorator, Preview } from '@storybook/react-vite'
import { DENSITIES, SCALINGS, YoujProvider, type ReducedMotionSetting } from '../packages/core/src/lib/youj/provider'
import type { QualitySetting } from '../packages/core/src/lib/youj/budget'
import { internalPresetById, themes } from '../packages/core/src/lib/youj/theme/themes'
import { PAGE, type NeutralPage } from '../packages/core/src/lib/youj/theme/contract'
import { DEFAULT_LOOK, lookById, looks } from '../packages/core/src/lib/youj/look'
import { DEVICE_SETTINGS, isDeviceSetting, type DeviceSetting } from '../packages/core/src/lib/youj/device'
import { useThemeFonts } from '../packages/ui/src/docs/create/load-fonts'
import { ar } from '../packages/core/src/locales/ar'
// Aliased in main.ts to @youj/react's @base-ui/react, so this shares the
// same module instance (and Context) the components import from.
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import './tailwind.css'
import './docs.css'
import '../packages/core/src/lib/youj/theme/themes/graphite.css'
import '../packages/core/src/lib/youj/theme/themes/terminal.css'
import '../packages/core/src/lib/youj/theme/themes/brutal.css'
import '../packages/core/src/lib/youj/theme/themes/basalt.css'
import { YoujDocsContainer } from './docs-container'
import { youjTheme } from './youj-theme'

/* The toolbar carries the axes every item must survive: theme, theme preset,
 * look, direction, reduced motion, a time scale for studying motion
 * slowly, and the motion budget (Quality: auto-detected, or forced high / low).
 * The defaults are the docs site's: dark, Graphite in light and Basalt in dark (both the Clean style), and the Classic look. Direction RTL
 * is a whole Arabic app: dir="rtl" and lang="ar" on the document, the
 * provider's dir (which reaches Base UI), locale and Arabic labels. Theme and
 * preset go on the document element (the preset through its stylesheet, the
 * CSS route), so the body and every portal follow; the provider carries the
 * preset too, so JS-driven motion uses its personality. A preset's web fonts
 * from the catalogue load as it's picked. Examples and
 * blocks that take a `theme` wear their own under "Own theme" (the default,
 * over the mode's preset, which everything else wears); picking a preset passes it to
 * them as their `theme` too. Density (roomy or compact) and Scale (75% to
 * 120%) size the UI as an app's provider does: roomy at 100% is the library
 * default, compact at 90% an app's. */

const OWN_THEME = 'own'
/* The preset each mode wears until one is picked, as on the docs site (apps/docs/lib/site-mode.ts): Graphite in light, Basalt in dark. */
const MODE_PRESET = { light: 'graphite', dark: 'basalt' } as const
/* Density "auto" is each story's own page: an app's compact for the blocks built for an app, roomy (the provider's default) for the rest. Blocks take theirs from the page, so the toolbar reaches every one. */
const APP_BLOCKS = /^Blocks\/(App|Frame|Lifestyle|Commerce)\//
/* Light's page, as the docs show each block (apps/docs/lib/showcase.ts): a website's white page for the marketing, content and auth blocks, an app's gray page under white cards for the rest. A story's `parameters.showcase.page` overrides it. Dark has one page. */
const WEBSITE_BLOCKS = /^Blocks\/(Marketing|Content|Auth)\//

const withYouj: Decorator = (Story, context) => {
  const theme = context.globals.theme as string
  const picked = context.globals.themePreset as string
  const preset = internalPresetById(picked === OWN_THEME ? MODE_PRESET[theme === 'light' ? 'light' : 'dark'] : picked)
  const page: NeutralPage = context.parameters.showcase?.page ?? (WEBSITE_BLOCKS.test(context.title) ? 'white' : 'gray')
  const paged = useMemo(() => (page === 'white' ? { ...preset, neutral: { ...preset.neutral, page } } : preset), [preset, page])
  const look = lookById(context.globals.look as string | undefined).id
  const rtl = context.globals.direction === 'rtl'
  // The library's defaults (roomy, 100%) leave the provider's attributes off, as an app that sets none.
  const pickedDensity = context.globals.density === 'auto' ? (APP_BLOCKS.test(context.title) ? 'compact' : 'roomy') : context.globals.density
  const density = DENSITIES.find((d) => d === pickedDensity && d !== 'roomy')
  const scaling = SCALINGS.find((s) => s === context.globals.scaling && s !== '100%')
  const deviceGlobal = context.globals.device
  const device: DeviceSetting = isDeviceSetting(deviceGlobal) ? deviceGlobal : 'auto'
  const kind = context.parameters.showcase?.kind
  const staged = (kind === 'card' || kind === 'fragment') && !context.title.startsWith('Blocks/Frame/')
  const rethemed = context.globals.themePreset !== OWN_THEME && /^(Blocks|Examples)\//.test(context.title) && 'theme' in context.argTypes
  useThemeFonts(preset.fonts)
  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
    html.setAttribute('data-yj-theme', preset.id)
    html.setAttribute('data-yj-motion', preset.motionPersonality)
    html.setAttribute('data-yj-look', look)
    html.setAttribute('dir', rtl ? 'rtl' : 'ltr')
    html.setAttribute('lang', rtl ? 'ar' : 'en')
    // Over the preset's stylesheet, so the body is the story's page too.
    html.style.setProperty('--yj-neutral-page', String(PAGE[page]))
    document.body.style.backgroundColor = 'var(--color-canvas)'
    document.body.style.color = 'var(--color-fg)'
  }, [theme, preset, look, rtl, page])

  return (
    <YoujProvider
      timeScale={Number(context.globals.timeScale)}
      reducedMotion={context.globals.reducedMotion as ReducedMotionSetting}
      quality={(context.globals.quality as QualitySetting | undefined) ?? 'auto'}
      theme={paged}
      look={look}
      device={device === 'auto' ? undefined : device}
      locale={rtl ? 'ar' : undefined}
      labels={rtl ? ar : undefined}
      density={density}
      scaling={scaling}
      dir={rtl ? 'rtl' : 'ltr'}
    >
      <div className="font-sans text-fg antialiased">
        {staged ? (
          // A card or fragment is the card alone (the docs' card stage, apps/docs/components/showcase/kind-stage.tsx): centered on the page, with room around it.
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', alignContent: 'center', minHeight: '100dvh', padding: '48px clamp(20px, 4vw, 40px)' }}>
            {rethemed ? <Story args={{ ...context.args, theme: paged }} /> : <Story />}
          </div>
        ) : rethemed ? (
          <Story args={{ ...context.args, theme: paged }} />
        ) : (
          <Story />
        )}
      </div>
    </YoujProvider>
  )
}

const preview: Preview = {
  decorators: [withYouj],
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
    themePreset: {
      description: 'Theme preset',
      toolbar: {
        title: 'Preset',
        icon: 'paintbrush',
        items: [{ value: OWN_THEME, title: 'Own theme', right: 'else Graphite / Basalt' }, ...themes.map((t) => ({ value: t.id, title: t.name, right: t.motionPersonality }))],
        dynamicTitle: true,
      },
    },
    look: {
      description: 'Look: how components are built, independent of the theme (Classic by default)',
      toolbar: {
        title: 'Look',
        icon: 'component',
        items: looks.map((s) => ({ value: s.id, title: s.name })),
        dynamicTitle: true,
      },
    },
    device: {
      description: 'How components are operated and presented: follow the hardware (auto), or force touch (sheets, big targets) or pointer (popovers)',
      toolbar: {
        title: 'Device',
        icon: 'mobile',
        items: DEVICE_SETTINGS.map((d) => ({ value: d, title: d === 'auto' ? 'Auto (hardware)' : d === 'touch' ? 'Touch' : 'Pointer' })),
        dynamicTitle: true,
      },
    },
    direction: {
      description: 'Text direction (RTL renders in Arabic: dir, lang, locale and labels)',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        items: [
          { value: 'ltr', title: 'LTR' },
          { value: 'rtl', title: 'RTL (Arabic)' },
        ],
        dynamicTitle: true,
      },
    },
    density: {
      description: 'Layout density: auto (compact for app, frame, lifestyle and commerce blocks, else roomy), roomy (the library default, marketing and auth) or compact (an app’s working density)',
      toolbar: {
        title: 'Density',
        icon: 'grow',
        items: [
          { value: 'auto', title: 'Auto', right: 'the story’s own' },
          ...DENSITIES.map((d) => ({ value: d, title: d === 'roomy' ? 'Roomy' : 'Compact', right: d === 'roomy' ? 'default' : 'app' })),
        ],
        dynamicTitle: true,
      },
    },
    scaling: {
      description: 'UI scale: 100% is the drawn size; an app is 90%',
      toolbar: {
        title: 'Scale',
        icon: 'zoom',
        items: SCALINGS.map((s) => ({ value: s, title: `Scale ${s}`, right: s === '100%' ? 'default' : s === '90%' ? 'app' : undefined })),
        dynamicTitle: true,
      },
    },
    reducedMotion: {
      description: 'Reduced motion',
      toolbar: {
        title: 'Motion',
        icon: 'accessibility',
        items: [
          { value: 'user', title: 'Motion: follow OS' },
          { value: 'always', title: 'Motion: reduced' },
          { value: 'never', title: 'Motion: full' },
        ],
        dynamicTitle: true,
      },
    },
    timeScale: {
      description: 'Time scale (higher = slower)',
      toolbar: {
        title: 'Speed',
        icon: 'timer',
        items: [
          { value: '0.5', title: '2× fast' },
          { value: '1', title: '1× speed' },
          { value: '2', title: '½× slow' },
          { value: '4', title: '¼× slow' },
        ],
        dynamicTitle: true,
      },
    },
    quality: {
      description: 'Motion budget (low-end devices get lighter backgrounds and no cursor follower)',
      toolbar: {
        title: 'Quality',
        icon: 'lightning',
        items: [
          { value: 'auto', title: 'Quality: auto' },
          { value: 'high', title: 'Quality: high' },
          { value: 'low', title: 'Quality: low' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'dark', themePreset: OWN_THEME, look: DEFAULT_LOOK, device: 'auto', direction: 'ltr', density: 'auto', scaling: '100%', reducedMotion: 'user', timeScale: '1', quality: 'auto' },
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
    // Base UI's focus-trap guards are aria-hidden yet focusable by design: an axe false positive.
    a11y: { test: 'error', context: { exclude: ['[data-base-ui-focus-guard]'] } },
    docs: { container: YoujDocsContainer, theme: youjTheme('dark') },
    options: {
      storySort: {
        order: ['Introduction', 'Foundations', ['Principles', 'Color', 'Motion', 'Themes'], 'Primitives', 'Icons', 'Pieces', 'Players', 'Motion', ['Blocks', 'Effects'], 'UI', ['Overview', 'Foundations', 'Primitives', 'Inputs', 'Overlays', 'Navigation', 'Layout', 'Display', 'Data', 'Chat', 'Examples'], 'Blocks', ['Auth', 'App', 'Marketing', 'Commerce', 'Lifestyle']],
      },
    },
  },
}

export default preview
