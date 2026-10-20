import type { ComponentProps, CSSProperties } from 'react'
import { themeProps, type Mode, type NeutralPage, type ToneInput } from '@youj/core/lib/youj/theme'
import { cn } from '@/lib/cn'
import { sitePreset } from '@/lib/preview'

/* The one place the site sets library output down: a theme scope painted in
 * its own page colour (bg-canvas inside the scope), so what stands on it looks
 * as it will in an app, white cards on a soft gray page in light. It wears the
 * previewed theme when there is one (`theme`, a preset id), else the site's
 * with the gray page; `mode` holds it to light or dark whatever the site's is;
 * `page: 'white'` sets a website's white page instead. The dev panel's Paper
 * stage tints every site-themed stage (styles/site.css, .site-stage).
 *
 * In light a stage stands on a quiet grid (`pattern`), on the white card
 * plane, so it reads apart from the white page without a gray box. The site's
 * pattern is STAGE_PATTERN, written on <html> as data-stage-pattern (the dev
 * panel flips it live); `pattern` holds one stage to its own. Dark draws none.
 *
 * Only this and the preview frame write data-yj-theme or data-theme below
 * <html> (test/boundary.test.ts), and the site's CSS never reaches inside
 * one: frames, cards and toolbars around it are the site's (.site-card). */

type StageTag = 'div' | 'figure' | 'span'

export type StagePattern = 'none' | 'blueprint' | 'iso' | 'lines' | 'dots'

/** The grid every light stage stands on unless it names its own. */
export const STAGE_PATTERN: StagePattern = 'blueprint'

export type StageProps<T extends StageTag = 'div'> = ComponentProps<T> & {
  /** The element: a div, or a figure or span where the markup needs one. */
  as?: T
  /** A preset id: the stage wears it. Without one, the site's theme. */
  theme?: string
  /** Light or dark for the stage alone. Without one, the site's mode. */
  mode?: Mode
  /** The theme's gray app page (the default) or a website's white one. */
  page?: NeutralPage
  /** The preset's tone replaced: a two-tone stage (`{ chrome: 'dark' }`). Needs `theme`. */
  tone?: ToneInput
  /** The grid under it in light. Without one, the site's (STAGE_PATTERN). */
  pattern?: StagePattern
  /** The docs' monochrome look: ink as the accent in light (lib/preview sitePreset's `ink`). Needs `theme`. */
  ink?: boolean
}

export function Stage<T extends StageTag = 'div'>({ as, theme, mode, page = 'gray', tone, pattern, ink, className, style, ...props }: StageProps<T>) {
  const Tag = (as ?? 'div') as 'div'
  const scope = theme ? themeProps({ ...sitePreset(theme, page, false, ink), ...(tone && { tone }) }) : undefined
  return (
    <Tag
      data-yj-theme={scope?.['data-yj-theme'] ?? ''}
      data-yj-motion={scope?.['data-yj-motion']}
      data-theme={mode}
      data-page={page}
      data-pattern={pattern}
      className={cn('site-stage', className)}
      style={scope ? ({ ...scope.style, ...style } as CSSProperties) : style}
      {...(props as ComponentProps<'div'>)}
    />
  )
}
