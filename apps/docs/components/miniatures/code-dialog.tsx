'use client'

import { CodeIcon, SlidersIcon } from '@youj/icons'
import type { Scheme } from '@/components/showroom/hooks'
import { Thumbs } from '@/components/showroom/thumb'
import { PropsSheet, UseCode, UseInstall, UsePreview, UseStep, UseSteps } from '@/components/showroom/use-dialog'
import { CodeExportDialog, type CodeExportDialogProps } from '@/components/ui/code-export-dialog'
import type { ComponentDoc } from '@/lib/props'
import { exhibitSnippet, thumbsOf, usageSnippet, type ShowroomMiniature } from './catalog'

/* A miniature's Use it, in the site's large code modal on the showroom's grammar (components/showroom/use-dialog): its
 * picture at the head of the nav, then Use it (1 install the package, 2 the code: on its own, or with a readout and
 * keys of your own, as the showroom draws it) and the props every miniature takes. A miniature comes from its package
 * only, so there's no copy to choose. */

const icon = { size: 16, strokeWidth: 1.75 }

interface MiniatureCodeDialogProps extends Pick<CodeExportDialogProps, 'open' | 'onOpenChange' | 'onOpenChangeComplete' | 'finalFocus'> {
  meta: ShowroomMiniature
  /** The props every miniature takes. */
  props?: ComponentDoc
  /** The stage's light or dark, which the picture wears. */
  scheme?: Scheme
}

export function MiniatureCodeDialog({ meta, props, scheme = 'dark', ...dialog }: MiniatureCodeDialogProps) {
  return (
    <CodeExportDialog
      {...dialog}
      title={meta.name}
      description={`${meta.model} · @youj/miniatures/${meta.id}`}
      preview={
        <UsePreview scheme={scheme}>
          {/* Its picture, not a second live one: the stage's is the miniature at work. */}
          <span className="absolute inset-0">
            <Thumbs item={{ id: meta.id, label: meta.name, thumbs: thumbsOf(meta.id) }} eager />
          </span>
        </UsePreview>
      }
      navLabel="The code"
      sections={[
        {
          value: 'use',
          label: 'Use it',
          icon: <CodeIcon {...icon} />,
          description: 'Install the package, then put it on a page: on its own, or with a readout and keys of your own.',
          content: (
            <UseSteps>
              <UseStep n={1} title="Install" note="One package, an entry per miniature: your app bundles only the ones it imports. React is its only dependency.">
                <UseInstall install={{ kind: 'package', packages: '@youj/miniatures' }} label="Package install command" />
              </UseStep>
              <UseStep n={2} title="Put it on a page" note="Without a size it fills its container’s width; stage paints the paper behind it. Its ref presses its keys and reads its state.">
                <UseCode
                  label="Ways to use it"
                  variants={[
                    { value: 'own', label: 'On its own', file: 'hero.tsx', code: usageSnippet(meta.id) },
                    { value: 'exhibit', label: 'With its readout and keys', file: 'exhibit.tsx', code: exhibitSnippet(meta) },
                  ]}
                />
              </UseStep>
            </UseSteps>
          ),
        },
        ...(props
          ? [
              {
                value: 'props',
                label: 'Props',
                icon: <SlidersIcon {...icon} />,
                description: 'Every miniature takes the same props. Other HTML attributes go to its host element.',
                content: <PropsSheet doc={props} />,
              },
            ]
          : []),
      ]}
    />
  )
}
