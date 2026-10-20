import type { ComponentProps } from 'react'
import { Markdown as FumadocsMarkdown } from 'fumadocs-core/content/md'
import { rehypeCode, rehypeCodeDefaultOptions, remarkGfm } from 'fumadocs-core/mdx-plugins'
import { CodeBlock } from '@/components/docs/blocks'
import { ScrollTable } from '@/components/docs/scroll-table'
import { codeClasses, codeHighlight } from '@/lib/code-theme'
import { project } from '@/lib/project'

/* Markdown from the repository (CHANGELOG.md, the FAQ's answers), rendered
 * on the server with the docs' own code blocks and tables. A relative link
 * in a repository file points at that file on GitHub. */

function Anchor({ href = '', ...props }: ComponentProps<'a'>) {
  const relative = href && !/^([a-z]+:|\/|#)/i.test(href)
  return <a href={relative ? project.file(href) : href} {...props} />
}

const components = { pre: CodeBlock, table: ScrollTable, a: Anchor }

export function Markdown({ children }: { children: string }) {
  return (
    <FumadocsMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeCode, { ...codeHighlight, transformers: [...(rehypeCodeDefaultOptions.transformers ?? []), codeClasses], icon: false }]]} components={components}>
      {children}
    </FumadocsMarkdown>
  )
}
