'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps } from 'react'
import { observeThemeChange, palettes, styles, ThemeScope, useYouj, useTheme, type PaletteId, type StyleId, type ThemeInput } from '@youj/core'
import { Eyebrow } from '../../components/ui/typography'
import { cn } from '../../lib/utils'
import { Controls } from './theme-playground/controls'
import { COPY, fromPair, SITE, snippetOf, styleOf, themeOf, type Mode, type Recipe } from './theme-playground/data'
import { SitePreview } from './theme-playground/preview'

/* A landing-page section that sells theming by doing it: visitors re-theme
 * a small landing page live. Beside it, the builder's controls (palette,
 * style, accent, corners, control size, mode), composed from public parts. A
 * palette brings its accent and a style its corners and control size; the
 * rest tune on top.
 * The page wears the result through ThemeScope (style included) and a
 * `data-theme` for its mode, so every component in it re-derives, exactly
 * as an app would. Each change settles the page into focus (a short fade
 * and unblur on the frame), and a status line names the recipe. Copy puts
 * the recipe on the clipboard as code. It starts from the page's own preset
 * and mode. Reduced motion: the page changes in place.
 *
 * Demo content — edit after adding. */

interface ThemePlaygroundProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Wraps the section in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another page: a `section` named by an `h2`. Default false. */
  embedded?: boolean
  /** The palette the preview starts on. Default: the page's own, or Youj. */
  defaultPalette?: PaletteId
  /** The style the preview starts on. Default: the page's own, or Clean. */
  defaultStyle?: StyleId
  /** The preview's mode at first. Default: the page's own. */
  defaultMode?: Mode
}

const isPalette = (id: string | undefined): id is PaletteId => palettes.some((p) => p.id === id)
const isStyle = (id: string | undefined): id is StyleId => styles.some((s) => s.id === id)

function Playground({ embedded, defaultPalette, defaultStyle, defaultMode, className, ...rest }: Omit<ThemePlaygroundProps, 'theme'>) {
  const k = useYouj()
  const titleId = useId()
  const page = useTheme()
  const start = useMemo(() => {
    const palette = defaultPalette ?? (isPalette(page.palette) ? page.palette : 'youj')
    const style = defaultStyle ?? (isStyle(page.style) ? page.style : 'clean')
    // The custom accent starts from an electric violet, a color no palette wears.
    return fromPair(palette, style, { mode: defaultMode ?? 'dark', custom: 'oklch(0.54 0.265 295)' }) // youj-allow: the colour picker's starting value, which the visitor edits
  }, [defaultPalette, defaultStyle, defaultMode, page.palette, page.style])
  const [recipe, setRecipe] = useState<Recipe>(start)
  const root = useRef<HTMLElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const Title = embedded ? 'h2' : 'h1'

  // Without a mode given, the preview follows the page's until the visitor picks one.
  const following = useRef(!defaultMode)
  useEffect(() => {
    const read = () => {
      const mode = root.current?.closest('[data-theme]')?.getAttribute('data-theme')
      if (following.current && (mode === 'light' || mode === 'dark')) setRecipe((r) => (r.mode === mode ? r : { ...r, mode }))
    }
    read()
    return observeThemeChange(root.current, read)
  }, [])

  const theme = useMemo(() => themeOf(recipe), [recipe])
  const key = JSON.stringify([theme, recipe.mode])
  const last = useRef(key)
  // Each change settles the page into focus; the tokens themselves swap at once.
  useEffect(() => {
    if (last.current === key) return
    last.current = key
    if (k.reduced || !frame.current?.animate) return
    frame.current.animate([{ opacity: 0.55, filter: 'blur(3px)' }, { opacity: 1, filter: 'blur(0px)' }], {
      duration: k.ms('slow'),
      easing: `cubic-bezier(${k.ease('enter').join(',')})`, // youj-allow: the enter token's own curve, for a Web Animation
    })
  }, [key, k])

  const change = (next: Partial<Recipe>) => {
    if (next.mode) following.current = false
    setRecipe((r) => ({ ...r, ...next }))
  }
  const content = (
    <div className="@container mx-auto flex w-full max-w-6xl flex-col gap-8 lg:gap-10">
      <header className="flex max-w-2xl flex-col gap-3">
        <Eyebrow render={<p />}>{COPY.eyebrow}</Eyebrow>
        <Title id={titleId} className="text-[length:clamp(1.875rem,4cqi,2.75rem)] leading-[1.05] font-semibold tracking-tight text-balance">
          {COPY.title}
        </Title>
        <p className="text-ui-lg text-fg-muted text-pretty">{COPY.subtitle}</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <div role="group" aria-label={COPY.controls} className="rounded-xl border border-line bg-surface p-4 max-lg:order-last sm:p-5">
          <Controls
            recipe={recipe}
            onChange={change}
            onPalette={(palette) => setRecipe((r) => ({ ...r, palette, accent: palette }))}
            onStyle={(style) => setRecipe((r) => ({ ...fromPair(r.palette, style, r), accent: r.accent }))}
            onReset={() => setRecipe((r) => ({ ...start, mode: r.mode }))}
            onCopy={() => navigator.clipboard.writeText(snippetOf(recipe))}
          />
        </div>

        <figure className="flex min-w-0 flex-col gap-2">
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
            <div aria-hidden className="flex h-9 items-center gap-3 border-b border-line px-3">
              <span className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-2.5 rounded-full bg-line" />
                ))}
              </span>
              <span className="mx-auto rounded-md bg-band px-3 py-0.5 font-mono text-ui-xs text-fg-muted">{SITE.address}</span>
              <span className="w-10" />
            </div>
            <ThemeScope theme={theme} look={styleOf(recipe.style).look}>
              {/* Roomy's height at 100%: a denser pick tightens the page inside the window, never the section. */}
              <div ref={frame} data-theme={recipe.mode} className="isolate min-h-165.25">
                <SitePreview headingLevel={embedded ? 3 : 2} />
              </div>
            </ThemeScope>
          </div>
          <figcaption className="px-1 font-mono text-ui-xs text-fg-muted">
            <span role="status">
              {COPY.preview}: {COPY.applied(recipe)}
            </span>
          </figcaption>
        </figure>
      </div>
    </div>
  )

  return embedded ? (
    <section ref={root} aria-labelledby={titleId} {...rest} className={cn('w-full', className)}>
      {content}
    </section>
  ) : (
    <main
      ref={root}
      aria-labelledby={titleId}
      {...rest}
      className={cn('min-h-dvh bg-canvas px-4 py-12 text-fg sm:px-6 lg:py-20', className)}
    >
      {content}
    </main>
  )
}

function ThemePlayground({ theme, ...props }: ThemePlaygroundProps) {
  return theme ? (
    <ThemeScope theme={theme}>
      <Playground {...props} />
    </ThemeScope>
  ) : (
    <Playground {...props} />
  )
}

export { ThemePlayground, type ThemePlaygroundProps }
