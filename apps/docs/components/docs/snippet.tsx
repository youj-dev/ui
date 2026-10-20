import { highlight } from 'fumadocs-core/highlight'
import { codeHighlight } from '@/lib/code-theme'
import { fillUrls } from '@/lib/site'
import { CodeBlock } from './blocks'

/**
 * A code block whose text needs this site's URL, which a fenced block in MDX
 * can't know at compile time: `<Snippet code="{registry}/reveal.json" />`.
 */
export async function Snippet({ code, lang = 'bash', title }: { code: string; lang?: string; title?: string }) {
  return highlight(fillUrls(code), {
    lang,
    ...codeHighlight,
    components: { pre: (props) => <CodeBlock {...props} title={title} /> },
  })
}
