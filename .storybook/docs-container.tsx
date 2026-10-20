import { useEffect, useState, type PropsWithChildren } from 'react'
import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks'
import { GLOBALS_UPDATED } from 'storybook/internal/core-events'
import { YoujProvider, type ReducedMotionSetting } from '../packages/core/src/lib/youj/provider'
import { internalPresetById } from '../packages/core/src/lib/youj/theme/themes'
import { useThemeFonts } from '../packages/ui/src/docs/create/load-fonts'
import { youjTheme } from './youj-theme'

/* MDX pages live outside the story decorator, so the docs container follows
 * the toolbar globals itself: it themes the Storybook doc blocks and wraps
 * the page in a YoujProvider, so docs content obeys Theme, Preset, Motion
 * and Speed, and loads the preset's catalogue fonts. */

type Globals = Record<string, unknown>
const themes = { dark: youjTheme('dark'), light: youjTheme('light') }

function initialGlobals(context: DocsContainerProps['context']): Globals {
  const store = (context as unknown as { store?: { userGlobals?: { globals?: Globals } } }).store
  return store?.userGlobals?.globals ?? {}
}

export function YoujDocsContainer({ context, children }: PropsWithChildren<DocsContainerProps>) {
  const [globals, setGlobals] = useState<Globals>(() => initialGlobals(context))

  useEffect(() => {
    const onUpdate = ({ globals: next }: { globals: Globals }) => setGlobals(next)
    context.channel.on(GLOBALS_UPDATED, onUpdate)
    return () => context.channel.off(GLOBALS_UPDATED, onUpdate)
  }, [context.channel])

  const theme = globals.theme === 'light' ? 'light' : 'dark'
  const preset = internalPresetById(globals.themePreset as string | undefined)
  useThemeFonts(preset.fonts)
  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
    html.setAttribute('data-yj-theme', preset.id)
    html.setAttribute('data-yj-motion', preset.motionPersonality)
    document.body.style.backgroundColor = 'var(--color-canvas)'
    document.body.style.color = 'var(--color-fg)'
  }, [theme, preset])

  return (
    <DocsContainer context={context} theme={themes[theme]}>
      <YoujProvider
        timeScale={Number(globals.timeScale ?? 1)}
        reducedMotion={(globals.reducedMotion as ReducedMotionSetting | undefined) ?? 'user'}
        theme={preset}
      >
        {children}
      </YoujProvider>
    </DocsContainer>
  )
}
