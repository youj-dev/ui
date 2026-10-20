'use client'

import { CodeIcon } from '@youj/icons'
import { CodePanel } from '@/components/showcase/code-panel'
import { CodeSource } from '@/components/ui/code-source'
import { CodeExportDialog, type CodeExportDialogProps } from '@/components/ui/code-export-dialog'
import { codeUrl, useCode } from '@/lib/code-load'

/* A docs example's code, in the site's large code modal (the one Create's
 * export and a scene's code open): the install command over the example's
 * file, highlighted, with its copy button. The file is fetched when it first
 * opens (lib/code-load.ts). A chunk of its own, loaded the first time Code is
 * pressed. */

export interface ExampleCodeDialogProps extends Pick<CodeExportDialogProps, 'open' | 'onOpenChange' | 'finalFocus'> {
  /** The example's registered name: `action-island/demo`. */
  name: string
  /** Its file, for the title: `demo.tsx`. */
  file: string
}

export default function ExampleCodeDialog({ name, file, ...dialog }: ExampleCodeDialogProps) {
  const src = codeUrl.example(name)
  const state = useCode(dialog.open ? src : null)
  const slug = name.replace(/\W/g, '-')
  return (
    <CodeExportDialog
      {...dialog}
      title={file}
      description="The example on show. The component itself comes from the package."
      nav={false}
      sections={[
        {
          value: 'code',
          label: 'Code',
          icon: <CodeIcon size={16} strokeWidth={1.75} />,
          fill: true,
          content: (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-canvas light:bg-surface">
              {state.status === 'ready' ? (
                <CodePanel
                  idBase={`example-code-${slug}`}
                  files={[{ path: `examples/${name}.tsx`, src, lines: state.body.code.split('\n').length }]}
                  install={{ command: `npx youj add ${name.split('/')[0]}`, deps: [] }}
                  download={slug}
                  height="100%"
                  collapsibleTree
                />
              ) : (
                <div aria-busy={state.status === 'loading' || undefined} className="min-h-0 flex-1 overflow-auto">
                  <CodeSource state={state} />
                </div>
              )}
            </div>
          ),
        },
      ]}
    />
  )
}
