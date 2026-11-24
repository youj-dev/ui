'use client'

import { JsonViewer } from '@youj/react'

const STATUSES = ['paid', 'pending', 'refunded', 'failed']

const RESPONSE = {
  object: 'list',
  url: '/v1/orders',
  has_more: true,
  next_cursor: 'ord_0250',
  data: Array.from({ length: 250 }, (_, i) => ({
    id: `ord_${String(i + 1).padStart(4, '0')}`,
    status: STATUSES[i % 4],
    total: Math.round((19 + ((i * 37) % 180)) * 100) / 100,
    items: (i % 4) + 1,
  })),
}

export default function JsonViewerApiResponse() {
  return <JsonViewer label="GET /v1/orders · 200" value={RESPONSE} className="max-h-[360px] w-full max-w-xl" />
}
