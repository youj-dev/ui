'use client'

// Plain markup that uses only shadcn's token names. The bridge in ui.css
// resolves each one to a youj token, in both themes.
const CHART = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']
const USAGE = [40, 27, 17, 10, 6] // percent of seats, by project
const INVITES = [
  { email: 'ana@youj.dev', role: 'Member' },
  { email: 'jonas@youj.dev', role: 'Viewer' },
]

export default function TokenBridge() {
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <p className="text-sm font-medium">Invite your team</p>
      <p className="mt-1 text-sm text-muted-foreground">Teammates get access to every project in youj-web.</p>

      <div className="mt-4 flex gap-2">
        <input
          aria-label="Email address"
          placeholder="name@company.com"
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 focus-visible:outline-none"
        />
        <button
          type="button"
          className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none"
        >
          Invite
        </button>
      </div>

      <ul className="mt-4 divide-y divide-border rounded-md border border-border">
        {INVITES.map((invite) => (
          <li key={invite.email} className="flex items-center gap-3 px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{invite.email}</span>
            <span className="text-xs text-muted-foreground">{invite.role}</span>
            <button
              type="button"
              aria-label={`Resend the invite to ${invite.email}`}
              className="rounded-md px-2 py-1 text-xs font-medium hover:bg-highlight hover:text-highlight-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Resend
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        {CHART.map((chart, i) => (
          <span key={chart} className={chart} style={{ width: `${USAGE[i]}%` }} />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Seats used across projects</span>
        <button type="button" className="rounded-sm font-medium text-destructive hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          Remove all
        </button>
      </div>
    </div>
  )
}
