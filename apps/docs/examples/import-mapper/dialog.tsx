'use client'

import { ImportMapper } from '@youj/react'

export default function ImportMapperDialog() {
  return (
    <ImportMapper
      variant="dialog"
      copy={{ importMapperTitle: 'Import contacts', importMapperDescription: 'Match the columns of your file to your contact fields.' }}
    />
  )
}
