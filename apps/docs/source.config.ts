import { defineConfig, defineDocs, frontmatterSchema } from 'fumadocs-mdx/config'
import { z } from 'zod'
import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins'
import { codeClasses, codeHighlight } from './lib/code-theme'
import { resolveRepoHref } from './lib/repo'

interface MdNode {
  type: string
  url?: string
  children?: MdNode[]
}

/** `[text](repo:…)` links become the repository's URLs (lib/repo.ts), so content never spells the repository out. */
function remarkRepoLinks() {
  const visit = (node: MdNode) => {
    if ((node.type === 'link' || node.type === 'definition') && node.url) node.url = resolveRepoHref(node.url)
    node.children?.forEach(visit)
  }
  return visit
}

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema.extend({
      /**
       * A sidebar badge. `new` spotlights a new capability (a family, a tool, a
       * guide), never its parts, and comes off at the next release; at most
       * eight at a time (test/parity.test.ts). `experimental` marks a section whose
       * API may still change (Animations). `deprecated` marks a page kept
       * for apps that still use it. Placeholder pages aren't published.
       */
      status: z.enum(['new', 'experimental', 'deprecated']).optional(),
      /** The page's name in the sidebar, when it differs from its title: a section's index is its "Overview". */
      sidebarTitle: z.string().optional(),
      /** Plain words people search for that the page doesn't say: "modal" for Dialog, "snackbar" for Toast. Added to the page's search entry. */
      aliases: z.array(z.string()).optional(),
    }),
  },
})

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkRepoLinks],
    rehypeCodeOptions: { ...codeHighlight, transformers: [...(rehypeCodeDefaultOptions.transformers ?? []), codeClasses], icon: false },
  },
})
