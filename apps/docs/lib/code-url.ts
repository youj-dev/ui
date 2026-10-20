/* Where a Code tab's file is published (app/code/[...path]/route.ts), for the
 * server pages that list files and the tabs that fetch them (lib/code-load.ts). */

export interface CodeBody {
  /** The file as written, for copying and the .zip. */
  code: string
  /** Its highlighted markup, a `<pre class="shiki">` with a class per token color (lib/code-theme.ts). */
  html: string
}

/** A docs example by its name (`button/demo`), a block's or example's file by its item and install path. */
export const codeUrl = {
  example: (name: string) => `/code/docs/${name}.json`,
  item: (kind: 'blocks', slug: string, path: string) => `/code/${kind}/${slug}/${path}.json`,
  /** A block's install, usage and reference on a block page (lib/block-ref.ts). */
  ref: (kind: 'blocks', slug: string) => `/code/ref/${kind}/${slug}.json`,
}
