import { DownloadIcon } from '@/components/client'
import { ButtonLink } from '@/components/ui/button-link'
import { FIGMA_PLUGIN_ZIP, figmaPluginZip } from '@/lib/figma-kit'

const ALT = 'The kit’s cover page in Figma: the Youj lockup on its construction grid, then the themes, variables, icons and components it holds.'

/** The kit's cover, rendered from the plugin in the site's mode, and the download with its real size. */
export function FigmaKit() {
  const mb = (figmaPluginZip().length / 1024 / 1024).toFixed(1)
  return (
    <figure className="not-prose my-6 overflow-hidden rounded-xl border border-line bg-surface">
      <img src="/figma/kit-cover-light.webp" alt={ALT} width={1600} height={1223} className="block h-auto w-full dark:hidden" />
      <img src="/figma/kit-cover-dark.webp" alt={ALT} width={1600} height={1223} className="hidden h-auto w-full dark:block" />
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3">
        <ButtonLink href={FIGMA_PLUGIN_ZIP} download prefetch={false}>
          <DownloadIcon size={16} strokeWidth={2} />
          Download the plugin
        </ButtonLink>
        <span className="type-small text-fg-muted">.zip · {mb} MB · needs the Figma desktop app</span>
      </figcaption>
    </figure>
  )
}
