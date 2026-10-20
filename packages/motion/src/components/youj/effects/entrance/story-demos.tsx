import { useState, type ReactNode } from 'react'
import { ArrowUpRight, Bell, CreditCard, Folder, Home, Search, Settings, Users } from 'lucide-react'

/* Storybook-only demos the entrance looks' stories share: a sign-in card and a small dashboard screen, real UI with
 * every kind of part a look reads. Not a registry item. */

export function Stage({ children, replay }: { children: ReactNode; replay: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-canvas px-4 py-12">
      {children}
      <ReplayButton onClick={replay} />
    </div>
  )
}

export function ReplayButton({ onClick, children = 'Replay' }: { onClick: () => void; children?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-fg-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
    >
      {children}
    </button>
  )
}

export function useReplay() {
  const [play, setPlay] = useState(0)
  return [play, () => setPlay((n) => n + 1)] as const
}

export function SignInCard() {
  return (
    <form
      aria-label="Sign in to Northwind"
      className="flex w-[360px] flex-col gap-5 rounded-xl border border-line bg-surface p-6 shadow-sm"
      onSubmit={(e) => e.preventDefault()}
    >
      <header className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-fg text-sm font-semibold text-canvas">N</span>
        <div>
          <h2 className="text-base font-semibold text-fg">Sign in to Northwind</h2>
          <p className="text-sm text-fg-muted">Welcome back. Pick up where you left off.</p>
        </div>
      </header>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
        Email
        <input
          type="email"
          defaultValue="ada@northwind.dev"
          className="h-9 rounded-md border border-line bg-field px-3 text-sm font-normal text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
        Password
        <input
          type="password"
          defaultValue="hunter22"
          className="h-9 rounded-md border border-line bg-field px-3 text-sm font-normal text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-fg-muted">
          <input type="checkbox" defaultChecked className="size-4 accent-accent" />
          Remember me
        </label>
        <a href="#reset" className="text-fg underline-offset-4 hover:underline">
          Forgot password?
        </a>
      </div>
      <button
        type="submit"
        className="h-9 rounded-md bg-accent text-sm font-medium text-accent-contrast focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        Sign in
      </button>
      <hr className="border-line" />
      <p className="text-center text-xs text-fg-subtle">Protected by single sign-on.</p>
    </form>
  )
}

const NAV = [
  { icon: Home, label: 'Overview' },
  { icon: Folder, label: 'Projects' },
  { icon: Users, label: 'Team' },
  { icon: CreditCard, label: 'Billing' },
  { icon: Settings, label: 'Settings' },
]
const STATS = [
  ['Revenue', '$48,210', '+12.4%'],
  ['Active users', '3,982', '+4.1%'],
  ['Churn', '1.8%', '−0.3%'],
]
const ROWS = [
  ['Atlas redesign', 'Mira Okafor', 'In review'],
  ['Billing v2', 'Tomas Lind', 'Shipped'],
  ['Mobile onboarding', 'Ines Duarte', 'Draft'],
  ['Search revamp', 'Kenji Mori', 'Shipped'],
]
const BARS = [32, 48, 40, 64, 56, 72, 60, 84, 76, 92, 70, 88]

export function SmallScreen() {
  return (
    <div className="flex h-[560px] w-[880px] overflow-hidden rounded-xl border border-line bg-canvas text-fg shadow-sm">
      <aside aria-label="Workspace" className="flex w-52 shrink-0 flex-col gap-1 border-e border-line bg-surface p-3">
        <div className="mb-3 flex items-center gap-2 px-2 py-1.5">
          <span className="grid size-6 place-items-center rounded-md bg-fg text-xs font-semibold text-canvas">N</span>
          <span className="text-sm font-semibold">Northwind</span>
        </div>
        <nav aria-label="Main" className="flex flex-col gap-0.5">
          {NAV.map(({ icon: Icon, label }, i) => (
            <a
              key={label}
              href={`#${label}`}
              aria-current={i === 0 ? 'page' : undefined}
              className={`flex h-8 items-center gap-2 rounded-md px-2 text-sm ${i === 0 ? 'bg-well text-fg' : 'text-fg-muted'}`}
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-line px-5">
          <h1 className="text-base font-semibold">Overview</h1>
          <div className="flex items-center gap-2">
            <label className="flex h-8 w-52 items-center gap-2 rounded-md border border-line bg-field px-2 text-sm text-fg-subtle">
              <Search aria-hidden className="size-4" />
              <input aria-label="Search" placeholder="Search…" className="min-w-0 flex-1 bg-transparent outline-none" />
            </label>
            <button type="button" aria-label="Notifications" className="grid size-8 place-items-center rounded-md border border-line text-fg-muted">
              <Bell aria-hidden className="size-4" />
            </button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <section aria-label="This month" className="grid grid-cols-3 gap-3">
            {STATS.map(([label, value, delta]) => (
              <div key={label} className="rounded-lg border border-line bg-surface p-3">
                <p className="text-xs text-fg-muted">{label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-fg-subtle">
                  <ArrowUpRight aria-hidden className="size-3" />
                  {delta}
                </p>
              </div>
            ))}
          </section>
          <div className="grid flex-1 grid-cols-[1.3fr_1fr] gap-3">
            <section aria-label="Weekly revenue" className="flex flex-col rounded-lg border border-line bg-surface p-3">
              <p className="text-xs font-medium text-fg-muted">Weekly revenue</p>
              <svg viewBox="0 0 240 110" role="img" aria-label="Revenue rose most weeks" className="mt-2 h-full w-full text-fg-subtle">
                {BARS.map((h, i) => (
                  <rect
                    key={i}
                    x={i * 20 + 4}
                    y={110 - h}
                    width={12}
                    height={h}
                    rx={2}
                    fill="currentColor"
                    opacity={i === BARS.length - 3 ? 1 : 0.45}
                  />
                ))}
              </svg>
            </section>
            <section aria-label="Projects" className="rounded-lg border border-line bg-surface">
              <p className="border-b border-line px-3 py-2 text-xs font-medium text-fg-muted">Projects</p>
              <ul>
                {ROWS.map(([name, owner, status]) => (
                  <li key={name} className="flex items-center justify-between border-b border-line px-3 py-2 text-sm last:border-0">
                    <span>
                      <span className="block">{name}</span>
                      <span className="block text-xs text-fg-subtle">{owner}</span>
                    </span>
                    <span className="rounded-full border border-line px-2 py-0.5 text-xs text-fg-muted">{status}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
