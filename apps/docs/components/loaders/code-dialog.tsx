'use client'

import { useState, type ReactElement } from 'react'
import { CodeIcon, FileCodeIcon, SlidersIcon } from '@youj/icons'
import type { Scheme } from '@/components/showroom/hooks'
import { PropsSheet, RegistrySource, RouteSwitch, UseCode, UseInstall, UsePreview, UseStep, UseSteps, type Route } from '@/components/showroom/use-dialog'
import { CodeExportDialog, type CodeExportDialogProps } from '@/components/ui/code-export-dialog'
import type { ComponentDoc } from '@/lib/props'
import { copiedUsage, installedPath, itemName, labelValue, loopSeconds, usage, type LoaderEntry, type Look } from './catalog'
import { useLoader } from './live'

/* A loader's Use it, in the site's large code modal on the showroom's grammar (components/showroom/use-dialog): the
 * loader live at the head of the nav, then Use it (1 install the package or copy the loader in, 2 the code, with the
 * look set on the page), its props, and its source as the CLI writes it, read from the site's registry the first time
 * that section is shown. */

const icon = { size: 16, strokeWidth: 1.75 }

interface LoaderCodeDialogProps extends Pick<CodeExportDialogProps, 'open' | 'onOpenChange' | 'onOpenChangeComplete' | 'finalFocus'> {
  entry: LoaderEntry
  look?: Look
  categoryTitle: string
  /** The props every loader takes (read on the server). */
  props?: ComponentDoc
  /** The stage's light or dark, which the preview wears. */
  scheme?: Scheme
  /** The button that opens it, when it isn't opened from outside (`open`). */
  trigger?: ReactElement
}

export function LoaderCodeDialog({ entry, look, categoryTitle, props, scheme = 'dark', trigger, ...dialog }: LoaderCodeDialogProps) {
  const [route, setRoute] = useState<Route>('package')
  const path = `${installedPath(entry).replace(/^@\//, '')}.tsx`
  return (
    <CodeExportDialog
      {...dialog}
      trigger={trigger}
      title={entry.title}
      description={`${entry.component} · ${categoryTitle}`}
      preview={
        <UsePreview scheme={scheme}>
          <LoaderPreview entry={entry} look={look} />
        </UsePreview>
      }
      navLabel="The code"
      sections={[
        {
          value: 'use',
          label: 'Use it',
          icon: <CodeIcon {...icon} />,
          description: route === 'package' ? 'Install the package, then put it on a page, with the look you set.' : 'Copy just this loader into your app, then put it on a page.',
          end: <RouteSwitch value={route} onChange={setRoute} />,
          content: (
            <UseSteps>
              <UseStep
                n={1}
                title="Install"
                note={
                  route === 'package'
                    ? 'One entry per loader: your app bundles only the ones it imports.'
                    : `Writes ${path} and the kit it draws with (its status, the shared ticker, the engine).`
                }
              >
                {route === 'package' ? (
                  <UseInstall install={{ kind: 'package', packages: '@youj/loaders' }} label="Package install command" />
                ) : (
                  <UseInstall install={{ kind: 'cli', run: `add ${itemName(entry.id)}` }} label="Copy-in command" />
                )}
              </UseStep>
              <UseStep n={2} title="Put it on a page" note="Its label is what assistive technology announces, the first of several first.">
                <UseCode
                  key={route}
                  label="Usage"
                  variants={[
                    route === 'package'
                      ? { value: 'package', label: 'Usage', file: 'results.tsx', code: usage(entry, look) }
                      : { value: 'copy', label: 'The copied component', file: 'results.tsx', code: copiedUsage(entry, look) },
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
                description: 'Every loader takes the same props: its size, pace, two colors and label.',
                content: <PropsSheet doc={props} />,
              },
            ]
          : []),
        {
          value: 'source',
          label: 'Source',
          icon: <FileCodeIcon {...icon} />,
          description: 'The file the CLI writes, as it writes it.',
          content: <RegistrySource item={itemName(entry.id)} path={path} />,
        },
      ]}
    />
  )
}

/** The loader as the page sets it, small and live (its label left to the stage). */
function LoaderPreview({ entry, look }: { entry: LoaderEntry; look?: Look }) {
  const { Component } = useLoader(entry.id)
  if (!Component) return null
  return (
    <div className="swap-in">
      <Component
        size={84}
        speed={look ? Math.round((loopSeconds(entry) / look.cycle) * 100) / 100 : undefined}
        color={look?.ink}
        accentColor={look?.accent}
        colors={look?.colors}
        label={look ? labelValue(look.label) : undefined}
        showLabel={false}
      />
    </div>
  )
}
