'use client'

import { Marquee } from '@youj/motion'

const QUOTES = [
  { quote: 'Our previews went from a Slack thread to a link in every pull request.', who: 'Ana Lima', role: 'Design lead, Northwind' },
  { quote: 'Rollbacks take one click, and nobody holds their breath on release day.', who: 'Kenji Sato', role: 'Staff engineer, Halcyon' },
  { quote: 'We deleted three deploy scripts and a wiki page nobody trusted.', who: 'Sara Okafor', role: 'Platform, Quanta' },
  { quote: 'Edge config made feature flags boring, which is exactly what we wanted.', who: 'Jonas Weber', role: 'Frontend, Lumen' },
]

function Quote({ quote, who, role }: (typeof QUOTES)[number]) {
  return (
    <figure className="w-full rounded-xl border border-line bg-surface p-4">
      <blockquote className="text-sm leading-relaxed text-fg">“{quote}”</blockquote>
      <figcaption className="mt-3 text-xs text-fg-muted">
        <span className="font-medium text-fg">{who}</span> · {role}
      </figcaption>
    </figure>
  )
}

export default function MarqueeVertical() {
  return (
    <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
      {/* The edge fade masks anything painted outside the marquee, so the focus ring sits on a wrapper. */}
      <div className="rounded-xl has-focus-visible:ring-2 has-focus-visible:ring-accent has-focus-visible:ring-offset-4 has-focus-visible:ring-offset-canvas">
        {/* Vertical loops need a height. Focusable and named: Tab eases the loop to a stop, and with
            reduced motion the column becomes a scroll area that keyboards can reach. */}
        <Marquee
          role="region"
          aria-label="Customer quotes"
          tabIndex={0}
          direction="up"
          speed={22}
          gap={12}
          fade={72}
          className="h-80 outline-none"
        >
          {QUOTES.map((q) => (
            <Quote key={q.who} {...q} />
          ))}
        </Marquee>
      </div>
      <Marquee aria-hidden direction="down" speed={16} gap={12} fade={72} className="hidden h-80 sm:block">
        {[...QUOTES].reverse().map((q) => (
          <Quote key={q.who} {...q} />
        ))}
      </Marquee>
    </div>
  )
}
