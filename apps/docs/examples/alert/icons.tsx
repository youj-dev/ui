'use client'

import { RocketIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription, AlertTitle, Button } from '@youj/react'

export default function AlertIcons() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      {/* A custom icon plays on mount like the built-in ones, in the variant's color. */}
      <Alert variant="info" icon={<RocketIcon trigger="mount" />}>
        <AlertTitle>Preview comments are here</AlertTitle>
        <AlertDescription>Reviewers can pin feedback to any element of a preview deployment.</AlertDescription>
        <AlertAction>
          <Button size="sm" variant="outline">
            Try it on a preview
          </Button>
        </AlertAction>
      </Alert>
      <Alert variant="success" icon={false}>
        <AlertDescription>Build cache restored: 312 packages in 1.8 seconds.</AlertDescription>
      </Alert>
    </div>
  )
}
