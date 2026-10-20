/* Renders every Youj icon at rest into generated/icon-svgs.json, the
 * static SVG the icons explorer shows in its grid and copies as SVG or JSX.
 *
 * The icons are TSX in packages/motion, so Vite's SSR loader imports them
 * (the package's own `react` and `motion` resolve to the same modules this
 * script renders with). Each renders once with reduced motion and
 * `trigger="none"`: every part in its rest pose, no animation. The set is
 * read from the generated icon index, so new icons appear on the next run. */

import { createElement, type ComponentType, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { cleanIcon, parseMarkup, type IconNode } from '../components/icons/static-svg.ts'
import { packagesDir, report, writeGenerated } from './lib.ts'

interface IconModule {
  icons: (ComponentType<{ trigger?: 'none' }> & { meta: { name: string } })[]
}
interface ProviderModule {
  YoujProvider: ComponentType<{ reducedMotion: 'always'; children?: ReactNode }>
}

const iconsPackage = `${packagesDir}/icons`

const vite = await createServer({
  root: iconsPackage,
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
})

try {
  const { icons } = (await vite.ssrLoadModule('/src/index.ts')) as IconModule
  const { YoujProvider } = (await vite.ssrLoadModule('@youj/core')) as ProviderModule
  const svgs: Record<string, IconNode[]> = {}
  for (const Icon of icons) {
    const html = renderToStaticMarkup(createElement(YoujProvider, { reducedMotion: 'always' }, createElement(Icon, { trigger: 'none' })))
    svgs[Icon.meta.name] = cleanIcon(parseMarkup(html), `ki-${Icon.meta.name}-`)
  }
  writeGenerated('icon-svgs.json', JSON.stringify(svgs))
  report('icon svgs', `${icons.length} icons at rest`)
} finally {
  await vite.close()
}
