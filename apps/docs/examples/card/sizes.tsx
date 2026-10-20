'use client'

import { Button, Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, type CardProps } from '@youj/react'

const VARIABLES = ['DATABASE_URL', 'STRIPE_SECRET_KEY', 'RESEND_API_KEY']

function EnvironmentCard({ size }: { size: CardProps['size'] }) {
  return (
    <Card size={size} className="h-full">
      <CardHeader>
        <CardTitle>Environment variables</CardTitle>
        <CardDescription>Encrypted, and read at build time.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1.5 font-mono text-ui-sm">
          {VARIABLES.map((name) => (
            <li key={name} className="flex items-center justify-between gap-3">
              <span className="truncate text-fg">{name}</span>
              <span className="text-fg-muted">
                <span aria-hidden>••••••</span>
                <span className="sr-only">value hidden</span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <span className="text-ui-sm text-fg-muted">Production · updated 3 days ago</span>
      </CardFooter>
    </Card>
  )
}

export default function CardSizes() {
  return (
    <div className="@container w-full max-w-2xl">
      <div className="grid items-start gap-4 @lg:grid-cols-2">
        {(['default', 'sm'] as const).map((size) => (
          <figure key={size} className="flex flex-col gap-2">
            <figcaption className="font-mono text-ui-xs text-fg-muted">size=&quot;{size}&quot;</figcaption>
            <EnvironmentCard size={size} />
          </figure>
        ))}
      </div>
    </div>
  )
}
