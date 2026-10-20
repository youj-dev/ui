'use client'

import { Button, toast } from '@youj/react'
import { BellIcon } from '@youj/icons'
import { IllustrationBackups, IllustrationSearch } from '@youj/illustrations'
import { LoaderWinnow } from '@youj/loaders/winnow'

// An index that builds for a while: a loader while it runs, then a scene once it's ready.
function reindex() {
  const id = toast('Indexing orion…', { description: '1,204 issues, 38 projects', media: <LoaderWinnow label={null} />, timeout: 0 })
  setTimeout(() => toast.success('Search index ready', { id, description: 'Search now covers every issue in orion.', media: <IllustrationSearch />, timeout: 5000 }), 2600)
}

// No Toaster here: the app's one Toaster renders these. On this page, that's the one in the first preview.
export default function ToastMedia() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button
        variant="outline"
        onClick={() => toast('Backup complete', { description: '12.4 GB of orion saved to eu-west.', media: <IllustrationBackups /> })}
      >
        Illustration
      </Button>
      <Button variant="outline" onClick={reindex}>
        Loader
      </Button>
      <Button
        variant="outline"
        onClick={() => toast('Reminder set', { description: 'We’ll nudge you about ORI-830 at 9:00 tomorrow.', media: <BellIcon trigger="mount" /> })}
      >
        Animated icon
      </Button>
    </div>
  )
}
