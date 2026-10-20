'use client'

import { AlertTriangleIcon, SparklesIcon } from '@youj/icons'
import { Banner, BannerAction, BannerTitle } from '@youj/react'

export default function BannerVariants() {
  return (
    <div className="flex w-full flex-col gap-3">
      <Banner aria-label="Release" dismissible>
        <BannerTitle>
          <strong>Youj 1.0</strong> <span>is here.</span>
        </BannerTitle>
        <BannerAction href="#notes">See what’s new</BannerAction>
      </Banner>
      <Banner aria-label="Event" variant="inverse" dismissible>
        <BannerTitle>Join us for Ship Week, October 6–10.</BannerTitle>
        <BannerAction href="#register">Register</BannerAction>
      </Banner>
      <Banner aria-label="Trial" variant="accent" icon={<SparklesIcon trigger="mount" />} dismissible>
        <BannerTitle>
          <strong>Pro trial:</strong> <span>12 days left.</span>
        </BannerTitle>
        <BannerAction href="#upgrade">Upgrade</BannerAction>
      </Banner>
      <Banner aria-label="Maintenance" variant="warning" icon={<AlertTriangleIcon trigger="mount" className="text-warning-text" />}>
        <BannerTitle>
          <strong>Scheduled maintenance</strong> <span>Sunday 02:00–02:30 UTC. Deploys will queue.</span>
        </BannerTitle>
      </Banner>
    </div>
  )
}
