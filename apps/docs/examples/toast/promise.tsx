'use client'

import { Button, toast } from '@youj/react'
import { RocketIcon } from '@youj/icons'
import { IllustrationDeploy, IllustrationLightning } from '@youj/illustrations'
import { LoaderBuild } from '@youj/loaders/build'

// Stands in for a deployment, which fails when the build has type errors.
const build = (fail: boolean) =>
  new Promise<{ url: string }>((resolve, reject) =>
    setTimeout(() => (fail ? reject(new Error('2 type errors in app/search/page.tsx')) : resolve({ url: 'orion.acme.dev' })), 1800),
  )

function deploy(fail: boolean) {
  toast
    .promise(build(fail), {
      // Each step can bring its own media; the toast crossfades from one to the next.
      loading: { title: 'Deploying orion…', description: 'Building main at 4f2a91c', media: <LoaderBuild label={null} /> },
      success: (result) => ({ title: 'Deployed to production', description: `${result.url} is live`, media: <IllustrationDeploy /> }),
      error: (error) => ({
        title: 'Deployment failed',
        media: <IllustrationLightning />,
        description: error instanceof Error ? error.message : 'Something went wrong.',
        action: { label: 'View logs', onClick: () => {} },
      }),
    })
    // toast.promise passes the work's outcome through, so a rejection still needs a catch.
    .catch(() => {})
}

// No Toaster here: the app's one Toaster renders these. On this page, that's the one in the first preview.
export default function ToastPromise() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button onClick={() => deploy(false)}>
        <RocketIcon />
        Deploy
      </Button>
      <Button variant="outline" onClick={() => deploy(true)}>
        Deploy a failing build
      </Button>
    </div>
  )
}
