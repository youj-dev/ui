import type { ThemeId } from './constants'
import { Project } from './project'
import type { Framework } from './detect'

export interface RegistryFiles {
  youjCss: string
  uiCss: string
  provider: string
  theme: string
  preset: (id: ThemeId) => string
}

export function findRegistryFiles(project: Project): Partial<RegistryFiles> {
  const all = project.walk('.', (n) => n === 'youj.css' || n === 'ui.css' || n === 'provider.tsx' || n === 'provider.jsx')
  return {
    youjCss: all.find((f) => f.endsWith('styles/youj.css')),
    uiCss: all.find((f) => f.endsWith('styles/ui.css')),
    provider: all.find((f) => /lib\/youj\/provider\.[jt]sx$/.test(f)),
  }
}

/** The copied core, or where shadcn will put it (for a dry run, before it's there). */
export function registryFiles(project: Project): RegistryFiles {
  const found = findRegistryFiles(project)
  const base = project.exists('src') ? 'src/' : ''
  const provider = found.provider ?? `${base}lib/youj/provider.tsx`
  const youjDir = provider.replace(/\/provider\.[jt]sx$/, '')
  return {
    youjCss: found.youjCss ?? `${base}styles/youj.css`,
    uiCss: found.uiCss ?? `${base}styles/ui.css`,
    provider,
    theme: `${youjDir}/theme`,
    preset: (id) => `${youjDir}/theme/themes/${id}.css`,
  }
}

/** Frameworks themed by attributes on a static <html> (no server render of the React root). */
export const usesThemeAttributes = (framework: Framework) => framework === 'vite' || framework === 'astro'
