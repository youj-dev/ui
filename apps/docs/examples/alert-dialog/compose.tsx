'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from '@youj/react'
import { RocketIcon } from '@youj/icons'
import { IllustrationDocuments, IllustrationNewsletter } from '@youj/illustrations'

export default function AlertDialogCompose() {
  const [publishOpen, setPublishOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [status, setStatus] = useState('Release notes · 3 unsaved changes')

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {/* The default size: an icon badge beside the title, actions in the footer band. */}
        <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
          <AlertDialogTrigger render={<Button />}>
            <RocketIcon />
            Publish…
          </AlertDialogTrigger>
          <AlertDialogContent>
            {/* Decorative: with no title the scene is hidden from assistive tech. */}
            <div className="grid place-items-center rounded-lg py-1">
              <IllustrationNewsletter unit={10} />
            </div>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <RocketIcon />
              </AlertDialogMedia>
              <AlertDialogTitle>Publish the release notes?</AlertDialogTitle>
              <AlertDialogDescription>They go out to 1,240 subscribers and appear on the changelog.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Not yet</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setStatus('Release notes published')
                  setPublishOpen(false)
                }}
              >
                Publish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* size="sm": a short question, centered over two equal buttons. */}
        <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
          <AlertDialogTrigger render={<Button variant="outline" />}>Close editor</AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <IllustrationDocuments unit={7} className="-my-2" />
              <AlertDialogTitle>Discard changes?</AlertDialogTitle>
              <AlertDialogDescription>Your edits to the release notes haven’t been saved.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep editing</AlertDialogCancel>
              <AlertDialogAction
                variant="danger"
                onClick={() => {
                  setStatus('Editor closed, changes discarded')
                  setDiscardOpen(false)
                }}
              >
                Discard
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <p role="status" className="text-ui-sm text-fg-muted">
        {status}
      </p>
    </div>
  )
}
