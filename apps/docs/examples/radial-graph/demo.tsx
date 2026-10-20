'use client'

import { RadialGraph, type RadialGraphNode } from '@youj/react'

/** A made-up service account and what it can reach: the vault and a bucket were hit, three more are exposed through them. */
const NODES: RadialGraphNode[] = [
  { id: 'vault', label: 'secrets-vault', tone: 'chart-3', ring: 'solid', state: 'Hit', detail: 'Read with the leaked token' },
  { id: 'queue', label: 'jobs-queue', tone: 'chart-1' },
  { id: 'bucket', label: 'exports-bucket', tone: 'chart-5', ring: 'solid', state: 'Hit', detail: 'Listed twice in a minute' },
  { id: 'db', label: 'orders-db', tone: 'chart-1' },
  { id: 'cache', label: 'session-cache', tone: 'chart-5' },
  { id: 'api', label: 'billing-api', via: 'vault', tone: 'chart-3', ring: 'dashed', state: 'Exposed', detail: 'Its key is in the vault' },
  { id: 'ci', label: 'ci-runner', via: 'vault', tone: 'chart-1' },
  { id: 'worker', label: 'report-worker', via: 'queue', tone: 'chart-1' },
  { id: 'archive', label: 'cold-archive', via: 'bucket', tone: 'chart-5', ring: 'dashed', state: 'Exposed', detail: 'Same bucket policy' },
  { id: 'cdn', label: 'assets-cdn', via: 'bucket', tone: 'chart-5' },
  { id: 'replica', label: 'orders-replica', via: 'db', tone: 'chart-1', ring: 'dashed', state: 'Exposed', detail: 'Replicates from orders-db' },
  { id: 'warehouse', label: 'warehouse', via: 'db', tone: 'chart-1' },
]

export default function RadialGraphDemo() {
  return (
    <div className="w-full max-w-sm">
      <RadialGraph center={{ id: 'svc', label: 'svc-reports', short: 'SR' }} nodes={NODES} label="What svc-reports can reach" />
    </div>
  )
}
